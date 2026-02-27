import { CustomerProfile, CustomerInsight, CustomerFeatures } from '../../customer-profile/models';
import { AdvancedModelManager, TaskConfig, TaskType } from '../models/advanced-model-manager';
import { v4 as uuidv4 } from 'uuid';

/**
 * 高级AI分析服务
 */
export class AdvancedAnalysisService {
  private modelManager: AdvancedModelManager;

  constructor() {
    this.modelManager = new AdvancedModelManager();
  }

  /**
   * 深度客户分析
   */
  async deepCustomerAnalysis(profile: CustomerProfile): Promise<CustomerProfile> {
    // 构建分析提示
    const prompt = this.buildDeepAnalysisPrompt(profile);

    // 配置任务
    const taskConfig: TaskConfig = {
      taskType: 'analysis',
      priority: 'high',
      timeout: 30000,
      budget: 0.5,
      quality: 'high'
    };

    // 执行分析任务
    const result = await this.modelManager.executeTask(prompt, taskConfig);

    if (result.success && result.result) {
      try {
        const analysis = JSON.parse(result.result);
        
        // 更新客户特征
        if (analysis.features) {
          profile.features = {
            ...profile.features,
            ...analysis.features
          };
        }

        // 添加深度洞察
        if (analysis.insights) {
          const newInsights = analysis.insights.map((insight: any) => ({
            id: uuidv4(),
            type: insight.type || 'deep',
            content: insight.content || '',
            confidence: insight.confidence || 0.8,
            timestamp: new Date(),
            actionItems: insight.actionItems || []
          }));
          profile.insights = [...(profile.insights || []), ...newInsights];
        }

        // 更新客户标签
        if (analysis.tags) {
          const newTags = analysis.tags.filter((tag: string) => !profile.tags?.includes(tag));
          profile.tags = [...(profile.tags || []), ...newTags];
        }
      } catch (error) {
        console.error('Error parsing deep analysis result:', error);
      }
    }

    profile.updatedAt = new Date();
    return profile;
  }

  /**
   * 构建深度分析提示
   */
  private buildDeepAnalysisPrompt(profile: CustomerProfile): string {
    return `
    请对以下客户进行深度分析，提供全面的客户画像分析：

    ${JSON.stringify(profile, null, 2)}

    请从以下几个维度进行分析：
    1. 客户特征分析：
       - 基本特征：年龄、性别、位置等
       - 行为特征：购买习惯、互动模式等
       - 心理特征：偏好、动机、价值观等
       - 社交特征：社交网络、影响力等

    2. 客户价值分析：
       - 客户终身价值
       - 潜在价值
       - 流失风险
       - 推荐价值

    3. 客户行为预测：
       - 未来购买行为
       - 对营销活动的响应
       - 客户生命周期发展

    4. 个性化建议：
       - 产品推荐
       - 沟通策略
       - 服务优化

    请以JSON格式返回分析结果，包含以下字段：
    - features：客户特征
    - insights：深度洞察
    - tags：推荐标签

    示例输出格式：
    {
      "features": {
        "age": 35,
        "gender": "male",
        "location": "北京",
        "engagementLevel": "high",
        "purchaseFrequency": "frequent",
        "averageOrderValue": 10000,
        "interests": ["技术", "投资", "旅游"],
        "preferences": ["高端服务", "个性化方案"],
        "socialInfluence": "high",
        "networkSize": 500,
        "customerLifetimeValue": 500000,
        "churnRisk": "low",
        "potentialValue": "high"
      },
      "insights": [
        {
          "type": "behavioral",
          "content": "客户经常在工作日下午咨询产品信息",
          "confidence": 0.9,
          "actionItems": ["在工作日下午安排专门的客服人员"]
        },
        {
          "type": "predictive",
          "content": "客户可能在未来30天内有购买意向",
          "confidence": 0.8,
          "actionItems": ["发送个性化的产品推荐", "安排销售跟进"]
        }
      ],
      "tags": ["高价值客户", "技术爱好者", "潜在投资者"]
    }
    `;
  }

