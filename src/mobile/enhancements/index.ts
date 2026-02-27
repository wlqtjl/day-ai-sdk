import { CustomerProfile } from '../../customer-profile/models';
import { v4 as uuidv4 } from 'uuid';

/**
 * 离线数据配置
 */
export interface OfflineConfig {
  enabled: boolean;
  syncInterval: number; // 同步间隔（分钟）
  maxOfflineDataSize: number; // 最大离线数据大小（MB）
  retryAttempts: number; // 同步失败重试次数
  autoSync: boolean; // 自动同步
}

/**
 * 推送通知配置
 */
export interface PushNotificationConfig {
  enabled: boolean;
  notificationTypes: NotificationType[];
  sound: boolean;
  vibration: boolean;
  badge: boolean;
}

/**
 * 通知类型
 */
export type NotificationType = 
  | 'customer_update'
  | 'task_reminder'
  | 'sales_opportunity'
  | 'competitor_alert'
  | 'system_alert';

/**
 * 离线数据存储
 */
export interface OfflineData {
  id: string;
  type: 'customer' | 'activity' | 'task' | 'note';
  data: any;
  timestamp: Date;
  synced: boolean;
  syncAttempts: number;
}

/**
 * 推送通知
 */
export interface PushNotification {
  id: string;
  title: string;
  body: string;
  type: NotificationType;
  data: Record<string, any>;
  timestamp: Date;
  read: boolean;
}

/**
 * 地理位置
 */
export interface Geolocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: Date;
}

/**
 * 语音记录
 */
export interface VoiceRecording {
  id: string;
  customerId: string;
  duration: number; // 秒
  audioUrl: string;
  transcript: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  timestamp: Date;
  synced: boolean;
}

/**
 * 性能指标
 */
export interface PerformanceMetric {
  id: string;
  type: 'app_start' | 'api_response' | 'screen_load' | 'database_query';
  duration: number; // 毫秒
  timestamp: Date;
  context: Record<string, any>;
}

/**
 * 移动应用增强服务
 */
export class MobileEnhancementService {
  private offlineConfig: OfflineConfig;
  private pushConfig: PushNotificationConfig;
  private offlineData: OfflineData[] = [];
  private notifications: PushNotification[] = [];
  private voiceRecordings: VoiceRecording[] = [];
  private performanceMetrics: PerformanceMetric[] = [];
  private lastLocation: Geolocation | null = null;
  private isOnline: boolean = true;

  constructor(offlineConfig: OfflineConfig = {
    enabled: true,
    syncInterval: 60,
    maxOfflineDataSize: 100,
    retryAttempts: 3,
    autoSync: true
  }, pushConfig: PushNotificationConfig = {
    enabled: true,
    notificationTypes: ['customer_update', 'task_reminder', 'sales_opportunity', 'competitor_alert', 'system_alert'],
    sound: true,
    vibration: true,
    badge: true
  }) {
    this.offlineConfig = offlineConfig;
    this.pushConfig = pushConfig;
    this.initializeSync();
  }

  /**
   * 初始化同步
   */
  private initializeSync(): void {
    if (this.offlineConfig.autoSync) {
      setInterval(() => {
        this.syncData();
      }, this.offlineConfig.syncInterval * 60 * 1000);
    }
  }

  /**
   * 存储离线数据
   */
  storeOfflineData(type: 'customer' | 'activity' | 'task' | 'note', data: any): string {
    const offlineItem: OfflineData = {
      id: uuidv4(),
      type,
      data,
      timestamp: new Date(),
      synced: false,
      syncAttempts: 0,
    };

    this.offlineData.push(offlineItem);
    this.cleanupOfflineData();
    return offlineItem.id;
  }

  /**
   * 获取离线数据
   */
  getOfflineData(): OfflineData[] {
    return [...this.offlineData];
  }

  /**
   * 清理离线数据
   */
  private cleanupOfflineData(): void {
    // 移除已同步的数据
    this.offlineData = this.offlineData.filter(item => !item.synced);

    // 限制数据大小
    const estimatedSize = this.estimateOfflineDataSize();
    if (estimatedSize > this.offlineConfig.maxOfflineDataSize) {
      // 按时间戳排序，移除最旧的数据
      this.offlineData.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      while (this.estimateOfflineDataSize() > this.offlineConfig.maxOfflineDataSize && this.offlineData.length > 0) {
        this.offlineData.shift();
      }
    }
  }

  /**
   * 估计离线数据大小
   */
  private estimateOfflineDataSize(): number {
    // 简化估算，实际应该计算真实大小
    return this.offlineData.length * 0.1; // 假设每条数据平均0.1MB
  }

