import { CustomerProfile } from '../models';

/**
 * 客户生命周期管理服务
 */
export class LifecycleService {
  /**
   * 计算客户生命周期阶段
   */
  calculateLifecycleStage(profile: CustomerProfile): 'lead' | 'prospect' | 'customer' | 'loyal' | 'churned' | 'reactivated' {
    // 检查是否有流失日期
    if (profile.churnDate) {
      // 检查是否有重新激活日期
      if (profile.reactivationDate && profile.reactivationDate > profile.churnDate) {
        return 'reactivated';
      }
      return 'churned';
    }

    // 检查是否有购买记录
    if (profile.orders && profile.orders.length > 0) {
      // 计算订单数量和总消费
      const orderCount = profile.orders.length;
      const totalSpent = profile.orders.reduce((sum, order) => sum + order.total, 0);
      
      // 检查最近购买日期
      const lastPurchase = Math.max(...profile.orders.map(order => order.date.getTime()));
      const daysSinceLastPurchase = (new Date().getTime() - lastPurchase) / (1000 * 60 * 60 * 24);
      
      // 定义忠诚度阈值
      const LOYAL_ORDER_COUNT = 5;
      const LOYAL_TOTAL_SPENT = 10000;
      const CHURN_DAYS = 90;
      
      // 检查是否为忠诚客户
      if (orderCount >= LOYAL_ORDER_COUNT && totalSpent >= LOYAL_TOTAL_SPENT) {
        return 'loyal';
      }
      
      // 检查是否为流失客户
      if (daysSinceLastPurchase > CHURN_DAYS) {
        return 'churned';
      }
      
      return 'customer';
    }

    // 检查是否有互动记录
    if (profile.interactions && profile.interactions.length > 0) {
      return 'prospect';
    }

    // 默认为潜在客户
    return 'lead';
  }

  /**
   * 更新客户生命周期信息
   */
  updateLifecycleInfo(profile: CustomerProfile): CustomerProfile {
    // 计算生命周期阶段
    const stage = this.calculateLifecycleStage(profile);
    profile.lifecycleStage = stage;
    
    // 计算生命周期分数
    profile.lifecycleScore = this.calculateLifecycleScore(profile);
    
    // 更新生命周期状态
    profile.lifecycleStatus = this.getLifecycleStatus(profile);
    
    // 更新关键日期
    this.updateKeyDates(profile);
    
    return profile;
  }

