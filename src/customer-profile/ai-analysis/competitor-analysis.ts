import { LLMClient, DomesticLLM } from '../../llm-domestic';
import { v4 as uuidv4 } from 'uuid';

/**
 * 竞争对手分析配置
 */
export interface CompetitorAnalysisConfig {
  enabled: boolean;
  models: string[];
  dataSources: string[];
  updateFrequency: 'daily' | 'weekly' | 'monthly';
  industry: string;
}

/**
 * 竞争对手信息
 */
export interface Competitor {
  id: string;
  name: string;
  industry: string;
  marketShare: number;
  strengths: string[];
  weaknesses: string[];
  products: CompetitorProduct[];
  pricingStrategy: string;
  marketingStrategy: string;
  recentActivities: string[];
  lastUpdated: Date;
}

/**
 * 竞争对手产品
 */
export interface CompetitorProduct {
  id: string;
  name: string;
  features: string[];
  pricing: string;
  targetAudience: string[];
  competitiveAdvantages: string[];
}

/**
 * 竞争对手分析结果
 */
export interface CompetitorAnalysis {
  id: string;
  timestamp: Date;
  industry: string;
  competitors: Competitor[];
  marketAnalysis: MarketAnalysis;
  competitiveLandscape: CompetitiveLandscape;
  insights: string[];
  recommendations: string[];
  confidence: number;
}

/**
 * 市场分析
 */
export interface MarketAnalysis {
  marketSize: number;
  growthRate: number;
  keyTrends: string[];
  opportunities: string[];
  threats: string[];
  customerSegments: string[];
}

/**
 * 竞争格局
 */
export interface CompetitiveLandscape {
  leader: string;
  challengers: string[];
  followers: string[];
  nichers: string[];
  marketDynamics: string[];
  competitiveIntensity: 'low' | 'medium' | 'high';
}

/**
 * 智能竞争对手分析服务
 */
export class CompetitorAnalysisService {
  private domesticLLM: DomesticLLM;
  private config: CompetitorAnalysisConfig;
  private competitors: Competitor[] = [];

