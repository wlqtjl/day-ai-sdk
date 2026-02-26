import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

/**
 * PyWxDump 工具集成
 */
export class PyWxDump {
  private static instance: PyWxDump;
  private pywxdumpPath: string;

  private constructor() {
    this.pywxdumpPath = this.findPyWxDump();
  }

  /**
   * 获取 PyWxDump 实例
   */
  public static getInstance(): PyWxDump {
    if (!PyWxDump.instance) {
      PyWxDump.instance = new PyWxDump();
    }
    return PyWxDump.instance;
  }

  /**
   * 查找或安装 PyWxDump
   */
  private findPyWxDump(): string {
    // 检查是否已安装 PyWxDump
    try {
      execSync('python3 -c "import pywxdump"', { stdio: 'ignore' });
      return 'pywxdump';
    } catch (error) {
      // 安装 PyWxDump
      this.installPyWxDump();
      return 'pywxdump';
    }
  }

  /**
   * 安装 PyWxDump
   */
  private installPyWxDump(): void {
    console.log('Installing PyWxDump...');
    try {
      execSync('pip3 install pywxdump', { stdio: 'inherit' });
      console.log('PyWxDump installed successfully');
    } catch (error) {
      console.error('Failed to install PyWxDump:', error);
      throw new Error('Failed to install PyWxDump');
    }
  }

  /**
   * 解密微信数据库
   * @param dbPath 数据库路径
   * @param outputPath 输出路径
   */
  public decryptDatabase(dbPath: string, outputPath: string): boolean {
    try {
      console.log(`Decrypting WeChat database: ${dbPath}`);
      execSync(`python3 -m pywxdump decrypt -i ${dbPath} -o ${outputPath}`, { stdio: 'inherit' });
      return true;
    } catch (error) {
      console.error('Failed to decrypt database:', error);
      return false;
    }
  }

  /**
   * 提取微信聊天记录
   * @param dbPath 解密后的数据库路径
   * @param outputPath 输出路径
   */
  public extractMessages(dbPath: string, outputPath: string): boolean {
    try {
      console.log(`Extracting messages from database: ${dbPath}`);
      execSync(`python3 -m pywxdump extract -i ${dbPath} -o ${outputPath}`, { stdio: 'inherit' });
      return true;
    } catch (error) {
      console.error('Failed to extract messages:', error);
      return false;
    }
  }
}