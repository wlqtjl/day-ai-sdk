import { CustomerProfile } from '../models';
import { v4 as uuidv4 } from 'uuid';

/**
 * 销售漏斗阶段
 */
export type SalesFunnelStage = 
  | 'lead'
  | 'prospect'
  | 'proposal'
  | 'negotiation'
  | 'customer'
  | 'loyal_customer';

/**
 * 销售漏斗配置
 */
export interface SalesFunnelConfig {
  stages: SalesFunnelStage[];
  conversionRateTargets: Record<SalesFunnelStage, number>;
  analysisPeriod: 'week' | 'month' | 'quarter' | 'year';
  enabled: boolean;
}

/**
 * 销售漏斗阶段数据
 */
export interface FunnelStageData {
  stage: SalesFunnelStage;
  stageName: string;
  count: number;
  conversionRate: number;
  targetConversionRate: number;
  changeFromPrevious: number;
  avgTimeInStage: number; // 平均停留时间（天）
}

/**
 * 销售漏斗分析结果
 */
export interface SalesFunnelAnalysis {
  id: string;
  timestamp: Date;
  period: string;
  stages: FunnelStageData[];
  overallConversionRate: number;
  totalLeads: number;
  totalCustomers: number;
  dropOffPoints: DropOffPoint[];
  insights: string[];
  recommendations: string[];
  trends: SalesFunnelTrend[];
  confidence: number;
}

/**
 * 流失点
 */
export interface DropOffPoint {
  stage: SalesFunnelStage;
  nextStage: SalesFunnelStage;
  dropOffRate: number;
  count: number;
  potentialRevenue: number;
}

/**
 * 销售漏斗趋势
 */
export interface SalesFunnelTrend {
  period: string;
  overallConversionRate: number;
  totalLeads: number;
  totalCustomers: number;
  stageConversions: Record<SalesFunnelStage, number>;
}

/**
 * 销售漏斗分析服务
 */
export class SalesFunnelAnalysisService {
  private config: SalesFunnelConfig;
  private historicalAnalyses: SalesFunnelAnalysis[] = [];

  constructor(config: SalesFunnelConfig) {
    this.config = config;
  }

  /**
   * 分析销售漏斗
   */
  analyzeFunnel(customers: CustomerProfile[]): SalesFunnelAnalysis {
    const analysisId = uuidv4();
    const timestamp = new Date();
    const period = this.getCurrentPeriod();

    // 计算各阶段客户数量
    const stageCounts = this.calculateStageCounts(customers);

    // 计算转化率
    const stages = this.calculateStageData(stageCounts);

    // 计算整体转化率
    const totalLeads = stageCounts.lead || 0;
    const totalCustomers = stageCounts.customer || 0;
    const overallConversionRate = totalLeads > 0 ? totalCustomers / totalLeads : 0;

    // 识别流失点
    const dropOffPoints = this.identifyDropOffPoints(stages);

    // 生成洞察和建议
    const insights = this.generateInsights(stages, dropOffPoints);
    const recommendations = this.generateRecommendations(dropOffPoints);

    // 分析趋势
    const trends = this.analyzeTrends();

    const analysis: SalesFunnelAnalysis = {
      id: analysisId,
      timestamp,
      period,
      stages,
      overallConversionRate,
      totalLeads,
      totalCustomers,
      dropOffPoints,
      insights,
      recommendations,
      trends,
      confidence: 0.85,
    };

    // 保存历史分析
    this.historicalAnalyses.push(analysis);
    if (this.historicalAnalyses.length > 12) {
      this.historicalAnalyses.shift();
    }

    return analysis;
  }