  constructor(llmClient: LLMClient, config: CompetitorAnalysisConfig) {
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
   * 添加竞争对手
   */
  addCompetitor(competitor: Omit<Competitor, 'id' | 'lastUpdated'>): Competitor {
    const newCompetitor: Competitor = {
      ...competitor,
      id: uuidv4(),
      lastUpdated: new Date(),
    };
    this.competitors.push(newCompetitor);
    return newCompetitor;
  }

  /**
   * 更新竞争对手信息
   */
  updateCompetitor(id: string, updates: Partial<Competitor>): Competitor | null {
    const index = this.competitors.findIndex(c => c.id === id);
    if (index !== -1) {
      this.competitors[index] = {
        ...this.competitors[index],
        ...updates,
        lastUpdated: new Date(),
      };
      return this.competitors[index];
    }
    return null;
  }

  /**
   * 删除竞争对手
   */
  removeCompetitor(id: string): boolean {
    const initialLength = this.competitors.length;
    this.competitors = this.competitors.filter(c => c.id !== id);
    return this.competitors.length < initialLength;
  }

  /**
   * 获取所有竞争对手
   */
  getCompetitors(): Competitor[] {
    return this.competitors;
  }

  /**
   * 分析竞争对手
   */
  async analyzeCompetitors(): Promise<CompetitorAnalysis> {
    try {
      // 构建竞争对手分析提示
      const prompt = this.buildCompetitorAnalysisPrompt();
      
      // 调用AI模型进行分析
      const modelType = this.domesticLLM.selectModelByTask('analytic');
      const response = await this.domesticLLM.generate(prompt, false, modelType);
      
      // 解析AI响应
      if (response && response.content) {
        try {
          const analysisData = JSON.parse(response.content);
          
          // 构建分析结果
          const analysis: CompetitorAnalysis = {
            id: uuidv4(),
            timestamp: new Date(),
            industry: this.config.industry,
            competitors: this.competitors,
            marketAnalysis: analysisData.marketAnalysis || this.getDefaultMarketAnalysis(),
            competitiveLandscape: analysisData.competitiveLandscape || this.getDefaultCompetitiveLandscape(),
            insights: analysisData.insights || [],
            recommendations: analysisData.recommendations || [],
            confidence: analysisData.confidence || 0.8,
          };
          
          return analysis;
        } catch (error) {
          console.error('Error parsing AI response:', error);
          return this.generateDefaultAnalysis();
        }
      }
      
      return this.generateDefaultAnalysis();
    } catch (error) {
      console.error('Error analyzing competitors:', error);
      return this.generateDefaultAnalysis();
    }
  }

  /**
   * 构建竞争对手分析提示
   */
  private buildCompetitorAnalysisPrompt(): string {
    return `
    请基于以下竞争对手信息，进行全面的竞争对手分析：

    行业：${this.config.industry}

    竞争对手信息：
    ${JSON.stringify(this.competitors, null, 2)}

    请分析以下方面：
    1. 市场分析：市场规模、增长率、关键趋势、机会和威胁
    2. 竞争格局：市场领导者、挑战者、跟随者、利基市场玩家
    3. 竞争对手优势和劣势分析
    4. 市场动态和竞争强度
    5. 关键洞察和战略建议

    请以JSON格式返回分析结果，包含以下字段：
    - marketAnalysis: 市场分析
    - competitiveLandscape: 竞争格局
    - insights: 关键洞察数组
    - recommendations: 战略建议数组
    - confidence: 分析置信度(0-1)

    示例输出格式：
    {
      "marketAnalysis": {
        "marketSize": 1000000000,
        "growthRate": 0.15,
        "keyTrends": ["数字化转型", "AI集成"],
        "opportunities": ["新兴市场", "细分领域"],
        "threats": ["新进入者", "技术变革"],
        "customerSegments": ["大型企业", "中小企业"]
      },
      "competitiveLandscape": {
        "leader": "竞争对手A",
        "challengers": ["竞争对手B"],
        "followers": ["竞争对手C"],
        "nichers": ["竞争对手D"],
        "marketDynamics": ["价格竞争", "创新竞争"],
        "competitiveIntensity": "high"
      },
      "insights": ["市场增长迅速", "竞争激烈"],
      "recommendations": ["加强产品创新", "优化定价策略"],
      "confidence": 0.85
    }
    `;
  }

  /**
   * 生成默认分析结果
   */
  private generateDefaultAnalysis(): CompetitorAnalysis {
    return {
      id: uuidv4(),
      timestamp: new Date(),
      industry: this.config.industry,
      competitors: this.competitors,
      marketAnalysis: this.getDefaultMarketAnalysis(),
      competitiveLandscape: this.getDefaultCompetitiveLandscape(),
      insights: ['基于有限数据的分析', '需要更多市场数据'],
      recommendations: ['收集更多竞争对手信息', '定期更新市场数据'],
      confidence: 0.5,
    };
  }

  /**
   * 获取默认市场分析
   */
  private getDefaultMarketAnalysis(): MarketAnalysis {
    return {
      marketSize: 0,
      growthRate: 0,
      keyTrends: [],
      opportunities: [],
      threats: [],
      customerSegments: [],
    };
  }

  /**
   * 获取默认竞争格局
   */
  private getDefaultCompetitiveLandscape(): CompetitiveLandscape {
    return {
      leader: '',
      challengers: [],
      followers: [],
      nichers: [],
      marketDynamics: [],
      competitiveIntensity: 'medium',
    };
  }

  /**
   * 分析竞争对手产品
   */
  analyzeCompetitorProducts(competitorId: string): {
    products: CompetitorProduct[];
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
  } {
    const competitor = this.competitors.find(c => c.id === competitorId);
    if (!competitor) {
      return {
        products: [],
        strengths: [],
        weaknesses: [],
        opportunities: [],
      };
    }

    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const opportunities: string[] = [];

    // 分析产品优势
    competitor.products.forEach(product => {
      product.competitiveAdvantages.forEach(advantage => {
        if (!strengths.includes(advantage)) {
          strengths.push(advantage);
        }
      });
    });

    // 简单的弱点分析
    if (competitor.products.length === 0) {
      weaknesses.push('产品线不完整');
    }

    // 生成机会
    opportunities.push('产品差异化', '市场定位优化', '客户体验提升');

    return {
      products: competitor.products,
      strengths,
      weaknesses,
      opportunities,
    };
  }

  /**
   * 比较竞争对手
   */
  compareCompetitors(competitorIds: string[]): {
    comparison: Record<string, any>;
    keyDifferentiators: string[];
    marketPositioning: Record<string, string>;
  } {
    const selectedCompetitors = this.competitors.filter(c => competitorIds.includes(c.id));
    const comparison: Record<string, any> = {};
    const keyDifferentiators: string[] = [];
    const marketPositioning: Record<string, string> = {};

    selectedCompetitors.forEach(competitor => {
      comparison[competitor.name] = {
        marketShare: competitor.marketShare,
        strengths: competitor.strengths,
        weaknesses: competitor.weaknesses,
        productCount: competitor.products.length,
        recentActivities: competitor.recentActivities,
      };

      // 确定市场定位
      if (competitor.marketShare > 30) {
        marketPositioning[competitor.name] = '市场领导者';
      } else if (competitor.marketShare > 15) {
        marketPositioning[competitor.name] = '市场挑战者';
      } else if (competitor.marketShare > 5) {
        marketPositioning[competitor.name] = '市场跟随者';
      } else {
        marketPositioning[competitor.name] = '利基市场玩家';
      }
    });

    // 识别关键差异点
    keyDifferentiators.push('市场份额', '产品多样性', '营销策略', '技术创新');

    return {
      comparison,
      keyDifferentiators,
      marketPositioning,
    };
  }

  /**
   * 预测竞争对手行动
   */
  async predictCompetitorActions(competitorId: string): Promise<{
    possibleActions: string[];
    likelihood: number[];
    impact: string[];
    recommendations: string[];
  }> {
    const competitor = this.competitors.find(c => c.id === competitorId);
    if (!competitor) {
      return {
        possibleActions: [],
        likelihood: [],
        impact: [],
        recommendations: [],
      };
    }

    try {
      // 构建预测提示
      const prompt = this.buildCompetitorActionPrompt(competitor);
      
      // 调用AI模型进行预测
      const modelType = this.domesticLLM.selectModelByTask('predictive');
      const response = await this.domesticLLM.generate(prompt, false, modelType);
      
      // 解析AI响应
      if (response && response.content) {
        try {
          return JSON.parse(response.content);
        } catch (error) {
          console.error('Error parsing AI response:', error);
          return this.generateDefaultCompetitorActionPrediction();
        }
      }
      
      return this.generateDefaultCompetitorActionPrediction();
    } catch (error) {
      console.error('Error predicting competitor actions:', error);
      return this.generateDefaultCompetitorActionPrediction();
    }
  }

  /**
   * 构建竞争对手行动预测提示
   */
  private buildCompetitorActionPrompt(competitor: Competitor): string {
    return `
    请基于以下竞争对手信息，预测其未来可能采取的行动：

    竞争对手：${competitor.name}
    行业：${competitor.industry}
    市场份额：${competitor.marketShare}%
    优势：${competitor.strengths.join(', ')}
    劣势：${competitor.weaknesses.join(', ')}
    最近活动：${competitor.recentActivities.join(', ')}

    请预测：
    1. 未来6-12个月可能采取的3-5个关键行动
    2. 每个行动的可能性（0-1）
    3. 每个行动对市场的影响
    4. 应对这些行动的建议

    请以JSON格式返回结果，包含以下字段：
    - possibleActions: 可能的行动数组
    - likelihood: 可能性数组
    - impact: 影响数组
    - recommendations: 应对建议数组

    示例输出格式：
    {
      "possibleActions": ["产品升级", "价格调整", "市场扩张"],
      "likelihood": [0.8, 0.6, 0.4],
      "impact": ["中等", "高", "低"],
      "recommendations": ["加强产品研发", "优化定价策略", "关注目标市场"]
    }
    `;
  }

  /**
   * 生成默认竞争对手行动预测
   */
  private generateDefaultCompetitorActionPrediction(): {
    possibleActions: string[];
    likelihood: number[];
    impact: string[];
    recommendations: string[];
  } {
    return {
      possibleActions: ['产品更新', '价格调整', '营销活动'],
      likelihood: [0.7, 0.5, 0.6],
      impact: ['中等', '高', '低'],
      recommendations: ['持续监控', '灵活应对', '差异化竞争'],
    };
  }

  /**
   * 生成竞争情报报告
   */
  async generateCompetitiveIntelligenceReport(): Promise<{
    reportId: string;
    timestamp: Date;
    industryOverview: string;
    competitorAnalysis: string;
    marketTrends: string;
    strategicRecommendations: string;
  }> {
    try {
      // 构建报告生成提示
      const prompt = this.buildCompetitiveIntelligenceReportPrompt();
      
      // 调用AI模型生成报告
      const modelType = this.domesticLLM.selectModelByTask('creative');
      const response = await this.domesticLLM.generate(prompt, false, modelType);
      
      // 解析AI响应
      if (response && response.content) {
        try {
          const reportData = JSON.parse(response.content);
          return {
            reportId: uuidv4(),
            timestamp: new Date(),
            ...reportData,
          };
        } catch (error) {
          console.error('Error parsing AI response:', error);
          return this.generateDefaultCompetitiveIntelligenceReport();
        }
      }
      
      return this.generateDefaultCompetitiveIntelligenceReport();
    } catch (error) {
      console.error('Error generating competitive intelligence report:', error);
      return this.generateDefaultCompetitiveIntelligenceReport();
    }
  }

  /**
   * 构建竞争情报报告提示
   */
  private buildCompetitiveIntelligenceReportPrompt(): string {
    return `
    请基于以下竞争对手信息，生成一份详细的竞争情报报告：

    行业：${this.config.industry}

    竞争对手信息：
    ${JSON.stringify(this.competitors, null, 2)}

    报告应包含以下部分：
    1. 行业概览：市场规模、增长趋势、关键驱动因素
    2. 竞争对手分析：各竞争对手的优势、劣势、市场定位
    3. 市场趋势：技术发展、客户需求变化、监管环境
    4. 战略建议：如何应对竞争、把握市场机会

    请以JSON格式返回报告，包含以下字段：
    - industryOverview: 行业概览
    - competitorAnalysis: 竞争对手分析
    - marketTrends: 市场趋势
    - strategicRecommendations: 战略建议

    示例输出格式：
    {
      "industryOverview": "行业规模达到1000亿，年增长率15%，主要由数字化转型驱动...",
      "competitorAnalysis": "竞争对手A是市场领导者，拥有35%的市场份额，优势在于技术创新...",
      "marketTrends": "AI和自动化成为行业趋势，客户对个性化服务需求增加...",
      "strategicRecommendations": "加强研发投入，优化客户体验，拓展新兴市场..."
    }
    `;
  }

  /**
   * 生成默认竞争情报报告
   */
  private generateDefaultCompetitiveIntelligenceReport(): {
    reportId: string;
    timestamp: Date;
    industryOverview: string;
    competitorAnalysis: string;
    marketTrends: string;
    strategicRecommendations: string;
  } {
    return {
      reportId: uuidv4(),
      timestamp: new Date(),
      industryOverview: `(${this.config.industry})行业概览：基于有限数据，需要更多市场信息。`,
      competitorAnalysis: '竞争对手分析：需要更多竞争对手详细信息。',
      marketTrends: '市场趋势：需要最新市场数据和趋势分析。',
      strategicRecommendations: '战略建议：基于现有信息，建议加强市场调研和竞争对手监控。',
    };
  }
}

export default CompetitorAnalysisService;