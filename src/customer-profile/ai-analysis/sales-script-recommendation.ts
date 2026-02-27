import { CustomerProfile } from '../models';
import { LLMClient, DomesticLLM } from '../../llm-domestic';
import { v4 as uuidv4 } from 'uuid';

/**
 * 销售话术推荐配置
 */
export interface SalesScriptConfig {
  enabled: boolean;
  models: string[];
  scenarioTypes: string[];
  language: string;
  tone: 'professional' | 'friendly' | 'assertive' | 'consultative';
}

/**
 * 销售场景类型
 */
export type SalesScenario = 
  | 'initial_contact'
  | 'follow_up'
  | 'needs_assessment'
  | 'product_demo'
  | 'proposal'
  | 'negotiation'
  | 'closing'
  | 'customer_retention';

/**
 * 销售话术推荐结果
 */
export interface SalesScriptRecommendation {
  id: string;
  timestamp: Date;
  scenario: SalesScenario;
  customerProfile: Partial<CustomerProfile>;
  scripts: SalesScript[];
  confidence: number;
  context: string;
  nextSteps: string[];
}

/**
 * 销售话术
 */
export interface SalesScript {
  id: string;
  content: string;
  purpose: string;
  estimatedResponse: string;
  effectivenessScore: number;
  keywords: string[];
  length: 'short' | 'medium' | 'long';
}

/**
 * 智能销售话术推荐服务
 */
export class SalesScriptRecommendationService {
  private domesticLLM: DomesticLLM;
  private config: SalesScriptConfig;

