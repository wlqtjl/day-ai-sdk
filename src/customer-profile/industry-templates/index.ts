import { CustomerProfile, CustomerFeatures, CustomerInsight } from '../models';

interface IndustryTemplate {
  id: string;
  name: string;
  description: string;
  features: {
    [key: string]: any;
  };
  analysisRules: {
    [key: string]: any;
  };
  recommendedActions: string[];
  customizeProfile: (profile: CustomerProfile) => CustomerProfile;
  generateInsights: (profile: CustomerProfile) => CustomerInsight[];
}

class IndustryTemplateManager {
  private templates: Map<string, IndustryTemplate> = new Map();

  constructor() {
    // 注册默认行业模板
    this.registerTemplate(this.getRetailTemplate());
    this.registerTemplate(this.getFinanceTemplate());
    this.registerTemplate(this.getHealthcareTemplate());
    this.registerTemplate(this.getTechnologyTemplate());
    this.registerTemplate(this.getEducationTemplate());
    this.registerTemplate(this.getManufacturingTemplate());
    this.registerTemplate(this.getRestaurantTemplate());
    this.registerTemplate(this.getLogisticsTemplate());
  }

  registerTemplate(template: IndustryTemplate): void {
    this.templates.set(template.id, template);
  }

  getTemplate(industryId: string): IndustryTemplate | undefined {
    return this.templates.get(industryId);
  }

  getAllTemplates(): IndustryTemplate[] {
    return Array.from(this.templates.values());
  }

  applyTemplate(profile: CustomerProfile, industryId: string): CustomerProfile {
    const template = this.getTemplate(industryId);
    if (!template) {
      throw new Error(`Industry template ${industryId} not found`);
    }
    return template.customizeProfile(profile);
  }

  generateIndustryInsights(profile: CustomerProfile, industryId: string): CustomerInsight[] {
    const template = this.getTemplate(industryId);
    if (!template) {
      throw new Error(`Industry template ${industryId} not found`);
    }
    return template.generateInsights(profile);
  }

  private getRetailTemplate(): IndustryTemplate {
    return {
      id: 'retail',
      name: '零售行业',
      description: '针对零售行业的客户分析模板',
      features: {
        purchaseFrequency: 'high',
        averageOrderValue: 500,
        productCategories: ['服装', '电子产品', '家居用品'],
        preferredChannels: ['线上', '线下'],
        loyaltyLevel: 'gold',
      },
      analysisRules: {
        churnRisk: (profile: CustomerProfile) => {
          if (profile.features.purchaseFrequency === 'rare') return 'high';
          if (profile.features.engagementLevel === 'low') return 'medium';
          return 'low';
        },
        potentialValue: (profile: CustomerProfile) => {
          if (profile.features.averageOrderValue && profile.features.averageOrderValue > 1000) return 'high';
          if (profile.features.purchaseFrequency === 'frequent') return 'medium';
          return 'low';
        },
      },
      recommendedActions: [
        '发送个性化产品推荐',
        '提供会员专享折扣',
        '定期发送促销信息',
        '邀请参与会员活动',
      ],
      customizeProfile: (profile: CustomerProfile) => {
        return {
          ...profile,
          tags: [...(profile.tags || []), '零售客户'],
          features: {
            ...profile.features,
            productCategories: profile.features.interests || ['服装'],
            preferredChannels: ['线上'],
            loyaltyLevel: 'silver',
          },
        };
      },
      generateInsights: (profile: CustomerProfile) => {
        const insights: CustomerInsight[] = [];

        // 购买行为洞察
        if (profile.features.purchaseFrequency === 'frequent') {
          insights.push({
            id: `retail-insight-1-${Date.now()}`,
            type: 'behavioral',
            content: '客户购买频率高，是忠实客户',
            confidence: 0.9,
            timestamp: new Date(),
            actionItems: ['提供会员升级机会', '发送专属优惠'],
          });
        }

        // 消费能力洞察
        if (profile.features.averageOrderValue && profile.features.averageOrderValue > 1000) {
          insights.push({
            id: `retail-insight-2-${Date.now()}`,
            type: 'predictive',
            content: '客户消费能力强，可能对高端产品感兴趣',
            confidence: 0.8,
            timestamp: new Date(),
            actionItems: ['推荐高端产品', '提供VIP服务'],
          });
        }

        return insights;
      },
    };
  }

