import { CustomerProfile } from '../customer-profile/models';
import { v4 as uuidv4 } from 'uuid';

/**
 * 仪表盘组件类型
 */
export type DashboardWidgetType = 
  | 'metrics'
  | 'chart'
  | 'table'
  | 'customer_list'
  | 'sales_funnel'
  | 'prediction'
  | 'alert'
  | 'competitor_analysis'
  | 'activity_timeline';

/**
 * 仪表盘布局配置
 */
export interface DashboardLayout {
  widgets: DashboardWidget[];
  columns: number;
  theme: 'light' | 'dark' | 'system';
  refreshInterval: number; // 刷新间隔（秒）
}

/**
 * 仪表盘组件配置
 */
export interface DashboardWidget {
  id: string;
  type: DashboardWidgetType;
  title: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  config: Record<string, any>;
  enabled: boolean;
}

/**
 * 个性化仪表盘配置
 */
export interface PersonalizedDashboardConfig {
  id: string;
  userId: string;
  name: string;
  layout: DashboardLayout;
  filters: DashboardFilter[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 仪表盘过滤器
 */
export interface DashboardFilter {
  id: string;
  type: 'date' | 'customer' | 'industry' | 'sales_stage' | 'lifecycle_stage';
  value: any;
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'contains' | 'in';
}

/**
 * 仪表盘数据
 */
export interface DashboardData {
  widgets: WidgetData[];
  summary: DashboardSummary;
  timestamp: Date;
}

/**
 * 组件数据
 */
export interface WidgetData {
  widgetId: string;
  type: DashboardWidgetType;
  data: any;
  lastUpdated: Date;
  error: string | null;
}

/**
 * 仪表盘摘要
 */
export interface DashboardSummary {
  totalCustomers: number;
  activeDeals: number;
  totalRevenue: number;
  conversionRate: number;
  topCustomers: CustomerProfile[];
  recentActivities: Activity[];
}

/**
 * 活动
 */
export interface Activity {
  id: string;
  type: 'email' | 'call' | 'meeting' | 'note' | 'task';
  title: string;
  customerId: string;
  customerName: string;
  date: Date;
  status: 'completed' | 'pending' | 'upcoming';
}

/**
 * 个性化仪表盘服务
 */
export class DashboardService {
  private dashboards: Map<string, PersonalizedDashboardConfig> = new Map();
  private widgetFactories: Map<DashboardWidgetType, WidgetFactory> = new Map();

  constructor() {
    this.registerWidgetFactories();
  }

  /**
   * 注册组件工厂
   */
  private registerWidgetFactories(): void {
    this.widgetFactories.set('metrics', new MetricsWidgetFactory());
    this.widgetFactories.set('chart', new ChartWidgetFactory());
    this.widgetFactories.set('table', new TableWidgetFactory());
    this.widgetFactories.set('customer_list', new CustomerListWidgetFactory());
    this.widgetFactories.set('sales_funnel', new SalesFunnelWidgetFactory());
    this.widgetFactories.set('prediction', new PredictionWidgetFactory());
    this.widgetFactories.set('alert', new AlertWidgetFactory());
    this.widgetFactories.set('competitor_analysis', new CompetitorAnalysisWidgetFactory());
    this.widgetFactories.set('activity_timeline', new ActivityTimelineWidgetFactory());
  }

  /**
   * 创建个性化仪表盘
   */
  createDashboard(userId: string, name: string, layout?: Partial<DashboardLayout>): string {
    const dashboardId = uuidv4();
    const defaultLayout: DashboardLayout = {
      widgets: [
        {
          id: uuidv4(),
          type: 'metrics',
          title: '关键指标',
          position: { x: 0, y: 0, width: 4, height: 2 },
          config: {},
          enabled: true,
        },
        {
          id: uuidv4(),
          type: 'customer_list',
          title: '最近客户',
          position: { x: 0, y: 2, width: 4, height: 4 },
          config: { limit: 10 },
          enabled: true,
        },
        {
          id: uuidv4(),
          type: 'chart',
          title: '销售趋势',
          position: { x: 4, y: 0, width: 4, height: 3 },
          config: { chartType: 'line', dataType: 'sales' },
          enabled: true,
        },
        {
          id: uuidv4(),
          type: 'sales_funnel',
          title: '销售漏斗',
          position: { x: 4, y: 3, width: 4, height: 3 },
          config: {},
          enabled: true,
        },
      ],
      columns: 8,
      theme: 'light',
      refreshInterval: 60,
      ...layout,
    };

    const dashboard: PersonalizedDashboardConfig = {
      id: dashboardId,
      userId,
      name,
      layout: defaultLayout,
      filters: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.dashboards.set(dashboardId, dashboard);
    return dashboardId;
  }

  /**
   * 获取仪表盘
   */
  getDashboard(dashboardId: string): PersonalizedDashboardConfig | null {
    return this.dashboards.get(dashboardId) || null;
  }

  /**
   * 获取用户的所有仪表盘
   */
  getUserDashboards(userId: string): PersonalizedDashboardConfig[] {
    return Array.from(this.dashboards.values()).filter(d => d.userId === userId);
  }

  /**
   * 更新仪表盘
   */
  updateDashboard(dashboardId: string, updates: Partial<PersonalizedDashboardConfig>): boolean {
    const dashboard = this.dashboards.get(dashboardId);
    if (dashboard) {
      this.dashboards.set(dashboardId, {
        ...dashboard,
        ...updates,
        updatedAt: new Date(),
      });
      return true;
    }
    return false;
  }

  /**
   * 删除仪表盘
   */
  deleteDashboard(dashboardId: string): boolean {
    return this.dashboards.delete(dashboardId);
  }

  /**
   * 添加组件
   */
  addWidget(dashboardId: string, widget: Omit<DashboardWidget, 'id'>): string {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) {
      return '';
    }

    const widgetId = uuidv4();
    const newWidget: DashboardWidget = {
      ...widget,
      id: widgetId,
    };

    dashboard.layout.widgets.push(newWidget);
    dashboard.updatedAt = new Date();
    this.dashboards.set(dashboardId, dashboard);
    return widgetId;
  }

  /**
   * 更新组件
   */
  updateWidget(dashboardId: string, widgetId: string, updates: Partial<DashboardWidget>): boolean {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) {
      return false;
    }

    const widgetIndex = dashboard.layout.widgets.findIndex(w => w.id === widgetId);
    if (widgetIndex === -1) {
      return false;
    }

    dashboard.layout.widgets[widgetIndex] = {
      ...dashboard.layout.widgets[widgetIndex],
      ...updates,
    };
    dashboard.updatedAt = new Date();
    this.dashboards.set(dashboardId, dashboard);
    return true;
  }

  /**
   * 删除组件
   */
  removeWidget(dashboardId: string, widgetId: string): boolean {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) {
      return false;
    }

    const initialLength = dashboard.layout.widgets.length;
    dashboard.layout.widgets = dashboard.layout.widgets.filter(w => w.id !== widgetId);
    if (dashboard.layout.widgets.length < initialLength) {
      dashboard.updatedAt = new Date();
      this.dashboards.set(dashboardId, dashboard);
      return true;
    }
    return false;
  }

