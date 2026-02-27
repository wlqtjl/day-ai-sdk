import { CustomerProfile, Order } from '../models';
import { LLMClient, DomesticLLM } from '../../llm-domestic';
import { v4 as uuidv4 } from 'uuid';

/**
 * 销售预测配置
 */
export interface SalesPredictionConfig {
  enabled: boolean;
  models: string[];
  historicalDataMonths: number;
  forecastPeriods: number;
  confidenceLevel: number; // 0-1
}

/**
 * 销售预测结果
 */
export interface SalesPrediction {
  id: string;
  timestamp: Date;
  period: 'week' | 'month' | 'quarter' | 'year';
  predictions: SalesPredictionItem[];
  confidence: number;
  historicalData: SalesHistoricalData[];
  trend: 'up' | 'down' | 'stable';
  insights: string[];
  recommendations: string[];
}

/**
 * 销售预测项
 */
export interface SalesPredictionItem {
  period: string; // 具体的时间周期，如 "2024-03"
  predictedSales: number;
  predictedOrders: number;
  predictedCustomers: number;
  confidence: number;
  factors: string[];
}

/**
 * 销售历史数据
 */
export interface SalesHistoricalData {
  period: string;
  actualSales: number;
  actualOrders: number;
  actualCustomers: number;
}

/**
 * 销售漏斗阶段
 */
export interface SalesFunnelStage {
  name: string;
  count: number;
}

/**
 * 智能销售预测服务
 */
export class SalesPredictionService {
  private domesticLLM: DomesticLLM;
  private config: SalesPredictionConfig;