  constructor(llmClient: LLMClient, config: SalesScriptConfig) {
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
   * 为特定场景推荐销售话术
   */
  async recommendScripts(profile: CustomerProfile, scenario: SalesScenario): Promise<SalesScriptRecommendation> {
    try {
      // 构建话术推荐提示
      const prompt = this.buildScriptRecommendationPrompt(profile, scenario);
      
      // 调用AI模型生成话术
      const modelType = this.domesticLLM.selectModelByTask('creative');
      const response = await this.domesticLLM.generate(prompt, false, modelType);
      
      // 解析AI响应
      if (response && response.content) {
        try {
          const scriptData = JSON.parse(response.content);
          
          // 构建推荐结果
          const recommendation: SalesScriptRecommendation = {
            id: uuidv4(),
            timestamp: new Date(),
            scenario,
            customerProfile: {
              id: profile.id,
              name: profile.name,
              company: profile.company,
              industry: profile.industry,
              lifecycleStage: profile.lifecycleStage,
              salesStage: profile.salesStage,
              healthScore: profile.healthScore,
            },
            scripts: scriptData.scripts || [],
            confidence: scriptData.confidence || 0.8,
            context: scriptData.context || '',
            nextSteps: scriptData.nextSteps || [],
          };
          
          return recommendation;
        } catch (error) {
          console.error('Error parsing AI response:', error);
          return this.generateDefaultRecommendation(profile, scenario);
        }
      }
      
      return this.generateDefaultRecommendation(profile, scenario);
    } catch (error) {
      console.error('Error recommending sales scripts:', error);
      return this.generateDefaultRecommendation(profile, scenario);
    }
  }

  /**
   * 构建话术推荐提示
   */
  private buildScriptRecommendationPrompt(profile: CustomerProfile, scenario: SalesScenario): string {
    const scenarioName = this.getScenarioName(scenario);
    const communicationHistory = this.formatCommunicationHistory(profile.interactions || []);
    
    return `
    请基于以下客户信息和沟通历史，为${scenarioName}场景生成3-5条有效的销售话术：

    客户信息：
    ${JSON.stringify({
      name: profile.name,
      company: profile.company,
      industry: profile.industry,
      jobTitle: profile.jobTitle,
      lifecycleStage: profile.lifecycleStage,
      salesStage: profile.salesStage,
      healthScore: profile.healthScore,
      preferences: profile.communicationPreferences,
      interests: profile.interests,
    }, null, 2)}

    最近沟通历史：
    ${communicationHistory}

    要求：
    1. 话术要符合${this.config.tone}的语气
    2. 要体现对客户行业和需求的了解
    3. 要针对${scenarioName}场景的特定目标
    4. 要考虑客户的生命周期阶段和销售阶段
    5. 每条话术要包含：内容、目的、预期回应、有效性评分(0-1)、关键词、长度(short/medium/long)

    请以JSON格式返回结果，包含以下字段：
    - scripts: 话术数组
    - confidence: 推荐置信度(0-1)
    - context: 话术使用上下文
    - nextSteps: 建议的后续步骤

    示例输出格式：
    {
      "scripts": [
        {
          "id": "1",
          "content": "您好[客户姓名]，我是[销售姓名]。最近了解到贵公司正在[行业趋势]，想和您分享一些我们如何帮助类似企业的案例。",
          "purpose": "建立初步联系，引起兴趣",
          "estimatedResponse": "客户可能会询问具体案例或表示兴趣",
          "effectivenessScore": 0.85,
          "keywords": ["行业趋势", "案例分享"],
          "length": "short"
        }
      ],
      "confidence": 0.8,
      "context": "适用于首次联系客户，通过行业趋势引起兴趣",
      "nextSteps": ["准备行业案例", "了解客户具体需求", "安排后续会议"]
    }
    `;
  }

  /**
   * 格式化沟通历史
   */
  private formatCommunicationHistory(history: any[]): string {
    if (history.length === 0) {
      return "无沟通历史";
    }
    
    return history.slice(-5).map(item => {
      return `${item.timestamp || item.date}: ${item.type} - ${item.content.substring(0, 100)}${item.content.length > 100 ? '...' : ''}`;
    }).join('\n');
  }

  /**
   * 获取场景名称
   */
  private getScenarioName(scenario: SalesScenario): string {
    const scenarioMap: Record<SalesScenario, string> = {
      initial_contact: '初次接触',
      follow_up: '跟进',
      needs_assessment: '需求评估',
      product_demo: '产品演示',
      proposal: '提案',
      negotiation: '谈判',
      closing: '成交',
      customer_retention: '客户留存'
    };
    return scenarioMap[scenario];
  }

  /**
   * 生成默认推荐结果
   */
  private generateDefaultRecommendation(profile: CustomerProfile, scenario: SalesScenario): SalesScriptRecommendation {
    const defaultScripts = this.getDefaultScripts(scenario, profile);
    
    return {
      id: uuidv4(),
      timestamp: new Date(),
      scenario,
      customerProfile: {
        id: profile.id,
        name: profile.name,
        company: profile.company,
        industry: profile.industry,
        lifecycleStage: profile.lifecycleStage,
        salesStage: profile.salesStage,
        healthScore: profile.healthScore,
      },
      scripts: defaultScripts,
      confidence: 0.5,
      context: `默认${this.getScenarioName(scenario)}场景话术`,
      nextSteps: this.getDefaultNextSteps(scenario),
    };
  }

  /**
   * 获取默认话术
   */
  private getDefaultScripts(scenario: SalesScenario, profile: CustomerProfile): SalesScript[] {
    const scripts: SalesScript[] = [];
    const customerName = profile.name || '客户';
    
    switch (scenario) {
      case 'initial_contact':
        scripts.push(
          {
            id: uuidv4(),
            content: `您好${customerName}，我是[销售姓名]。通过了解，贵公司在[行业]领域表现出色，我们的解决方案已经帮助许多类似企业提升了效率。想和您简单交流一下，看看我们是否能为贵公司提供一些价值。`,
            purpose: '建立初步联系，引起兴趣',
            estimatedResponse: '客户可能会表示兴趣或要求更多信息',
            effectivenessScore: 0.7,
            keywords: ['行业', '解决方案', '价值'],
            length: 'medium'
          },
          {
            id: uuidv4(),
            content: `您好${customerName}，最近看到贵公司在[具体业务]方面的创新，我们的产品可能会对您有所帮助。能否安排一个15分钟的通话，简单介绍一下我们如何支持您的业务发展？`,
            purpose: '寻求初步沟通机会',
            estimatedResponse: '客户可能会同意或询问具体内容',
            effectivenessScore: 0.75,
            keywords: ['创新', '产品', '业务发展'],
            length: 'short'
          }
        );
        break;
        
      case 'follow_up':
        scripts.push(
          {
            id: uuidv4(),
            content: `您好${customerName}，上次和您交流后，我整理了一些针对贵公司需求的具体方案。想和您分享一下，看看是否符合您的期望。`,
            purpose: '跟进上次沟通，提供具体方案',
            estimatedResponse: '客户可能会要求详细说明或安排会议',
            effectivenessScore: 0.8,
            keywords: ['方案', '需求', '期望'],
            length: 'short'
          }
        );
        break;
        
      case 'needs_assessment':
        scripts.push(
          {
            id: uuidv4(),
            content: `您好${customerName}，为了更好地了解您的需求，我想请问几个问题：1. 您目前面临的主要挑战是什么？2. 您对解决方案有什么具体要求？3. 您希望通过我们的产品实现什么目标？`,
            purpose: '了解客户具体需求',
            estimatedResponse: '客户会分享具体需求和挑战',
            effectivenessScore: 0.85,
            keywords: ['需求', '挑战', '目标'],
            length: 'medium'
          }
        );
        break;
        
      case 'product_demo':
        scripts.push(
          {
            id: uuidv4(),
            content: `您好${customerName}，今天我们来演示一下我们的产品如何解决您提到的[具体挑战]。首先，我会展示核心功能，然后根据您的具体需求进行定制演示。`,
            purpose: '展示产品功能，针对客户需求',
            estimatedResponse: '客户会关注产品功能和适用性',
            effectivenessScore: 0.9,
            keywords: ['产品演示', '核心功能', '定制'],
            length: 'medium'
          }
        );
        break;
        
      case 'proposal':
        scripts.push(
          {
            id: uuidv4(),
            content: `您好${customerName}，基于我们的交流和您的需求，我准备了一份详细的提案，包括解决方案、实施计划和投资回报分析。这份提案专门针对贵公司的[具体需求]定制。`,
            purpose: '提交定制化提案',
            estimatedResponse: '客户会仔细阅读提案并提出问题',
            effectivenessScore: 0.85,
            keywords: ['提案', '解决方案', '投资回报'],
            length: 'medium'
          }
        );
        break;
        
      case 'negotiation':
        scripts.push(
          {
            id: uuidv4(),
            content: `您好${customerName}，感谢您对我们提案的反馈。我们理解您对[具体问题]的关注，我们可以调整方案以满足您的需求。您认为哪些方面需要进一步讨论？`,
            purpose: '回应客户反馈，协商解决方案',
            estimatedResponse: '客户会提出具体的修改意见',
            effectivenessScore: 0.8,
            keywords: ['反馈', '调整', '协商'],
            length: 'short'
          }
        );
        break;
        
      case 'closing':
        scripts.push(
          {
            id: uuidv4(),
            content: `您好${customerName}，基于我们的讨论，我们的解决方案能够满足您的[具体需求]。如果您对方案满意，我们可以开始准备合同和实施计划，您认为什么时候可以签署协议？`,
            purpose: '推动成交，确认合作意向',
            estimatedResponse: '客户会确认合作意向或提出最终问题',
            effectivenessScore: 0.85,
            keywords: ['解决方案', '合同', '实施计划'],
            length: 'short'
          }
        );
        break;
        
      case 'customer_retention':
        scripts.push(
          {
            id: uuidv4(),
            content: `您好${customerName}，我们一直关注您使用我们产品的情况，想了解一下您的使用体验如何，是否有任何需要我们支持的地方？同时，我们最近推出了一些新功能，可能会对您的业务有所帮助。`,
            purpose: '维护客户关系，了解使用情况',
            estimatedResponse: '客户会分享使用体验和需求',
            effectivenessScore: 0.8,
            keywords: ['使用体验', '支持', '新功能'],
            length: 'medium'
          }
        );
        break;
    }
    
    return scripts;
  }

  /**
   * 获取默认后续步骤
   */
  private getDefaultNextSteps(scenario: SalesScenario): string[] {
    switch (scenario) {
      case 'initial_contact':
        return ['等待客户回应', '准备行业案例', '制定跟进计划'];
      case 'follow_up':
        return ['准备详细方案', '安排深入会议', '确认客户需求'];
      case 'needs_assessment':
        return ['分析客户需求', '定制解决方案', '准备产品演示'];
      case 'product_demo':
        return ['回答客户问题', '收集反馈', '准备提案'];
      case 'proposal':
        return ['跟进提案反馈', '准备谈判', '解答疑问'];
      case 'negotiation':
        return ['调整方案', '准备合同', '确认细节'];
      case 'closing':
        return ['准备合同', '安排实施', '建立后续联系'];
      case 'customer_retention':
        return ['解决客户问题', '介绍新功能', '收集推荐'];
      default:
        return ['跟进客户', '准备下一步行动'];
    }
  }

  /**
   * 为特定客户生成个性化话术
   */
  async generatePersonalizedScript(profile: CustomerProfile, message: string, purpose: string): Promise<SalesScript> {
    try {
      // 构建个性化话术生成提示
      const prompt = this.buildPersonalizedScriptPrompt(profile, message, purpose);
      
      // 调用AI模型生成话术
      const modelType = this.domesticLLM.selectModelByTask('creative');
      const response = await this.domesticLLM.generate(prompt, false, modelType);
      
      // 解析AI响应
      if (response && response.content) {
        try {
          const script = JSON.parse(response.content);
          return {
            id: uuidv4(),
            ...script,
          };
        } catch (error) {
          console.error('Error parsing AI response:', error);
          return this.generateDefaultPersonalizedScript(profile, purpose);
        }
      }
      
      return this.generateDefaultPersonalizedScript(profile, purpose);
    } catch (error) {
      console.error('Error generating personalized script:', error);
      return this.generateDefaultPersonalizedScript(profile, purpose);
    }
  }

  /**
   * 构建个性化话术生成提示
   */
  private buildPersonalizedScriptPrompt(profile: CustomerProfile, message: string, purpose: string): string {
    return `
    请基于以下客户信息，生成一条个性化的销售话术：

    客户信息：
    ${JSON.stringify({
      name: profile.name,
      company: profile.company,
      industry: profile.industry,
      jobTitle: profile.jobTitle,
      lifecycleStage: profile.lifecycleStage,
      salesStage: profile.salesStage,
      interests: profile.interests,
    }, null, 2)}

    原始消息：
    ${message}

    话术目的：
    ${purpose}

    要求：
    1. 话术要符合${this.config.tone}的语气
    2. 要体现对客户行业和背景的了解
    3. 要针对指定的话术目的
    4. 要保持自然、专业的表达

    请以JSON格式返回结果，包含以下字段：
    - content: 话术内容
    - purpose: 话术目的
    - estimatedResponse: 预期回应
    - effectivenessScore: 有效性评分(0-1)
    - keywords: 关键词数组
    - length: 长度(short/medium/long)

    示例输出格式：
    {
      "content": "您好[客户姓名]，感谢您的反馈。基于您在[行业]的经验，我认为我们的[产品功能]可以帮助您解决[具体问题]。",
      "purpose": "回应客户反馈，提供解决方案",
      "estimatedResponse": "客户可能会对解决方案表示兴趣",
      "effectivenessScore": 0.8,
      "keywords": ["反馈", "解决方案", "行业"],
      "length": "medium"
    }
    `;
  }

  /**
   * 生成默认个性化话术
   */
  private generateDefaultPersonalizedScript(profile: CustomerProfile, purpose: string): SalesScript {
    const customerName = profile.name || '客户';
    
    return {
      id: uuidv4(),
      content: `您好${customerName}，${purpose}。我们的解决方案可以根据您的具体需求进行定制，欢迎随时交流。`,
      purpose,
      estimatedResponse: '客户可能会回应并提出问题',
      effectivenessScore: 0.6,
      keywords: [purpose, '解决方案', '定制'],
      length: 'short'
    };
  }

  /**
   * 分析销售话术效果
   */
  analyzeScriptEffectiveness(script: SalesScript, response: string): {
    effectivenessScore: number;
    strengths: string[];
    improvements: string[];
    suggestions: string[];
  } {
    // 简单的效果分析逻辑
    const effectivenessScore = response.length > 50 ? 0.8 : 0.5;
    const strengths = ['话术结构清晰', '表达专业'];
    const improvements = ['可以增加更多个性化内容', '可以更明确地表达价值主张'];
    const suggestions = ['根据客户回应调整后续话术', '针对客户关注点提供更多信息'];
    
    return {
      effectivenessScore,
      strengths,
      improvements,
      suggestions
    };
  }
}

export default SalesScriptRecommendationService;