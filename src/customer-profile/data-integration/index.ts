import { DayAIClient } from '../../client';
import { WeChatDecryptor } from '../../wechat-decrypt';
import { CustomerProfile, CustomerInteraction, DataSource, DataIntegrationConfig } from '../models';
import { v4 as uuidv4 } from 'uuid';
import { EmailIntegrationService } from './email';
import { SocialMediaIntegrationService } from './social';

/**
 * 数据整合服务
 */
export class DataIntegrationService {
  private dayAIClient: DayAIClient;
  private weChatDecryptor: WeChatDecryptor;
  private emailService: EmailIntegrationService;
  private socialService: SocialMediaIntegrationService;
  private config: DataIntegrationConfig;
  private dataCache: Map<string, CustomerProfile> = new Map();

  constructor(dayAIClient: DayAIClient, config: DataIntegrationConfig) {
    this.dayAIClient = dayAIClient;
    this.weChatDecryptor = new WeChatDecryptor();
    this.emailService = new EmailIntegrationService(config.sources.email?.config || {});
    this.socialService = new SocialMediaIntegrationService(config.sources.social?.config || {});
    this.config = config;
  }

  /**
   * 整合所有数据源的客户数据
   */
  async integrateCustomerData(): Promise<CustomerProfile[]> {
    const profiles: CustomerProfile[] = [];

    // 从CRM获取客户数据
    if (this.config.sources.crm?.enabled) {
      const crmCustomers = await this.fetchFromCRM();
      profiles.push(...crmCustomers);
    }

    // 从微信获取客户数据
    if (this.config.sources.wechat?.enabled) {
      const wechatCustomers = await this.fetchFromWeChat();
      // 合并微信数据到现有客户画像
      this.mergeWeChatData(profiles, wechatCustomers);
    }

    // 从邮件获取客户数据
    if (this.config.sources.email?.enabled) {
      const emailCustomers = await this.emailService.fetchCustomerData();
      // 合并邮件数据到现有客户画像
      this.mergeEmailData(profiles, emailCustomers);
    }

    // 从社交媒体获取客户数据
    if (this.config.sources.social?.enabled) {
      const socialCustomers = await this.socialService.fetchCustomerData();
      // 合并社交媒体数据到现有客户画像
      this.mergeSocialData(profiles, socialCustomers);
    }

    // 缓存结果
    profiles.forEach(profile => {
      this.dataCache.set(profile.id, profile);
    });

    return profiles;
  }

  /**
   * 从CRM获取客户数据
   */
  private async fetchFromCRM(): Promise<CustomerProfile[]> {
    try {
      // 使用MCP工具获取CRM数据
      const result = await this.dayAIClient.mcpCallTool('search_contacts', {
        query: '',
        limit: 100,
      });

      if (!result.success || !result.data) {
        console.error('Failed to fetch contacts from CRM:', result.error);
        return [];
      }

      // 解析CRM数据为客户画像
      const contacts = result.data.content?.[0]?.text || '';
      // 这里需要根据实际的CRM数据格式进行解析
      // 暂时返回模拟数据
      return this.parseCRMData(contacts);
    } catch (error) {
      console.error('Error fetching from CRM:', error);
      return [];
    }
  }

  /**
   * 从微信获取客户数据
   */
  private async fetchFromWeChat(): Promise<{ wechatId: string; interactions: CustomerInteraction[] }[]> {
    try {
      // 获取微信数据路径
      const wechatPath = this.weChatDecryptor.getWeChatPath();
      if (!wechatPath) {
        console.error('WeChat path not found');
        return [];
      }

      // 这里需要实现微信聊天记录的提取和解析
      // 暂时返回模拟数据
      return this.getMockWeChatData();
    } catch (error) {
      console.error('Error fetching from WeChat:', error);
      return [];
    }
  }

