import { DomesticLLM, ModelType, ModelConfig } from '../../llm-domestic';
import { v4 as uuidv4 } from 'uuid';

/**
 * 模型性能指标
 */
export interface ModelPerformance {
  modelType: ModelType;
  accuracy: number; // 准确率
  speed: number; // 速度（tokens/秒）
  cost: number; // 成本（元/1000 tokens）
  successRate: number; // 成功率
  lastUsed: Date;
  usageCount: number;
}

/**
 * 任务类型
 */
export type TaskType = 
  | 'analysis' // 数据分析
  | 'prediction' // 预测
  | 'recommendation' // 推荐
  | 'generation' // 内容生成
  | 'classification' // 分类
  | 'sentiment' // 情感分析
  | 'summarization' // 总结
  | 'translation' // 翻译
  | 'reasoning'; // 推理

/**
 * 任务配置
 */
export interface TaskConfig {
  taskType: TaskType;
  priority: 'high' | 'medium' | 'low';
  timeout: number; // 超时时间（毫秒）
  budget: number; // 预算（元）
  quality: 'high' | 'medium' | 'low'; // 质量要求
}

/**
 * 高级模型管理服务
 */
export class AdvancedModelManager {
  private domesticLLM: DomesticLLM;
  private modelPerformance: Map<ModelType, ModelPerformance> = new Map();
  private taskHistory: Map<string, TaskResult> = new Map();
  private modelCache: Map<string, string> = new Map(); // 缓存模型响应

  constructor() {
    this.domesticLLM = new DomesticLLM();
    this.initializeModelPerformance();
  }

  /**
   * 初始化模型性能数据
   */
  private initializeModelPerformance(): void {
    const models: ModelType[] = ['doubao', 'qianwen', 'xinghuo', 'glm'];
    models.forEach(model => {
      this.modelPerformance.set(model, {
        modelType: model,
        accuracy: 0.85,
        speed: 10,
        cost: 0.1,
        successRate: 0.95,
        lastUsed: new Date(),
        usageCount: 0
      });
    });
  }

  /**
   * 注册模型
   */
  public registerModel(modelType: ModelType, config: ModelConfig): void {
    switch (modelType) {
      case 'doubao':
        this.domesticLLM.registerDoubao(config);
        break;
      case 'qianwen':
        this.domesticLLM.registerQianwen(config);
        break;
      case 'xinghuo':
        this.domesticLLM.registerXinghuo(config);
        break;
      case 'glm':
        this.domesticLLM.registerGLM(config);
        break;
    }
  }

  /**
   * 根据任务类型选择最佳模型
   */
  public selectBestModel(taskConfig: TaskConfig): ModelType {
    const models = Array.from(this.modelPerformance.values());
    
    // 根据任务类型和配置计算模型得分
    const scoredModels = models.map(model => {
      let score = 0;
      
      // 准确率权重
      score += model.accuracy * 0.4;
      
      // 速度权重
      score += model.speed / 100 * 0.2;
      
      // 成本权重（成本越低得分越高）
      score += (1 - model.cost) * 0.2;
      
      // 成功率权重
      score += model.successRate * 0.2;
      
      return { model, score };
    });
    
    // 按得分排序
    scoredModels.sort((a, b) => b.score - a.score);
    
    return scoredModels[0].model.modelType;
  }

  /**
   * 执行AI任务
   */
  async executeTask(prompt: string, taskConfig: TaskConfig): Promise<TaskResult> {
    const taskId = uuidv4();
    const startTime = Date.now();
    
    // 生成缓存键
    const cacheKey = this.generateCacheKey(prompt, taskConfig);
    
    // 检查缓存
    if (this.modelCache.has(cacheKey)) {
      const cachedResult = this.modelCache.get(cacheKey);
      return {
        taskId,
        success: true,
        result: cachedResult || null,
        modelType: 'cached' as ModelType,
        executionTime: 0,
        cost: 0,
        timestamp: new Date()
      };
    }
    
    // 选择最佳模型
    const modelType = this.selectBestModel(taskConfig);
    
    try {
      // 执行任务
      const response = await this.domesticLLM.generate(prompt, false, modelType);
      const executionTime = Date.now() - startTime;
      
      // 计算成本（估算）
      const cost = this.calculateCost(prompt.length + (response?.content?.length || 0), modelType);
      
      // 更新模型性能
      this.updateModelPerformance(modelType, true, executionTime);
      
      // 缓存结果
      this.modelCache.set(cacheKey, response?.content || '');
      
      const result: TaskResult = {
        taskId,
        success: true,
        result: response?.content,
        modelType,
        executionTime,
        cost,
        timestamp: new Date()
      };
      
      // 保存任务历史
      this.taskHistory.set(taskId, result);
      
      return result;
    } catch (error) {
      // 更新模型性能（失败）
      this.updateModelPerformance(modelType, false, Date.now() - startTime);
      
      const result: TaskResult = {
        taskId,
        success: false,
        result: null,
        modelType,
        executionTime: Date.now() - startTime,
        cost: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      };
      
      // 保存任务历史
      this.taskHistory.set(taskId, result);
      
      return result;
    }
  }

