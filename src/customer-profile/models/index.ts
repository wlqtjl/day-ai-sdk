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
  
  // 扩展字段 - 360度客户视图
  addresses?: CustomerAddress[];
  paymentMethods?: PaymentMethod[];
  orders?: Order[];
  supportTickets?: SupportTicket[];
  marketingCampaigns?: MarketingCampaign[];
  socialProfiles?: SocialProfile[];
  websiteActivity?: WebsiteActivity[];
  
  // 团队信息
  assignedTo?: string; // 分配给哪个销售
  teamId?: string; // 所属团队
  accountManager?: string; // 客户经理
  
  // 业务信息
  leadSource?: string; // 线索来源
  leadStatus?: 'new' | 'qualified' | 'opportunity' | 'customer' | 'lost';
  salesStage?: string; // 销售阶段
  dealValue?: number; // 交易价值
  closeDate?: Date; // 预计关闭日期
  
  // 偏好设置
  communicationPreferences?: CommunicationPreferences;
  marketingPreferences?: MarketingPreferences;
  
  // 生命周期管理
  lifecycleStage?: 'lead' | 'prospect' | 'customer' | 'loyal' | 'churned' | 'reactivated';
  lifecycleStatus?: string;
  firstContactDate?: Date;
  customerSince?: Date;
  lastPurchaseDate?: Date;
  churnDate?: Date;
  reactivationDate?: Date;
  lifecycleScore?: number;
  
  // 额外字段
  industry?: string; // 行业
  jobTitle?: string; // 职位
  healthScore?: number; // 健康分数
  value?: number; // 客户价值
  riskScore?: number; // 风险分数
  engagementScore?: number; // 参与度分数
  address?: string; // 地址（兼容旧字段）
  interests?: string[]; // 兴趣爱好
}

// 客户地址
export interface CustomerAddress {
  id: string;
  type: 'billing' | 'shipping' | 'other';
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isPrimary: boolean;
}

// 支付方式
export interface PaymentMethod {
  id: string;
  type: 'credit_card' | 'debit_card' | 'paypal' | 'bank_transfer' | 'other';
  lastFour: string;
  expiryDate?: string;
  isPrimary: boolean;
}

// 订单
export interface Order {
  id: string;
  orderNumber: string;
  date: Date;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  items: OrderItem[];
  paymentStatus: 'unpaid' | 'paid' | 'partial' | 'refunded';
  shippingAddressId?: string;
  billingAddressId?: string;
}

// 订单项
export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  total: number;
}

// 支持工单
export interface SupportTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdDate: Date;
  resolvedDate?: Date;
  assignedTo?: string;
  category: string;
}

// 营销活动
export interface MarketingCampaign {
  id: string;
  campaignId: string;
  name: string;
  type: 'email' | 'social' | 'sms' | 'direct_mail' | 'other';
  status: 'planned' | 'active' | 'completed' | 'paused';
  startDate: Date;
  endDate?: Date;
  response?: 'opened' | 'clicked' | 'converted' | 'unsubscribed';
  conversionValue?: number;
}

// 社交档案
export interface SocialProfile {
  id: string;
  platform: 'weibo' | 'wechat' | 'linkedin' | 'twitter' | 'facebook' | 'instagram' | 'other';
  username: string;
  url?: string;
  followers?: number;
  engagementRate?: number;
  lastActive?: Date;
}

// 网站活动
export interface WebsiteActivity {
  id: string;
  timestamp: Date;
  type: 'page_view' | 'form_submission' | 'download' | 'video_play' | 'other';
  pageUrl: string;
  duration?: number;
  referrer?: string;
  deviceType?: 'desktop' | 'mobile' | 'tablet';
  ipAddress?: string;
}

// 沟通偏好
export interface CommunicationPreferences {
  preferredChannel: 'email' | 'phone' | 'wechat' | 'sms' | 'other';
  preferredTime: string;
  doNotDisturb: boolean;
  language: string;
}

// 营销偏好
export interface MarketingPreferences {
  email: boolean;
  sms: boolean;
  social: boolean;
  directMail: boolean;
  preferredTopics: string[];
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
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
  type: 'wechat' | 'email' | 'phone' | 'meeting' | 'purchase' | 'social' | 'social_media_post' | 'social_media_comment';
  content: string;
  timestamp: Date;
  sentiment: 'positive' | 'neutral' | 'negative';
  tags: string[];
  metadata?: Record<string, any>;
  direction?: 'inbound' | 'outbound'; // 沟通方向
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
export type DataSource = 'wechat' | 'crm' | 'email' | 'social' | 'internal' | 'ecommerce' | 'support' | 'marketing' | 'analytics' | 'erp' | 'pos';

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
