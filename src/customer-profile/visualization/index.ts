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
   * 生成客户行为热力图数据
   */
  generateBehaviorHeatmap(interactions: any[]): any {
    // 按日期和时间分组
    const heatmapData: { [key: string]: { [key: string]: number } } = {};
    
    interactions.forEach(interaction => {
      const date = interaction.timestamp.toISOString().split('T')[0];
      const hour = interaction.timestamp.getHours();
      const hourKey = `${hour}:00`;
      
      if (!heatmapData[date]) {
        heatmapData[date] = {};
      }
      
      heatmapData[date][hourKey] = (heatmapData[date][hourKey] || 0) + 1;
    });
    
    // 转换为热力图格式
    const dates = Object.keys(heatmapData).sort();
    const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);
    
    const data = hours.map(hour => {
      return dates.map(date => heatmapData[date]?.[hour] || 0);
    });
    
    return {
      dates,
      hours,
      data,
    };
  }

  /**
   * 生成趋势分析图数据
   */
  generateTrendAnalysis(interactions: any[], days: number = 30): any {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - days);
    
    // 初始化日期范围
    const dateRange: string[] = [];
    const currentDate = new Date(startDate);
    while (currentDate <= today) {
      dateRange.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // 统计每天的互动次数
    const interactionCounts: { [key: string]: number } = {};
    dateRange.forEach(date => {
      interactionCounts[date] = 0;
    });
    
    interactions.forEach(interaction => {
      const date = interaction.timestamp.toISOString().split('T')[0];
      if (interactionCounts.hasOwnProperty(date)) {
        interactionCounts[date]++;
      }
    });
    
    // 生成情感趋势
    const sentimentTrends: { [key: string]: { positive: number; neutral: number; negative: number } } = {};
    dateRange.forEach(date => {
      sentimentTrends[date] = { positive: 0, neutral: 0, negative: 0 };
    });
    
    interactions.forEach(interaction => {
      const date = interaction.timestamp.toISOString().split('T')[0];
      if (sentimentTrends.hasOwnProperty(date)) {
        const sentiment = interaction.sentiment;
        if (sentiment === 'positive') {
          sentimentTrends[date].positive++;
        } else if (sentiment === 'neutral') {
          sentimentTrends[date].neutral++;
        } else if (sentiment === 'negative') {
          sentimentTrends[date].negative++;
        }
      }
    });
    
    return {
      labels: dateRange,
      datasets: [
        {
          label: '总互动次数',
          data: dateRange.map(date => interactionCounts[date]),
          borderColor: 'rgba(54, 162, 235, 1)',
          backgroundColor: 'rgba(54, 162, 235, 0.1)',
          tension: 0.4,
        },
        {
          label: '积极情感',
          data: dateRange.map(date => sentimentTrends[date].positive),
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.1)',
          tension: 0.4,
        },
        {
          label: '消极情感',
          data: dateRange.map(date => sentimentTrends[date].negative),
          borderColor: 'rgba(255, 99, 132, 1)',
          backgroundColor: 'rgba(255, 99, 132, 0.1)',
          tension: 0.4,
        },
      ],
    };
  }

  /**
   * 生成自定义仪表盘配置
   */
  generateDashboardConfig(profile: CustomerProfile): any {
    return {
      widgets: [
        {
          id: 'profile-overview',
          type: 'overview',
          title: '客户概览',
          position: { x: 0, y: 0, width: 4, height: 2 },
        },
        {
          id: 'feature-radar',
          type: 'radar',
          title: '客户特征雷达图',
          position: { x: 4, y: 0, width: 4, height: 2 },
        },
        {
          id: 'interaction-timeline',
          type: 'timeline',
          title: '互动时间线',
          position: { x: 0, y: 2, width: 8, height: 2 },
        },
        {
          id: 'sentiment-analysis',
          type: 'pie',
          title: '情感分析',
          position: { x: 0, y: 4, width: 4, height: 2 },
        },
        {
          id: 'interest-tag-cloud',
          type: 'tag-cloud',
          title: '兴趣标签云',
          position: { x: 4, y: 4, width: 4, height: 2 },
        },
        {
          id: 'insights',
          type: 'insights',
          title: '客户洞察',
          position: { x: 0, y: 6, width: 8, height: 2 },
        },
        {
          id: 'behavior-heatmap',
          type: 'heatmap',
          title: '行为热力图',
          position: { x: 0, y: 8, width: 8, height: 3 },
        },
        {
          id: 'trend-analysis',
          type: 'line',
          title: '趋势分析',
          position: { x: 0, y: 11, width: 8, height: 3 },
        },
      ],
    };
  }

  /**
   * 生成交互式数据探索配置
   */
  generateDataExplorationConfig(profile: CustomerProfile): any {
    return {
      dimensions: [
        {
          id: 'engagement',
          label: '参与度',
          values: ['low', 'medium', 'high'],
        },
        {
          id: 'purchase',
          label: '购买频率',
          values: ['rare', 'occasional', 'frequent'],
        },
        {
          id: 'churn',
          label: '流失风险',
          values: ['low', 'medium', 'high'],
        },
        {
          id: 'potential',
          label: '潜在价值',
          values: ['low', 'medium', 'high'],
        },
        {
          id: 'lead-status',
          label: '线索状态',
          values: ['new', 'qualified', 'opportunity', 'customer', 'lost'],
        },
        {
          id: 'sales-stage',
          label: '销售阶段',
          values: ['lead', 'prospect', 'negotiation', 'closed', 'lost'],
        },
      ],
      metrics: [
        {
          id: 'interactions',
          label: '互动次数',
          type: 'count',
        },
        {
          id: 'avg-order-value',
          label: '平均订单价值',
          type: 'average',
        },
        {
          id: 'customer-lifetime-value',
          label: '客户终身价值',
          type: 'sum',
        },
        {
          id: 'total-spent',
          label: '总消费',
          type: 'sum',
        },
        {
          id: 'order-count',
          label: '订单数量',
          type: 'count',
        },
        {
          id: 'support-tickets',
          label: '支持工单',
          type: 'count',
        },
      ],
      filters: [
        {
          id: 'date-range',
          label: '日期范围',
          type: 'date',
          default: {
            start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            end: new Date().toISOString().split('T')[0],
          },
        },
        {
          id: 'interaction-type',
          label: '互动类型',
          type: 'multi-select',
          values: ['wechat', 'email', 'phone', 'meeting', 'purchase'],
        },
        {
          id: 'order-status',
          label: '订单状态',
          type: 'multi-select',
          values: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
        },
        {
          id: 'support-status',
          label: '支持状态',
          type: 'multi-select',
          values: ['open', 'in_progress', 'resolved', 'closed'],
        },
      ],
    };
  }

  /**
   * 生成360度客户视图数据
   */
  generate360ViewData(profile: CustomerProfile): any {
    return {
      overview: {
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
        businessInfo: {
          leadSource: profile.leadSource,
          leadStatus: profile.leadStatus,
          salesStage: profile.salesStage,
          dealValue: profile.dealValue,
          closeDate: profile.closeDate,
          assignedTo: profile.assignedTo,
          accountManager: profile.accountManager,
        },
        lifecycleInfo: {
          stage: profile.lifecycleStage,
          status: profile.lifecycleStatus,
          score: profile.lifecycleScore,
          firstContactDate: profile.firstContactDate,
          customerSince: profile.customerSince,
          lastPurchaseDate: profile.lastPurchaseDate,
          churnDate: profile.churnDate,
          reactivationDate: profile.reactivationDate,
        },
      },
      financial: {
        totalSpent: profile.orders?.reduce((sum, order) => sum + order.total, 0) || 0,
        orderCount: profile.orders?.length || 0,
        averageOrderValue: profile.orders && profile.orders.length > 0 
          ? profile.orders.reduce((sum, order) => sum + order.total, 0) / profile.orders.length 
          : 0,
        paymentMethods: profile.paymentMethods?.length || 0,
      },
      engagement: {
        interactions: profile.interactions?.length || 0,
        supportTickets: profile.supportTickets?.length || 0,
        marketingCampaigns: profile.marketingCampaigns?.length || 0,
        websiteActivity: profile.websiteActivity?.length || 0,
      },
      social: {
        socialProfiles: profile.socialProfiles?.length || 0,
        totalFollowers: profile.socialProfiles?.reduce((sum, profile) => sum + (profile.followers || 0), 0) || 0,
      },
      timeline: this.generate360Timeline(profile),
    };
  }

  /**
   * 生成360度客户时间线
   */
  generate360Timeline(profile: CustomerProfile): any[] {
    const events: any[] = [];

    // 添加互动事件
    if (profile.interactions) {
      profile.interactions.forEach(interaction => {
        events.push({
          id: interaction.id,
          type: 'interaction',
          subtype: interaction.type,
          title: `互动: ${interaction.type}`,
          description: interaction.content,
          timestamp: interaction.timestamp,
          sentiment: interaction.sentiment,
        });
      });
    }

    // 添加订单事件
    if (profile.orders) {
      profile.orders.forEach(order => {
        events.push({
          id: order.id,
          type: 'order',
          subtype: order.status,
          title: `订单: ${order.orderNumber}`,
          description: `金额: ¥${order.total}, 状态: ${order.status}`,
          timestamp: order.date,
        });
      });
    }

    // 添加支持工单事件
    if (profile.supportTickets) {
      profile.supportTickets.forEach(ticket => {
        events.push({
          id: ticket.id,
          type: 'support',
          subtype: ticket.status,
          title: `支持工单: ${ticket.ticketNumber}`,
          description: `${ticket.subject}, 优先级: ${ticket.priority}`,
          timestamp: ticket.createdDate,
        });
      });
    }

    // 添加营销活动事件
    if (profile.marketingCampaigns) {
      profile.marketingCampaigns.forEach(campaign => {
        events.push({
          id: campaign.id,
          type: 'marketing',
          subtype: campaign.type,
          title: `营销活动: ${campaign.name}`,
          description: `状态: ${campaign.status}, 响应: ${campaign.response}`,
          timestamp: campaign.startDate,
        });
      });
    }

    // 添加网站活动事件
    if (profile.websiteActivity) {
      profile.websiteActivity.forEach(activity => {
        events.push({
          id: activity.id,
          type: 'website',
          subtype: activity.type,
          title: `网站活动: ${activity.type}`,
          description: `页面: ${activity.pageUrl}`,
          timestamp: activity.timestamp,
        });
      });
    }

    // 按时间排序
    return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * 生成客户健康度评分
   */
  generateHealthScore(profile: CustomerProfile): number {
    let score = 0;

    // 订单情况 (40%)
    const orderScore = this.calculateOrderScore(profile);
    score += orderScore * 0.4;

    // 互动情况 (25%)
    const interactionScore = this.calculateInteractionScore(profile);
    score += interactionScore * 0.25;

    // 支持情况 (20%)
    const supportScore = this.calculateSupportScore(profile);
    score += supportScore * 0.2;

    // 营销响应 (15%)
    const marketingScore = this.calculateMarketingScore(profile);
    score += marketingScore * 0.15;

    return Math.round(score);
  }

  /**
   * 计算订单得分
   */
  private calculateOrderScore(profile: CustomerProfile): number {
    if (!profile.orders || profile.orders.length === 0) {
      return 0;
    }

    const totalSpent = profile.orders.reduce((sum, order) => sum + order.total, 0);
    const orderCount = profile.orders.length;
    const recentOrders = profile.orders.filter(order => {
      const daysSinceOrder = (new Date().getTime() - order.date.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceOrder <= 90;
    });

    let score = 0;
    score += Math.min(totalSpent / 10000 * 30, 30); // 消费金额 (30分)
    score += Math.min(orderCount * 5, 30); // 订单数量 (30分)
    score += Math.min(recentOrders.length * 10, 40); // 最近订单 (40分)

    return score;
  }

  /**
   * 计算互动得分
   */
  private calculateInteractionScore(profile: CustomerProfile): number {
    if (!profile.interactions || profile.interactions.length === 0) {
      return 0;
    }

    const interactionCount = profile.interactions.length;
    const recentInteractions = profile.interactions.filter(interaction => {
      const daysSinceInteraction = (new Date().getTime() - interaction.timestamp.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceInteraction <= 30;
    });

    const positiveInteractions = profile.interactions.filter(interaction => interaction.sentiment === 'positive').length;
    const sentimentScore = positiveInteractions / interactionCount * 50;

    let score = 0;
    score += Math.min(interactionCount * 2, 30); // 互动数量 (30分)
    score += Math.min(recentInteractions.length * 5, 20); // 最近互动 (20分)
    score += sentimentScore; // 情感得分 (50分)

    return score;
  }

  /**
   * 计算支持得分
   */
  private calculateSupportScore(profile: CustomerProfile): number {
    if (!profile.supportTickets || profile.supportTickets.length === 0) {
      return 100; // 没有工单是好事
    }

    const totalTickets = profile.supportTickets.length;
    const resolvedTickets = profile.supportTickets.filter(ticket => ticket.status === 'resolved' || ticket.status === 'closed').length;
    const highPriorityTickets = profile.supportTickets.filter(ticket => ticket.priority === 'high' || ticket.priority === 'urgent').length;

    const resolutionRate = resolvedTickets / totalTickets;
    const highPriorityRate = highPriorityTickets / totalTickets;

    let score = 100;
    score -= (1 - resolutionRate) * 50; // 解决率 (50分)
    score -= highPriorityRate * 50; // 高优先级工单率 (50分)

    return Math.max(score, 0);
  }

  /**
   * 计算营销得分
   */
  private calculateMarketingScore(profile: CustomerProfile): number {
    if (!profile.marketingCampaigns || profile.marketingCampaigns.length === 0) {
      return 0;
    }

    const campaignCount = profile.marketingCampaigns.length;
    const respondedCampaigns = profile.marketingCampaigns.filter(campaign => 
      campaign.response === 'opened' || campaign.response === 'clicked' || campaign.response === 'converted'
    ).length;

    const conversionCampaigns = profile.marketingCampaigns.filter(campaign => 
      campaign.response === 'converted'
    ).length;

    let score = 0;
    score += Math.min(campaignCount * 10, 30); // 活动参与度 (30分)
    score += Math.min(respondedCampaigns / campaignCount * 30, 30); // 响应率 (30分)
    score += Math.min(conversionCampaigns / campaignCount * 40, 40); // 转化率 (40分)

    return score;
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
