import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { DayAIService } from './DayAIService';

/**
 * 语音记录服务 - 支持隐蔽录音和AI分析
 */
export class VoiceRecordService {
  private sound: Audio.Sound | null = null;
  private recording: Audio.Recording | null = null;
  private isRecording: boolean = false;
  private dayAIService: DayAIService;

  constructor() {
    this.dayAIService = new DayAIService();
    this.initializeAudio();
  }

  /**
   * 初始化音频系统
   */
  private async initializeAudio() {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      });
    } catch (error) {
      console.error('Error initializing audio:', error);
    }
  }

  /**
   * 开始隐蔽录音
   */
  async startRecording(): Promise<boolean> {
    try {
      // 停止任何正在播放的声音
      if (this.sound) {
        await this.sound.unloadAsync();
      }

      // 准备录音
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      });

      // 创建录音实例
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      this.recording = recording;
      this.isRecording = true;
      console.log('Recording started silently');
      return true;
    } catch (error) {
      console.error('Error starting recording:', error);
      return false;
    }
  }

  /**
   * 停止录音
   */
  async stopRecording(): Promise<string | null> {
    try {
      if (!this.recording) {
        return null;
      }

      this.isRecording = false;
      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();
      this.recording = null;

      // 重置音频模式
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      console.log('Recording stopped, URI:', uri);
      return uri;
    } catch (error) {
      console.error('Error stopping recording:', error);
      return null;
    }
  }

  /**
   * 分析录音内容
   */
  async analyzeRecording(uri: string): Promise<{
    transcript: string;
    keyPoints: string[];
    customerNeeds: string[];
    projectDetails: string[];
  } | null> {
    try {
      // 读取录音文件
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists) {
        console.error('Recording file not found');
        return null;
      }

      // 这里可以添加语音转文本的逻辑
      // 暂时使用模拟数据
      const transcript = '客户需要一个新的CRM系统，预算大约50万，希望在3个月内完成实施。项目负责人是张总，联系方式是13800138000。';

      // 使用Day AI分析内容
      const analysis = await this.dayAIService.analyzeVoiceContent(transcript);
      return analysis;
    } catch (error) {
      console.error('Error analyzing recording:', error);
      return null;
    }
  }

  /**
   * 检查是否正在录音
   */
  getIsRecording(): boolean {
    return this.isRecording;
  }

  /**
   * 清理资源
   */
  async cleanup() {
    try {
      if (this.recording) {
        await this.recording.stopAndUnloadAsync();
        this.recording = null;
      }
      if (this.sound) {
        await this.sound.unloadAsync();
        this.sound = null;
      }
    } catch (error) {
      console.error('Error cleaning up:', error);
    }
  }
}

export default VoiceRecordService;