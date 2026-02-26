import os from 'os';
import fs from 'fs';
import path from 'path';

/**
 * 根据平台获取微信数据路径
 * @param platform 平台类型 (auto, darwin, win32, android, ios)
 */
export function getWeChatPathByPlatform(platform: string = 'auto'): string | null {
  const detectedPlatform = platform === 'auto' ? os.platform() : platform;

  switch (detectedPlatform) {
    case 'darwin': // macOS
      return getWeChatPathMacOS();
    case 'win32': // Windows
      return getWeChatPathWindows();
    case 'android': // Android
      return getWeChatPathAndroid();
    case 'ios': // iOS
      return getWeChatPathiOS();
    default:
      console.error(`Unsupported platform: ${detectedPlatform}`);
      return null;
  }
}

/**
 * 获取 macOS 平台的微信数据路径
 */
function getWeChatPathMacOS(): string | null {
  const homeDir = os.homedir();
  const possiblePaths = [
    path.join(homeDir, 'Library', 'Containers', 'com.tencent.xinWeChat', 'Data', 'Library', 'Application Support', 'com.tencent.xinWeChat'),
    path.join(homeDir, 'Documents', 'WeChat Files')
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }

  return null;
}

/**
 * 获取 Windows 平台的微信数据路径
 */
function getWeChatPathWindows(): string | null {
  const homeDir = os.homedir();
  const possiblePaths = [
    path.join(homeDir, 'Documents', 'WeChat Files'),
    path.join(process.env.APPDATA || '', 'Tencent', 'WeChat')
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }

  return null;
}

/**
 * 获取 Android 平台的微信数据路径
 */
function getWeChatPathAndroid(): string | null {
  const possiblePaths = [
    '/sdcard/tencent/micromsg',
    '/storage/emulated/0/tencent/micromsg',
    '/Android/data/com.tencent.mm/MicroMsg'
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }

  return null;
}

/**
 * 获取 iOS 平台的微信数据路径
 */
function getWeChatPathiOS(): string | null {
  // iOS 是封闭系统，无法直接访问文件系统
  // 需要通过第三方工具或iTunes备份获取
  console.warn('iOS系统无法直接访问微信数据，需要通过iTunes或第三方工具导出');
  return null;
}

/**
 * 检测平台类型
 */
export function detectPlatform(): string {
  return os.platform();
}
