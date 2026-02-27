import { DayAIClient } from '../client';
import { LLMClient } from '../llm-domestic/base';
import { DataIntegrationService } from './data-integration';
import { AIAnalysisService } from './ai-analysis';
import { VisualizationService } from './visualization';
import { IndustryTemplateManager, type IndustryTemplate } from './industry-templates';
import * as Models from './models';
export type { CustomerProfile, CustomerFeatures, CustomerInteraction, CustomerInsight, ProfileConfig } from './models';
export { DataIntegrationService, AIAnalysisService, IndustryTemplateManager, type IndustryTemplate };

/**
 * 智能客户画像服务
 */
export class CustomerProfileService {
  private dayAIClient: DayAIClient;
  private llmClient: LLMClient;
  private config: Models.ProfileConfig;
  private dataIntegrationService: DataIntegrationService;
  private aiAnalysisService: AIAnalysisService;
  private visualizationService: VisualizationService;
  private industryTemplateManager: IndustryTemplateManager;

  constructor(dayAIClient: DayAIClient, llmClient: LLMClient, config: Models.ProfileConfig) {
    this.dayAIClient = dayAIClient;
    this.llmClient = llmClient;
    this.config = config;
    
    // 初始化子服务
    this.dataIntegrationService = new DataIntegrationService(
      dayAIClient,
      config.dataIntegration
    );
    
    this.aiAnalysisService = new AIAnalysisService(
      llmClient,
      config.aiAnalysis
    );
    
    this.visualizationService = new VisualizationService();
    this.industryTemplateManager = new IndustryTemplateManager();
    
    // 注册数据变更事件监听器
    this.dataIntegrationService.on((event) => {
      this.handleDataChangeEvent(event);
    });
  }

  /**
   * 处理数据变更事件
   */
  private handleDataChangeEvent(event: any): void {
    console.log('Data change event:', event.type, event.data);
    
    // 根据事件类型进行处理
    switch (event.type) {
      case 'customer_updated':
        // 客户更新事件
        console.log('Customer updated:', event.data.customerId);
        break;
      case 'new_interaction':
        // 新互动事件
        console.log('New interaction:', event.data.customerId, event.data.interaction.type);
        break;
      case 'data_synced':
        // 数据同步完成事件
        console.log('Data synced:', event.data.totalCustomers, 'customers');
        break;
      case 'system_status':
        // 系统状态事件
        console.log('System status:', event.data.syncStatus);
        break;
      default:
        console.log('Unknown event type:', event.type);
    }
  }

  /**
   * 注册事件监听器
   */
  on(listener: (event: any) => void): () => void {
    return this.dataIntegrationService.on(listener);
  }

  /**
   * 获取系统状态
   */
  getSystemStatus(): any {
    return this.dataIntegrationService.getSystemStatus();
  }

  /**
   * 获取所有客户画像
   */
  async getAllCustomerProfiles(): Promise<Models.CustomerProfile[]> {
    // 整合数据
    const profiles = await this.dataIntegrationService.integrateCustomerData();
    
    // 分析每个客户画像
    const analyzedProfiles = await Promise.all(
      profiles.map(profile => this.aiAnalysisService.analyzeCustomerProfile(profile))
    );
    
    return analyzedProfiles;
  }

  /**
   * 获取单个客户画像
   */
  async getCustomerProfile(customerId: string): Promise<Models.CustomerProfile | null> {
    // 获取客户数据
    const profile = await this.dataIntegrationService.getCustomerProfile(customerId);
    if (!profile) {
      return null;
    }
    
    // 分析客户画像
    const analyzedProfile = await this.aiAnalysisService.analyzeCustomerProfile(profile);
    return analyzedProfile;
  }

  /**
   * 更新客户画像
   */
  async updateCustomerProfile(profile: Models.CustomerProfile): Promise<boolean> {
    return this.dataIntegrationService.updateCustomerProfile(profile);
  }