  /**
   * 合并微信数据到客户画像
   */
  private mergeWeChatData(
    profiles: CustomerProfile[],
    wechatData: { wechatId: string; interactions: CustomerInteraction[] }[]
  ): void {
    wechatData.forEach(wechatCustomer => {
      // 查找对应客户
      let profile = profiles.find(p => p.wechatId === wechatCustomer.wechatId);

      // 如果没有找到，创建新的客户画像
      if (!profile) {
        profile = {
          id: uuidv4(),
          name: `微信用户 ${wechatCustomer.wechatId}`,
          wechatId: wechatCustomer.wechatId,
          tags: ['微信'],
          features: {
            engagementLevel: 'medium',
            purchaseFrequency: 'occasional',
            interests: [],
            preferences: [],
            socialInfluence: 'medium',
            churnRisk: 'medium',
            potentialValue: 'medium',
          },
          interactions: [],
          insights: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        profiles.push(profile);
      }

      // 合并微信互动记录
      profile.interactions.push(...wechatCustomer.interactions);
      profile.updatedAt = new Date();
    });
  }

  /**
   * 合并邮件数据到客户画像
   */
  private mergeEmailData(
    profiles: CustomerProfile[],
    emailData: { email: string; interactions: CustomerInteraction[] }[]
  ): void {
    emailData.forEach(emailCustomer => {
      // 查找对应客户
      let profile = profiles.find(p => p.email === emailCustomer.email);

      // 如果没有找到，创建新的客户画像
      if (!profile) {
        profile = {
          id: uuidv4(),
          name: `邮件用户 ${emailCustomer.email}`,
          email: emailCustomer.email,
          tags: ['邮件'],
          features: {
            engagementLevel: 'medium',
            purchaseFrequency: 'occasional',
            interests: [],
            preferences: [],
            socialInfluence: 'medium',
            churnRisk: 'medium',
            potentialValue: 'medium',
          },
          interactions: [],
          insights: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        profiles.push(profile);
      }

      // 合并邮件互动记录
      profile.interactions.push(...emailCustomer.interactions);
      profile.updatedAt = new Date();
    });
  }

  /**
   * 合并社交媒体数据到客户画像
   */
  private mergeSocialData(
    profiles: CustomerProfile[],
    socialData: { socialId: string; interactions: CustomerInteraction[] }[]
  ): void {
    socialData.forEach(socialCustomer => {
      // 查找对应客户
      let profile = profiles.find(p => p.tags.includes(socialCustomer.socialId));

      // 如果没有找到，创建新的客户画像
      if (!profile) {
        profile = {
          id: uuidv4(),
          name: `社交媒体用户 ${socialCustomer.socialId}`,
          tags: ['社交媒体', socialCustomer.socialId],
          features: {
            engagementLevel: 'medium',
            purchaseFrequency: 'occasional',
            interests: [],
            preferences: [],
            socialInfluence: 'medium',
            churnRisk: 'medium',
            potentialValue: 'medium',
          },
          interactions: [],
          insights: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        profiles.push(profile);
      }

      // 合并社交媒体互动记录
      profile.interactions.push(...socialCustomer.interactions);
      profile.updatedAt = new Date();
    });
  }

  /**
   * 解析CRM数据
   */
  private parseCRMData(data: string): CustomerProfile[] {
    // 这里需要根据实际的CRM数据格式进行解析
    // 暂时返回模拟数据
    return [
      {
        id: '1',
        name: '张三',
        phone: '13800138000',
        email: 'zhangsan@example.com',
        company: 'ABC公司',
        position: '总经理',
        tags: ['重要客户', '高价值'],
        features: {
          age: 35,
          gender: 'male',
          location: '北京',
          engagementLevel: 'high',
          purchaseFrequency: 'frequent',
          averageOrderValue: 10000,
          interests: ['技术', '投资', '旅游'],
          preferences: ['高端服务', '个性化方案'],
          socialInfluence: 'high',
          networkSize: 500,
          customerLifetimeValue: 500000,
          churnRisk: 'low',
          potentialValue: 'high',
        },
        interactions: [
          {
            id: '1',
            type: 'meeting',
            content: '讨论合作方案',
            timestamp: new Date('2024-01-01'),
            sentiment: 'positive',
            tags: ['商务会议'],
          },
        ],
        insights: [],
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
    ];
  }

  /**
   * 获取模拟微信数据
   */
  private getMockWeChatData(): { wechatId: string; interactions: CustomerInteraction[] }[] {
    return [
      {
        wechatId: 'wx123456',
        interactions: [
          {
            id: '1',
            type: 'wechat',
            content: '您好，请问贵公司的产品价格是多少？',
            timestamp: new Date('2024-01-02'),
            sentiment: 'neutral',
            tags: ['询价'],
          },
          {
            id: '2',
            type: 'wechat',
            content: '我们对您的产品很感兴趣，希望能够进一步了解',
            timestamp: new Date('2024-01-03'),
            sentiment: 'positive',
            tags: ['意向'],
          },
        ],
      },
    ];
  }

  /**
   * 获取客户画像
   */
  async getCustomerProfile(customerId: string): Promise<CustomerProfile | null> {
    // 先从缓存获取
    if (this.dataCache.has(customerId)) {
      return this.dataCache.get(customerId) || null;
    }

    // 从数据源获取
    const profiles = await this.integrateCustomerData();
    const profile = profiles.find(p => p.id === customerId);
    return profile || null;
  }

  /**
   * 更新客户画像
   */
  async updateCustomerProfile(profile: CustomerProfile): Promise<boolean> {
    try {
      // 这里需要实现更新逻辑，例如保存到数据库或CRM
      profile.updatedAt = new Date();
      this.dataCache.set(profile.id, profile);
      return true;
    } catch (error) {
      console.error('Error updating customer profile:', error);
      return false;
    }
  }

  /**
   * 启动数据同步
   */
  startSync(): void {
    const interval = this.config.syncInterval * 60 * 1000;
    setInterval(async () => {
      console.log('Syncing customer data...');
      await this.integrateCustomerData();
    }, interval);

    // 启动邮件监控
    if (this.config.sources.email?.enabled) {
      this.emailService.startMonitoring(async (emailData) => {
        console.log('Email data updated, syncing...');
        await this.integrateCustomerData();
      });
    }

    // 启动社交媒体监控
    if (this.config.sources.social?.enabled) {
      this.socialService.startMonitoring(async (socialData) => {
        console.log('Social media data updated, syncing...');
        await this.integrateCustomerData();
      });
    }
  }
}

export default DataIntegrationService;