  private getFinanceTemplate(): IndustryTemplate {
    return {
      id: 'finance',
      name: '金融行业',
      description: '针对金融行业的客户分析模板',
      features: {
        riskTolerance: 'medium',
        investmentGoals: ['财富增值', '资产保值'],
        financialProducts: ['储蓄', '基金', '保险'],
        incomeLevel: 'high',
        creditScore: 800,
      },
      analysisRules: {
        churnRisk: (profile: CustomerProfile) => {
          if (profile.features.engagementLevel === 'low') return 'high';
          return 'low';
        },
        potentialValue: (profile: CustomerProfile) => {
          const features = profile.features as any;
          if (features.incomeLevel === 'high') return 'high';
          return 'medium';
        },
      },
      recommendedActions: [
        '提供个性化理财方案',
        '定期进行财务健康检查',
        '邀请参加投资讲座',
        '推荐适合的金融产品',
      ],
      customizeProfile: (profile: CustomerProfile) => {
        return {
          ...profile,
          tags: [...(profile.tags || []), '金融客户'],
          features: {
            ...profile.features,
            riskTolerance: 'medium',
            investmentGoals: ['财富增值'],
            financialProducts: ['储蓄', '基金'],
            incomeLevel: 'medium',
            creditScore: 750,
          },
        };
      },
      generateInsights: (profile: CustomerProfile) => {
        const insights: CustomerInsight[] = [];

        // 风险偏好洞察
        const financeFeatures = profile.features as any;
        if (financeFeatures.riskTolerance === 'high') {
          insights.push({
            id: `finance-insight-1-${Date.now()}`,
            type: 'behavioral',
            content: '客户风险承受能力高，适合高收益投资产品',
            confidence: 0.9,
            timestamp: new Date(),
            actionItems: ['推荐股票型基金', '介绍高收益理财产品'],
          });
        }

        // 投资目标洞察
        if (financeFeatures.investmentGoals?.includes('财富增值')) {
          insights.push({
            id: `finance-insight-2-${Date.now()}`,
            type: 'predictive',
            content: '客户目标是财富增值，可能对长期投资感兴趣',
            confidence: 0.8,
            timestamp: new Date(),
            actionItems: ['制定长期投资计划', '推荐复利理财产品'],
          });
        }

        return insights;
      },
    };
  }

  private getHealthcareTemplate(): IndustryTemplate {
    return {
      id: 'healthcare',
      name: '医疗健康行业',
      description: '针对医疗健康行业的客户分析模板',
      features: {
        healthConditions: ['高血压', '糖尿病'],
        ageGroup: 'middle-aged',
        healthcareNeeds: ['定期体检', '慢性病管理'],
        insuranceCoverage: 'comprehensive',
        preferredProviders: ['三甲医院', '专科诊所'],
      },
      analysisRules: {
        churnRisk: (profile: CustomerProfile) => {
          if (profile.features.engagementLevel === 'low') return 'medium';
          return 'low';
        },
        potentialValue: (profile: CustomerProfile) => {
          const healthFeatures = profile.features as any;
          if (healthFeatures.healthConditions?.length) return 'high';
          return 'medium';
        },
      },
      recommendedActions: [
        '提供健康管理计划',
        '定期发送健康资讯',
        '安排专家咨询服务',
        '推荐适合的健康保险',
      ],
      customizeProfile: (profile: CustomerProfile) => {
        return {
          ...profile,
          tags: [...(profile.tags || []), '医疗健康客户'],
          features: {
            ...profile.features,
            healthConditions: [],
            ageGroup: 'adult',
            healthcareNeeds: ['常规体检'],
            insuranceCoverage: 'basic',
            preferredProviders: ['社区医院'],
          },
        };
      },
      generateInsights: (profile: CustomerProfile) => {
        const insights: CustomerInsight[] = [];

        // 健康需求洞察
        const healthFeatures = profile.features as any;
        if (healthFeatures.healthcareNeeds?.includes('慢性病管理')) {
          insights.push({
            id: `healthcare-insight-1-${Date.now()}`,
            type: 'behavioral',
            content: '客户需要慢性病管理服务',
            confidence: 0.9,
            timestamp: new Date(),
            actionItems: ['提供慢性病管理计划', '安排定期随访'],
          });
        }

        // 年龄群体洞察
        if (healthFeatures.ageGroup === 'senior') {
          insights.push({
            id: `healthcare-insight-2-${Date.now()}`,
            type: 'predictive',
            content: '客户属于老年群体，可能需要更多健康关怀',
            confidence: 0.8,
            timestamp: new Date(),
            actionItems: ['提供老年健康套餐', '安排家庭医生服务'],
          });
        }

        return insights;
      },
    };
  }

