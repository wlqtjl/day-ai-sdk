import { CustomerProfile } from '../../customer-profile/models';
import { v4 as uuidv4 } from 'uuid';

/**
 * CRM系统类型
 */
export type CrmSystemType = 
  | 'salesforce'
  | 'hubspot'
  | 'zoho'
  | 'freshworks'
  | 'dynamics'
  | 'pipedrive'
  | 'custom';

/**
 * CRM集成配置
 */
export interface CrmIntegrationConfig {
  type: CrmSystemType;
  apiKey?: string;
  accessToken?: string;
  baseUrl?: string;
  username?: string;
  password?: string;
  syncInterval: number; // 同步间隔（分钟）
  enabled: boolean;
  syncFields: string[];
}

/**
 * CRM集成状态
 */
export interface CrmIntegrationStatus {
  connected: boolean;
  lastSync: Date | null;
  nextSync: Date | null;
  syncCount: number;
  error: string | null;
}

/**
 * CRM记录
 */
export interface CrmRecord {
  id: string;
  type: string;
  fields: Record<string, any>;
  lastModified: Date;
}

/**
 * CRM集成服务
 */
export class CrmIntegrationService {
  private integrations: Map<string, CrmIntegration> = new Map();

  /**
   * 添加CRM集成
   */
  addIntegration(config: CrmIntegrationConfig): string {
    const integrationId = uuidv4();
    const integration = this.createIntegration(config, integrationId);
    this.integrations.set(integrationId, integration);
    return integrationId;
  }

  /**
   * 更新CRM集成
   */
  updateIntegration(id: string, config: Partial<CrmIntegrationConfig>): boolean {
    const integration = this.integrations.get(id);
    if (integration) {
      integration.updateConfig(config);
      return true;
    }
    return false;
  }

  /**
   * 删除CRM集成
   */
  removeIntegration(id: string): boolean {
    return this.integrations.delete(id);
  }

  /**
   * 获取所有CRM集成
   */
  getIntegrations(): Array<{ id: string; config: CrmIntegrationConfig; status: CrmIntegrationStatus }> {
    const result = [];
    for (const [id, integration] of this.integrations.entries()) {
      result.push({
        id,
        config: integration.getConfig(),
        status: integration.getStatus(),
      });
    }
    return result;
  }

