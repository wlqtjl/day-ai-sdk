import { DayAIClient } from '../../client';
import { WeChatDecryptor } from '../../wechat-decrypt';
import { CustomerProfile, CustomerInteraction, DataSource, DataIntegrationConfig, Order, CustomerAddress, PaymentMethod, SupportTicket, MarketingCampaign, WebsiteActivity } from '../models';
import { v4 as uuidv4 } from 'uuid';
import { EmailIntegrationService } from '../../integration/email';
import { SocialMediaIntegrationService } from '../../integration/social-media';

// 事件类型定义
type DataChangeEvent = {
  type: 'customer_updated' | 'new_interaction' | 'data_synced' | 'system_status';
  data: any;
  timestamp: Date;
};

// 事件监听器类型
type EventListener = (event: DataChangeEvent) => void;

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
  private eventListeners: EventListener[] = [];
  private lastSyncTime: Date = new Date();
  private systemStatus: {
    lastSync: Date;
    syncStatus: 'idle' | 'syncing' | 'error';
    activeSources: DataSource[];
    totalCustomers: number;
    lastEvent: DataChangeEvent | null;
  } = {
    lastSync: new Date(),
    syncStatus: 'idle',
    activeSources: [],
    totalCustomers: 0,
    lastEvent: null,
  };

  constructor(dayAIClient: DayAIClient, config: DataIntegrationConfig) {
    this.dayAIClient = dayAIClient;
    this.weChatDecryptor = new WeChatDecryptor();
    this.emailService = new EmailIntegrationService();
    this.socialService = new SocialMediaIntegrationService();
    this.config = config;
    
    // 初始化活跃数据源
    this.systemStatus.activeSources = Object.entries(config.sources)
      .filter(([_, source]) => source.enabled)
      .map(([key]) => key as DataSource);
  }

  /**
   * 注册事件监听器
   */
  on(listener: EventListener): () => void {
    this.eventListeners.push(listener);
    return () => {
      this.off(listener);
    };
  }

  /**
   * 移除事件监听器
   */
  off(listener: EventListener): void {
    this.eventListeners = this.eventListeners.filter(l => l !== listener);
  }

  /**
   * 发射事件
   */
  private emit(event: DataChangeEvent): void {
    this.eventListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in event listener:', error);
      }
    });
    
    // 更新系统状态
    this.systemStatus.lastEvent = event;
  }

  /**
   * 获取系统状态
   */
  getSystemStatus(): typeof this.systemStatus {
    return { ...this.systemStatus };
  }

  /**
   * 更新系统状态
   */
  private updateSystemStatus(status: Partial<typeof this.systemStatus>): void {
    this.systemStatus = {
      ...this.systemStatus,
      ...status,
    };
    
    // 发射系统状态事件
    this.emit({
      type: 'system_status',
      data: this.systemStatus,
      timestamp: new Date(),
    });
  }

  /**
   * 整合所有数据源的客户数据
   */
  async integrateCustomerData(): Promise<CustomerProfile[]> {
    this.updateSystemStatus({ syncStatus: 'syncing' });
    
    try {
      const profiles: CustomerProfile[] = [];
      const updatedCustomers: CustomerProfile[] = [];

      // 从CRM获取客户数据
      if (this.config.sources.crm?.enabled) {
        const crmCustomers = await this.fetchFromCRM();
        profiles.push(...crmCustomers);
        updatedCustomers.push(...crmCustomers);
      }

      // 从微信获取客户数据
      if (this.config.sources.wechat?.enabled) {
        const wechatCustomers = await this.fetchFromWeChat();
        // 合并微信数据到现有客户画像
        const mergedCustomers = this.mergeWeChatData(profiles, wechatCustomers);
        updatedCustomers.push(...mergedCustomers);
      }

      // 从邮件获取客户数据
      if (this.config.sources.email?.enabled) {
        // 模拟邮件数据，实际应使用邮件集成服务的方法
        const emailCustomers = this.getMockEmailData();
        // 合并邮件数据到现有客户画像
        const mergedCustomers = this.mergeEmailData(profiles, emailCustomers);
        updatedCustomers.push(...mergedCustomers);
      }

      // 从社交媒体获取客户数据
      if (this.config.sources.social?.enabled) {
        // 模拟社交媒体数据，实际应使用社交媒体集成服务的方法
        const socialCustomers = this.getMockSocialData();
        // 合并社交媒体数据到现有客户画像
        const mergedCustomers = this.mergeSocialData(profiles, socialCustomers);
        updatedCustomers.push(...mergedCustomers);
      }

      // 从电子商务平台获取客户数据
      if (this.config.sources.ecommerce?.enabled) {
        const ecommerceCustomers = await this.fetchFromEcommerce();
        // 合并电子商务数据到现有客户画像
        const mergedCustomers = this.mergeEcommerceData(profiles, ecommerceCustomers);
        updatedCustomers.push(...mergedCustomers);
      }

      // 从支持系统获取客户数据
      if (this.config.sources.support?.enabled) {
        const supportCustomers = await this.fetchFromSupport();
        // 合并支持系统数据到现有客户画像
        const mergedCustomers = this.mergeSupportData(profiles, supportCustomers);
        updatedCustomers.push(...mergedCustomers);
      }

      // 从营销系统获取客户数据
      if (this.config.sources.marketing?.enabled) {
        const marketingCustomers = await this.fetchFromMarketing();
        // 合并营销系统数据到现有客户画像
        const mergedCustomers = this.mergeMarketingData(profiles, marketingCustomers);
        updatedCustomers.push(...mergedCustomers);
      }

      // 从分析系统获取客户数据
      if (this.config.sources.analytics?.enabled) {
        const analyticsCustomers = await this.fetchFromAnalytics();
        // 合并分析系统数据到现有客户画像
        const mergedCustomers = this.mergeAnalyticsData(profiles, analyticsCustomers);
        updatedCustomers.push(...mergedCustomers);
      }

      // 从ERP系统获取客户数据
      if (this.config.sources.erp?.enabled) {
        const erpCustomers = await this.fetchFromERP();
        // 合并ERP系统数据到现有客户画像
        const mergedCustomers = this.mergeERPData(profiles, erpCustomers);
        updatedCustomers.push(...mergedCustomers);
      }

      // 从POS系统获取客户数据
      if (this.config.sources.pos?.enabled) {
        const posCustomers = await this.fetchFromPOS();
        // 合并POS系统数据到现有客户画像
        const mergedCustomers = this.mergePOSData(profiles, posCustomers);
        updatedCustomers.push(...mergedCustomers);
      }

      // 缓存结果
      profiles.forEach(profile => {
        this.dataCache.set(profile.id, profile);
      });

      // 发射数据同步完成事件
      this.emit({
        type: 'data_synced',
        data: {
          totalCustomers: profiles.length,
          updatedCustomers: updatedCustomers.length,
          timestamp: new Date(),
        },
        timestamp: new Date(),
      });

      // 更新系统状态
      this.updateSystemStatus({
        syncStatus: 'idle',
        lastSync: new Date(),
        totalCustomers: profiles.length,
      });

      return profiles;
    } catch (error) {
      console.error('Error integrating customer data:', error);
      
      // 更新系统状态为错误
      this.updateSystemStatus({ syncStatus: 'error' });
      
      // 发射错误事件
      this.emit({
        type: 'system_status',
        data: {
          ...this.systemStatus,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        timestamp: new Date(),
      });
      
      return [];
    }
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
  ): CustomerProfile[] {
    const updatedCustomers: CustomerProfile[] = [];
    
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
        updatedCustomers.push(profile);
      }

      // 合并微信互动记录
      if (wechatCustomer.interactions.length > 0) {
        profile.interactions.push(...wechatCustomer.interactions);
        profile.updatedAt = new Date();
        updatedCustomers.push(profile);
        
        // 发射新互动事件
        wechatCustomer.interactions.forEach(interaction => {
          this.emit({
            type: 'new_interaction',
            data: {
              customerId: profile.id,
              interaction,
            },
            timestamp: new Date(),
          });
        });
      }
    });
    
    return updatedCustomers;
  }

  /**
   * 合并邮件数据到客户画像
   */
  private mergeEmailData(
    profiles: CustomerProfile[],
    emailData: { email: string; interactions: CustomerInteraction[] }[]
  ): CustomerProfile[] {
    const updatedCustomers: CustomerProfile[] = [];
    
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
        updatedCustomers.push(profile);
      }

      // 合并邮件互动记录
      if (emailCustomer.interactions.length > 0) {
        profile.interactions.push(...emailCustomer.interactions);
        profile.updatedAt = new Date();
        updatedCustomers.push(profile);
        
        // 发射新互动事件
        emailCustomer.interactions.forEach(interaction => {
          this.emit({
            type: 'new_interaction',
            data: {
              customerId: profile.id,
              interaction,
            },
            timestamp: new Date(),
          });
        });
      }
    });
    
    return updatedCustomers;
  }

  /**
   * 合并社交媒体数据到客户画像
   */
  private mergeSocialData(
    profiles: CustomerProfile[],
    socialData: { socialId: string; interactions: CustomerInteraction[] }[]
  ): CustomerProfile[] {
    const updatedCustomers: CustomerProfile[] = [];
    
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
        updatedCustomers.push(profile);
      }

      // 合并社交媒体互动记录
      if (socialCustomer.interactions.length > 0) {
        profile.interactions.push(...socialCustomer.interactions);
        profile.updatedAt = new Date();
        updatedCustomers.push(profile);
        
        // 发射新互动事件
        socialCustomer.interactions.forEach(interaction => {
          this.emit({
            type: 'new_interaction',
            data: {
              customerId: profile.id,
              interaction,
            },
            timestamp: new Date(),
          });
        });
      }
    });
    
    return updatedCustomers;
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
   * 获取模拟邮件数据
   */
  private getMockEmailData(): { email: string; interactions: CustomerInteraction[] }[] {
    return [
      {
        email: 'zhangsan@example.com',
        interactions: [
          {
            id: '1',
            type: 'email',
            content: '您好，我对贵公司的产品很感兴趣，希望能够了解更多信息。',
            timestamp: new Date('2024-01-04'),
            sentiment: 'positive',
            tags: ['咨询'],
          },
          {
            id: '2',
            type: 'email',
            content: '感谢您的回复，我想了解一下产品的价格和交付时间。',
            timestamp: new Date('2024-01-05'),
            sentiment: 'neutral',
            tags: ['询价'],
          },
        ],
      },
    ];
  }

  /**
   * 获取模拟社交媒体数据
   */
  private getMockSocialData(): { socialId: string; interactions: CustomerInteraction[] }[] {
    return [
      {
        socialId: 'weibo_123456',
        interactions: [
          {
            id: '1',
            type: 'social',
            content: '刚刚体验了一款非常不错的产品，推荐给大家！',
            timestamp: new Date('2024-01-06'),
            sentiment: 'positive',
            tags: ['推荐', '产品体验'],
          },
          {
            id: '2',
            type: 'social',
            content: '希望产品能够增加更多功能，期待更新！',
            timestamp: new Date('2024-01-07'),
            sentiment: 'neutral',
            tags: ['建议', '功能需求'],
          },
        ],
      },
    ];
  }

  /**
   * 从电子商务平台获取客户数据
   */
  private async fetchFromEcommerce(): Promise<{ email: string; orders: Order[]; addresses: CustomerAddress[]; paymentMethods: PaymentMethod[] }[]> {
    // 模拟从电子商务平台获取数据
    return [
      {
        email: 'zhangsan@example.com',
        orders: [
          {
            id: 'order1',
            orderNumber: 'ORD-2024-0001',
            date: new Date('2024-01-10'),
            total: 5000,
            status: 'delivered',
            items: [
              {
                id: 'item1',
                productId: 'prod1',
                productName: '高级版产品',
                quantity: 1,
                price: 5000,
                total: 5000,
              },
            ],
            paymentStatus: 'paid',
            shippingAddressId: 'addr1',
            billingAddressId: 'addr1',
          },
        ],
        addresses: [
          {
            id: 'addr1',
            type: 'shipping',
            street: '北京市朝阳区建国路88号',
            city: '北京',
            state: '北京',
            zipCode: '100022',
            country: '中国',
            isPrimary: true,
          },
        ],
        paymentMethods: [
          {
            id: 'pm1',
            type: 'credit_card',
            lastFour: '4567',
            expiryDate: '2025-12',
            isPrimary: true,
          },
        ],
      },
    ];
  }

  /**
   * 从支持系统获取客户数据
   */
  private async fetchFromSupport(): Promise<{ email: string; supportTickets: SupportTicket[] }[]> {
    // 模拟从支持系统获取数据
    return [
      {
        email: 'zhangsan@example.com',
        supportTickets: [
          {
            id: 'ticket1',
            ticketNumber: 'TKT-2024-0001',
            subject: '产品使用问题',
            description: '使用过程中遇到了一些问题，希望得到帮助',
            status: 'resolved',
            priority: 'medium',
            createdDate: new Date('2024-01-15'),
            resolvedDate: new Date('2024-01-16'),
            assignedTo: 'support1',
            category: 'technical',
          },
        ],
      },
    ];
  }

  /**
   * 从营销系统获取客户数据
   */
  private async fetchFromMarketing(): Promise<{ email: string; marketingCampaigns: MarketingCampaign[] }[]> {
    // 模拟从营销系统获取数据
    return [
      {
        email: 'zhangsan@example.com',
        marketingCampaigns: [
          {
            id: 'camp1',
            campaignId: 'CMP-2024-0001',
            name: '春节促销活动',
            type: 'email',
            status: 'completed',
            startDate: new Date('2024-01-01'),
            endDate: new Date('2024-01-31'),
            response: 'converted',
            conversionValue: 5000,
          },
        ],
      },
    ];
  }

  /**
   * 从分析系统获取客户数据
   */
  private async fetchFromAnalytics(): Promise<{ email: string; websiteActivity: WebsiteActivity[] }[]> {
    // 模拟从分析系统获取数据
    return [
      {
        email: 'zhangsan@example.com',
        websiteActivity: [
          {
            id: 'activity1',
            timestamp: new Date('2024-01-01T10:00:00'),
            type: 'page_view',
            pageUrl: 'https://example.com/products',
            duration: 60,
            referrer: 'https://google.com',
            deviceType: 'desktop',
            ipAddress: '192.168.1.1',
          },
        ],
      },
    ];
  }

  /**
   * 从ERP系统获取客户数据
   */
  private async fetchFromERP(): Promise<{ email: string; accountManager: string; dealValue: number; salesStage: string }[]> {
    // 模拟从ERP系统获取数据
    return [
      {
        email: 'zhangsan@example.com',
        accountManager: 'sales1',
        dealValue: 100000,
        salesStage: 'negotiation',
      },
    ];
  }

  /**
   * 从POS系统获取客户数据
   */
  private async fetchFromPOS(): Promise<{ phone: string; orders: Order[] }[]> {
    // 模拟从POS系统获取数据
    return [
      {
        phone: '13800138000',
        orders: [
          {
            id: 'pos1',
            orderNumber: 'POS-2024-0001',
            date: new Date('2024-01-20'),
            total: 1000,
            status: 'delivered',
            items: [
              {
                id: 'positem1',
                productId: 'prod2',
                productName: '基础版产品',
                quantity: 1,
                price: 1000,
                total: 1000,
              },
            ],
            paymentStatus: 'paid',
          },
        ],
      },
    ];
  }

  /**
   * 合并电子商务数据到客户画像
   */
  private mergeEcommerceData(
    profiles: CustomerProfile[],
    ecommerceData: { email: string; orders: Order[]; addresses: CustomerAddress[]; paymentMethods: PaymentMethod[] }[]
  ): CustomerProfile[] {
    const updatedCustomers: CustomerProfile[] = [];
    
    ecommerceData.forEach(ecommerceCustomer => {
      // 查找对应客户
      let profile = profiles.find(p => p.email === ecommerceCustomer.email);

      // 如果没有找到，创建新的客户画像
      if (!profile) {
        profile = {
          id: uuidv4(),
          name: `电商用户 ${ecommerceCustomer.email}`,
          email: ecommerceCustomer.email,
          tags: ['电商'],
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
        updatedCustomers.push(profile);
      }

      // 合并订单数据
      if (ecommerceCustomer.orders && ecommerceCustomer.orders.length > 0) {
        profile.orders = [...(profile.orders || []), ...ecommerceCustomer.orders];
        profile.updatedAt = new Date();
        updatedCustomers.push(profile);
      }

      // 合并地址数据
      if (ecommerceCustomer.addresses && ecommerceCustomer.addresses.length > 0) {
        profile.addresses = [...(profile.addresses || []), ...ecommerceCustomer.addresses];
        profile.updatedAt = new Date();
        updatedCustomers.push(profile);
      }

      // 合并支付方式数据
      if (ecommerceCustomer.paymentMethods && ecommerceCustomer.paymentMethods.length > 0) {
        profile.paymentMethods = [...(profile.paymentMethods || []), ...ecommerceCustomer.paymentMethods];
        profile.updatedAt = new Date();
        updatedCustomers.push(profile);
      }
    });
    
    return updatedCustomers;
  }

  /**
   * 合并支持系统数据到客户画像
   */
  private mergeSupportData(
    profiles: CustomerProfile[],
    supportData: { email: string; supportTickets: SupportTicket[] }[]
  ): CustomerProfile[] {
    const updatedCustomers: CustomerProfile[] = [];
    
    supportData.forEach(supportCustomer => {
      // 查找对应客户
      let profile = profiles.find(p => p.email === supportCustomer.email);

      // 如果没有找到，创建新的客户画像
      if (!profile) {
        profile = {
          id: uuidv4(),
          name: `支持用户 ${supportCustomer.email}`,
          email: supportCustomer.email,
          tags: ['支持'],
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
        updatedCustomers.push(profile);
      }

      // 合并支持工单数据
      if (supportCustomer.supportTickets && supportCustomer.supportTickets.length > 0) {
        profile.supportTickets = [...(profile.supportTickets || []), ...supportCustomer.supportTickets];
        profile.updatedAt = new Date();
        updatedCustomers.push(profile);
      }
    });
    
    return updatedCustomers;
  }

  /**
   * 合并营销系统数据到客户画像
   */
  private mergeMarketingData(
    profiles: CustomerProfile[],
    marketingData: { email: string; marketingCampaigns: MarketingCampaign[] }[]
  ): CustomerProfile[] {
    const updatedCustomers: CustomerProfile[] = [];
    
    marketingData.forEach(marketingCustomer => {
      // 查找对应客户
      let profile = profiles.find(p => p.email === marketingCustomer.email);

      // 如果没有找到，创建新的客户画像
      if (!profile) {
        profile = {
          id: uuidv4(),
          name: `营销用户 ${marketingCustomer.email}`,
          email: marketingCustomer.email,
          tags: ['营销'],
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
        updatedCustomers.push(profile);
      }

      // 合并营销活动数据
      if (marketingCustomer.marketingCampaigns && marketingCustomer.marketingCampaigns.length > 0) {
        profile.marketingCampaigns = [...(profile.marketingCampaigns || []), ...marketingCustomer.marketingCampaigns];
        profile.updatedAt = new Date();
        updatedCustomers.push(profile);
      }
    });
    
    return updatedCustomers;
  }

  /**
   * 合并分析系统数据到客户画像
   */
  private mergeAnalyticsData(
    profiles: CustomerProfile[],
    analyticsData: { email: string; websiteActivity: WebsiteActivity[] }[]
  ): CustomerProfile[] {
    const updatedCustomers: CustomerProfile[] = [];
    
    analyticsData.forEach(analyticsCustomer => {
      // 查找对应客户
      let profile = profiles.find(p => p.email === analyticsCustomer.email);

      // 如果没有找到，创建新的客户画像
      if (!profile) {
        profile = {
          id: uuidv4(),
          name: `分析用户 ${analyticsCustomer.email}`,
          email: analyticsCustomer.email,
          tags: ['分析'],
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
        updatedCustomers.push(profile);
      }

      // 合并网站活动数据
      if (analyticsCustomer.websiteActivity && analyticsCustomer.websiteActivity.length > 0) {
        profile.websiteActivity = [...(profile.websiteActivity || []), ...analyticsCustomer.websiteActivity];
        profile.updatedAt = new Date();
        updatedCustomers.push(profile);
      }
    });
    
    return updatedCustomers;
  }

  /**
   * 合并ERP系统数据到客户画像
   */
  private mergeERPData(
    profiles: CustomerProfile[],
    erpData: { email: string; accountManager: string; dealValue: number; salesStage: string }[]
  ): CustomerProfile[] {
    const updatedCustomers: CustomerProfile[] = [];
    
    erpData.forEach(erpCustomer => {
      // 查找对应客户
      let profile = profiles.find(p => p.email === erpCustomer.email);

      // 如果没有找到，创建新的客户画像
      if (!profile) {
        profile = {
          id: uuidv4(),
          name: `ERP用户 ${erpCustomer.email}`,
          email: erpCustomer.email,
          tags: ['ERP'],
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
        updatedCustomers.push(profile);
      }

      // 合并ERP数据
      profile.accountManager = erpCustomer.accountManager;
      profile.dealValue = erpCustomer.dealValue;
      profile.salesStage = erpCustomer.salesStage;
      profile.updatedAt = new Date();
      updatedCustomers.push(profile);
    });
    
    return updatedCustomers;
  }

  /**
   * 合并POS系统数据到客户画像
   */
  private mergePOSData(
    profiles: CustomerProfile[],
    posData: { phone: string; orders: Order[] }[]
  ): CustomerProfile[] {
    const updatedCustomers: CustomerProfile[] = [];
    
    posData.forEach(posCustomer => {
      // 查找对应客户
      let profile = profiles.find(p => p.phone === posCustomer.phone);

      // 如果没有找到，创建新的客户画像
      if (!profile) {
        profile = {
          id: uuidv4(),
          name: `POS用户 ${posCustomer.phone}`,
          phone: posCustomer.phone,
          tags: ['POS'],
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
        updatedCustomers.push(profile);
      }

      // 合并订单数据
      if (posCustomer.orders && posCustomer.orders.length > 0) {
        profile.orders = [...(profile.orders || []), ...posCustomer.orders];
        profile.updatedAt = new Date();
        updatedCustomers.push(profile);
      }
    });
    
    return updatedCustomers;
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
      
      // 发射客户更新事件
      this.emit({
        type: 'customer_updated',
        data: {
          customerId: profile.id,
          profile,
        },
        timestamp: new Date(),
      });
      
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
    
    // 定期同步所有数据
    setInterval(async () => {
      console.log('Syncing customer data...');
      await this.integrateCustomerData();
    }, interval);

    // 启动邮件监控
    if (this.config.sources.email?.enabled) {
      console.log('Email monitoring started');
    }

    // 启动社交媒体监控
    if (this.config.sources.social?.enabled) {
      console.log('Social media monitoring started');
    }

    // 启动微信监控
    if (this.config.sources.wechat?.enabled) {
      // 这里可以添加微信实时监控逻辑
      console.log('WeChat monitoring started');
    }
  }
}

export default DataIntegrationService;