  private getTechnologyTemplate(): IndustryTemplate {
    return {
      id: 'technology',
      name: '科技行业',
      description: '针对科技行业的客户分析模板',
      features: {
        techSavviness: 'high',
        digitalChannels: ['mobile', 'web', 'social'],
        softwareUsage: ['SaaS', 'cloud', 'AI tools'],
        innovationAdoption: 'early adopter',
        technicalSupportNeeds: 'medium',
      },
      analysisRules: {
        churnRisk: (profile: CustomerProfile) => {
          if (profile.features.engagementLevel === 'low') return 'high';
          return 'low';
        },
        potentialValue: (profile: CustomerProfile) => {
          const techFeatures = profile.features as any;
          if (techFeatures.techSavviness === 'high') return 'high';
          return 'medium';
        },
      },
      recommendedActions: [
        '提供技术白皮书',
        '邀请参加产品发布会',
        '提供API文档和开发资源',
        '推荐企业级解决方案',
      ],
      customizeProfile: (profile: CustomerProfile) => {
        return {
          ...profile,
          tags: [...(profile.tags || []), '科技客户'],
          features: {
            ...profile.features,
            techSavviness: 'medium',
            digitalChannels: ['mobile', 'web'],
            softwareUsage: ['SaaS'],
            innovationAdoption: 'early majority',
            technicalSupportNeeds: 'low',
          },
        };
      },
      generateInsights: (profile: CustomerProfile) => {
        const insights: CustomerInsight[] = [];

        // 技术熟练度洞察
        const techFeatures = profile.features as any;
        if (techFeatures.techSavviness === 'high') {
          insights.push({
            id: `tech-insight-1-${Date.now()}`,
            type: 'behavioral',
            content: '客户技术熟练度高，适合自助服务和高级功能',
            confidence: 0.9,
            timestamp: new Date(),
            actionItems: ['提供API访问权限', '推荐高级功能'],
          });
        }

        // 创新采用洞察
        if (techFeatures.innovationAdoption === 'early adopter') {
          insights.push({
            id: `tech-insight-2-${Date.now()}`,
            type: 'predictive',
            content: '客户是早期采用者，对新产品和功能感兴趣',
            confidence: 0.8,
            timestamp: new Date(),
            actionItems: ['邀请参与beta测试', '提前通知新功能'],
          });
        }

        return insights;
      },
    };
  }