  /**
   * 计算各阶段客户数量
   */
  private calculateStageCounts(customers: CustomerProfile[]): Record<SalesFunnelStage, number> {
    const counts: Record<SalesFunnelStage, number> = {
      lead: 0,
      prospect: 0,
      proposal: 0,
      negotiation: 0,
      customer: 0,
      loyal_customer: 0,
    };

    customers.forEach(customer => {
      if (customer.lifecycleStage === 'loyal') {
        counts.loyal_customer++;
      } else if (customer.lifecycleStage === 'customer') {
        counts.customer++;
      } else if (customer.salesStage === 'negotiation') {
        counts.negotiation++;
      } else if (customer.salesStage === 'proposal') {
        counts.proposal++;
      } else if (customer.lifecycleStage === 'prospect' || customer.salesStage === 'prospect') {
        counts.prospect++;
      } else {
        counts.lead++;
      }
    });

    return counts;
  }

  /**
   * 计算阶段数据
   */
  private calculateStageData(stageCounts: Record<SalesFunnelStage, number>): FunnelStageData[] {
    const stages: FunnelStageData[] = [];
    const stageOrder: SalesFunnelStage[] = ['lead', 'prospect', 'proposal', 'negotiation', 'customer', 'loyal_customer'];

    let previousCount = 0;
    stageOrder.forEach((stage, index) => {
      const count = stageCounts[stage];
      const conversionRate = previousCount > 0 ? count / previousCount : 0;
      const targetConversionRate = this.config.conversionRateTargets[stage] || 0;
      const changeFromPrevious = 0; // 简化处理，实际应该与历史数据比较
      const avgTimeInStage = this.calculateAvgTimeInStage(stage);

      stages.push({
        stage,
        stageName: this.getStageName(stage),
        count,
        conversionRate,
        targetConversionRate,
        changeFromPrevious,
        avgTimeInStage,
      });

      previousCount = count;
    });

    return stages;
  }

  /**
   * 识别流失点
   */
  private identifyDropOffPoints(stages: FunnelStageData[]): DropOffPoint[] {
    const dropOffPoints: DropOffPoint[] = [];

    for (let i = 0; i < stages.length - 1; i++) {
      const currentStage = stages[i];
      const nextStage = stages[i + 1];
      const dropOffRate = 1 - currentStage.conversionRate;
      const count = currentStage.count - nextStage.count;
      const potentialRevenue = count * this.estimateAverageRevenue();

      if (dropOffRate > 0.3) { // 流失率超过30%视为流失点
        dropOffPoints.push({
          stage: currentStage.stage,
          nextStage: nextStage.stage,
          dropOffRate,
          count,
          potentialRevenue,
        });
      }
    }

    return dropOffPoints.sort((a, b) => b.dropOffRate - a.dropOffRate);
  }

  /**
   * 生成洞察
   */
  private generateInsights(stages: FunnelStageData[], dropOffPoints: DropOffPoint[]): string[] {
    const insights: string[] = [];

    // 整体转化率洞察
    const overallConversion = stages[stages.length - 1].conversionRate;
    if (overallConversion > 0.2) {
      insights.push(`整体转化率为${Math.round(overallConversion * 100)}%，表现良好`);
    } else if (overallConversion > 0.1) {
      insights.push(`整体转化率为${Math.round(overallConversion * 100)}%，有提升空间`);
    } else {
      insights.push(`整体转化率为${Math.round(overallConversion * 100)}%，需要重点改进`);
    }

    // 流失点洞察
    if (dropOffPoints.length > 0) {
      const topDropOff = dropOffPoints[0];
      insights.push(`${this.getStageName(topDropOff.stage)}到${this.getStageName(topDropOff.nextStage)}的流失率高达${Math.round(topDropOff.dropOffRate * 100)}%，是主要流失点`);
    }

    // 各阶段表现洞察
    stages.forEach(stage => {
      if (stage.conversionRate < stage.targetConversionRate * 0.8) {
        insights.push(`${stage.stageName}阶段的转化率(${Math.round(stage.conversionRate * 100)}%)低于目标(${Math.round(stage.targetConversionRate * 100)}%)`);
      } else if (stage.conversionRate > stage.targetConversionRate) {
        insights.push(`${stage.stageName}阶段的转化率(${Math.round(stage.conversionRate * 100)}%)高于目标(${Math.round(stage.targetConversionRate * 100)}%)，表现优秀`);
      }

      if (stage.avgTimeInStage > 30) {
        insights.push(`${stage.stageName}阶段的平均停留时间较长(${stage.avgTimeInStage}天)，可能存在瓶颈`);
      }
    });

    return insights;
  }