  /**
   * 同步数据
   */
  async syncData(): Promise<{
    success: boolean;
    syncedItems: number;
    failedItems: number;
  }> {
    if (!this.isOnline) {
      return {
        success: false,
        syncedItems: 0,
        failedItems: 0,
      };
    }

    let syncedItems = 0;
    let failedItems = 0;

    for (const item of this.offlineData) {
      if (!item.synced && item.syncAttempts < this.offlineConfig.retryAttempts) {
        try {
          // 模拟同步过程
          await this.simulateSync(item);
          item.synced = true;
          syncedItems++;
        } catch (error) {
          item.syncAttempts++;
          failedItems++;
        }
      }
    }

    this.cleanupOfflineData();
    return {
      success: syncedItems > 0,
      syncedItems,
      failedItems,
    };
  }

  /**
   * 模拟同步
   */
  private async simulateSync(item: OfflineData): Promise<void> {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 500));
    // 模拟90%的成功率
    if (Math.random() > 0.1) {
      throw new Error('Sync failed');
    }
  }

  /**
   * 设置在线状态
   */
  setOnlineStatus(status: boolean): void {
    this.isOnline = status;
    if (status && this.offlineConfig.autoSync) {
      this.syncData();
    }
  }

  /**
   * 获取在线状态
   */
  getOnlineStatus(): boolean {
    return this.isOnline;
  }

  /**
   * 发送推送通知
   */
  sendNotification(type: NotificationType, title: string, body: string, data?: Record<string, any>): string {
    if (!this.pushConfig.enabled || !this.pushConfig.notificationTypes.includes(type)) {
      return '';
    }

    const notification: PushNotification = {
      id: uuidv4(),
      title,
      body,
      type,
      data: data || {},
      timestamp: new Date(),
      read: false,
    };

    this.notifications.push(notification);
    this.cleanupNotifications();
    this.simulatePush(notification);
    return notification.id;
  }

  /**
   * 模拟推送
   */
  private simulatePush(notification: PushNotification): void {
    // 模拟推送通知的显示
    console.log('Push notification:', {
      title: notification.title,
      body: notification.body,
      type: notification.type,
      data: notification.data,
    });
  }

  /**
   * 获取通知
   */
  getNotifications(unreadOnly: boolean = false): PushNotification[] {
    if (unreadOnly) {
      return this.notifications.filter(n => !n.read);
    }
    return [...this.notifications];
  }

  /**
   * 标记通知为已读
   */
  markNotificationAsRead(notificationId: string): boolean {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      return true;
    }
    return false;
  }

  /**
   * 清理通知
   */
  private cleanupNotifications(): void {
    // 只保留最近100条通知
    if (this.notifications.length > 100) {
      this.notifications = this.notifications
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 100);
    }
  }

  /**
   * 为客户更新发送通知
   */
  sendCustomerUpdateNotification(customer: CustomerProfile): string {
    return this.sendNotification(
      'customer_update',
      '客户信息更新',
      `${customer.name}的信息已更新`,
      { customerId: customer.id, customerName: customer.name }
    );
  }

  /**
   * 发送任务提醒通知
   */
  sendTaskReminderNotification(taskId: string, taskName: string, dueDate: Date): string {
    return this.sendNotification(
      'task_reminder',
      '任务提醒',
      `任务 "${taskName}" 将在${dueDate.toLocaleDateString()}到期`,
      { taskId, taskName, dueDate: dueDate.toISOString() }
    );
  }

  /**
   * 发送销售机会通知
   */
  sendSalesOpportunityNotification(opportunityId: string, customerName: string, amount: number): string {
    return this.sendNotification(
      'sales_opportunity',
      '销售机会',
      `来自${customerName}的销售机会，金额: ¥${amount}`,
      { opportunityId, customerName, amount }
    );
  }

  /**
   * 发送竞争对手告警通知
   */
  sendCompetitorAlertNotification(competitorName: string, alertType: string, message: string): string {
    return this.sendNotification(
      'competitor_alert',
      '竞争对手告警',
      `${competitorName} ${alertType}: ${message}`,
      { competitorName, alertType, message }
    );
  }

  /**
   * 发送系统告警通知
   */
  sendSystemAlertNotification(title: string, message: string): string {
    return this.sendNotification(
      'system_alert',
      title,
      message,
      { timestamp: new Date().toISOString() }
    );
  }

  /**
   * 更新离线配置
   */
  updateOfflineConfig(config: Partial<OfflineConfig>): void {
    this.offlineConfig = { ...this.offlineConfig, ...config };
  }

  /**
   * 更新推送配置
   */
  updatePushConfig(config: Partial<PushNotificationConfig>): void {
    this.pushConfig = { ...this.pushConfig, ...config };
  }

  /**
   * 获取配置
   */
  getConfig(): {
    offline: OfflineConfig;
    push: PushNotificationConfig;
  } {
    return {
      offline: { ...this.offlineConfig },
      push: { ...this.pushConfig },
    };
  }

  /**
   * 导出离线数据
   */
  exportOfflineData(): {
    data: OfflineData[];
    timestamp: Date;
    totalSize: number;
  } {
    return {
      data: this.offlineData,
      timestamp: new Date(),
      totalSize: this.estimateOfflineDataSize(),
    };
  }

  /**
   * 导入离线数据
   */
  importOfflineData(data: OfflineData[]): {
    success: boolean;
    imported: number;
    duplicates: number;
  } {
    let imported = 0;
    let duplicates = 0;

    for (const item of data) {
      // 检查是否已存在
      if (!this.offlineData.some(existing => existing.id === item.id)) {
        this.offlineData.push(item);
        imported++;
      } else {
        duplicates++;
      }
    }

    this.cleanupOfflineData();
    return {
      success: imported > 0,
      imported,
      duplicates,
    };
  }

  /**
   * 生成离线模式下的客户列表
   */
  generateOfflineCustomerList(): CustomerProfile[] {
    // 从离线数据中提取客户信息
    const customerData = this.offlineData.filter(item => item.type === 'customer');
    return customerData.map(item => item.data as CustomerProfile);
  }

  /**
   * 检查离线数据状态
   */
  checkOfflineDataStatus(): {
    totalItems: number;
    syncedItems: number;
    pendingItems: number;
    failedItems: number;
    estimatedSize: number;
  } {
    const totalItems = this.offlineData.length;
    const syncedItems = this.offlineData.filter(item => item.synced).length;
    const pendingItems = this.offlineData.filter(item => !item.synced && item.syncAttempts === 0).length;
    const failedItems = this.offlineData.filter(item => !item.synced && item.syncAttempts >= this.offlineConfig.retryAttempts).length;
    const estimatedSize = this.estimateOfflineDataSize();

    return {
      totalItems,
      syncedItems,
      pendingItems,
      failedItems,
      estimatedSize,
    };
  }

  /**
   * 检查通知状态
   */
  checkNotificationStatus(): {
    totalNotifications: number;
    unreadNotifications: number;
    notificationsByType: Record<NotificationType, number>;
  } {
    const totalNotifications = this.notifications.length;
    const unreadNotifications = this.notifications.filter(n => !n.read).length;
    const notificationsByType: Record<NotificationType, number> = {
      customer_update: 0,
      task_reminder: 0,
      sales_opportunity: 0,
      competitor_alert: 0,
      system_alert: 0,
    };

    this.notifications.forEach(notification => {
      notificationsByType[notification.type]++;
    });

    return {
      totalNotifications,
      unreadNotifications,
      notificationsByType,
    };
  }

  /**
   * 更新地理位置
   */
  updateLocation(latitude: number, longitude: number, accuracy: number): void {
    this.lastLocation = {
      latitude,
      longitude,
      accuracy,
      timestamp: new Date(),
    };
  }

  /**
   * 获取最后已知位置
   */
  getLastLocation(): Geolocation | null {
    return this.lastLocation;
  }

  /**
   * 记录语音通话
   */
  recordVoiceCall(customerId: string, duration: number, audioUrl: string, transcript: string, sentiment: 'positive' | 'negative' | 'neutral'): string {
    const recording: VoiceRecording = {
      id: uuidv4(),
      customerId,
      duration,
      audioUrl,
      transcript,
      sentiment,
      timestamp: new Date(),
      synced: false,
    };

    this.voiceRecordings.push(recording);
    this.cleanupVoiceRecordings();
    return recording.id;
  }

  /**
   * 获取语音记录
   */
  getVoiceRecordings(customerId?: string): VoiceRecording[] {
    if (customerId) {
      return this.voiceRecordings.filter(recording => recording.customerId === customerId);
    }
    return [...this.voiceRecordings];
  }

  /**
   * 清理语音记录
   */
  private cleanupVoiceRecordings(): void {
    // 只保留最近100条语音记录
    if (this.voiceRecordings.length > 100) {
      this.voiceRecordings = this.voiceRecordings
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 100);
    }
  }

  /**
   * 记录性能指标
   */
  recordPerformanceMetric(type: 'app_start' | 'api_response' | 'screen_load' | 'database_query', duration: number, context?: Record<string, any>): void {
    const metric: PerformanceMetric = {
      id: uuidv4(),
      type,
      duration,
      timestamp: new Date(),
      context: context || {},
    };

    this.performanceMetrics.push(metric);
    this.cleanupPerformanceMetrics();
  }

  /**
   * 获取性能指标
   */
  getPerformanceMetrics(type?: 'app_start' | 'api_response' | 'screen_load' | 'database_query'): PerformanceMetric[] {
    if (type) {
      return this.performanceMetrics.filter(metric => metric.type === type);
    }
    return [...this.performanceMetrics];
  }

  /**
   * 清理性能指标
   */
  private cleanupPerformanceMetrics(): void {
    // 只保留最近1000条性能指标
    if (this.performanceMetrics.length > 1000) {
      this.performanceMetrics = this.performanceMetrics
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 1000);
    }
  }

  /**
   * 获取性能统计
   */
  getPerformanceStats(): {
    averageAppStart: number;
    averageApiResponse: number;
    averageScreenLoad: number;
    averageDatabaseQuery: number;
    totalMetrics: number;
  } {
    const appStartMetrics = this.performanceMetrics.filter(m => m.type === 'app_start');
    const apiResponseMetrics = this.performanceMetrics.filter(m => m.type === 'api_response');
    const screenLoadMetrics = this.performanceMetrics.filter(m => m.type === 'screen_load');
    const databaseQueryMetrics = this.performanceMetrics.filter(m => m.type === 'database_query');

    const averageAppStart = appStartMetrics.length > 0
      ? appStartMetrics.reduce((sum, m) => sum + m.duration, 0) / appStartMetrics.length
      : 0;

    const averageApiResponse = apiResponseMetrics.length > 0
      ? apiResponseMetrics.reduce((sum, m) => sum + m.duration, 0) / apiResponseMetrics.length
      : 0;

    const averageScreenLoad = screenLoadMetrics.length > 0
      ? screenLoadMetrics.reduce((sum, m) => sum + m.duration, 0) / screenLoadMetrics.length
      : 0;

    const averageDatabaseQuery = databaseQueryMetrics.length > 0
      ? databaseQueryMetrics.reduce((sum, m) => sum + m.duration, 0) / databaseQueryMetrics.length
      : 0;

    return {
      averageAppStart,
      averageApiResponse,
      averageScreenLoad,
      averageDatabaseQuery,
      totalMetrics: this.performanceMetrics.length,
    };
  }

  /**
   * 优化移动应用性能
   */
  optimizePerformance(): {
    recommendations: string[];
    currentStats: {
      averageAppStart: number;
      averageApiResponse: number;
      averageScreenLoad: number;
      averageDatabaseQuery: number;
    };
  } {
    const stats = this.getPerformanceStats();
    const recommendations: string[] = [];

    if (stats.averageAppStart > 3000) {
      recommendations.push('优化应用启动时间，考虑延迟加载非必要资源');
    }

    if (stats.averageApiResponse > 1000) {
      recommendations.push('优化API响应时间，考虑使用缓存和批量请求');
    }

    if (stats.averageScreenLoad > 1500) {
      recommendations.push('优化屏幕加载时间，考虑分页加载和虚拟列表');
    }

    if (stats.averageDatabaseQuery > 500) {
      recommendations.push('优化数据库查询，考虑索引和查询优化');
    }

    return {
      recommendations,
      currentStats: {
        averageAppStart: stats.averageAppStart,
        averageApiResponse: stats.averageApiResponse,
        averageScreenLoad: stats.averageScreenLoad,
        averageDatabaseQuery: stats.averageDatabaseQuery,
      },
    };
  }

  /**
   * 生成移动应用报告
   */
  generateMobileReport(): {
    offlineStatus: {
      totalItems: number;
      syncedItems: number;
      pendingItems: number;
      failedItems: number;
      estimatedSize: number;
    };
    notificationStatus: {
      totalNotifications: number;
      unreadNotifications: number;
      notificationsByType: Record<NotificationType, number>;
    };
    performanceStats: {
      averageAppStart: number;
      averageApiResponse: number;
      averageScreenLoad: number;
      averageDatabaseQuery: number;
      totalMetrics: number;
    };
    voiceRecordingCount: number;
    lastLocation: Geolocation | null;
    timestamp: Date;
  } {
    return {
      offlineStatus: this.checkOfflineDataStatus(),
      notificationStatus: this.checkNotificationStatus(),
      performanceStats: this.getPerformanceStats(),
      voiceRecordingCount: this.voiceRecordings.length,
      lastLocation: this.lastLocation,
      timestamp: new Date(),
    };
  }
}

export default MobileEnhancementService;