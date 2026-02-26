import fs from 'fs';
import path from 'path';

/**
 * 微信数据库监控器
 */
export class WeChatMonitor {
  private watchers: fs.FSWatcher[] = [];
  private isMonitoring: boolean = false;

  /**
   * 启动监控
   * @param wechatPath 微信数据路径
   * @param callback 回调函数
   */
  public start(wechatPath: string, callback: (messages: any[]) => void): void {
    if (this.isMonitoring) {
      console.warn('Monitor is already running');
      return;
    }

    this.isMonitoring = true;
    console.log(`Starting WeChat monitor for path: ${wechatPath}`);

    // 监控微信数据库文件
    this.monitorDatabaseFiles(wechatPath, callback);
  }

  /**
   * 停止监控
   */
  public stop(): void {
    if (!this.isMonitoring) {
      console.warn('Monitor is not running');
      return;
    }

    // 关闭所有监控器
    this.watchers.forEach(watcher => {
      watcher.close();
    });

    this.watchers = [];
    this.isMonitoring = false;
    console.log('WeChat monitor stopped');
  }

  /**
   * 监控数据库文件
   * @param wechatPath 微信数据路径
   * @param callback 回调函数
   */
  private monitorDatabaseFiles(wechatPath: string, callback: (messages: any[]) => void): void {
    // 查找微信数据库文件
    const dbPaths = this.findDatabaseFiles(wechatPath);

    dbPaths.forEach(dbPath => {
      console.log(`Monitoring database file: ${dbPath}`);

      // 创建文件监控器
      const watcher = fs.watch(dbPath, (eventType, filename) => {
        if (eventType === 'change' && filename) {
          console.log(`Database file changed: ${filename}`);
          // 这里可以实现增量读取和解析
          // 暂时返回模拟数据
          const mockMessages = this.getMockMessages();
          callback(mockMessages);
        }
      });

      this.watchers.push(watcher);
    });
  }

  /**
   * 查找数据库文件
   * @param wechatPath 微信数据路径
   */
  private findDatabaseFiles(wechatPath: string): string[] {
    const dbFiles: string[] = [];

    try {
      // 遍历微信数据目录
      const entries = fs.readdirSync(wechatPath, { withFileTypes: true });

      entries.forEach(entry => {
        const fullPath = path.join(wechatPath, entry.name);

        if (entry.isDirectory()) {
          // 检查是否是用户目录（通常是很长的字符串）
          if (entry.name.length > 20) {
            const dbPath = path.join(fullPath, 'Msg', 'Msg.db');
            if (fs.existsSync(dbPath)) {
              dbFiles.push(dbPath);
            }
          }
          // 递归查找
          const subDbFiles = this.findDatabaseFiles(fullPath);
          dbFiles.push(...subDbFiles);
        }
      });
    } catch (error) {
      console.error('Error finding database files:', error);
    }

    return dbFiles;
  }

  /**
   * 获取模拟消息数据
   */
  private getMockMessages(): any[] {
    return [
      {
        id: `msg_${Date.now()}`,
        content: '这是一条新消息',
        sender: '张三',
        timestamp: new Date().toISOString(),
        type: 'text'
      }
    ];
  }
}
