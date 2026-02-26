import { PyWxDump } from './pywxdump';
import { getWeChatPathByPlatform } from './platforms';
import { WeChatMonitor } from './monitor';

/**
 * 微信聊天记录解密器
 */
export class WeChatDecryptor {
  private pywxdump: PyWxDump;
  private monitor: WeChatMonitor;

  constructor() {
    this.pywxdump = PyWxDump.getInstance();
    this.monitor = new WeChatMonitor();
  }

  /**
   * 获取微信数据路径
   * @param platform 平台类型
   */
  public getWeChatPath(platform: string = 'auto'): string | null {
    return getWeChatPathByPlatform(platform);
  }

  /**
   * 解密微信数据库
   * @param dbPath 数据库路径
   * @param outputPath 输出路径
   */
  public decryptDatabase(dbPath: string, outputPath: string): boolean {
    return this.pywxdump.decryptDatabase(dbPath, outputPath);
  }

  /**
   * 提取微信聊天记录
   * @param dbPath 解密后的数据库路径
   * @param outputPath 输出路径
   */
  public extractMessages(dbPath: string, outputPath: string): boolean {
    return this.pywxdump.extractMessages(dbPath, outputPath);
  }

  /**
   * 启动实时监控
   * @param wechatPath 微信数据路径
   * @param callback 回调函数
   */
  public startMonitor(wechatPath: string, callback: (messages: any[]) => void): void {
    this.monitor.start(wechatPath, callback);
  }

  /**
   * 停止实时监控
   */
  public stopMonitor(): void {
    this.monitor.stop();
  }
}

// 导出核心模块
export { PyWxDump } from './pywxdump';
export { getWeChatPathByPlatform } from './platforms';
export { WeChatMonitor } from './monitor';