  /**
   * 多维度情感分析
   */
  async multiDimensionSentimentAnalysis(profile: CustomerProfile): Promise<{ [key: string]: any }> {
    // 收集客户互动数据
    const interactions = profile.interactions || [];
    const interactionContent = interactions.map(interaction => interaction.content).join('\n');

    // 构建情感分析提示
    const prompt = this.buildSentimentAnalysisPrompt(interactionContent);

    // 配置任务
    const taskConfig: TaskConfig = {
      taskType: 'sentiment',
      priority: 'medium',
      timeout: 20000,
      budget: 0.3,
      quality: 'medium'
    };

    // 执行情感分析任务
    const result = await this.modelManager.executeTask(prompt, taskConfig);

    if (result.success && result.result) {
      try {
        return JSON.parse(result.result);
      } catch (error) {
        console.error('Error parsing sentiment analysis result:', error);
      }
    }

    return {
      overallSentiment: 'neutral',
      dimensions: {},
      confidence: 0.5
    };
  }

  /**
   * 构建情感分析提示
   */
  private buildSentimentAnalysisPrompt(content: string): string {
    return `
    请对以下客户互动内容进行多维度情感分析：

    ${content}

    请从以下维度进行分析：
    1. 整体情感倾向（positive、negative、neutral）
    2. 产品满意度
    3. 服务满意度
    4. 价格敏感度
    5. 品牌认知
    6. 购买意向

    每个维度请给出：
    - 情感倾向（positive、negative、neutral）
    - 强度（0-1）
    - 关键依据

    请以JSON格式返回分析结果，包含以下字段：
    - overallSentiment：整体情感倾向
    - dimensions：各维度分析
    - confidence：分析置信度（0-1）

    示例输出格式：
    {
      "overallSentiment": "positive",
      "dimensions": {
        "productSatisfaction": {
          "sentiment": "positive",
          "intensity": 0.8,
          "evidence": "客户多次提到产品质量好"
        },
        "serviceSatisfaction": {
          "sentiment": "neutral",
          "intensity": 0.5,
          "evidence": "客户对服务没有特别评价"
        },
        "priceSensitivity": {
          "sentiment": "negative",
          "intensity": 0.6,
          "evidence": "客户提到价格偏高"
        },
        "brandPerception": {
          "sentiment": "positive",
          "intensity": 0.7,
          "evidence": "客户认为品牌值得信赖"
        },
        "purchaseIntent": {
          "sentiment": "positive",
          "intensity": 0.85,
          "evidence": "客户表示有购买意向"
        }
      },
      "confidence": 0.85
    }
    `;
  }

  /**
   * 预测客户流失风险
   */
  async predictChurnRisk(profile: CustomerProfile): Promise<{
    riskScore: number; // 0-1
    riskLevel: 'low' | 'medium' | 'high';
    factors: string[];
    recommendations: string[];
    confidence: number;
  }> {
    // 构建流失风险预测提示
    const prompt = this.buildChurnRiskPrompt(profile);

    // 配置任务
    const taskConfig: TaskConfig = {
      taskType: 'prediction',
      priority: 'high',
      timeout: 25000,
      budget: 0.4,
      quality: 'high'
    };

    // 执行预测任务
    const result = await this.modelManager.executeTask(prompt, taskConfig);

    if (result.success && result.result) {
      try {
        return JSON.parse(result.result);
      } catch (error) {
        console.error('Error parsing churn risk prediction:', error);
      }
    }

    return {
      riskScore: 0.5,
      riskLevel: 'medium',
      factors: ['数据不足'],
      recommendations: ['收集更多客户数据'],
      confidence: 0.5
    };
  }

  /**
   * 构建流失风险预测提示
   */
  private buildChurnRiskPrompt(profile: CustomerProfile): string {
    return `
    请分析以下客户数据，预测其流失风险：

    ${JSON.stringify(profile, null, 2)}

    请从以下方面进行分析：
    1. 客户互动频率和质量
    2. 购买历史和消费模式
    3. 客户反馈和情感倾向
    4. 客户生命周期阶段
    5. 与竞争对手的互动

    请返回以下信息：
    - riskScore：流失风险分数（0-1，越高风险越大）
    - riskLevel：风险等级（low、medium、high）
    - factors：导致流失风险的关键因素
    - recommendations：降低流失风险的建议
    - confidence：预测置信度（0-1）

    示例输出格式：
    {
      "riskScore": 0.2,
      "riskLevel": "low",
      "factors": ["近期互动频繁", "购买历史稳定", "情感倾向积极"],
      "recommendations": ["继续保持当前的客户互动策略", "定期发送个性化内容"],
      "confidence": 0.85
    }
    `;
  }