  /**
   * 计算生命周期分数
   */
  calculateLifecycleScore(profile: CustomerProfile): number {
    let score = 0;

    // 基础分数 (20分)
    score += 20;

    // 互动分数 (20分)
    if (profile.interactions && profile.interactions.length > 0) {
      const interactionCount = profile.interactions.length;
      const recentInteractions = profile.interactions.filter(interaction => {
        const daysSinceInteraction = (new Date().getTime() - interaction.timestamp.getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceInteraction <= 30;
      });
      
      score += Math.min(interactionCount * 2, 10);
      score += Math.min(recentInteractions.length * 2, 10);
    }

    // 购买分数 (30分)
    if (profile.orders && profile.orders.length > 0) {
      const orderCount = profile.orders.length;
      const totalSpent = profile.orders.reduce((sum, order) => sum + order.total, 0);
      const lastPurchase = Math.max(...profile.orders.map(order => order.date.getTime()));
      const daysSinceLastPurchase = (new Date().getTime() - lastPurchase) / (1000 * 60 * 24);
      
      score += Math.min(orderCount * 3, 10);
      score += Math.min(totalSpent / 1000, 10);
      score += Math.max(10 - (daysSinceLastPurchase / 10), 0);
    }

    // 支持分数 (15分)
    if (profile.supportTickets) {
      const totalTickets = profile.supportTickets.length;
      const resolvedTickets = profile.supportTickets.filter(ticket => 
        ticket.status === 'resolved' || ticket.status === 'closed'
      ).length;
      
      if (totalTickets > 0) {
        const resolutionRate = resolvedTickets / totalTickets;
        score += resolutionRate * 15;
      } else {
        score += 15; // 没有工单是好事
      }
    } else {
      score += 15;
    }

    // 营销响应分数 (15分)
    if (profile.marketingCampaigns && profile.marketingCampaigns.length > 0) {
      const campaignCount = profile.marketingCampaigns.length;
      const respondedCampaigns = profile.marketingCampaigns.filter(campaign => 
        campaign.response === 'opened' || campaign.response === 'clicked' || campaign.response === 'converted'
      ).length;
      
      if (campaignCount > 0) {
        const responseRate = respondedCampaigns / campaignCount;
        score += responseRate * 15;
      }
    }

    return Math.round(Math.min(score, 100));
  }

  /**
   * 获取生命周期状态描述
   */
  getLifecycleStatus(profile: CustomerProfile): string {
    switch (profile.lifecycleStage) {
      case 'lead':
        return '潜在客户';
      case 'prospect':
        return '潜在客户-已互动';
      case 'customer':
        return '活跃客户';
      case 'loyal':
        return '忠诚客户';
      case 'churned':
        return '流失客户';
      case 'reactivated':
        return '重新激活客户';
      default:
        return '未知';
    }
  }

  /**
   * 更新关键日期
   */
  updateKeyDates(profile: CustomerProfile): void {
    // 更新首次联系日期
    if (!profile.firstContactDate) {
      const earliestDate = this.getEarliestDate(profile);
      if (earliestDate) {
        profile.firstContactDate = earliestDate;
      }
    }

    // 更新成为客户日期
    if (!profile.customerSince && profile.orders && profile.orders.length > 0) {
      const earliestOrder = Math.min(...profile.orders.map(order => order.date.getTime()));
      profile.customerSince = new Date(earliestOrder);
    }

    // 更新最近购买日期
    if (profile.orders && profile.orders.length > 0) {
      const lastOrder = Math.max(...profile.orders.map(order => order.date.getTime()));
      profile.lastPurchaseDate = new Date(lastOrder);
    }

    // 更新流失日期
    if (profile.lifecycleStage === 'churned' && !profile.churnDate) {
      profile.churnDate = new Date();
    }

    // 更新重新激活日期
    if (profile.lifecycleStage === 'reactivated' && !profile.reactivationDate) {
      profile.reactivationDate = new Date();
    }
  }

  /**
   * 获取最早的日期
   */
  private getEarliestDate(profile: CustomerProfile): Date | null {
    const dates: Date[] = [];

    // 添加互动日期
    if (profile.interactions) {
      profile.interactions.forEach(interaction => {
        dates.push(interaction.timestamp);
      });
    }

    // 添加订单日期
    if (profile.orders) {
      profile.orders.forEach(order => {
        dates.push(order.date);
      });
    }

    // 添加支持工单日期
    if (profile.supportTickets) {
      profile.supportTickets.forEach(ticket => {
        dates.push(ticket.createdDate);
      });
    }

    // 添加营销活动日期
    if (profile.marketingCampaigns) {
      profile.marketingCampaigns.forEach(campaign => {
        dates.push(campaign.startDate);
      });
    }

    // 添加网站活动日期
    if (profile.websiteActivity) {
      profile.websiteActivity.forEach(activity => {
        dates.push(activity.timestamp);
      });
    }

    if (dates.length === 0) {
      return null;
    }

    const earliestTime = Math.min(...dates.map(date => date.getTime()));
    return new Date(earliestTime);
  }

  /**
   * 获取客户生命周期阶段的建议行动
   */
  getLifecycleActions(profile: CustomerProfile): string[] {
    switch (profile.lifecycleStage) {
      case 'lead':
        return [
          '发送欢迎邮件，介绍公司产品和服务',
          '安排初步电话沟通，了解客户需求',
          '提供相关行业资料和案例研究',
          '邀请参加线上或线下活动'
        ];
      case 'prospect':
        return [
          '提供个性化的产品演示',
          '发送定制化的解决方案',
          '安排与销售顾问的深度交流',
          '提供试用或体验机会'
        ];
      case 'customer':
        return [
          '定期发送产品更新和使用技巧',
          '提供专属客户支持',
          '邀请加入客户社区',
          '推荐相关产品或服务'
        ];
      case 'loyal':
        return [
          '提供忠诚度奖励和专属优惠',
          '邀请参与产品测试和反馈',
          '建立客户成功案例',
          '鼓励推荐新客户'
        ];
      case 'churned':
        return [
          '发送挽回邮件，了解流失原因',
          '提供重新激活的特别优惠',
          '安排专门的客户成功经理跟进',
          '定期发送行业资讯和产品更新'
        ];
      case 'reactivated':
        return [
          '发送欢迎回来的个性化消息',
          '提供重新激活的专属优惠',
          '安排产品使用培训',
          '建立更紧密的沟通机制'
        ];
      default:
        return [];
    }
  }

  /**
   * 批量更新客户生命周期信息
   */
  batchUpdateLifecycleInfo(profiles: CustomerProfile[]): CustomerProfile[] {
    return profiles.map(profile => this.updateLifecycleInfo(profile));
  }

  /**
   * 按生命周期阶段分组客户
   */
  groupByLifecycleStage(profiles: CustomerProfile[]): Map<string, CustomerProfile[]> {
    const groups = new Map<string, CustomerProfile[]>();

    profiles.forEach(profile => {
      const stage = profile.lifecycleStage || this.calculateLifecycleStage(profile);
      if (!groups.has(stage)) {
        groups.set(stage, []);
      }
      groups.get(stage)?.push(profile);
    });

    return groups;
  }

  /**
   * 计算生命周期阶段分布
   */
  calculateLifecycleDistribution(profiles: CustomerProfile[]): Record<string, number> {
    const distribution: Record<string, number> = {
      lead: 0,
      prospect: 0,
      customer: 0,
      loyal: 0,
      churned: 0,
      reactivated: 0
    };

    profiles.forEach(profile => {
      const stage = profile.lifecycleStage || this.calculateLifecycleStage(profile);
      distribution[stage]++;
    });

    return distribution;
  }
}

export default LifecycleService;