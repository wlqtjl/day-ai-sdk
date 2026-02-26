/**
 * 大模型配置
 */
export interface ModelConfig {
  apiKey: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * 消息类型
 */
export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/**
 * 工具调用参数
 */
export interface ToolCall {
  id: string;
  type: string;
  function: {
    name: string;
    arguments: string;
  };
}

/**
 * 工具结果
 */
export interface ToolResult {
  tool_call_id: string;
  result: any;
}

/**
 * 大模型客户端接口
 */
export interface LLMClient {
  /**
   * 聊天接口
   * @param messages 消息列表
   * @param tools 工具列表
   * @param stream 是否流式输出
   */
  chat(
    messages: Message[],
    tools?: any[],
    stream?: boolean
  ): Promise<any>;

  /**
   * 流式聊天接口
   * @param messages 消息列表
   * @param tools 工具列表
   * @param callback 回调函数
   */
  streamChat(
    messages: Message[],
    tools?: any[],
    callback?: (chunk: any) => void
  ): Promise<any>;

  /**
   * 生成接口
   * @param prompt 提示词
   * @param stream 是否流式输出
   */
  generate(
    prompt: string,
    stream?: boolean
  ): Promise<any>;
}

/**
 * 基础大模型类
 */
export abstract class BaseLLM implements LLMClient {
  protected config: ModelConfig;

  constructor(config: ModelConfig) {
    this.config = config;
  }

  abstract chat(
    messages: Message[],
    tools?: any[],
    stream?: boolean
  ): Promise<any>;

  abstract streamChat(
    messages: Message[],
    tools?: any[],
    callback?: (chunk: any) => void
  ): Promise<any>;

  abstract generate(
    prompt: string,
    stream?: boolean
  ): Promise<any>;

  /**
   * 设置配置
   * @param config 配置
   */
  public setConfig(config: Partial<ModelConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 获取配置
   */
  public getConfig(): ModelConfig {
    return this.config;
  }
}
