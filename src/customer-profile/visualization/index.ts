import { CustomerProfile, CustomerFeatures, CustomerInsight } from '../models';

/**
 * 数据可视化服务
 */
export class VisualizationService {
  /**
   * 生成客户画像概览
   */
  generateProfileOverview(profile: CustomerProfile): any {
    return {
      basicInfo: {
        name: profile.name,
        company: profile.company,
        position: profile.position,
        contact: {
          phone: profile.phone,
          email: profile.email,
          wechatId: profile.wechatId,
        },
      },
      keyMetrics: {
        engagementLevel: profile.features.engagementLevel,
        purchaseFrequency: profile.features.purchaseFrequency,
        customerLifetimeValue: profile.features.customerLifetimeValue,
        churnRisk: profile.features.churnRisk,
        potentialValue: profile.features.potentialValue,
      },
      recentInteractions: profile.interactions
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 5),
      keyInsights: profile.insights
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 3),
    };
  }

  /**
   * 生成客户特征雷达图数据
   */
  generateFeatureRadarData(features: CustomerFeatures): any {
    const engagementScore = this.getScoreFromLevel(features.engagementLevel);
    const purchaseScore = this.getScoreFromFrequency(features.purchaseFrequency);
    const socialScore = this.getScoreFromLevel(features.socialInfluence);
    const churnScore = 100 - this.getScoreFromLevel(features.churnRisk); // 流失风险越高，分数越低
    const potentialScore = this.getScoreFromLevel(features.potentialValue);

    return {
      labels: ['参与度', '购买频率', '社交影响力', '流失风险', '潜在价值'],
      datasets: [
        {
          label: '客户特征',
          data: [engagementScore, purchaseScore, socialScore, churnScore, potentialScore],
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 2,
        },
      ],
    };
  }

  /**
   * 生成互动时间线数据
   */
  generateInteractionTimeline(interactions: any[]): any {
    const data = interactions
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
      .map(interaction => ({
        date: interaction.timestamp.toISOString().split('T')[0],
        type: interaction.type,
        content: interaction.content,
        sentiment: interaction.sentiment,
      }));

    return data;
  }

  /**
   * 生成情感分析数据
   */
  generateSentimentAnalysis(interactions: any[]): any {
    const sentimentCounts: { [key: string]: number } = {
      positive: 0,
      neutral: 0,
      negative: 0,
    };

    interactions.forEach(interaction => {
      const sentiment = interaction.sentiment;
      if (sentimentCounts.hasOwnProperty(sentiment)) {
        sentimentCounts[sentiment]++;
      }
    });

    return {
      labels: ['积极', '中性', '消极'],
      datasets: [
        {
          label: '情感分布',
          data: [sentimentCounts.positive, sentimentCounts.neutral, sentimentCounts.negative],
          backgroundColor: ['rgba(75, 192, 192, 0.6)', 'rgba(255, 206, 86, 0.6)', 'rgba(255, 99, 132, 0.6)'],
          borderColor: ['rgba(75, 192, 192, 1)', 'rgba(255, 206, 86, 1)', 'rgba(255, 99, 132, 1)'],
          borderWidth: 1,
        },
      ],
    };
  }

  /**
   * 生成兴趣标签云数据
   */
  generateInterestTagCloud(profile: CustomerProfile): any {
    const tags = [...profile.tags, ...profile.features.interests, ...profile.features.preferences];
    const tagCounts: { [key: string]: number } = tags.reduce((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    return Object.entries(tagCounts).map(([tag, count]) => ({
      text: tag,
      value: count * 10,
    }));
  }

  /**
   * 生成客户洞察卡片
   */
  generateInsightCards(insights: CustomerInsight[]): any {
    return insights.map(insight => ({
      id: insight.id,
      type: this.getInsightTypeLabel(insight.type),
      content: insight.content,
      confidence: Math.round(insight.confidence * 100),
      actionItems: insight.actionItems,
      timestamp: insight.timestamp.toISOString(),
    }));
  }

  /**
   * 生成客户分群可视化数据
   */
  generateSegmentationVisualization(segments: Map<string, CustomerProfile[]>): any {
    const segmentData = Array.from(segments.entries()).map(([key, profiles]) => ({
      name: this.getSegmentLabel(key),
      count: profiles.length,
      averageValue: profiles.reduce((sum, profile) => {
        return sum + (profile.features.customerLifetimeValue || 0);
      }, 0) / profiles.length,
    }));

    return {
      labels: segmentData.map(segment => segment.name),
      datasets: [
        {
          label: '客户数量',
          data: segmentData.map(segment => segment.count),
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
        },
        {
          label: '平均客户价值',
          data: segmentData.map(segment => segment.averageValue),
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
          yAxisID: 'y1',
        },
      ],
      options: {
        scales: {
          y1: {
            type: 'linear',
            position: 'right',
            title: {
              display: true,
              text: '平均客户价值',
            },
          },
        },
      },
    };
  }

  /**
   * 辅助方法：将等级转换为分数
   */
  private getScoreFromLevel(level: string): number {
    switch (level) {
      case 'high':
        return 100;
      case 'medium':
        return 60;
      case 'low':
        return 20;
      default:
        return 50;
    }
  }

  /**
   * 辅助方法：将购买频率转换为分数
   */
  private getScoreFromFrequency(frequency: string): number {
    switch (frequency) {
      case 'frequent':
        return 100;
      case 'occasional':
        return 60;
      case 'rare':
        return 20;
      default:
        return 50;
    }
  }

  /**
   * 辅助方法：获取洞察类型标签
   */
  private getInsightTypeLabel(type: string): string {
    switch (type) {
      case 'behavioral':
        return '行为洞察';
      case 'predictive':
        return '预测洞察';
      case 'recommendation':
        return '推荐洞察';
      default:
        return '其他洞察';
    }
  }

  /**
   * 辅助方法：获取分群标签
   */
  private getSegmentLabel(key: string): string {
    const [engagement, potential] = key.split('_');
    const engagementLabel = this.getLevelLabel(engagement);
    const potentialLabel = this.getLevelLabel(potential);
    return `${engagementLabel}参与度 - ${potentialLabel}潜在价值`;
  }

  /**
   * 辅助方法：获取等级标签
   */
  private getLevelLabel(level: string): string {
    switch (level) {
      case 'high':
        return '高';
      case 'medium':
        return '中';
      case 'low':
        return '低';
      default:
        return '未知';
    }
  }
}

export default VisualizationService;