  private getEducationTemplate(): IndustryTemplate {
    return {
      id: 'education',
      name: '教育行业',
      description: '针对教育行业的客户分析模板',
      features: {
        educationLevel: 'bachelor',
        learningPreferences: ['online', 'classroom'],
        courseInterests: ['technology', 'business', 'language'],
        educationalGoals: ['career advancement', 'skill development'],
        budgetRange: 'medium',
      },
      analysisRules: {
        churnRisk: (profile: CustomerProfile) => {
          if (profile.features.engagementLevel === 'low') return 'high';
          return 'low';
        },
        potentialValue: (profile: CustomerProfile) => {
          const eduFeatures = profile.features as any;
          if (eduFeatures.educationalGoals?.includes('career advancement')) return 'high';
          return 'medium';
        },
      },
      recommendedActions: [
        '提供课程推荐',
        '发送学习资源',
        '邀请参加线上研讨会',
        '提供职业发展规划',
      ],
      customizeProfile: (profile: CustomerProfile) => {
        return {
          ...profile,
          tags: [...(profile.tags || []), '教育客户'],
          features: {
            ...profile.features,
            educationLevel: 'high school',
            learningPreferences: ['online'],
            courseInterests: ['technology'],
            educationalGoals: ['skill development'],
            budgetRange: 'medium',
          },
        };
      },
      generateInsights: (profile: CustomerProfile) => {
        const insights: CustomerInsight[] = [];

        // 学习偏好洞察
        const eduFeatures = profile.features as any;
        if (eduFeatures.learningPreferences?.includes('online')) {
          insights.push({
            id: `edu-insight-1-${Date.now()}`,
            type: 'behavioral',
            content: '客户偏好在线学习，适合线上课程和资源',
            confidence: 0.9,
            timestamp: new Date(),
            actionItems: ['推荐在线课程', '提供数字学习资源'],
          });
        }

        // 教育目标洞察
        if (eduFeatures.educationalGoals?.includes('career advancement')) {
          insights.push({
            id: `edu-insight-2-${Date.now()}`,
            type: 'predictive',
            content: '客户目标是职业发展，可能对职业认证课程感兴趣',
            confidence: 0.8,
            timestamp: new Date(),
            actionItems: ['推荐职业认证课程', '提供就业指导服务'],
          });
        }

        return insights;
      },
    };
  }

  private getManufacturingTemplate(): IndustryTemplate {
    return {
      id: 'manufacturing',
      name: '制造业',
      description: '针对制造业的客户分析模板',
      features: {
        industrySegment: 'automotive',
        productionScale: 'medium',
        supplyChainNeeds: ['raw materials', 'components', 'logistics'],
        technologyAdoption: 'traditional',
        qualityStandards: 'ISO 9001',
      },
      analysisRules: {
        churnRisk: (profile: CustomerProfile) => {
          if (profile.features.engagementLevel === 'low') return 'high';
          return 'low';
        },
        potentialValue: (profile: CustomerProfile) => {
          const manFeatures = profile.features as any;
          if (manFeatures.productionScale === 'large') return 'high';
          return 'medium';
        },
      },
      recommendedActions: [
        '提供供应链优化方案',
        '推荐智能制造解决方案',
        '安排行业专家咨询',
        '提供质量控制培训',
      ],
      customizeProfile: (profile: CustomerProfile) => {
        return {
          ...profile,
          tags: [...(profile.tags || []), '制造业客户'],
          features: {
            ...profile.features,
            industrySegment: 'general manufacturing',
            productionScale: 'small',
            supplyChainNeeds: ['raw materials'],
            technologyAdoption: 'traditional',
            qualityStandards: 'basic',
          },
        };
      },
      generateInsights: (profile: CustomerProfile) => {
        const insights: CustomerInsight[] = [];

        // 技术采用洞察
        const manFeatures = profile.features as any;
        if (manFeatures.technologyAdoption === 'traditional') {
          insights.push({
            id: `man-insight-1-${Date.now()}`,
            type: 'behavioral',
            content: '客户技术采用较为传统，需要渐进式数字化转型',
            confidence: 0.9,
            timestamp: new Date(),
            actionItems: ['提供分阶段数字化方案', '安排技术培训'],
          });
        }

        // 供应链需求洞察
        if (manFeatures.supplyChainNeeds?.includes('logistics')) {
          insights.push({
            id: `man-insight-2-${Date.now()}`,
            type: 'predictive',
            content: '客户有物流需求，可能对供应链优化感兴趣',
            confidence: 0.8,
            timestamp: new Date(),
            actionItems: ['推荐物流解决方案', '提供供应链分析服务'],
          });
        }

        return insights;
      },
    };
  }

