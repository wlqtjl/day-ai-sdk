import express, { Request, Response, NextFunction } from 'express';
import { CustomerProfile, DataIntegrationService, AIAnalysisService } from '../customer-profile';
import { DomesticLLM } from '../llm-domestic';
import { SecurityService } from '../security';
import { AIService } from '../ai';
import { SalesPredictionService } from '../customer-profile/ai-analysis/sales-prediction';
import { SalesScriptRecommendationService } from '../customer-profile/ai-analysis/sales-script-recommendation';
import { CompetitorAnalysisService } from '../customer-profile/ai-analysis/competitor-analysis';
import { SalesFunnelAnalysisService } from '../customer-profile/analytics/sales-funnel';
import { DashboardService } from '../dashboard';
import { EmailIntegrationService } from '../integration/email';
import { SocialMediaIntegrationService } from '../integration/social-media';
import { CrmIntegrationService } from '../integration/crm';
import { MobileEnhancementService } from '../mobile/enhancements';

const app = express();
const port = process.env.PORT || 3000;

// 中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 初始化服务
const domesticLLM = new DomesticLLM();
const securityService = new SecurityService();
const aiService = new AIService();

// 创建模拟的DayAIClient
const mockDayAIClient = {
  mcpCallTool: async () => ({
    success: true,
    data: {
      content: [{ text: '[]' }]
    }
  }),
  getAIService: () => aiService
} as any;

// 创建配置对象
const dataIntegrationConfig = {
  sources: {
    crm: { enabled: true },
    wechat: { enabled: true },
    email: { enabled: false },
    social: { enabled: false },
    internal: { enabled: false },
    ecommerce: { enabled: false },
    support: { enabled: false },
    marketing: { enabled: false },
    analytics: { enabled: false },
    erp: { enabled: false },
    pos: { enabled: false }
  },
  syncInterval: 60,
  dataRetention: 365
};

const aiAnalysisConfig = {
  featureExtraction: {
    enabled: true,
    models: ['doubao', 'qianwen']
  },
  customerSegmentation: {
    enabled: true,
    algorithm: 'kmeans' as 'kmeans' | 'hierarchical' | 'dbscan',
    clusters: 5
  },
  predictiveAnalysis: {
    enabled: true,
    models: ['doubao', 'qianwen']
  }
};

const salesPredictionConfig = {
  enabled: true,
  models: ['doubao', 'qianwen'],
  historicalDataMonths: 12,
  forecastPeriods: 3,
  confidenceLevel: 0.8
};

// 初始化服务
const dataIntegrationService = new DataIntegrationService(mockDayAIClient, dataIntegrationConfig);
const aiAnalysisService = new AIAnalysisService(domesticLLM, aiAnalysisConfig);
const salesPredictionService = new SalesPredictionService(domesticLLM, salesPredictionConfig);
const salesScriptRecommendationService = new SalesScriptRecommendationService(domesticLLM, {
  enabled: true,
  models: ['doubao'],
  scenarioTypes: ['cold_call', 'follow_up', 'demo', 'negotiation'],
  language: 'zh-CN',
  tone: 'professional'
});
const competitorAnalysisService = new CompetitorAnalysisService(domesticLLM, {
  enabled: true,
  models: ['doubao'],
  dataSources: ['market_research', 'social_media', 'reviews'],
  updateFrequency: 'weekly',
  industry: 'technology'
});
const salesFunnelAnalysisService = new SalesFunnelAnalysisService({
  enabled: true,
  stages: ['lead', 'prospect', 'proposal', 'negotiation', 'customer', 'loyal_customer'],
  conversionRateTargets: {
    lead: 1.0,
    prospect: 0.6,
    proposal: 0.4,
    negotiation: 0.3,
    customer: 0.2,
    loyal_customer: 0.1
  },
  analysisPeriod: 'month'
});
const dashboardService = new DashboardService();
const emailIntegrationService = new EmailIntegrationService();
const socialMediaIntegrationService = new SocialMediaIntegrationService();
const crmIntegrationService = new CrmIntegrationService();
const mobileEnhancementService = new MobileEnhancementService();

// 认证中间件
const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers.authorization?.replace('Bearer ', '');
  if (!apiKey) {
    return res.status(401).json({ error: 'Authorization header required' });
  }

  const { valid, userId } = securityService.validateApiKey(apiKey);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid or expired API key' });
  }

  // 将用户ID添加到请求对象
  (req as any).userId = userId;
  next();
};

