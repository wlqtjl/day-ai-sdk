import { CustomerProfile, CustomerFeatures, CustomerInsight, AIAnalysisConfig } from '../models';
import { LLMClient, DomesticLLM, ModelConfig } from '../../llm-domestic';
import { v4 as uuidv4 } from 'uuid';

/**
 * AI分析服务
 */
export class AIAnalysisService {
  private domesticLLM: DomesticLLM;
  private config: AIAnalysisConfig;

  constructor(llmClient: LLMClient, config: AIAnalysisConfig) {
    this.domesticLLM = new DomesticLLM();
    // 注册默认模型
    if (llmClient.constructor.name === 'DoubaoClient') {
      this.domesticLLM.registerDoubao({ apiKey: '', model: 'doubao-pro-1.5' });
    } else if (llmClient.constructor.name === 'QianwenClient') {
      this.domesticLLM.registerQianwen({ apiKey: '', model: 'qwen-plus' });
    }
    this.config = config;
  }

  /**
   * 注册模型
   * @param modelType 模型类型
   * @param config 模型配置
   */
  public registerModel(modelType: string, config: ModelConfig): void {
    switch (modelType) {
      case 'doubao':
        this.domesticLLM.registerDoubao(config);
        break;
      case 'qianwen':
        this.domesticLLM.registerQianwen(config);
        break;
      case 'xinghuo':
        this.domesticLLM.registerXinghuo(config);
        break;
      case 'glm':
        this.domesticLLM.registerGLM(config);
        break;
    }
  }

  /**
   * 设置默认模型
   * @param modelType 模型类型
   */
  public setDefaultModel(modelType: string): void {
    this.domesticLLM.setDefaultModel(modelType as any);
  }

  /**
   * 分析客户画像
   */
  async analyzeCustomerProfile(profile: CustomerProfile): Promise<CustomerProfile> {
    // 提取客户特征
    if (this.config.featureExtraction.enabled) {
      profile.features = await this.extractCustomerFeatures(profile);
    }

    // 生成客户洞察
    profile.insights = await this.generateCustomerInsights(profile);

    // 更新时间戳
    profile.updatedAt = new Date();

    return profile;
  }

  /**
   * 提取客户特征
   */
  private async extractCustomerFeatures(profile: CustomerProfile): Promise<CustomerFeatures> {
    try {
      // 构建分析提示
      const prompt = this.buildFeatureExtractionPrompt(profile);

      // 根据任务类型选择模型
      const modelType = this.domesticLLM.selectModelByTask('technical');

      // 调用AI模型分析
      const response = await this.domesticLLM.generate(prompt, false, modelType);

      // 解析AI响应
      if (response && response.content) {
        try {
          const features = JSON.parse(response.content);
          return {
            ...profile.features,
            ...features,
          };
        } catch (error) {
          console.error('Error parsing AI response:', error);
        }
      }

      // 如果AI分析失败，返回原有特征
      return profile.features;
    } catch (error) {
      console.error('Error extracting customer features:', error);
      return profile.features;
    }
  }

  /**
   * 生成客户洞察
   */
  private async generateCustomerInsights(profile: CustomerProfile): Promise<CustomerInsight[]> {
    try {
      // 构建洞察生成提示
      const prompt = this.buildInsightGenerationPrompt(profile);

      // 根据任务类型选择模型
      const modelType = this.domesticLLM.selectModelByTask('creative');

      // 调用AI模型生成洞察
      const response = await this.domesticLLM.generate(prompt, false, modelType);

      // 解析AI响应
      if (response && response.content) {
        try {
          const insights = JSON.parse(response.content);
          return insights.map((insight: any) => ({
            id: uuidv4(),
            type: insight.type || 'behavioral',
            content: insight.content || '',
            confidence: insight.confidence || 0.8,
            timestamp: new Date(),
            actionItems: insight.actionItems || [],
          }));
        } catch (error) {
          console.error('Error parsing AI response:', error);
        }
      }

      // 如果AI分析失败，返回空数组
      return [];
    } catch (error) {
      console.error('Error generating customer insights:', error);
      return [];
    }
  }

