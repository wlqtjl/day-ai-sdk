import { BaseLLM, ModelConfig, Message } from './base';
import fetch from 'node-fetch';

/**
 * 豆包客户端
 */
export class DoubaoClient extends BaseLLM {
  private baseUrl: string;

  constructor(config: ModelConfig) {
    super(config);
    this.baseUrl = 'https://ark.cn-beijing.volces.com/api/v3';
  }

  /**
   * 聊天接口
   * @param messages 消息列表
   * @param tools 工具列表
   * @param stream 是否流式输出
   */
  async chat(
    messages: Message[],
    tools?: any[],
    stream: boolean = false
  ): Promise<any> {
    const payload = {
      model: this.config.model,
      messages,
      tools,
      temperature: this.config.temperature || 0.7,
      max_tokens: this.config.maxTokens || 4096,
      stream
    };

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.json() as any;
      throw new Error(`Doubao API error: ${error.error?.message || 'Unknown error'}`);
    }

    if (stream) {
      const text = await response.text();
      return this.parseStreamResponse(text);
    } else {
      return await response.json();
    }
  }

  /**
   * 流式聊天接口
   * @param messages 消息列表
   * @param tools 工具列表
   * @param callback 回调函数
   */
  async streamChat(
    messages: Message[],
    tools?: any[],
    callback?: (chunk: any) => void
  ): Promise<any> {
    const payload = {
      model: this.config.model,
      messages,
      tools,
      temperature: this.config.temperature || 0.7,
      max_tokens: this.config.maxTokens || 4096,
      stream: true
    };

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.json() as any;
      throw new Error(`Doubao API error: ${error.error?.message || 'Unknown error'}`);
    }

    const text = await response.text();
    const lines = text.split('\n');
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.substring(6);
        if (data === '[DONE]') continue;
        try {
          const chunk = JSON.parse(data);
          callback?.(chunk);
        } catch (e) {
          // 忽略解析错误
        }
      }
    }

    return this.parseStreamResponse(text);
  }

  /**
   * 生成接口
   * @param prompt 提示词
   * @param stream 是否流式输出
   */
  async generate(
    prompt: string,
    stream: boolean = false
  ): Promise<any> {
    const messages: Message[] = [
      {
        role: 'user',
        content: prompt
      }
    ];

    return this.chat(messages, undefined, stream);
  }

  /**
   * 解析流式响应
   * @param text 响应文本
   */
  private parseStreamResponse(text: string): any {
    const lines = text.split('\n');
    const chunks = [];

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.substring(6);
        if (data === '[DONE]') continue;
        try {
          chunks.push(JSON.parse(data));
        } catch (e) {
          // 忽略解析错误
        }
      }
    }

    // 合并最后一个chunk作为完整响应
    return chunks[chunks.length - 1] || {};
  }
}