  constructor(llmClient: LLMClient, config: SalesPredictionConfig) {
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
   * 预测销售趋势
   */
  async predictSalesTrend(profiles: CustomerProfile[], period: 'week' | 'month' | 'quarter' | 'year' = 'month'): Promise<SalesPrediction> {
    try {
      // 准备历史销售数据
      const historicalData = this.prepareHistoricalData(profiles, period);
      
      // 构建预测提示
      const prompt = this.buildPredictionPrompt(historicalData, period);
      
      // 调用AI模型进行预测
      const modelType = this.domesticLLM.selectModelByTask('academic');
      const response = await this.domesticLLM.generate(prompt, false, modelType);
      
      // 解析AI响应
      if (response && response.content) {
        try {
          const predictionData = JSON.parse(response.content);
          
          // 构建预测结果
          const prediction: SalesPrediction = {
            id: uuidv4(),
            timestamp: new Date(),
            period,
            predictions: predictionData.predictions || [],
            confidence: predictionData.confidence || 0.8,
            historicalData,
            trend: predictionData.trend || 'stable',
            insights: predictionData.insights || [],
            recommendations: predictionData.recommendations || [],
          };
          
          return prediction;
        } catch (error) {
          console.error('Error parsing AI response:', error);
          return this.generateDefaultPrediction(historicalData, period);
        }
      }
      
      return this.generateDefaultPrediction(historicalData, period);
    } catch (error) {
      console.error('Error predicting sales trend:', error);
      return this.generateDefaultPrediction([], period);
    }
  }

  /**
   * 准备历史销售数据
   */
  private prepareHistoricalData(profiles: CustomerProfile[], period: 'week' | 'month' | 'quarter' | 'year'): SalesHistoricalData[] {
    const historicalData: SalesHistoricalData[] = [];
    const now = new Date();
    
    // 收集所有订单
    const allOrders: Order[] = [];
    profiles.forEach(profile => {
      if (profile.orders) {
        allOrders.push(...profile.orders);
      }
    });
    
    // 按时间周期分组
    const ordersByPeriod = new Map<string, Order[]>();
    allOrders.forEach(order => {
      const periodKey = this.getPeriodKey(order.date, period);
      if (!ordersByPeriod.has(periodKey)) {
        ordersByPeriod.set(periodKey, []);
      }
      ordersByPeriod.get(periodKey)?.push(order);
    });
    
    // 生成历史数据
    const periods = this.generatePeriods(period, this.config.historicalDataMonths);
    periods.forEach(periodKey => {
      const orders = ordersByPeriod.get(periodKey) || [];
      const actualSales = orders.reduce((sum, order) => sum + order.total, 0);
      const actualOrders = orders.length;
      const uniqueCustomers = new Set(orders.map(order => order.id)).size;
      
      historicalData.push({
        period: periodKey,
        actualSales,
        actualOrders,
        actualCustomers: uniqueCustomers,
      });
    });
    
    return historicalData;
  }

  /**
   * 获取时间周期的键
   */
  private getPeriodKey(date: Date, period: 'week' | 'month' | 'quarter' | 'year'): string {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    
    switch (period) {
      case 'year':
        return year.toString();
      case 'quarter':
        const quarter = Math.floor((month - 1) / 3) + 1;
        return `${year}-Q${quarter}`;
      case 'month':
        return `${year}-${month.toString().padStart(2, '0')}`;
      case 'week':
        const weekNumber = this.getWeekNumber(date);
        return `${year}-W${weekNumber.toString().padStart(2, '0')}`;
      default:
        return `${year}-${month.toString().padStart(2, '0')}`;
    }
  }

  /**
   * 获取周数
   */
  private getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  /**
   * 生成时间周期
   */
  private generatePeriods(period: 'week' | 'month' | 'quarter' | 'year', count: number): string[] {
    const periods: string[] = [];
    const now = new Date();
    
    for (let i = count - 1; i >= 0; i--) {
      const targetDate = new Date(now);
      
      switch (period) {
        case 'year':
          targetDate.setFullYear(now.getFullYear() - i);
          break;
        case 'quarter':
          targetDate.setMonth(now.getMonth() - i * 3);
          break;
        case 'month':
          targetDate.setMonth(now.getMonth() - i);
          break;
        case 'week':
          targetDate.setDate(now.getDate() - i * 7);
          break;
      }
      
      periods.push(this.getPeriodKey(targetDate, period));
    }
    
    return periods;
  }

  /**
   * 构建预测提示
   */
  private buildPredictionPrompt(historicalData: SalesHistoricalData[], period: 'week' | 'month' | 'quarter' | 'year'): string {
    return `
    请基于以下历史销售数据，预测未来${this.config.forecastPeriods}个${this.getPeriodName(period)}的销售趋势：

    ${JSON.stringify(historicalData, null, 2)}

    请分析以下方面：
    1. 销售趋势（上升、下降或稳定）
    2. 未来${this.config.forecastPeriods}个${this.getPeriodName(period)}的预测销售额、订单数量和客户数量
    3. 影响销售的关键因素
    4. 提高销售的建议

    请以JSON格式返回分析结果，包含以下字段：
    - predictions: 预测数据数组，每个元素包含period、predictedSales、predictedOrders、predictedCustomers、confidence、factors
    - confidence: 整体预测置信度（0-1）
    - trend: 趋势（up、down、stable）
    - insights: 关键洞察数组
    - recommendations: 建议数组

    示例输出格式：
    {
      "predictions": [
        {
          "period": "2024-03",
          "predictedSales": 50000,
          "predictedOrders": 100,
          "predictedCustomers": 80,
          "confidence": 0.85,
          "factors": ["季节性因素", "市场推广"]
        }
      ],
      "confidence": 0.8,
      "trend": "up",
      "insights": ["销售呈上升趋势", "新客户获取率提高"],
      "recommendations": ["增加营销投入", "优化客户转化"]
    }
    `;
  }

  /**
   * 获取周期名称
   */
  private getPeriodName(period: 'week' | 'month' | 'quarter' | 'year'): string {
    switch (period) {
      case 'week':
        return '周';
      case 'month':
        return '月';
      case 'quarter':
        return '季度';
      case 'year':
        return '年';
      default:
        return '月';
    }
  }

  /**
   * 生成默认预测结果
   */
  private generateDefaultPrediction(historicalData: SalesHistoricalData[], period: 'week' | 'month' | 'quarter' | 'year'): SalesPrediction {
    const predictions: SalesPredictionItem[] = [];
    const futurePeriods = this.generateFuturePeriods(period, this.config.forecastPeriods);
    
    // 计算历史平均值
    let avgSales = 0;
    let avgOrders = 0;
    let avgCustomers = 0;
    
    if (historicalData.length > 0) {
      avgSales = historicalData.reduce((sum, data) => sum + data.actualSales, 0) / historicalData.length;
      avgOrders = historicalData.reduce((sum, data) => sum + data.actualOrders, 0) / historicalData.length;
      avgCustomers = historicalData.reduce((sum, data) => sum + data.actualCustomers, 0) / historicalData.length;
    }
    
    // 生成预测
    futurePeriods.forEach(futurePeriod => {
      predictions.push({
        period: futurePeriod,
        predictedSales: avgSales,
        predictedOrders: avgOrders,
        predictedCustomers: avgCustomers,
        confidence: 0.5,
        factors: ['历史趋势'],
      });
    });
    
    return {
      id: uuidv4(),
      timestamp: new Date(),
      period,
      predictions,
      confidence: 0.5,
      historicalData,
      trend: 'stable',
      insights: ['基于历史数据的简单预测'],
      recommendations: ['收集更多数据以提高预测准确性'],
    };
  }

  /**
   * 生成未来时间周期
   */
  private generateFuturePeriods(period: 'week' | 'month' | 'quarter' | 'year', count: number): string[] {
    const periods: string[] = [];
    const now = new Date();
    
    for (let i = 1; i <= count; i++) {
      const targetDate = new Date(now);
      
      switch (period) {
        case 'year':
          targetDate.setFullYear(now.getFullYear() + i);
          break;
        case 'quarter':
          targetDate.setMonth(now.getMonth() + i * 3);
          break;
        case 'month':
          targetDate.setMonth(now.getMonth() + i);
          break;
        case 'week':
          targetDate.setDate(now.getDate() + i * 7);
          break;
      }
      
      periods.push(this.getPeriodKey(targetDate, period));
    }
    
    return periods;
  }

  /**
   * 预测特定客户的购买行为
   */
  async predictCustomerPurchase(profile: CustomerProfile): Promise<{
    purchaseProbability: number;
    expectedSpend: number;
    nextPurchaseDate: string;
    recommendedProducts: string[];
    confidence: number;
  }> {
    try {
      // 构建客户购买行为提示
      const prompt = this.buildCustomerPurchasePrompt(profile);
      
      // 调用AI模型进行预测
      const modelType = this.domesticLLM.selectModelByTask('creative');
      const response = await this.domesticLLM.generate(prompt, false, modelType);
      
      // 解析AI响应
      if (response && response.content) {
        try {
          return JSON.parse(response.content);
        } catch (error) {
          console.error('Error parsing AI response:', error);
          return this.generateDefaultCustomerPurchasePrediction();
        }
      }
      
      return this.generateDefaultCustomerPurchasePrediction();
    } catch (error) {
      console.error('Error predicting customer purchase:', error);
      return this.generateDefaultCustomerPurchasePrediction();
    }
  }

  /**
   * 构建客户购买行为提示
   */
  private buildCustomerPurchasePrompt(profile: CustomerProfile): string {
    return `
    请分析以下客户的购买历史和行为，预测其未来的购买行为：

    ${JSON.stringify(profile, null, 2)}

    请预测以下内容：
    1. 未来30天内的购买概率（0-1）
    2. 预计消费金额
    3. 预计下次购买日期
    4. 推荐的产品或服务
    5. 预测置信度（0-1）

    请以JSON格式返回分析结果，包含以下字段：
    - purchaseProbability
    - expectedSpend
    - nextPurchaseDate
    - recommendedProducts
    - confidence

    示例输出格式：
    {
      "purchaseProbability": 0.85,
      "expectedSpend": 5000,
      "nextPurchaseDate": "2024-03-15",
      "recommendedProducts": ["高级版产品", "专业服务"],
      "confidence": 0.8
    }
    `;
  }

  /**
   * 生成默认客户购买预测
   */
  private generateDefaultCustomerPurchasePrediction(): {
    purchaseProbability: number;
    expectedSpend: number;
    nextPurchaseDate: string;
    recommendedProducts: string[];
    confidence: number;
  } {
    return {
      purchaseProbability: 0.5,
      expectedSpend: 1000,
      nextPurchaseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      recommendedProducts: ['相关产品'],
      confidence: 0.5,
    };
  }

  /**
   * 分析销售漏斗
   */
  analyzeSalesFunnel(profiles: CustomerProfile[]): {
    stages: SalesFunnelStage[];
    conversionRates: number[];
    insights: string[];
    recommendations: string[];
  } {
    // 定义销售漏斗阶段
    const stages = [
      { name: '潜在客户', count: 0 },
      { name: '意向客户', count: 0 },
      { name: '提案阶段', count: 0 },
      { name: '谈判阶段', count: 0 },
      { name: '成交客户', count: 0 },
    ];
    
    // 统计各阶段客户数量
    profiles.forEach(profile => {
      if (profile.lifecycleStage === 'lead') {
        stages[0].count++;
      } else if (profile.lifecycleStage === 'prospect') {
        stages[1].count++;
      } else if (profile.salesStage === 'proposal') {
        stages[2].count++;
      } else if (profile.salesStage === 'negotiation') {
        stages[3].count++;
      } else if (profile.lifecycleStage === 'customer' || profile.lifecycleStage === 'loyal') {
        stages[4].count++;
      }
    });
    
    // 计算转化率
    const conversionRates: number[] = [];
    for (let i = 0; i < stages.length - 1; i++) {
      const rate = stages[i].count > 0 ? stages[i + 1].count / stages[i].count : 0;
      conversionRates.push(rate);
    }
    
    // 生成洞察和建议
    const insights = this.generateSalesFunnelInsights(stages, conversionRates);
    const recommendations = this.generateSalesFunnelRecommendations(stages, conversionRates);
    
    return {
      stages,
      conversionRates,
      insights,
      recommendations,
    };
  }

  /**
   * 生成销售漏斗洞察
   */
  private generateSalesFunnelInsights(stages: { name: string; count: number }[], conversionRates: number[]): string[] {
    const insights: string[] = [];
    
    // 分析各阶段转化率
    conversionRates.forEach((rate, index) => {
      if (rate < 0.2) {
        insights.push(`${stages[index].name}到${stages[index + 1].name}的转化率较低(${Math.round(rate * 100)}%)，需要重点关注`);
      } else if (rate > 0.5) {
        insights.push(`${stages[index].name}到${stages[index + 1].name}的转化率较高(${Math.round(rate * 100)}%)，表现良好`);
      }
    });
    
    // 分析整体漏斗
    const totalLeads = stages[0].count;
    const totalCustomers = stages[stages.length - 1].count;
    const overallConversion = totalLeads > 0 ? totalCustomers / totalLeads : 0;
    
    insights.push(`整体转化率为${Math.round(overallConversion * 100)}%`);
    
    return insights;
  }

  /**
   * 生成销售漏斗建议
   */
  private generateSalesFunnelRecommendations(stages: { name: string; count: number }[], conversionRates: number[]): string[] {
    const recommendations: string[] = [];
    
    // 针对低转化率阶段提供建议
    conversionRates.forEach((rate, index) => {
      if (rate < 0.2) {
        switch (index) {
          case 0: // 潜在客户到意向客户
            recommendations.push('优化潜在客户培育策略，提供更有针对性的内容');
            break;
          case 1: // 意向客户到提案阶段
            recommendations.push('改进销售演示和产品介绍，更好地展示价值');
            break;
          case 2: // 提案阶段到谈判阶段
            recommendations.push('优化提案质量，确保满足客户需求');
            break;
          case 3: // 谈判阶段到成交客户
            recommendations.push('改进谈判策略，解决客户疑虑');
            break;
        }
      }
    });
    
    // 通用建议
    recommendations.push('建立销售漏斗各阶段的明确标准和流程');
    recommendations.push('定期分析销售漏斗数据，识别改进机会');
    recommendations.push('为销售团队提供针对性培训，提高转化技能');
    
    return recommendations;
  }
}

export default SalesPredictionService;