  /**
   * 生成建议
   */
  private generateRecommendations(dropOffPoints: DropOffPoint[]): string[] {
    const recommendations: string[] = [];

    // 针对流失点的建议
    dropOffPoints.forEach(dropOff => {
      switch (dropOff.stage) {
        case 'lead':
          recommendations.push('优化潜在客户筛选流程，提高线索质量');
          recommendations.push('加强市场推广，吸引更多高质量潜在客户');
          break;
        case 'prospect':
          recommendations.push('改进销售跟进策略，提高意向客户转化率');
          recommendations.push('提供更多有价值的内容，增强客户兴趣');
          break;
        case 'proposal':
          recommendations.push('优化提案质量，更好地满足客户需求');
          recommendations.push('提供更有竞争力的定价策略');
          break;
        case 'negotiation':
          recommendations.push('改进谈判技巧，更好地处理客户异议');
          recommendations.push('提供灵活的解决方案，满足客户特殊需求');
          break;
        case 'customer':
          recommendations.push('加强客户关怀，提高客户忠诚度');
          recommendations.push('开发客户升级和交叉销售机会');
          break;
      }
    });

    // 通用建议
    recommendations.push('建立销售漏斗各阶段的明确标准和流程');
    recommendations.push('定期分析销售漏斗数据，持续优化');
    recommendations.push('为销售团队提供针对性培训，提高转化技能');
    recommendations.push('利用AI工具分析客户行为，预测转化可能性');

    return recommendations;
  }

  /**
   * 分析趋势
   */
  private analyzeTrends(): SalesFunnelTrend[] {
    const trends: SalesFunnelTrend[] = [];

    // 模拟趋势数据
    const periods = ['2024-Q1', '2024-Q2', '2024-Q3', '2024-Q4'];
    periods.forEach(period => {
      trends.push({
        period,
        overallConversionRate: 0.15 + Math.random() * 0.1,
        totalLeads: 100 + Math.floor(Math.random() * 50),
        totalCustomers: 15 + Math.floor(Math.random() * 10),
        stageConversions: {
          lead: 1.0,
          prospect: 0.6 + Math.random() * 0.2,
          proposal: 0.4 + Math.random() * 0.2,
          negotiation: 0.3 + Math.random() * 0.2,
          customer: 0.2 + Math.random() * 0.1,
          loyal_customer: 0.1 + Math.random() * 0.05,
        },
      });
    });

    return trends;
  }

  /**
   * 计算平均停留时间
   */
  private calculateAvgTimeInStage(stage: SalesFunnelStage): number {
    // 模拟数据，实际应该根据真实数据计算
    const avgTimes: Record<SalesFunnelStage, number> = {
      lead: 14,
      prospect: 21,
      proposal: 14,
      negotiation: 28,
      customer: 90,
      loyal_customer: 180,
    };

    return avgTimes[stage];
  }

  /**
   * 估计平均收入
   */
  private estimateAverageRevenue(): number {
    // 模拟数据，实际应该根据真实数据计算
    return 5000;
  }

  /**
   * 获取阶段名称
   */
  private getStageName(stage: SalesFunnelStage): string {
    const stageNames: Record<SalesFunnelStage, string> = {
      lead: '潜在客户',
      prospect: '意向客户',
      proposal: '提案阶段',
      negotiation: '谈判阶段',
      customer: '成交客户',
      loyal_customer: '忠诚客户',
    };

    return stageNames[stage];
  }

  /**
   * 获取当前周期
   */
  private getCurrentPeriod(): string {
    const now = new Date();
    const year = now.getFullYear();
    const quarter = Math.floor(now.getMonth() / 3) + 1;
    return `${year}-Q${quarter}`;
  }

