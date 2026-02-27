import { CustomerProfile } from '../../customer-profile/models';
import { v4 as uuidv4 } from 'uuid';

/**
 * 邮件服务类型
 */
export type EmailServiceType = 
  | 'gmail'
  | 'outlook'
  | 'exchange'
  | 'imap'
  | 'smtp'
  | 'custom';

/**
 * 邮件集成配置
 */
export interface EmailIntegrationConfig {
  service: EmailServiceType;
  username: string;
  password?: string;
  accessToken?: string;
  imapServer?: string;
  smtpServer?: string;
  imapPort?: number;
  smtpPort?: number;
  useSSL: boolean;
  syncInterval: number; // 同步间隔（分钟）
  enabled: boolean;
  syncFields: string[];
  folders: string[];
}

/**
 * 邮件
 */
export interface Email {
  id: string;
  from: string;
  to: string[];
  cc: string[];
  bcc: string[];
  subject: string;
  body: string;
  htmlBody?: string;
  attachments: EmailAttachment[];
  timestamp: Date;
  folder: string;
  read: boolean;
  importance: 'low' | 'normal' | 'high';
  sentiment: 'positive' | 'negative' | 'neutral';
}

/**
 * 邮件附件
 */
export interface EmailAttachment {
  id: string;
  filename: string;
  size: number;
  contentType: string;
  content?: string;
}

/**
 * 邮件线程
 */
export interface EmailThread {
  id: string;
  subject: string;
  emails: Email[];
  participants: string[];
  startDate: Date;
  lastActivity: Date;
  unreadCount: number;
}

/**
 * 邮件集成服务
 */
export class EmailIntegrationService {
  private integrations: Map<string, EmailIntegration> = new Map();

  /**
   * 添加邮件集成
   */
  addIntegration(config: EmailIntegrationConfig): string {
    const integrationId = uuidv4();
    const integration = this.createIntegration(config, integrationId);
    this.integrations.set(integrationId, integration);
    return integrationId;
  }

  /**
   * 更新邮件集成
   */
  updateIntegration(id: string, config: Partial<EmailIntegrationConfig>): boolean {
    const integration = this.integrations.get(id);
    if (integration) {
      integration.updateConfig(config);
      return true;
    }
    return false;
  }

  /**
   * 删除邮件集成
   */
  removeIntegration(id: string): boolean {
    return this.integrations.delete(id);
  }

  /**
   * 获取所有邮件集成
   */
  getIntegrations(): Array<{ id: string; config: EmailIntegrationConfig; status: any }> {
    const result = [];
    for (const [id, integration] of this.integrations.entries()) {
      result.push({
        id,
        config: integration.getConfig(),
        status: integration.getStatus(),
      });
    }
    return result;
  }