  /**
   * 生成客户画像可视化数据
   */
  generateProfileVisualization(profile: Models.CustomerProfile): any {
    return {
      overview: this.visualizationService.generateProfileOverview(profile),
      featureRadar: this.visualizationService.generateFeatureRadarData(profile.features),
      interactionTimeline: this.visualizationService.generateInteractionTimeline(profile.interactions),
      sentimentAnalysis: this.visualizationService.generateSentimentAnalysis(profile.interactions),
      interestTagCloud: this.visualizationService.generateInterestTagCloud(profile),
      insightCards: this.visualizationService.generateInsightCards(profile.insights),
      behaviorHeatmap: this.visualizationService.generateBehaviorHeatmap(profile.interactions),
      trendAnalysis: this.visualizationService.generateTrendAnalysis(profile.interactions),
      dashboardConfig: this.visualizationService.generateDashboardConfig(profile),
      dataExplorationConfig: this.visualizationService.generateDataExplorationConfig(profile),
    };
  }

  /**
   * 客户分群分析
   */
  async segmentCustomers(): Promise<Map<string, Models.CustomerProfile[]>> {
    // 获取所有客户画像
    const profiles = await this.getAllCustomerProfiles();
    
    // 进行分群分析
    const segments = await this.aiAnalysisService.segmentCustomers(profiles);
    return segments;
  }

  /**
   * 生成客户分群可视化数据
   */
  generateSegmentationVisualization(segments: Map<string, Models.CustomerProfile[]>): any {
    return this.visualizationService.generateSegmentationVisualization(segments);
  }

  /**
   * 预测客户行为
   */
  async predictCustomerBehavior(customerId: string): Promise<{ [key: string]: any }> {
    // 获取客户画像
    const profile = await this.getCustomerProfile(customerId);
    if (!profile) {
      return {};
    }
    
    // 预测客户行为
    const prediction = await this.aiAnalysisService.predictCustomerBehavior(profile);
    return prediction;
  }

  /**
   * 启动数据同步
   */
  startDataSync(): void {
    this.dataIntegrationService.startSync();
  }

  /**
   * 获取服务配置
   */
  getConfig(): Models.ProfileConfig {
    return this.config;
  }

  /**
   * 更新服务配置
   */
  updateConfig(config: Partial<Models.ProfileConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };
  }

  /**
   * 获取所有行业模板
   */
  getIndustryTemplates(): IndustryTemplate[] {
    return this.industryTemplateManager.getAllTemplates();
  }

  /**
   * 应用行业模板到客户画像
   */
  applyIndustryTemplate(customerId: string, industryId: string): Promise<Models.CustomerProfile | null> {
    return this.getCustomerProfile(customerId).then(profile => {
      if (!profile) {
        return null;
      }
      return this.industryTemplateManager.applyTemplate(profile, industryId);
    });
  }

  /**
   * 为客户生成行业特定的洞察
   */
  generateIndustryInsights(customerId: string, industryId: string): Promise<Models.CustomerInsight[]> {
    return this.getCustomerProfile(customerId).then(profile => {
      if (!profile) {
        return [];
      }
      return this.industryTemplateManager.generateIndustryInsights(profile, industryId);
    });
  }
};

// 默认配置
export const defaultProfileConfig: Models.ProfileConfig = {
  dataIntegration: {
    sources: {
      crm: {
        enabled: true,
      },
      wechat: {
        enabled: true,
      },
      email: {
        enabled: false,
      },
      social: {
        enabled: false,
      },
      internal: {
        enabled: false,
      },
    },
    syncInterval: 60, // 60分钟
    dataRetention: 365, // 365天
  },
  aiAnalysis: {
    featureExtraction: {
      enabled: true,
      models: ['doubao', 'qianwen'],
    },
    customerSegmentation: {
      enabled: true,
      algorithm: 'kmeans',
      clusters: 5,
    },
    predictiveAnalysis: {
      enabled: true,
      models: ['doubao', 'qianwen'],
    },
  },
  visualization: {
    enabled: true,
    dashboard: true,
    reports: true,
  },
};

export default CustomerProfileService;
