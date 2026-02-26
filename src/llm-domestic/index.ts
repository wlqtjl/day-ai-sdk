import { BaseLLM, LLMClient, ModelConfig, Message } from './base';
import { DoubaoClient } from './doubao';
import { QianwenClient } from './qianwen';
import { XinghuoClient } from './xinghuo';
import { GLMClient } from './glm';
import { MultiModelManager, ModelType } from './multi-model';

/**
 * 国内大模型管理类
 */
export class DomesticLLM {
  private multiModelManager: MultiModelManager;

  constructor() {
    this.multiModelManager = new MultiModelManager();
  }

  /**
   * 注册豆包模型
   * @param config 模型配置
   */
  public registerDoubao(config: ModelConfig): void {
    this.multiModelManager.registerModel('doubao', config);
  }

  /**
   * 注册千问模型
   * @param config 模型配置
   */
  public registerQianwen(config: ModelConfig): void {
    this.multiModelManager.registerModel('qianwen', config);
  }

  /**
   * 注册讯飞星火模型
   * @param config 模型配置
   */
  public registerXinghuo(config: ModelConfig): void {
    this.multiModelManager.registerModel('xinghuo', config);
  }

  /**
   * 注册智谱GLM模型
   * @param config 模型配置
   */
  public registerGLM(config: ModelConfig): void {
    this.multiModelManager.registerModel('glm', config);
  }

  /**
   * 设置默认模型
   * @param modelType 模型类型
   */
  public setDefaultModel(modelType: ModelType): void {
    this.multiModelManager.setDefaultModel(modelType);
  }

  /**
   * 聊天接口
   * @param messages 消息列表
   * @param tools 工具列表
   * @param stream 是否流式输出
   * @param modelType 模型类型
   */
  async chat(
    messages: Message[],
    tools?: any[],
    stream: boolean = false,
    modelType?: ModelType
  ): Promise<any> {
    return this.multiModelManager.chat(messages, tools, stream, modelType);
  }

  /**
   * 流式聊天接口
   * @param messages 消息列表
   * @param tools 工具列表
   * @param callback 回调函数
   * @param modelType 模型类型
   */
  async streamChat(
    messages: Message[],
    tools?: any[],
    callback?: (chunk: any) => void,
    modelType?: ModelType
  ): Promise<any> {
    return this.multiModelManager.streamChat(messages, tools, callback, modelType);
  }

  /**
   * 生成接口
   * @param prompt 提示词
   * @param stream 是否流式输出
   * @param modelType 模型类型
   */
  async generate(
    prompt: string,
    stream: boolean = false,
    modelType?: ModelType
  ): Promise<any> {
    return this.multiModelManager.generate(prompt, stream, modelType);
  }

  /**
   * 根据任务类型选择模型
   * @param taskType 任务类型
   */
  public selectModelByTask(taskType: string): ModelType {
    return this.multiModelManager.selectModelByTask(taskType);
  }

  /**
   * 多模型投票
   * @param messages 消息列表
   * @param tools 工具列表
   */
  async multiModelVote(
    messages: Message[],
    tools?: any[]
  ): Promise<any> {
    return this.multiModelManager.multiModelVote(messages, tools);
  }
}

// 导出核心模块
export {
  BaseLLM,
  LLMClient,
  ModelConfig,
  Message,
  DoubaoClient,
  QianwenClient,
  XinghuoClient,
  GLMClient,
  MultiModelManager,
  ModelType
};
