import { LLMClient, Message, ModelConfig } from './base';
import { DoubaoClient } from './doubao';
import { QianwenClient } from './qianwen';
import { XinghuoClient } from './xinghuo';
import { GLMClient } from './glm';

/**
 * 模型类型
 */
export type ModelType = 'doubao' | 'qianwen' | 'xinghuo' | 'glm';

/**
 * 多模型管理器
 */
export class MultiModelManager {
  private clients: Map<ModelType, LLMClient> = new Map();
  private defaultModel: ModelType = 'doubao';

  /**
   * 注册模型客户端
   * @param type 模型类型
   * @param config 模型配置
   */
  public registerModel(type: ModelType, config: ModelConfig): void {
    let client: LLMClient;

    switch (type) {
      case 'doubao':
        client = new DoubaoClient(config);
        break;
      case 'qianwen':
        client = new QianwenClient(config);
        break;
      case 'xinghuo':
        client = new XinghuoClient(config);
        break;
      case 'glm':
        client = new GLMClient(config);
        break;
      default:
        throw new Error(`Unsupported model type: ${type}`);
    }

    this.clients.set(type, client);
  }

  /**
   * 设置默认模型
   * @param type 模型类型
   */
  public setDefaultModel(type: ModelType): void {
    if (!this.clients.has(type)) {
      throw new Error(`Model ${type} not registered`);
    }
    this.defaultModel = type;
  }

  /**
   * 获取模型客户端
   * @param type 模型类型
   */
  public getClient(type?: ModelType): LLMClient {
    const modelType = type || this.defaultModel;
    const client = this.clients.get(modelType);
    if (!client) {
      throw new Error(`Model ${modelType} not registered`);
    }
    return client;
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
    const client = this.getClient(modelType);
    return client.chat(messages, tools, stream);
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
    const client = this.getClient(modelType);
    return client.streamChat(messages, tools, callback);
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
    const client = this.getClient(modelType);
    return client.generate(prompt, stream);
  }

  /**
   * 根据任务类型选择模型
   * @param taskType 任务类型
   */
  public selectModelByTask(taskType: string): ModelType {
    // 根据任务类型选择合适的模型
    switch (taskType) {
      case 'creative':
        return 'doubao';
      case 'technical':
        return 'qianwen';
      case 'academic':
        return 'glm';
      case 'multilingual':
        return 'xinghuo';
      default:
        return this.defaultModel;
    }
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
    const results: any[] = [];

    // 收集所有模型的结果
    for (const [type, client] of this.clients) {
      try {
        const result = await client.chat(messages, tools);
        results.push({
          model: type,
          result
        });
      } catch (error) {
        console.error(`Error with model ${type}:`, error);
      }
    }

    // 简单投票逻辑：返回第一个成功的结果
    if (results.length > 0) {
      return results[0].result;
    }

    throw new Error('All models failed');
  }
}