  /**
   * 生成个性化营销建议
   */
  async generatePersonalizedMarketing(profile: CustomerProfile): Promise<{
    strategies: string[];
    channels: string[];
    content: string;
    timing: string;
    budget: number;
    expectedROI: number;
  }> {
    // 构建营销建议提示
    const prompt = this.buildMarketingPrompt(profile);

    // 配置任务
    const taskConfig: TaskConfig = {
      taskType: 'recommendation',
      priority: 'medium',
      timeout: 20000,
      budget: 0.3,
      quality: 'medium'
    };

    // 执行任务
    const result = await this.modelManager.executeTask(prompt, taskConfig);

    if (result.success && result.result) {
      try {
        return JSON.parse(result.result);
      } catch (error) {
        console.error('Error parsing marketing recommendations:', error);
      }
    }

    return {
      strategies: ['个性化邮件营销'],
      channels: ['email', 'wechat'],
      content: '个性化产品推荐',
      timing: '工作日下午',
      budget: 1000,
      expectedROI: 3
    };
  }

  /**
   * 构建营销建议提示
   */
  private buildMarketingPrompt(profile: CustomerProfile): string {
    return `
    请根据以下客户数据，生成个性化的营销建议：

    ${JSON.stringify(profile, null, 2)}

    请考虑以下因素：
    1. 客户的兴趣和偏好
    2. 客户的购买历史和行为
    3. 客户的互动模式
    4. 客户的生命周期阶段
    5. 客户的价值和潜力

    请提供以下信息：
    - strategies：推荐的营销策略
    - channels：推荐的营销渠道
    - content：推荐的营销内容
    - timing：推荐的营销时机
    - budget：建议的营销预算
    - expectedROI：预期投资回报率

    示例输出格式：
    {
      "strategies": ["个性化产品推荐", "会员专属优惠"],
      "channels": ["email", "wechat", "sms"],
      "content": "基于客户购买历史的个性化产品推荐，强调产品的技术优势",
      "timing": "工作日下午2-4点",
      "budget": 2000,
      "expectedROI": 4.5
    }
    `;
  }

  /**
   * 客户分群分析
   */
  async segmentCustomers(profiles: CustomerProfile[]): Promise<{
    segments: Array<{
      id: string;
      name: string;
      description: string;
      size: number;
      characteristics: string[];
      strategy: string;
    }>;
  }> {
    // 构建分群分析提示
    const prompt = this.buildSegmentationPrompt(profiles);

    // 配置任务
    const taskConfig: TaskConfig = {
      taskType: 'analysis',
      priority: 'high',
      timeout: 40000,
      budget: 0.6,
      quality: 'high'
    };

    // 执行任务
    const result = await this.modelManager.executeTask(prompt, taskConfig);

    if (result.success && result.result) {
      try {
        return JSON.parse(result.result);
      } catch (error) {
        console.error('Error parsing customer segmentation:', error);
      }
    }

    return {
      segments: []
    };
  }

  /**
   * 构建分群分析提示
   */
  private buildSegmentationPrompt(profiles: CustomerProfile[]): string {
    // 只发送部分客户数据以避免提示过长
    const sampleProfiles = profiles.slice(0, 10);
    const totalCount = profiles.length;

    return `
    请对以下客户数据进行分群分析，总共${totalCount}个客户，以下是前10个样本：

    ${JSON.stringify(sampleProfiles, null, 2)}

    请：
    1. 基于客户的特征、行为和价值进行分群
    2. 为每个群组命名并提供描述
    3. 分析每个群组的特征和特点
    4. 为每个群组提供针对性的营销策略

    请以JSON格式返回分析结果，包含以下字段：
    - segments：群组数组，每个群组包含id、name、description、size、characteristics、strategy

    示例输出格式：
    {
      "segments": [
        {
          "id": "1",
          "name": "高价值活跃客户",
          "description": "消费金额高且互动频繁的客户",
          "size": 25,
          "characteristics": ["高消费", "高频互动", "高忠诚度"],
          "strategy": "提供VIP服务和专属优惠"
        },
        {
          "id": "2",
          "name": "潜在客户",
          "description": "互动较少但有一定兴趣的客户",
          "size": 50,
          "characteristics": ["低消费", "低频互动", "高潜力"],
          "strategy": "加强培育和个性化推荐"
        }
      ]
    }
    `;
  }
}

export default AdvancedAnalysisService;