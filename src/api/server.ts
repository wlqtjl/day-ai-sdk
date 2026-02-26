import express, { Request, Response } from 'express';
import { CustomerProfile, DataIntegrationService, AIAnalysisService } from '../customer-profile';
import { DomesticLLM } from '../llm-domestic';

const app = express();
const port = process.env.PORT || 3000;

// 中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 初始化服务
const domesticLLM = new DomesticLLM();

// 创建模拟的DayAIClient
const mockDayAIClient = {
  mcpCallTool: async () => ({
    success: true,
    data: {
      content: [{ text: '[]' }]
    }
  })
} as any;

// 创建配置对象
const dataIntegrationConfig = {
  sources: {
    crm: { enabled: true },
    wechat: { enabled: true },
    email: { enabled: false },
    social: { enabled: false },
    internal: { enabled: false }
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

const dataIntegrationService = new DataIntegrationService(mockDayAIClient, dataIntegrationConfig);
const aiAnalysisService = new AIAnalysisService(domesticLLM, aiAnalysisConfig);

// 注册AI模型
domesticLLM.registerDoubao({ apiKey: 'your-doubao-api-key', model: 'doubao-pro' });
domesticLLM.registerQianwen({ apiKey: 'your-qianwen-api-key', model: 'qwen-turbo' });
domesticLLM.registerXinghuo({ apiKey: 'your-xinghuo-api-key', model: 'spark-pro' });
domesticLLM.registerGLM({ apiKey: 'your-glm-api-key', model: 'glm-4' });

// 客户画像API
app.get('/api/customers', async (req: Request, res: Response) => {
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

app.get('/api/customers/:id', async (req: Request, res: Response) => {
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

app.post('/api/customers', async (req: Request, res: Response) => {
  try {
    const customerData = req.body;
    // 这里应该保存客户数据到数据库
    res.status(201).json({ id: '3', ...customerData });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

app.put('/api/customers/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const customerData = req.body;
    // 这里应该更新数据库中的客户数据
    res.json({ id, ...customerData });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

app.delete('/api/customers/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // 这里应该从数据库删除客户数据
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete customer' });
  }
});

// 数据集成API
app.post('/api/integrations/email', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    // 这里应该集成邮件数据
    res.json({ success: true, message: 'Email integration started' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to integrate email data' });
  }
});

app.post('/api/integrations/social', async (req: Request, res: Response) => {
  try {
    const { platform, accessToken } = req.body;
    // 这里应该集成社交媒体数据
    res.json({ success: true, message: 'Social media integration started' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to integrate social media data' });
  }
});

// AI分析API
app.post('/api/ai/analyze', async (req: Request, res: Response) => {
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

// 健康检查
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// 启动服务器
app.listen(port, () => {
  console.log(`API server running on port ${port}`);
});

export default app;