  /**
   * 获取历史分析
   */
  getHistoricalAnalyses(): SalesFunnelAnalysis[] {
    return [...this.historicalAnalyses];
  }

  /**
   * 预测销售漏斗表现
   */
  predictFunnelPerformance(leads: number): {
    projectedCustomers: number;
    projectedRevenue: number;
    confidence: number;
  } {
    // 基于历史数据预测
    const recentAnalyses = this.historicalAnalyses.slice(-3);
    if (recentAnalyses.length === 0) {
      return {
        projectedCustomers: Math.round(leads * 0.15),
        projectedRevenue: Math.round(leads * 0.15 * 5000),
        confidence: 0.5,
      };
    }

    const avgConversionRate = recentAnalyses.reduce((sum, analysis) => sum + analysis.overallConversionRate, 0) / recentAnalyses.length;
    const projectedCustomers = Math.round(leads * avgConversionRate);
    const projectedRevenue = Math.round(projectedCustomers * this.estimateAverageRevenue());

    return {
      projectedCustomers,
      projectedRevenue,
      confidence: 0.7,
    };
  }

  /**
   * 分析销售团队表现
   */
  analyzeTeamPerformance(teamId: string, customers: CustomerProfile[]): {
    teamId: string;
    funnelAnalysis: SalesFunnelAnalysis;
    topPerformingStages: SalesFunnelStage[];
    areasForImprovement: SalesFunnelStage[];
  } {
    // 模拟团队数据，实际应该根据团队成员过滤客户
    const teamCustomers = customers;
    const funnelAnalysis = this.analyzeFunnel(teamCustomers);

    // 识别表现最好的阶段
    const topPerformingStages = funnelAnalysis.stages
      .filter(stage => stage.conversionRate >= stage.targetConversionRate)
      .map(stage => stage.stage)
      .sort((a, b) => {
        const aStage = funnelAnalysis.stages.find(s => s.stage === a);
        const bStage = funnelAnalysis.stages.find(s => s.stage === b);
        return (bStage?.conversionRate || 0) - (aStage?.conversionRate || 0);
      });

    // 识别需要改进的阶段
    const areasForImprovement = funnelAnalysis.stages
      .filter(stage => stage.conversionRate < stage.targetConversionRate * 0.8)
      .map(stage => stage.stage)
      .sort((a, b) => {
        const aStage = funnelAnalysis.stages.find(s => s.stage === a);
        const bStage = funnelAnalysis.stages.find(s => s.stage === b);
        return (aStage?.conversionRate || 0) - (bStage?.conversionRate || 0);
      });

    return {
      teamId,
      funnelAnalysis,
      topPerformingStages,
      areasForImprovement,
    };
  }

  /**
   * 导出销售漏斗报告
   */
  exportFunnelReport(analysis: SalesFunnelAnalysis): {
    reportId: string;
    timestamp: Date;
    period: string;
    summary: string;
    detailedAnalysis: string;
    recommendations: string[];
  } {
    const reportId = uuidv4();
    const summary = `销售漏斗分析报告 (${analysis.period})\n` +
      `整体转化率: ${Math.round(analysis.overallConversionRate * 100)}%\n` +
      `总潜在客户: ${analysis.totalLeads}\n` +
      `总成交客户: ${analysis.totalCustomers}\n` +
      `主要流失点: ${analysis.dropOffPoints.length > 0 ? this.getStageName(analysis.dropOffPoints[0].stage) : '无'}`;

    const detailedAnalysis = analysis.stages.map(stage => {
      return `${stage.stageName}: ${stage.count} 人, 转化率: ${Math.round(stage.conversionRate * 100)}%, 目标: ${Math.round(stage.targetConversionRate * 100)}%`;
    }).join('\n');

    return {
      reportId,
      timestamp: new Date(),
      period: analysis.period,
      summary,
      detailedAnalysis,
      recommendations: analysis.recommendations,
    };
  }
}

export default SalesFunnelAnalysisService;