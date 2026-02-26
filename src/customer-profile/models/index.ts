// 客户画像数据模型
export interface CustomerProfile {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  wechatId?: string;
  company?: string;
  position?: string;
  tags: string[];
  features: CustomerFeatures;
  interactions: CustomerInteraction[];
  insights: CustomerInsight[];
  createdAt: Date;
  updatedAt: Date;
}

// 客户特征
export interface CustomerFeatures {
  // 基本特征
  age?: number;
  gender?: 'male' | 'female' | 'other';
  location?: string;
  
  // 行为特征
  engagementLevel: 'high' | 'medium' | 'low';
  purchaseFrequency: 'frequent' | 'occasional' | 'rare';
  averageOrderValue?: number;
  
  // 兴趣特征
  interests: string[];
  preferences: string[];
  
  // 社交特征
  socialInfluence: 'high' | 'medium' | 'low';
  networkSize?: number;
  
  // 价值特征
  customerLifetimeValue?: number;
  churnRisk: 'high' | 'medium' | 'low';
  potentialValue: 'high' | 'medium' | 'low';
}

// 客户互动记录
export interface CustomerInteraction {
  id: string;
  type: 'wechat' | 'email' | 'phone' | 'meeting' | 'purchase';
  content: string;
  timestamp: Date;
  sentiment: 'positive' | 'neutral' | 'negative';
  tags: string[];
  metadata?: Record<string, any>;
}

// 客户洞察
export interface CustomerInsight {
  id: string;
  type: 'behavioral' | 'predictive' | 'recommendation';
  content: string;
  confidence: number;
  timestamp: Date;
  actionItems: string[];
}

// 数据源类型
export type DataSource = 'wechat' | 'crm' | 'email' | 'social' | 'internal';

// 数据整合配置
export interface DataIntegrationConfig {
  sources: {
    [key in DataSource]?: {
      enabled: boolean;
      config?: Record<string, any>;
    };
  };
  syncInterval: number; // 同步间隔（分钟）
  dataRetention: number; // 数据保留时间（天）
}

// AI分析配置
export interface AIAnalysisConfig {
  featureExtraction: {
    enabled: boolean;
    models: string[];
  };
  customerSegmentation: {
    enabled: boolean;
    algorithm: 'kmeans' | 'hierarchical' | 'dbscan';
    clusters: number;
  };
  predictiveAnalysis: {
    enabled: boolean;
    models: string[];
  };
}

// 画像配置
export interface ProfileConfig {
  dataIntegration: DataIntegrationConfig;
  aiAnalysis: AIAnalysisConfig;
  visualization: {
    enabled: boolean;
    dashboard: boolean;
    reports: boolean;
  };
}
