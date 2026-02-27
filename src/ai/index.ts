import { AdvancedModelManager } from './models/advanced-model-manager';
import { AdvancedAnalysisService } from './analysis/advanced-analysis';

/**
 * AI服务管理器
 */
export class AIService {
  private modelManager: AdvancedModelManager;
  private analysisService: AdvancedAnalysisService;

  constructor() {
    this.modelManager = new AdvancedModelManager();
    this.analysisService = new AdvancedAnalysisService();
  }

  /**
   * 获取模型管理器
   */
  public getModelManager(): AdvancedModelManager {
    return this.modelManager;
  }

  /**
   * 获取分析服务
   */
  public getAnalysisService(): AdvancedAnalysisService {
    return this.analysisService;
  }

  /**
   * 初始化AI服务
   */
  public initialize(): void {
    console.log('AI service initialized');
    // 可以在这里添加初始化逻辑
  }

  /**
   * 清理AI服务
   */
  public cleanup(): void {
    this.modelManager.clearCache();
    console.log('AI service cleaned up');
  }
}

// 导出核心模块
export {
  AdvancedModelManager,
  AdvancedAnalysisService
};

export default AIService;