  /**
   * 获取仪表盘数据
   */
  async getDashboardData(dashboardId: string, customers: CustomerProfile[]): Promise<DashboardData> {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) {
      return {
        widgets: [],
        summary: this.getDefaultSummary(),
        timestamp: new Date(),
      };
    }

    const widgetData: WidgetData[] = [];

    // 生成每个组件的数据
    for (const widget of dashboard.layout.widgets) {
      if (widget.enabled) {
        const factory = this.widgetFactories.get(widget.type);
        if (factory) {
          try {
            const data = await factory.generateData(widget.config, customers);
            widgetData.push({
              widgetId: widget.id,
              type: widget.type,
              data,
              lastUpdated: new Date(),
              error: null,
            });
          } catch (error) {
            widgetData.push({
              widgetId: widget.id,
              type: widget.type,
              data: null,
              lastUpdated: new Date(),
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        }
      }
    }

    return {
      widgets: widgetData,
      summary: this.generateSummary(customers),
      timestamp: new Date(),
    };
  }

  /**
   * 生成仪表盘摘要
   */
  private generateSummary(customers: CustomerProfile[]): DashboardSummary {
    const totalCustomers = customers.length;
    const activeDeals = customers.filter(c => c.salesStage && c.salesStage !== 'closed').length;
    const totalRevenue = customers.reduce((sum, c) => sum + (c.value || 0), 0);
    const conversionRate = totalCustomers > 0 ? activeDeals / totalCustomers : 0;
    const topCustomers = [...customers].sort((a, b) => (b.value || 0) - (a.value || 0)).slice(0, 5);
    const recentActivities = this.generateRecentActivities(customers);

    return {
      totalCustomers,
      activeDeals,
      totalRevenue,
      conversionRate,
      topCustomers,
      recentActivities,
    };
  }

  /**
   * 生成最近活动
   */
  private generateRecentActivities(customers: CustomerProfile[]): Activity[] {
    const activities: Activity[] = [];

    // 模拟活动数据
    customers.forEach(customer => {
      activities.push(
        {
          id: uuidv4(),
          type: 'email',
          title: '发送产品介绍',
          customerId: customer.id,
          customerName: customer.name,
          date: new Date(),
          status: 'completed',
        },
        {
          id: uuidv4(),
          type: 'call',
          title: '跟进需求',
          customerId: customer.id,
          customerName: customer.name,
          date: new Date(Date.now() + 24 * 60 * 60 * 1000),
          status: 'upcoming',
        }
      );
    });

    return activities.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 10);
  }

  /**
   * 获取默认摘要
   */
  private getDefaultSummary(): DashboardSummary {
    return {
      totalCustomers: 0,
      activeDeals: 0,
      totalRevenue: 0,
      conversionRate: 0,
      topCustomers: [],
      recentActivities: [],
    };
  }
}

/**
 * 组件工厂接口
 */
export interface WidgetFactory {
  generateData(config: Record<string, any>, customers: CustomerProfile[]): Promise<any>;
}

/**
 * 指标组件工厂
 */
export class MetricsWidgetFactory implements WidgetFactory {
  async generateData(config: Record<string, any>, customers: CustomerProfile[]): Promise<any> {
    return {
      metrics: [
        {
          name: '总客户数',
          value: customers.length,
          trend: 'up',
          change: 10,
        },
        {
          name: '活跃交易',
          value: customers.filter(c => c.salesStage && c.salesStage !== 'closed').length,
          trend: 'up',
          change: 5,
        },
        {
          name: '总收入',
          value: customers.reduce((sum, c) => sum + (c.value || 0), 0),
          trend: 'up',
          change: 15,
        },
        {
          name: '转化率',
          value: `${Math.round((customers.filter(c => c.lifecycleStage === 'customer').length / customers.length) * 100)}%`,
          trend: 'up',
          change: 2,
        },
      ],
    };
  }
}

/**
 * 图表组件工厂
 */
export class ChartWidgetFactory implements WidgetFactory {
  async generateData(config: Record<string, any>, customers: CustomerProfile[]): Promise<any> {
    const chartType = config.chartType || 'line';
    const dataType = config.dataType || 'sales';

    // 模拟图表数据
    return {
      chartType,
      dataType,
      labels: ['一月', '二月', '三月', '四月', '五月', '六月'],
      datasets: [
        {
          label: '销售额',
          data: [12000, 19000, 15000, 25000, 22000, 30000],
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
        },
        {
          label: '客户数',
          data: [10, 15, 12, 20, 18, 25],
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
        },
      ],
    };
  }
}

/**
 * 表格组件工厂
 */
export class TableWidgetFactory implements WidgetFactory {
  async generateData(config: Record<string, any>, customers: CustomerProfile[]): Promise<any> {
    const columns = config.columns || ['name', 'company', 'email', 'healthScore', 'value'];
    const limit = config.limit || 10;

    return {
      columns: columns.map((col: string) => ({
        key: col,
        label: this.getColumnLabel(col),
      })),
      rows: customers.slice(0, limit).map(customer => {
        const row: Record<string, any> = {};
        columns.forEach((col: string) => {
          row[col] = customer[col as keyof CustomerProfile];
        });
        return row;
      }),
    };
  }