  private getRestaurantTemplate(): IndustryTemplate {
    return {
      id: 'restaurant',
      name: '餐饮行业',
      description: '针对餐饮行业的客户分析模板',
      features: {
        cuisineType: 'Chinese',
        establishmentType: 'casual dining',
        customerDemographics: ['young professionals', 'families'],
        serviceChannels: ['dine-in', 'delivery', 'takeout'],
        peakHours: ['lunch', 'dinner'],
      },
      analysisRules: {
        churnRisk: (profile: CustomerProfile) => {
          if (profile.features.engagementLevel === 'low') return 'high';
          return 'low';
        },
        potentialValue: (profile: CustomerProfile) => {
          const restFeatures = profile.features as any;
          if (restFeatures.establishmentType === 'fine dining') return 'high';
          return 'medium';
        },
      },
      recommendedActions: [
        '提供菜单优化建议',
        '推荐餐饮管理系统',
        '安排食品安全培训',
        '提供营销推广方案',
      ],
      customizeProfile: (profile: CustomerProfile) => {
        return {
          ...profile,
          tags: [...(profile.tags || []), '餐饮客户'],
          features: {
            ...profile.features,
            cuisineType: 'Chinese',
            establishmentType: 'fast food',
            customerDemographics: ['young professionals'],
            serviceChannels: ['dine-in', 'takeout'],
            peakHours: ['lunch'],
          },
        };
      },
      generateInsights: (profile: CustomerProfile) => {
        const insights: CustomerInsight[] = [];

        // 服务渠道洞察
        const restFeatures = profile.features as any;
        if (restFeatures.serviceChannels?.includes('delivery')) {
          insights.push({
            id: `rest-insight-1-${Date.now()}`,
            type: 'behavioral',
            content: '客户提供外卖服务，需要优化配送流程',
            confidence: 0.9,
            timestamp: new Date(),
            actionItems: ['推荐外卖管理系统', '优化配送路线'],
          });
        }

        // 客户群体洞察
        if (restFeatures.customerDemographics?.includes('families')) {
          insights.push({
            id: `rest-insight-2-${Date.now()}`,
            type: 'predictive',
            content: '客户服务家庭群体，可能需要家庭套餐和儿童友好设施',
            confidence: 0.8,
            timestamp: new Date(),
            actionItems: ['设计家庭套餐', '提供儿童活动区域'],
          });
        }

        return insights;
      },
    };
  }

  private getLogisticsTemplate(): IndustryTemplate {
    return {
      id: 'logistics',
      name: '物流行业',
      description: '针对物流行业的客户分析模板',
      features: {
        serviceType: 'freight',
        networkCoverage: 'national',
        technologyAdoption: 'medium',
        fleetSize: 'medium',
        customerSegments: ['business', 'retail'],
      },
      analysisRules: {
        churnRisk: (profile: CustomerProfile) => {
          if (profile.features.engagementLevel === 'low') return 'high';
          return 'low';
        },
        potentialValue: (profile: CustomerProfile) => {
          const logFeatures = profile.features as any;
          if (logFeatures.networkCoverage === 'international') return 'high';
          return 'medium';
        },
      },
      recommendedActions: [
        '提供路线优化方案',
        '推荐物流管理系统',
        '安排车队管理培训',
        '提供供应链集成服务',
      ],
      customizeProfile: (profile: CustomerProfile) => {
        return {
          ...profile,
          tags: [...(profile.tags || []), '物流客户'],
          features: {
            ...profile.features,
            serviceType: 'last mile',
            networkCoverage: 'local',
            technologyAdoption: 'low',
            fleetSize: 'small',
            customerSegments: ['retail'],
          },
        };
      },
      generateInsights: (profile: CustomerProfile) => {
        const insights: CustomerInsight[] = [];

        // 技术采用洞察
        const logFeatures = profile.features as any;
        if (logFeatures.technologyAdoption === 'low') {
          insights.push({
            id: `log-insight-1-${Date.now()}`,
            type: 'behavioral',
            content: '客户技术采用较低，需要数字化转型支持',
            confidence: 0.9,
            timestamp: new Date(),
            actionItems: ['推荐物流管理软件', '提供数字化培训'],
          });
        }

        // 网络覆盖洞察
        if (logFeatures.networkCoverage === 'national') {
          insights.push({
            id: `log-insight-2-${Date.now()}`,
            type: 'predictive',
            content: '客户网络覆盖全国，可能对区域优化和成本控制感兴趣',
            confidence: 0.8,
            timestamp: new Date(),
            actionItems: ['提供路线优化方案', '推荐成本管理系统'],
          });
        }

        return insights;
      },
    };
  }
}

export { IndustryTemplateManager, type IndustryTemplate };