  /**
   * 构建特征提取提示
   */
  private buildFeatureExtractionPrompt(profile: CustomerProfile): string {
    return `
    请分析以下客户数据，提取并完善客户特征：

    ${JSON.stringify(profile, null, 2)}

    请根据客户的基本信息、互动记录等数据，分析并补充以下特征：
    1. 基本特征：年龄、性别、位置
    2. 行为特征：参与度、购买频率、平均订单价值
    3. 兴趣特征：兴趣爱好、偏好
    4. 社交特征：社交影响力、网络规模
    5. 价值特征：客户终身价值、流失风险、潜在价值

    请以JSON格式返回分析结果，只包含特征数据，不包含其他文字说明。
    例如：
    {
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
    }
    `;
  }

  /**
   * 构建洞察生成提示
   */
  private buildInsightGenerationPrompt(profile: CustomerProfile): string {
    return `
    请分析以下客户数据，生成有价值的客户洞察：

    ${JSON.stringify(profile, null, 2)}

    请根据客户的特征和互动记录，生成以下类型的洞察：
    1. 行为洞察：客户的行为模式和习惯
    2. 预测洞察：客户未来可能的行为和需求
    3. 推荐洞察：针对客户的个性化建议

    每个洞察应包含：
    - 类型（behavioral、predictive、recommendation）
    - 内容（洞察描述）
    - 置信度（0-1之间）
    - 行动建议（具体的行动项）

    请以JSON数组格式返回分析结果，只包含洞察数据，不包含其他文字说明。
    例如：
    [
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
      },
      {
        "type": "recommendation",
        "content": "建议为客户提供定制化的解决方案",
        "confidence": 0.95,
        "actionItems": ["根据客户需求定制方案", "提供专属折扣"]
      }
    ]
    `;
  }

  /**
   * 客户分群
   */
  async segmentCustomers(profiles: CustomerProfile[]): Promise<Map<string, CustomerProfile[]>> {
    try {
      if (!this.config.customerSegmentation.enabled) {
        return new Map();
      }

      // 这里可以实现不同的聚类算法
      // 暂时使用简单的基于特征的分群
      const segments = new Map<string, CustomerProfile[]>();

      profiles.forEach(profile => {
        const key = `${profile.features.engagementLevel}_${profile.features.potentialValue}`;
        if (!segments.has(key)) {
          segments.set(key, []);
        }
        segments.get(key)?.push(profile);
      });

      return segments;
    } catch (error) {
      console.error('Error segmenting customers:', error);
      return new Map();
    }
  }

  /**
   * 预测客户行为
   */
  async predictCustomerBehavior(profile: CustomerProfile): Promise<{ [key: string]: any }> {
    try {
      if (!this.config.predictiveAnalysis.enabled) {
        return {};
      }

      // 构建预测提示
      const prompt = this.buildBehaviorPredictionPrompt(profile);

      // 根据任务类型选择模型
      const modelType = this.domesticLLM.selectModelByTask('academic');

      // 调用AI模型进行预测
      const response = await this.domesticLLM.generate(prompt, false, modelType);

      // 解析AI响应
      if (response && response.content) {
        try {
          return JSON.parse(response.content);
        } catch (error) {
          console.error('Error parsing AI response:', error);
        }
      }

      return {};
    } catch (error) {
      console.error('Error predicting customer behavior:', error);
      return {};
    }
  }

  /**
   * 构建行为预测提示
   */
  private buildBehaviorPredictionPrompt(profile: CustomerProfile): string {
    return `
    请分析以下客户数据，预测客户未来的行为：

    ${JSON.stringify(profile, null, 2)}

    请预测以下方面：
    1. 未来30天内的购买可能性（0-1之间）
    2. 未来6个月内的流失风险（0-1之间）
    3. 未来可能感兴趣的产品或服务
    4. 最佳的沟通方式和时机

    请以JSON格式返回预测结果，只包含预测数据，不包含其他文字说明。
    例如：
    {
      "purchaseProbability": 0.85,
      "churnRisk": 0.1,
      "potentialInterests": ["高级版产品", "专业服务"],
      "optimalCommunication": {
        "channel": "微信",
        "time": "工作日下午"
      }
    }
    `;
  }
}

export default AIAnalysisService;