  /**
   * 同步邮件数据
   */
  async syncData(integrationId: string): Promise<{
    success: boolean;
    syncedEmails: number;
    error: string | null;
  }> {
    const integration = this.integrations.get(integrationId);
    if (!integration) {
      return {
        success: false,
        syncedEmails: 0,
        error: 'Integration not found',
      };
    }

    try {
      const result = await integration.sync();
      return {
        success: true,
        syncedEmails: result,
        error: null,
      };
    } catch (error) {
      return {
        success: false,
        syncedEmails: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 获取邮件
   */
  async getEmails(integrationId: string, folder: string = 'inbox', limit: number = 20): Promise<Email[]> {
    const integration = this.integrations.get(integrationId);
    if (!integration) {
      return [];
    }

    try {
      return await integration.getEmails(folder, limit);
    } catch (error) {
      console.error('Error getting emails:', error);
      return [];
    }
  }

  /**
   * 获取邮件线程
   */
  async getThreads(integrationId: string, limit: number = 10): Promise<EmailThread[]> {
    const integration = this.integrations.get(integrationId);
    if (!integration) {
      return [];
    }

    try {
      return await integration.getThreads(limit);
    } catch (error) {
      console.error('Error getting threads:', error);
      return [];
    }
  }

  /**
   * 发送邮件
   */
  async sendEmail(integrationId: string, email: {
    to: string[];
    cc?: string[];
    bcc?: string[];
    subject: string;
    body: string;
    htmlBody?: string;
    attachments?: EmailAttachment[];
  }): Promise<{
    success: boolean;
    messageId: string | null;
    error: string | null;
  }> {
    const integration = this.integrations.get(integrationId);
    if (!integration) {
      return {
        success: false,
        messageId: null,
        error: 'Integration not found',
      };
    }

    try {
      const messageId = await integration.sendEmail(email);
      return {
        success: true,
        messageId,
        error: null,
      };
    } catch (error) {
      return {
        success: false,
        messageId: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 分析邮件情感
   */
  analyzeEmailSentiment(content: string): 'positive' | 'negative' | 'neutral' {
    // 简单的情感分析逻辑，实际应该使用AI模型
    const positiveWords = ['好', '棒', '优秀', '喜欢', '满意', '赞', 'great', 'good', 'excellent', 'thanks', 'thank you'];
    const negativeWords = ['差', '糟糕', '失望', '讨厌', '不满', 'bad', 'terrible', 'disappointed', 'problem', 'issue'];

    let positiveScore = 0;
    let negativeScore = 0;

    positiveWords.forEach(word => {
      if (content.toLowerCase().includes(word.toLowerCase())) positiveScore++;
    });

    negativeWords.forEach(word => {
      if (content.toLowerCase().includes(word.toLowerCase())) negativeScore++;
    });

    if (positiveScore > negativeScore) return 'positive';
    if (negativeScore > positiveScore) return 'negative';
    return 'neutral';
  }

  /**
   * 与客户画像集成
   */
  integrateWithCustomerProfile(profile: CustomerProfile, emailData: {
    emails: Email[];
    threads: EmailThread[];
  }): CustomerProfile {
    // 集成邮件数据到客户画像
    const updatedProfile = { ...profile };

    // 添加邮件交互到交互历史
    if (!updatedProfile.interactions) {
      updatedProfile.interactions = [];
    }

    emailData.emails.forEach(email => {
      // 检查邮件是否与客户相关
      const isFromCustomer = email.from.includes(profile.email || '');
      const isToCustomer = email.to.some(to => to.includes(profile.email || ''));

      if (isFromCustomer || isToCustomer) {
        updatedProfile.interactions!.push({
          id: uuidv4(),
          type: 'email',
          content: email.subject,
          timestamp: email.timestamp,
          direction: isFromCustomer ? 'inbound' : 'outbound',
          sentiment: email.sentiment,
          tags: [],
        });
      }
    });

    // 更新客户沟通频率
    const emailCount = emailData.emails.filter(email => 
      email.from.includes(profile.email || '') || 
      email.to.some(to => to.includes(profile.email || ''))
    ).length;

    if (emailCount > 0) {
      updatedProfile.engagementScore = (updatedProfile.engagementScore || 0) + emailCount;
    }

    // 从邮件内容中提取关键词作为兴趣和标签
    if (!updatedProfile.interests) {
      updatedProfile.interests = [];
    }

    if (!updatedProfile.tags) {
      updatedProfile.tags = [];
    }

    emailData.emails.forEach(email => {
      const keywords = this.extractKeywords(email.subject + ' ' + email.body);
      keywords.forEach(keyword => {
        if (!updatedProfile.interests!.includes(keyword) && keyword.length > 2) {
          updatedProfile.interests!.push(keyword);
        }
        if (!updatedProfile.tags!.includes(keyword) && keyword.length > 2) {
          updatedProfile.tags!.push(keyword);
        }
      });
    });

    return updatedProfile;
  }

  /**
   * 提取关键词
   */
  private extractKeywords(content: string): string[] {
    // 简单的关键词提取逻辑，实际应该使用更复杂的NLP技术
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'from', 'as', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'shall', 'should', 'can', 'could', 'may', 'might', 'must', '我', '你', '他', '她', '它', '我们', '你们', '他们', '这', '那', '的', '了', '在', '是', '有', '和', '就', '不', '人', '都', '一', '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好', '自己', '这'];
    
    return content
      .toLowerCase()
      .replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 1 && !stopWords.includes(word))
      .slice(0, 10); // 只取前10个关键词
  }

  /**
   * 创建邮件集成实例
   */
  private createIntegration(config: EmailIntegrationConfig, id: string): EmailIntegration {
    switch (config.service) {
      case 'gmail':
        return new GmailIntegration(config, id);
      case 'outlook':
        return new OutlookIntegration(config, id);
      case 'exchange':
        return new ExchangeIntegration(config, id);
      case 'imap':
        return new IMAPIntegration(config, id);
      case 'smtp':
        return new SMTPIntegration(config, id);
      default:
        return new CustomEmailIntegration(config, id);
    }
  }
}

/**
 * 邮件集成基类
 */
export abstract class EmailIntegration {
  protected config: EmailIntegrationConfig;
  protected id: string;
  protected status: {
    connected: boolean;
    lastSync: Date | null;
    nextSync: Date | null;
    syncCount: number;
    error: string | null;
  };

  constructor(config: EmailIntegrationConfig, id: string) {
    this.config = config;
    this.id = id;
    this.status = {
      connected: false,
      lastSync: null,
      nextSync: null,
      syncCount: 0,
      error: null,
    };
  }

  /**
   * 获取配置
   */
  getConfig(): EmailIntegrationConfig {
    return { ...this.config };
  }

  /**
   * 获取状态
   */
  getStatus(): any {
    return { ...this.status };
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<EmailIntegrationConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 同步数据
   */
  abstract sync(): Promise<number>;

  /**
   * 获取邮件
   */
  abstract getEmails(folder: string, limit: number): Promise<Email[]>;

  /**
   * 获取邮件线程
   */
  abstract getThreads(limit: number): Promise<EmailThread[]>;

  /**
   * 发送邮件
   */
  abstract sendEmail(email: {
    to: string[];
    cc?: string[];
    bcc?: string[];
    subject: string;
    body: string;
    htmlBody?: string;
    attachments?: EmailAttachment[];
  }): Promise<string>;

  /**
   * 测试连接
   */
  abstract testConnection(): Promise<boolean>;

  /**
   * 更新状态
   */
  protected updateStatus(status: Partial<typeof this.status>): void {
    this.status = { ...this.status, ...status };
  }
}

/**
 * Gmail集成
 */
export class GmailIntegration extends EmailIntegration {
  async sync(): Promise<number> {
    // 模拟Gmail API调用
    console.log('Syncing with Gmail');
    this.updateStatus({
      connected: true,
      lastSync: new Date(),
      nextSync: new Date(Date.now() + this.config.syncInterval * 60 * 1000),
      syncCount: this.status.syncCount + 1,
      error: null,
    });
    return 20; // 模拟同步20封邮件
  }

  async getEmails(folder: string, limit: number): Promise<Email[]> {
    // 模拟获取Gmail邮件
    return [
      {
        id: uuidv4(),
        from: 'customer@example.com',
        to: ['user@example.com'],
        cc: [],
        bcc: [],
        subject: '关于产品咨询',
        body: '您好，我对贵公司的产品很感兴趣，想了解更多详情。',
        htmlBody: '<p>您好，我对贵公司的产品很感兴趣，想了解更多详情。</p>',
        attachments: [],
        timestamp: new Date(),
        folder: folder,
        read: false,
        importance: 'normal',
        sentiment: 'positive',
      },
    ];
  }

  async getThreads(limit: number): Promise<EmailThread[]> {
    // 模拟获取邮件线程
    return [
      {
        id: uuidv4(),
        subject: '关于产品咨询',
        emails: [
          {
            id: uuidv4(),
            from: 'customer@example.com',
            to: ['user@example.com'],
            cc: [],
            bcc: [],
            subject: '关于产品咨询',
            body: '您好，我对贵公司的产品很感兴趣，想了解更多详情。',
            attachments: [],
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
            folder: 'inbox',
            read: true,
            importance: 'normal',
            sentiment: 'positive',
          },
          {
            id: uuidv4(),
            from: 'user@example.com',
            to: ['customer@example.com'],
            cc: [],
            bcc: [],
            subject: 'Re: 关于产品咨询',
            body: '您好，很高兴收到您的咨询。我们的产品具有以下特点...',
            attachments: [],
            timestamp: new Date(),
            folder: 'sent',
            read: false,
            importance: 'normal',
            sentiment: 'positive',
          },
        ],
        participants: ['customer@example.com', 'user@example.com'],
        startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
        lastActivity: new Date(),
        unreadCount: 1,
      },
    ];
  }

  async sendEmail(email: {
    to: string[];
    cc?: string[];
    bcc?: string[];
    subject: string;
    body: string;
    htmlBody?: string;
    attachments?: EmailAttachment[];
  }): Promise<string> {
    // 模拟发送邮件
    console.log('Sending email via Gmail:', email.subject);
    return uuidv4();
  }

  async testConnection(): Promise<boolean> {
    // 模拟测试连接
    return !!(this.config.accessToken || (this.config.username && this.config.password));
  }
}

/**
 * Outlook集成
 */
export class OutlookIntegration extends EmailIntegration {
  async sync(): Promise<number> {
    // 模拟Outlook API调用
    console.log('Syncing with Outlook');
    this.updateStatus({
      connected: true,
      lastSync: new Date(),
      nextSync: new Date(Date.now() + this.config.syncInterval * 60 * 1000),
      syncCount: this.status.syncCount + 1,
      error: null,
    });
    return 15; // 模拟同步15封邮件
  }

  async getEmails(folder: string, limit: number): Promise<Email[]> {
    // 模拟获取Outlook邮件
    return [
      {
        id: uuidv4(),
        from: 'client@example.com',
        to: ['user@example.com'],
        cc: [],
        bcc: [],
        subject: '会议安排',
        body: '您好，我们想安排一次会议讨论合作事宜。',
        htmlBody: '<p>您好，我们想安排一次会议讨论合作事宜。</p>',
        attachments: [],
        timestamp: new Date(),
        folder: folder,
        read: false,
        importance: 'normal',
        sentiment: 'neutral',
      },
    ];
  }

  async getThreads(limit: number): Promise<EmailThread[]> {
    // 模拟获取邮件线程
    return [
      {
        id: uuidv4(),
        subject: '会议安排',
        emails: [
          {
            id: uuidv4(),
            from: 'client@example.com',
            to: ['user@example.com'],
            cc: [],
            bcc: [],
            subject: '会议安排',
            body: '您好，我们想安排一次会议讨论合作事宜。',
            attachments: [],
            timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000),
            folder: 'inbox',
            read: true,
            importance: 'normal',
            sentiment: 'neutral',
          },
          {
            id: uuidv4(),
            from: 'user@example.com',
            to: ['client@example.com'],
            cc: [],
            bcc: [],
            subject: 'Re: 会议安排',
            body: '您好，我们可以在下周安排会议。请问您什么时候方便？',
            attachments: [],
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
            folder: 'sent',
            read: false,
            importance: 'normal',
            sentiment: 'neutral',
          },
        ],
        participants: ['client@example.com', 'user@example.com'],
        startDate: new Date(Date.now() - 48 * 60 * 60 * 1000),
        lastActivity: new Date(Date.now() - 24 * 60 * 60 * 1000),
        unreadCount: 1,
      },
    ];
  }

  async sendEmail(email: {
    to: string[];
    cc?: string[];
    bcc?: string[];
    subject: string;
    body: string;
    htmlBody?: string;
    attachments?: EmailAttachment[];
  }): Promise<string> {
    // 模拟发送邮件
    console.log('Sending email via Outlook:', email.subject);
    return uuidv4();
  }

  async testConnection(): Promise<boolean> {
    // 模拟测试连接
    return !!(this.config.accessToken || (this.config.username && this.config.password));
  }
}

/**
 * Exchange集成
 */
export class ExchangeIntegration extends EmailIntegration {
  async sync(): Promise<number> {
    // 模拟Exchange API调用
    console.log('Syncing with Exchange');
    this.updateStatus({
      connected: true,
      lastSync: new Date(),
      nextSync: new Date(Date.now() + this.config.syncInterval * 60 * 1000),
      syncCount: this.status.syncCount + 1,
      error: null,
    });
    return 25; // 模拟同步25封邮件
  }

  async getEmails(folder: string, limit: number): Promise<Email[]> {
    // 模拟获取Exchange邮件
    return [
      {
        id: uuidv4(),
        from: 'partner@example.com',
        to: ['user@example.com'],
        cc: ['manager@example.com'],
        bcc: [],
        subject: '合作协议',
        body: '您好，请查收最新的合作协议草案。',
        htmlBody: '<p>您好，请查收最新的合作协议草案。</p>',
        attachments: [
          {
            id: uuidv4(),
            filename: '合作协议.pdf',
            size: 1024000,
            contentType: 'application/pdf',
          },
        ],
        timestamp: new Date(),
        folder: folder,
        read: false,
        importance: 'high',
        sentiment: 'neutral',
      },
    ];
  }

  async getThreads(limit: number): Promise<EmailThread[]> {
    // 模拟获取邮件线程
    return [
      {
        id: uuidv4(),
        subject: '合作协议',
        emails: [
          {
            id: uuidv4(),
            from: 'partner@example.com',
            to: ['user@example.com'],
            cc: ['manager@example.com'],
            bcc: [],
            subject: '合作协议',
            body: '您好，请查收最新的合作协议草案。',
            attachments: [
              {
                id: uuidv4(),
                filename: '合作协议.pdf',
                size: 1024000,
                contentType: 'application/pdf',
              },
            ],
            timestamp: new Date(),
            folder: 'inbox',
            read: false,
            importance: 'high',
            sentiment: 'neutral',
          },
        ],
        participants: ['partner@example.com', 'user@example.com', 'manager@example.com'],
        startDate: new Date(),
        lastActivity: new Date(),
        unreadCount: 1,
      },
    ];
  }

  async sendEmail(email: {
    to: string[];
    cc?: string[];
    bcc?: string[];
    subject: string;
    body: string;
    htmlBody?: string;
    attachments?: EmailAttachment[];
  }): Promise<string> {
    // 模拟发送邮件
    console.log('Sending email via Exchange:', email.subject);
    return uuidv4();
  }

  async testConnection(): Promise<boolean> {
    // 模拟测试连接
    return !!(this.config.username && this.config.password);
  }
}

/**
 * IMAP集成
 */
export class IMAPIntegration extends EmailIntegration {
  async sync(): Promise<number> {
    // 模拟IMAP同步
    console.log('Syncing with IMAP');
    this.updateStatus({
      connected: true,
      lastSync: new Date(),
      nextSync: new Date(Date.now() + this.config.syncInterval * 60 * 1000),
      syncCount: this.status.syncCount + 1,
      error: null,
    });
    return 10; // 模拟同步10封邮件
  }

  async getEmails(folder: string, limit: number): Promise<Email[]> {
    // 模拟获取IMAP邮件
    return [
      {
        id: uuidv4(),
        from: 'user@example.com',
        to: ['recipient@example.com'],
        cc: [],
        bcc: [],
        subject: '测试邮件',
        body: '这是一封测试邮件。',
        attachments: [],
        timestamp: new Date(),
        folder: folder,
        read: true,
        importance: 'normal',
        sentiment: 'neutral',
      },
    ];
  }

  async getThreads(limit: number): Promise<EmailThread[]> {
    // 模拟获取邮件线程
    return [
      {
        id: uuidv4(),
        subject: '测试邮件',
        emails: [
          {
            id: uuidv4(),
            from: 'user@example.com',
            to: ['recipient@example.com'],
            cc: [],
            bcc: [],
            subject: '测试邮件',
            body: '这是一封测试邮件。',
            attachments: [],
            timestamp: new Date(),
            folder: 'sent',
            read: true,
            importance: 'normal',
            sentiment: 'neutral',
          },
        ],
        participants: ['user@example.com', 'recipient@example.com'],
        startDate: new Date(),
        lastActivity: new Date(),
        unreadCount: 0,
      },
    ];
  }

  async sendEmail(email: {
    to: string[];
    cc?: string[];
    bcc?: string[];
    subject: string;
    body: string;
    htmlBody?: string;
    attachments?: EmailAttachment[];
  }): Promise<string> {
    // 模拟发送邮件
    console.log('Sending email via IMAP/SMTP:', email.subject);
    return uuidv4();
  }

  async testConnection(): Promise<boolean> {
    // 模拟测试连接
    return !!(this.config.username && this.config.password && this.config.imapServer);
  }
}

/**
 * SMTP集成
 */
export class SMTPIntegration extends EmailIntegration {
  async sync(): Promise<number> {
    // SMTP主要用于发送邮件，同步功能有限
    console.log('Syncing with SMTP');
    this.updateStatus({
      connected: true,
      lastSync: new Date(),
      nextSync: new Date(Date.now() + this.config.syncInterval * 60 * 1000),
      syncCount: this.status.syncCount + 1,
      error: null,
    });
    return 0; // 模拟同步0封邮件
  }

  async getEmails(folder: string, limit: number): Promise<Email[]> {
    // SMTP不支持获取邮件
    return [];
  }

  async getThreads(limit: number): Promise<EmailThread[]> {
    // SMTP不支持获取邮件线程
    return [];
  }

  async sendEmail(email: {
    to: string[];
    cc?: string[];
    bcc?: string[];
    subject: string;
    body: string;
    htmlBody?: string;
    attachments?: EmailAttachment[];
  }): Promise<string> {
    // 模拟发送邮件
    console.log('Sending email via SMTP:', email.subject);
    return uuidv4();
  }

  async testConnection(): Promise<boolean> {
    // 模拟测试连接
    return !!(this.config.username && this.config.password && this.config.smtpServer);
  }
}

/**
 * 自定义邮件集成
 */
export class CustomEmailIntegration extends EmailIntegration {
  async sync(): Promise<number> {
    // 模拟自定义邮件服务同步
    console.log('Syncing with custom email service');
    this.updateStatus({
      connected: true,
      lastSync: new Date(),
      nextSync: new Date(Date.now() + this.config.syncInterval * 60 * 1000),
      syncCount: this.status.syncCount + 1,
      error: null,
    });
    return 5; // 模拟同步5封邮件
  }

  async getEmails(folder: string, limit: number): Promise<Email[]> {
    // 模拟获取自定义邮件服务邮件
    return [
      {
        id: uuidv4(),
        from: 'custom@example.com',
        to: ['user@example.com'],
        cc: [],
        bcc: [],
        subject: '自定义邮件',
        body: '这是一封来自自定义邮件服务的邮件。',
        attachments: [],
        timestamp: new Date(),
        folder: folder,
        read: false,
        importance: 'normal',
        sentiment: 'neutral',
      },
    ];
  }

  async getThreads(limit: number): Promise<EmailThread[]> {
    // 模拟获取邮件线程
    return [
      {
        id: uuidv4(),
        subject: '自定义邮件',
        emails: [
          {
            id: uuidv4(),
            from: 'custom@example.com',
            to: ['user@example.com'],
            cc: [],
            bcc: [],
            subject: '自定义邮件',
            body: '这是一封来自自定义邮件服务的邮件。',
            attachments: [],
            timestamp: new Date(),
            folder: 'inbox',
            read: false,
            importance: 'normal',
            sentiment: 'neutral',
          },
        ],
        participants: ['custom@example.com', 'user@example.com'],
        startDate: new Date(),
        lastActivity: new Date(),
        unreadCount: 1,
      },
    ];
  }

  async sendEmail(email: {
    to: string[];
    cc?: string[];
    bcc?: string[];
    subject: string;
    body: string;
    htmlBody?: string;
    attachments?: EmailAttachment[];
  }): Promise<string> {
    // 模拟发送邮件
    console.log('Sending email via custom service:', email.subject);
    return uuidv4();
  }

  async testConnection(): Promise<boolean> {
    // 模拟测试连接
    return true;
  }
}

export default EmailIntegrationService;