  private getColumnLabel(column: string): string {
    const labels: Record<string, string> = {
      name: '姓名',
      company: '公司',
      email: '邮箱',
      healthScore: '健康评分',
      value: '价值',
    };
    return labels[column] || column;
  }
}

/**
 * 客户列表组件工厂
 */
export class CustomerListWidgetFactory implements WidgetFactory {
  async generateData(config: Record<string, any>, customers: CustomerProfile[]): Promise<any> {
    const limit = config.limit || 10;
    const sortBy = config.sortBy || 'updatedAt';
    const sortOrder = config.sortOrder || 'desc';

    const sortedCustomers = [...customers].sort((a, b) => {
      const aValue = a[sortBy as keyof CustomerProfile];
      const bValue = b[sortBy as keyof CustomerProfile];
      if (aValue === undefined && bValue === undefined) return 0;
      if (aValue === undefined) return 1;
      if (bValue === undefined) return -1;
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return {
      customers: sortedCustomers.slice(0, limit).map(customer => ({
        id: customer.id,
        name: customer.name,
        company: customer.company,
        email: customer.email,
        healthScore: customer.healthScore,
        lifecycleStage: customer.lifecycleStage,
        value: customer.value,
        lastUpdated: customer.updatedAt,
      })),
    };
  }
}

/**
 * 销售漏斗组件工厂
 */
export class SalesFunnelWidgetFactory implements WidgetFactory {
  async generateData(config: Record<string, any>, customers: CustomerProfile[]): Promise<any> {
    const stages = [
      { name: '潜在客户', key: 'lead', count: 0 },
      { name: '意向客户', key: 'prospect', count: 0 },
      { name: '提案阶段', key: 'proposal', count: 0 },
      { name: '谈判阶段', key: 'negotiation', count: 0 },
      { name: '成交客户', key: 'customer', count: 0 },
    ];

    customers.forEach(customer => {
      const stage = stages.find(s => s.key === customer.salesStage || s.key === customer.lifecycleStage);
      if (stage) {
        stage.count++;
      }
    });

    return {
      stages: stages.map(s => ({
        name: s.name,
        value: s.count,
      })),
    };
  }
}

/**
 * 预测组件工厂
 */
export class PredictionWidgetFactory implements WidgetFactory {
  async generateData(config: Record<string, any>, customers: CustomerProfile[]): Promise<any> {
    // 模拟预测数据
    return {
      predictions: [
        {
          period: '本月',
          sales: 50000,
          customers: 25,
          confidence: 0.85,
        },
        {
          period: '下月',
          sales: 55000,
          customers: 28,
          confidence: 0.8,
        },
        {
          period: '下下月',
          sales: 60000,
          customers: 30,
          confidence: 0.75,
        },
      ],
    };
  }
}

/**
 * 告警组件工厂
 */
export class AlertWidgetFactory implements WidgetFactory {
  async generateData(config: Record<string, any>, customers: CustomerProfile[]): Promise<any> {
    const alerts = [];

    // 低健康评分告警
    const lowHealthCustomers = customers.filter(c => c.healthScore && c.healthScore < 30);
    if (lowHealthCustomers.length > 0) {
      alerts.push({
        id: uuidv4(),
        type: 'warning',
        title: '低健康评分客户',
        message: `发现 ${lowHealthCustomers.length} 个客户健康评分低于 30`,
        count: lowHealthCustomers.length,
        timestamp: new Date(),
      });
    }

    // 长时间无活动告警
    const inactiveCustomers = customers.filter(c => {
      const lastUpdated = c.updatedAt || c.createdAt;
      return lastUpdated && (Date.now() - lastUpdated.getTime()) > 30 * 24 * 60 * 60 * 1000;
    });
    if (inactiveCustomers.length > 0) {
      alerts.push({
        id: uuidv4(),
        type: 'info',
        title: '长时间无活动客户',
        message: `发现 ${inactiveCustomers.length} 个客户超过 30 天无活动`,
        count: inactiveCustomers.length,
        timestamp: new Date(),
      });
    }

    return {
      alerts,
    };
  }
}

/**
 * 竞争对手分析组件工厂
 */
export class CompetitorAnalysisWidgetFactory implements WidgetFactory {
  async generateData(config: Record<string, any>, customers: CustomerProfile[]): Promise<any> {
    // 模拟竞争对手数据
    return {
      competitors: [
        {
          name: '竞争对手A',
          marketShare: 35,
          strength: '技术领先',
          weakness: '价格较高',
        },
        {
          name: '竞争对手B',
          marketShare: 25,
          strength: '价格优势',
          weakness: '服务一般',
        },
        {
          name: '竞争对手C',
          marketShare: 20,
          strength: '服务优秀',
          weakness: '技术落后',
        },
      ],
    };
  }
}

/**
 * 活动时间线组件工厂
 */
export class ActivityTimelineWidgetFactory implements WidgetFactory {
  async generateData(config: Record<string, any>, customers: CustomerProfile[]): Promise<any> {
    const activities: Activity[] = [];

    // 模拟活动数据
    customers.forEach(customer => {
      activities.push(
        {
          id: uuidv4(),
          type: 'email',
          title: '发送产品介绍',
          customerId: customer.id,
          customerName: customer.name,
          date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          status: 'completed',
        },
        {
          id: uuidv4(),
          type: 'call',
          title: '跟进需求',
          customerId: customer.id,
          customerName: customer.name,
          date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          status: 'completed',
        },
        {
          id: uuidv4(),
          type: 'meeting',
          title: '产品演示',
          customerId: customer.id,
          customerName: customer.name,
          date: new Date(),
          status: 'upcoming',
        }
      );
    });

    return {
      activities: activities.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 10),
    };
  }
}

export default DashboardService;