  /**
   * 同步CRM数据
   */
  async syncData(integrationId: string): Promise<{
    success: boolean;
    syncedRecords: number;
    error: string | null;
  }> {
    const integration = this.integrations.get(integrationId);
    if (!integration) {
      return {
        success: false,
        syncedRecords: 0,
        error: 'Integration not found',
      };
    }

    try {
      const result = await integration.sync();
      return {
        success: true,
        syncedRecords: result,
        error: null,
      };
    } catch (error) {
      return {
        success: false,
        syncedRecords: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 从CRM导入客户数据
   */
  async importCustomers(integrationId: string): Promise<CustomerProfile[]> {
    const integration = this.integrations.get(integrationId);
    if (!integration) {
      return [];
    }

    try {
      return await integration.importCustomers();
    } catch (error) {
      console.error('Error importing customers:', error);
      return [];
    }
  }

  /**
   * 向CRM导出客户数据
   */
  async exportCustomer(integrationId: string, profile: CustomerProfile): Promise<boolean> {
    const integration = this.integrations.get(integrationId);
    if (!integration) {
      return false;
    }

    try {
      return await integration.exportCustomer(profile);
    } catch (error) {
      console.error('Error exporting customer:', error);
      return false;
    }
  }

  /**
   * 创建CRM集成实例
   */
  private createIntegration(config: CrmIntegrationConfig, id: string): CrmIntegration {
    switch (config.type) {
      case 'salesforce':
        return new SalesforceIntegration(config, id);
      case 'hubspot':
        return new HubSpotIntegration(config, id);
      case 'zoho':
        return new ZohoIntegration(config, id);
      case 'freshworks':
        return new FreshworksIntegration(config, id);
      case 'dynamics':
        return new DynamicsIntegration(config, id);
      case 'pipedrive':
        return new PipedriveIntegration(config, id);
      default:
        return new CustomCrmIntegration(config, id);
    }
  }
}

/**
 * CRM集成基类
 */
export abstract class CrmIntegration {
  protected config: CrmIntegrationConfig;
  protected id: string;
  protected status: CrmIntegrationStatus;

  constructor(config: CrmIntegrationConfig, id: string) {
    this.config = config;
    this.id = id;
    this.status = {
      connected: false,
      lastSync: null,
      nextSync: null,
      syncCount: 0,
      error: null,
    };
  }

  /**
   * 获取配置
   */
  getConfig(): CrmIntegrationConfig {
    return { ...this.config };
  }

  /**
   * 获取状态
   */
  getStatus(): CrmIntegrationStatus {
    return { ...this.status };
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<CrmIntegrationConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 同步数据
   */
  abstract sync(): Promise<number>;

  /**
   * 导入客户
   */
  abstract importCustomers(): Promise<CustomerProfile[]>;

  /**
   * 导出客户
   */
  abstract exportCustomer(profile: CustomerProfile): Promise<boolean>;

  /**
   * 测试连接
   */
  abstract testConnection(): Promise<boolean>;

  /**
   * 更新状态
   */
  protected updateStatus(status: Partial<CrmIntegrationStatus>): void {
    this.status = { ...this.status, ...status };
  }

  /**
   * 转换为客户画像
   */
  protected convertToCustomerProfile(record: CrmRecord): CustomerProfile {
    return {
      id: record.id,
      name: record.fields.name || record.fields.fullName || record.fields.contactName || '',
      email: record.fields.email || record.fields.emailAddress || '',
      phone: record.fields.phone || record.fields.phoneNumber || '',
      company: record.fields.company || record.fields.accountName || '',
      industry: record.fields.industry || '',
      jobTitle: record.fields.jobTitle || record.fields.title || '',
      address: record.fields.address || record.fields.billingAddress || '',
      createdAt: record.lastModified,
      updatedAt: record.lastModified,
      tags: record.fields.tags || record.fields.categories || [],
      interests: record.fields.interests || [],
      communicationPreferences: record.fields.communicationPreferences || {
        preferredChannel: 'email',
        preferredTime: 'business_hours',
        doNotDisturb: false,
        language: 'zh-CN'
      },
      marketingPreferences: record.fields.marketingPreferences || {
        email: true,
        sms: false,
        social: false,
        directMail: false,
        preferredTopics: [],
        frequency: 'weekly'
      },
      features: {
        engagementLevel: 'medium',
        purchaseFrequency: 'occasional',
        interests: record.fields.interests || [],
        preferences: [],
        socialInfluence: 'medium',
        churnRisk: 'medium',
        potentialValue: 'medium'
      },
      insights: [],
      interactions: [],
      orders: [],
      supportTickets: [],
      healthScore: record.fields.healthScore || 0,
      lifecycleStage: record.fields.lifecycleStage || 'lead',
      salesStage: record.fields.salesStage || 'lead',
      value: record.fields.value || record.fields.revenue || 0,
      riskScore: record.fields.riskScore || 0,
      engagementScore: record.fields.engagementScore || 0,
    };
  }

  /**
   * 转换为CRM记录
   */
  protected convertToCrmRecord(profile: CustomerProfile): CrmRecord {
    return {
      id: profile.id,
      type: 'contact',
      fields: {
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        company: profile.company,
        industry: profile.industry,
        jobTitle: profile.jobTitle,
        address: profile.address,
        tags: profile.tags,
        interests: profile.interests,
        healthScore: profile.healthScore,
        lifecycleStage: profile.lifecycleStage,
        salesStage: profile.salesStage,
        value: profile.value,
        riskScore: profile.riskScore,
        engagementScore: profile.engagementScore,
      },
      lastModified: profile.updatedAt || new Date(),
    };
  }
}

/**
 * Salesforce集成
 */
export class SalesforceIntegration extends CrmIntegration {
  async sync(): Promise<number> {
    // 模拟Salesforce API调用
    console.log('Syncing with Salesforce');
    this.updateStatus({
      connected: true,
      lastSync: new Date(),
      nextSync: new Date(Date.now() + this.config.syncInterval * 60 * 1000),
      syncCount: this.status.syncCount + 1,
      error: null,
    });
    return 10; // 模拟同步10条记录
  }

  async importCustomers(): Promise<CustomerProfile[]> {
    // 模拟导入客户
    return [
      this.convertToCustomerProfile({
        id: '1',
        type: 'contact',
        fields: {
          name: '张三',
          email: 'zhangsan@example.com',
          phone: '13800138000',
          company: '示例公司',
          industry: '科技',
          jobTitle: '总经理',
        },
        lastModified: new Date(),
      }),
    ];
  }

  async exportCustomer(profile: CustomerProfile): Promise<boolean> {
    // 模拟导出客户
    console.log('Exporting customer to Salesforce:', profile.name);
    return true;
  }

  async testConnection(): Promise<boolean> {
    // 模拟测试连接
    return !!(this.config.apiKey && this.config.apiKey.length > 0);
  }
}

/**
 * HubSpot集成
 */
export class HubSpotIntegration extends CrmIntegration {
  async sync(): Promise<number> {
    // 模拟HubSpot API调用
    console.log('Syncing with HubSpot');
    this.updateStatus({
      connected: true,
      lastSync: new Date(),
      nextSync: new Date(Date.now() + this.config.syncInterval * 60 * 1000),
      syncCount: this.status.syncCount + 1,
      error: null,
    });
    return 15; // 模拟同步15条记录
  }

  async importCustomers(): Promise<CustomerProfile[]> {
    // 模拟导入客户
    return [
      this.convertToCustomerProfile({
        id: '2',
        type: 'contact',
        fields: {
          name: '李四',
          email: 'lisi@example.com',
          phone: '13900139000',
          company: '测试公司',
          industry: '金融',
          jobTitle: '财务总监',
        },
        lastModified: new Date(),
      }),
    ];
  }

  async exportCustomer(profile: CustomerProfile): Promise<boolean> {
    // 模拟导出客户
    console.log('Exporting customer to HubSpot:', profile.name);
    return true;
  }

  async testConnection(): Promise<boolean> {
    // 模拟测试连接
    return !!(this.config.accessToken && this.config.accessToken.length > 0);
  }
}

/**
 * Zoho集成
 */
export class ZohoIntegration extends CrmIntegration {
  async sync(): Promise<number> {
    // 模拟Zoho API调用
    console.log('Syncing with Zoho');
    this.updateStatus({
      connected: true,
      lastSync: new Date(),
      nextSync: new Date(Date.now() + this.config.syncInterval * 60 * 1000),
      syncCount: this.status.syncCount + 1,
      error: null,
    });
    return 8; // 模拟同步8条记录
  }

  async importCustomers(): Promise<CustomerProfile[]> {
    // 模拟导入客户
    return [
      this.convertToCustomerProfile({
        id: '3',
        type: 'contact',
        fields: {
          name: '王五',
          email: 'wangwu@example.com',
          phone: '13700137000',
          company: '科技公司',
          industry: '互联网',
          jobTitle: '产品经理',
        },
        lastModified: new Date(),
      }),
    ];
  }

  async exportCustomer(profile: CustomerProfile): Promise<boolean> {
    // 模拟导出客户
    console.log('Exporting customer to Zoho:', profile.name);
    return true;
  }

  async testConnection(): Promise<boolean> {
    // 模拟测试连接
    return !!(this.config.apiKey && this.config.apiKey.length > 0);
  }
}

/**
 * Freshworks集成
 */
export class FreshworksIntegration extends CrmIntegration {
  async sync(): Promise<number> {
    // 模拟Freshworks API调用
    console.log('Syncing with Freshworks');
    this.updateStatus({
      connected: true,
      lastSync: new Date(),
      nextSync: new Date(Date.now() + this.config.syncInterval * 60 * 1000),
      syncCount: this.status.syncCount + 1,
      error: null,
    });
    return 12; // 模拟同步12条记录
  }

  async importCustomers(): Promise<CustomerProfile[]> {
    // 模拟导入客户
    return [
      this.convertToCustomerProfile({
        id: '4',
        type: 'contact',
        fields: {
          name: '赵六',
          email: 'zhaoliu@example.com',
          phone: '13600136000',
          company: '制造企业',
          industry: '制造业',
          jobTitle: '生产经理',
        },
        lastModified: new Date(),
      }),
    ];
  }

  async exportCustomer(profile: CustomerProfile): Promise<boolean> {
    // 模拟导出客户
    console.log('Exporting customer to Freshworks:', profile.name);
    return true;
  }

  async testConnection(): Promise<boolean> {
    // 模拟测试连接
    return !!(this.config.apiKey && this.config.apiKey.length > 0);
  }
}

/**
 * Dynamics集成
 */
export class DynamicsIntegration extends CrmIntegration {
  async sync(): Promise<number> {
    // 模拟Dynamics API调用
    console.log('Syncing with Dynamics');
    this.updateStatus({
      connected: true,
      lastSync: new Date(),
      nextSync: new Date(Date.now() + this.config.syncInterval * 60 * 1000),
      syncCount: this.status.syncCount + 1,
      error: null,
    });
    return 20; // 模拟同步20条记录
  }

  async importCustomers(): Promise<CustomerProfile[]> {
    // 模拟导入客户
    return [
      this.convertToCustomerProfile({
        id: '5',
        type: 'contact',
        fields: {
          name: '钱七',
          email: 'qianqi@example.com',
          phone: '13500135000',
          company: '零售企业',
          industry: '零售业',
          jobTitle: '市场总监',
        },
        lastModified: new Date(),
      }),
    ];
  }

  async exportCustomer(profile: CustomerProfile): Promise<boolean> {
    // 模拟导出客户
    console.log('Exporting customer to Dynamics:', profile.name);
    return true;
  }

  async testConnection(): Promise<boolean> {
    // 模拟测试连接
    return !!(this.config.username && this.config.password);
  }
}

/**
 * Pipedrive集成
 */
export class PipedriveIntegration extends CrmIntegration {
  async sync(): Promise<number> {
    // 模拟Pipedrive API调用
    console.log('Syncing with Pipedrive');
    this.updateStatus({
      connected: true,
      lastSync: new Date(),
      nextSync: new Date(Date.now() + this.config.syncInterval * 60 * 1000),
      syncCount: this.status.syncCount + 1,
      error: null,
    });
    return 18; // 模拟同步18条记录
  }

  async importCustomers(): Promise<CustomerProfile[]> {
    // 模拟导入客户
    return [
      this.convertToCustomerProfile({
        id: '6',
        type: 'contact',
        fields: {
          name: '孙八',
          email: 'sunba@example.com',
          phone: '13400134000',
          company: '服务企业',
          industry: '服务业',
          jobTitle: '服务经理',
        },
        lastModified: new Date(),
      }),
    ];
  }

  async exportCustomer(profile: CustomerProfile): Promise<boolean> {
    // 模拟导出客户
    console.log('Exporting customer to Pipedrive:', profile.name);
    return true;
  }

  async testConnection(): Promise<boolean> {
    // 模拟测试连接
    return !!(this.config.apiKey && this.config.apiKey.length > 0);
  }
}

/**
 * 自定义CRM集成
 */
export class CustomCrmIntegration extends CrmIntegration {
  async sync(): Promise<number> {
    // 模拟自定义CRM API调用
    console.log('Syncing with custom CRM');
    this.updateStatus({
      connected: true,
      lastSync: new Date(),
      nextSync: new Date(Date.now() + this.config.syncInterval * 60 * 1000),
      syncCount: this.status.syncCount + 1,
      error: null,
    });
    return 5; // 模拟同步5条记录
  }

  async importCustomers(): Promise<CustomerProfile[]> {
    // 模拟导入客户
    return [
      this.convertToCustomerProfile({
        id: '7',
        type: 'contact',
        fields: {
          name: '周九',
          email: 'zhoujiu@example.com',
          phone: '13300133000',
          company: '教育机构',
          industry: '教育',
          jobTitle: '教育顾问',
        },
        lastModified: new Date(),
      }),
    ];
  }

  async exportCustomer(profile: CustomerProfile): Promise<boolean> {
    // 模拟导出客户
    console.log('Exporting customer to custom CRM:', profile.name);
    return true;
  }

  async testConnection(): Promise<boolean> {
    // 模拟测试连接
    return !!(this.config.baseUrl && this.config.baseUrl.length > 0);
  }
}

export default CrmIntegrationService;