  /**
   * 执行多模型协作任务
   */
  async executeCollaborativeTask(prompt: string, taskConfig: TaskConfig): Promise<TaskResult> {
    const taskId = uuidv4();
    const startTime = Date.now();
    
    // 选择多个模型
    const models = this.selectMultipleModels(taskConfig, 3);
    const results: Array<{ modelType: ModelType; result: string }> = [];
    
    // 并行执行多个模型
    await Promise.all(
      models.map(async (modelType) => {
        try {
          const response = await this.domesticLLM.generate(prompt, false, modelType);
          if (response?.content) {
            results.push({ modelType, result: response.content });
          }
        } catch (error) {
          console.error(`Error with model ${modelType}:`, error);
        }
      })
    );
    
    // 汇总结果
    const aggregatedResult = await this.aggregateResults(results);
    const executionTime = Date.now() - startTime;
    const cost = results.length * this.calculateCost(prompt.length, models[0]);
    
    const result: TaskResult = {
      taskId,
      success: results.length > 0,
      result: aggregatedResult,
      modelType: 'collaborative' as ModelType,
      executionTime,
      cost,
      timestamp: new Date()
    };
    
    // 保存任务历史
    this.taskHistory.set(taskId, result);
    
    return result;
  }

  /**
   * 选择多个模型
   */
  private selectMultipleModels(taskConfig: TaskConfig, count: number): ModelType[] {
    const models = Array.from(this.modelPerformance.values());
    const scoredModels = models.map(model => {
      let score = 0;
      score += model.accuracy * 0.4;
      score += model.speed / 100 * 0.2;
      score += (1 - model.cost) * 0.2;
      score += model.successRate * 0.2;
      return { model, score };
    });
    
    scoredModels.sort((a, b) => b.score - a.score);
    return scoredModels.slice(0, count).map(item => item.model.modelType);
  }

  /**
   * 汇总多个模型的结果
   */
  private async aggregateResults(results: Array<{ modelType: ModelType; result: string }>): Promise<string> {
    if (results.length === 0) {
      return 'No results available';
    }
    
    if (results.length === 1) {
      return results[0].result;
    }
    
    // 构建汇总提示
    const prompt = `
    请汇总以下多个AI模型的分析结果，生成一个综合、全面的最终结果：
    
    ${results.map((item, index) => `模型 ${index + 1} (${item.modelType}):\n${item.result}\n`).join('\n')}
    
    请：
    1. 提取每个模型的核心观点
    2. 识别共同的结论和差异
    3. 生成一个整合的、高质量的最终结果
    4. 保持专业性和准确性
    `;
    
    // 使用默认模型进行汇总
    const response = await this.domesticLLM.generate(prompt, false);
    return response?.content || 'No results available';
  }

  /**
   * 更新模型性能
   */
  private updateModelPerformance(modelType: ModelType, success: boolean, executionTime: number): void {
    const performance = this.modelPerformance.get(modelType);
    if (performance) {
      performance.lastUsed = new Date();
      performance.usageCount += 1;
      
      // 更新成功率
      performance.successRate = (performance.successRate * (performance.usageCount - 1) + (success ? 1 : 0)) / performance.usageCount;
      
      // 更新速度（简单移动平均）
      performance.speed = (performance.speed * 0.9) + (1000 / executionTime * 0.1);
      
      this.modelPerformance.set(modelType, performance);
    }
  }

  /**
   * 计算成本
   */
  private calculateCost(tokenCount: number, modelType: ModelType): number {
    const performance = this.modelPerformance.get(modelType);
    if (performance) {
      return (tokenCount / 1000) * performance.cost;
    }
    return 0;
  }

  /**
   * 生成缓存键
   */
  private generateCacheKey(prompt: string, taskConfig: TaskConfig): string {
    return `${taskConfig.taskType}:${taskConfig.quality}:${prompt.substring(0, 100)}`;
  }

  /**
   * 获取模型性能数据
   */
  public getModelPerformance(): Map<ModelType, ModelPerformance> {
    return new Map(this.modelPerformance);
  }

  /**
   * 获取任务历史
   */
  public getTaskHistory(): Map<string, TaskResult> {
    return new Map(this.taskHistory);
  }

  /**
   * 清除缓存
   */
  public clearCache(): void {
    this.modelCache.clear();
  }
}

/**
 * 任务结果
 */
export interface TaskResult {
  taskId: string;
  success: boolean;
  result: string | null;
  modelType: ModelType | 'cached' | 'collaborative';
  executionTime: number;
  cost: number;
  error?: string;
  timestamp: Date;
}

export default AdvancedModelManager;