// 权限检查中间件
const checkPermission = (resource: string, permission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const hasPermission = securityService.checkPermission(userId, resource, permission as any);
    if (!hasPermission) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

// 注册AI模型
domesticLLM.registerDoubao({ apiKey: 'your-doubao-api-key', model: 'doubao-pro' });
domesticLLM.registerQianwen({ apiKey: 'your-qianwen-api-key', model: 'qwen-turbo' });
domesticLLM.registerXinghuo({ apiKey: 'your-xinghuo-api-key', model: 'spark-pro' });
domesticLLM.registerGLM({ apiKey: 'your-glm-api-key', model: 'glm-4' });

// 认证API
app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    const result = await securityService.authenticate(username, password);
    if (!result) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// 客户画像API
app.get('/api/customers', authenticate, checkPermission('customers', 'read'), async (req: Request, res: Response) => {
  try {
    // 这里应该从数据库获取客户数据
    // 暂时使用模拟数据
    const mockCustomers: CustomerProfile[] = [
      {
        id: '1',
        name: '张三',
        phone: '13800138000',
        email: 'zhangsan@example.com',
        wechatId: 'wx123456',
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
            type: 'wechat',
            content: '您好，请问贵公司的产品价格是多少？',
            timestamp: new Date('2024-01-02'),
            sentiment: 'neutral',
            tags: ['询价'],
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
        insights: [
          {
            id: '1',
            type: 'behavioral',
            content: '客户经常在工作日下午咨询产品信息',
            confidence: 0.9,
            timestamp: new Date(),
            actionItems: ['在工作日下午安排专门的客服人员'],
          },
          {
            id: '2',
            type: 'predictive',
            content: '客户可能在未来30天内有购买意向',
            confidence: 0.8,
            timestamp: new Date(),
            actionItems: ['发送个性化的产品推荐', '安排销售跟进'],
          },
        ],
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2024-01-05'),
      },
      {
        id: '2',
        name: '李四',
        phone: '13900139000',
        email: 'lisi@example.com',
        company: 'XYZ公司',
        position: '技术总监',
        tags: ['技术专家', '潜在客户'],
        features: {
          age: 30,
          gender: 'male',
          location: '上海',
          engagementLevel: 'medium',
          purchaseFrequency: 'occasional',
          averageOrderValue: 5000,
          interests: ['技术', '编程', '音乐'],
          preferences: ['技术支持', '产品演示'],
          socialInfluence: 'medium',
          networkSize: 300,
          customerLifetimeValue: 200000,
          churnRisk: 'medium',
          potentialValue: 'medium',
        },
        interactions: [],
        insights: [],
        createdAt: new Date('2023-06-01'),
        updatedAt: new Date('2023-12-01'),
      },
    ];
    res.json(mockCustomers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

app.get('/api/customers/:id', authenticate, checkPermission('customers', 'read'), async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    // 这里应该从数据库获取客户数据
    // 暂时使用模拟数据
    const mockCustomer: CustomerProfile = {
      id,
      name: '张三',
      phone: '13800138000',
      email: 'zhangsan@example.com',
      wechatId: 'wx123456',
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
          type: 'wechat',
          content: '您好，请问贵公司的产品价格是多少？',
          timestamp: new Date('2024-01-02'),
          sentiment: 'neutral',
          tags: ['询价'],
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
      insights: [
        {
          id: '1',
          type: 'behavioral',
          content: '客户经常在工作日下午咨询产品信息',
          confidence: 0.9,
          timestamp: new Date(),
          actionItems: ['在工作日下午安排专门的客服人员'],
        },
        {
          id: '2',
          type: 'predictive',
          content: '客户可能在未来30天内有购买意向',
          confidence: 0.8,
          timestamp: new Date(),
          actionItems: ['发送个性化的产品推荐', '安排销售跟进'],
        },
      ],
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2024-01-05'),
    };
    res.json(mockCustomer);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
});

app.post('/api/customers', authenticate, checkPermission('customers', 'write'), async (req: Request, res: Response) => {
  try {
    const customerData = req.body;
    // 这里应该保存客户数据到数据库
    res.status(201).json({ id: '3', ...customerData });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

app.put('/api/customers/:id', authenticate, checkPermission('customers', 'write'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const customerData = req.body;
    // 这里应该更新数据库中的客户数据
    res.json({ id, ...customerData });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

app.delete('/api/customers/:id', authenticate, checkPermission('customers', 'delete'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // 这里应该从数据库删除客户数据
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete customer' });
  }
});

// 数据集成API
app.post('/api/integrations/email', authenticate, checkPermission('integrations', 'write'), async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    // 这里应该集成邮件数据
    res.json({ success: true, message: 'Email integration started' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to integrate email data' });
  }
});

app.post('/api/integrations/social', authenticate, checkPermission('integrations', 'write'), async (req: Request, res: Response) => {
  try {
    const { platform, accessToken } = req.body;
    // 这里应该集成社交媒体数据
    res.json({ success: true, message: 'Social media integration started' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to integrate social media data' });
  }
});

app.post('/api/integrations/crm', authenticate, checkPermission('integrations', 'write'), async (req: Request, res: Response) => {
  try {
    const { platform, apiKey, domain } = req.body;
    // 这里应该集成CRM数据
    res.json({ success: true, message: 'CRM integration started' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to integrate CRM data' });
  }
});

app.get('/api/integrations/status', authenticate, checkPermission('integrations', 'read'), async (req: Request, res: Response) => {
  try {
    // 这里应该获取所有集成的状态
    res.json({ 
      success: true, 
      integrations: [
        { platform: 'email', status: 'connected', lastSync: new Date().toISOString() },
        { platform: 'social', status: 'disconnected', lastSync: null },
        { platform: 'crm', status: 'connected', lastSync: new Date().toISOString() }
      ]
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get integration status' });
  }
});

// AI分析API
app.post('/api/ai/analyze', authenticate, checkPermission('ai', 'read'), async (req: Request, res: Response) => {
  try {
    const { customerId, analysisType } = req.body;
    // 这里应该调用AI分析服务
    res.json({ 
      success: true, 
      insights: [
        {
          id: '1',
          type: 'behavioral',
          content: '客户经常在工作日下午咨询产品信息',
          confidence: 0.9,
          timestamp: new Date(),
          actionItems: ['在工作日下午安排专门的客服人员'],
        },
      ]
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to analyze customer data' });
  }
});

// 高级AI分析API
app.post('/api/ai/deep-analysis', authenticate, checkPermission('ai', 'read'), async (req: Request, res: Response) => {
  try {
    const { customerId } = req.body;
    // 这里应该调用高级AI分析服务
    res.json({ 
      success: true, 
      message: 'Deep analysis started' 
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to perform deep analysis' });
  }
});

app.post('/api/ai/sentiment-analysis', authenticate, checkPermission('ai', 'read'), async (req: Request, res: Response) => {
  try {
    const { customerId } = req.body;
    // 这里应该调用情感分析服务
    res.json({ 
      success: true, 
      sentiment: 'positive',
      dimensions: {
        productSatisfaction: { sentiment: 'positive', intensity: 0.8 },
        serviceSatisfaction: { sentiment: 'neutral', intensity: 0.5 },
        priceSensitivity: { sentiment: 'negative', intensity: 0.6 }
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to perform sentiment analysis' });
  }
});

app.post('/api/ai/churn-risk', authenticate, checkPermission('ai', 'read'), async (req: Request, res: Response) => {
  try {
    const { customerId } = req.body;
    // 这里应该调用流失风险预测服务
    res.json({ 
      success: true, 
      riskScore: 0.2,
      riskLevel: 'low',
      factors: ['近期互动频繁', '购买历史稳定'],
      recommendations: ['继续保持当前的客户互动策略']
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to predict churn risk' });
  }
});

app.post('/api/ai/marketing-recommendations', authenticate, checkPermission('ai', 'read'), async (req: Request, res: Response) => {
  try {
    const { customerId } = req.body;
    // 这里应该调用营销建议服务
    res.json({ 
      success: true, 
      strategies: ['个性化产品推荐', '会员专属优惠'],
      channels: ['email', 'wechat'],
      content: '基于客户购买历史的个性化产品推荐',
      timing: '工作日下午',
      budget: 2000,
      expectedROI: 4.5
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate marketing recommendations' });
  }
});

app.post('/api/ai/customer-segmentation', authenticate, checkPermission('ai', 'read'), async (req: Request, res: Response) => {
  try {
    // 这里应该调用客户分群服务
    res.json({ 
      success: true, 
      segments: [
        {
          id: '1',
          name: '高价值活跃客户',
          description: '消费金额高且互动频繁的客户',
          size: 25,
          characteristics: ['高消费', '高频互动', '高忠诚度'],
          strategy: '提供VIP服务和专属优惠'
        },
        {
          id: '2',
          name: '潜在客户',
          description: '互动较少但有一定兴趣的客户',
          size: 50,
          characteristics: ['低消费', '低频互动', '高潜力'],
          strategy: '加强培育和个性化推荐'
        }
      ]
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to perform customer segmentation' });
  }
});

// 销售API
app.post('/api/sales/prediction', authenticate, checkPermission('sales', 'read'), async (req: Request, res: Response) => {
  try {
    const { period } = req.body;
    // 这里应该调用销售预测服务
    res.json({ 
      success: true, 
      prediction: {
        period: period || 'month',
        predictions: [
          { period: '2024-03', predictedSales: 50000, predictedOrders: 100, predictedCustomers: 80 },
          { period: '2024-04', predictedSales: 55000, predictedOrders: 110, predictedCustomers: 85 },
          { period: '2024-05', predictedSales: 60000, predictedOrders: 120, predictedCustomers: 90 }
        ],
        trend: 'up',
        insights: ['销售呈上升趋势', '新客户获取率提高'],
        recommendations: ['增加营销投入', '优化客户转化']
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate sales prediction' });
  }
});

app.post('/api/sales/script-recommendation', authenticate, checkPermission('sales', 'read'), async (req: Request, res: Response) => {
  try {
    const { customerId, scenario } = req.body;
    // 这里应该调用销售脚本推荐服务
    res.json({ 
      success: true, 
      script: {
        id: '1',
        scenario: scenario || 'initial_contact',
        content: '您好，我是[公司名称]的[姓名]，很高兴认识您。我们了解到您对[产品/服务]可能有兴趣...',
        suggestions: ['强调产品的核心优势', '询问客户的具体需求', '提供个性化的解决方案'],
        expectedOutcome: '建立初步联系，了解客户需求'
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate sales script' });
  }
});

app.post('/api/sales/competitor-analysis', authenticate, checkPermission('sales', 'read'), async (req: Request, res: Response) => {
  try {
    const { competitorName, industry } = req.body;
    // 这里应该调用竞争对手分析服务
    res.json({ 
      success: true, 
      analysis: {
        competitor: competitorName || '竞争对手A',
        industry: industry || '科技',
        strengths: ['产品功能丰富', '市场份额大', '品牌知名度高'],
        weaknesses: ['价格偏高', '客户服务响应慢', '创新速度慢'],
        opportunities: ['新兴市场', '技术创新', '合作伙伴'],
        threats: ['新进入者', '替代品', '市场饱和'],
        recommendations: ['加强产品创新', '优化价格策略', '提升客户服务']
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to perform competitor analysis' });
  }
});

app.get('/api/sales/funnel', authenticate, checkPermission('sales', 'read'), async (req: Request, res: Response) => {
  try {
    // 这里应该调用销售漏斗分析服务
    res.json({ 
      success: true, 
      funnel: {
        stages: [
          { name: '潜在客户', count: 100 },
          { name: '意向客户', count: 50 },
          { name: '提案阶段', count: 30 },
          { name: '谈判阶段', count: 20 },
          { name: '成交客户', count: 10 }
        ],
        conversionRates: [0.5, 0.6, 0.67, 0.5],
        insights: ['潜在客户到意向客户的转化率较低', '整体转化率为10%'],
        recommendations: ['优化潜在客户培育策略', '改进销售演示']
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to analyze sales funnel' });
  }
});

// 安全API
app.get('/api/audit/logs', authenticate, checkPermission('audit', 'read'), async (req: Request, res: Response) => {
  try {
    const logs = securityService.getAuditLogs();
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

app.get('/api/users', authenticate, checkPermission('users', 'read'), async (req: Request, res: Response) => {
  try {
    const users = securityService.getUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// 仪表盘API
app.get('/api/dashboard', authenticate, checkPermission('dashboard', 'read'), async (req: Request, res: Response) => {
  try {
    const { userId } = (req as any);
    // 这里应该调用仪表盘服务
    res.json({ 
      success: true, 
      dashboard: {
        id: '1',
        userId: userId,
        name: '销售仪表盘',
        layout: [
          { id: '1', type: 'metrics', position: { x: 0, y: 0, w: 2, h: 1 }, config: { metrics: ['sales', 'customers', 'conversion'] } },
          { id: '2', type: 'chart', position: { x: 2, y: 0, w: 4, h: 2 }, config: { type: 'line', data: 'sales_trend' } },
          { id: '3', type: 'table', position: { x: 0, y: 1, w: 3, h: 2 }, config: { data: 'top_customers' } },
          { id: '4', type: 'funnel', position: { x: 3, y: 2, w: 3, h: 2 }, config: { data: 'sales_funnel' } }
        ]
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard' });
  }
});

app.post('/api/dashboard', authenticate, checkPermission('dashboard', 'write'), async (req: Request, res: Response) => {
  try {
    const { name, layout } = req.body;
    // 这里应该创建新的仪表盘
    res.status(201).json({ 
      success: true, 
      dashboard: {
        id: '2',
        name: name || '新仪表盘',
        layout: layout || []
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create dashboard' });
  }
});

app.put('/api/dashboard/:id', authenticate, checkPermission('dashboard', 'write'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, layout } = req.body;
    // 这里应该更新仪表盘
    res.json({ 
      success: true, 
      dashboard: {
        id,
        name: name || '销售仪表盘',
        layout: layout || []
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update dashboard' });
  }
});

// 健康检查
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// 启动服务器
app.listen(port, () => {
  console.log(`API server running on port ${port}`);
});

export default app;