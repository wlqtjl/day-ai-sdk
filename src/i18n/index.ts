// 语言类型定义
export type Language = 'zh-CN' | 'en-US' | 'ja-JP' | 'ko-KR';

// 翻译类型定义
export interface Translations {
  [key: string]: string;
}

// 翻译数据
const translations: Record<Language, Translations> = {
  'zh-CN': {
    'app.title': 'Day AI SDK',
    'app.description': '智能客户画像系统',
    'nav.dashboard': '仪表盘',
    'nav.customers': '客户管理',
    'nav.settings': '设置',
    'nav.help': '帮助',
    'customer.name': '姓名',
    'customer.company': '公司',
    'customer.position': '职位',
    'customer.phone': '电话',
    'customer.email': '邮箱',
    'customer.wechat': '微信',
    'customer.features': '客户特征',
    'customer.interactions': '互动记录',
    'customer.insights': '客户洞察',
    'feature.engagement': '参与度',
    'feature.purchase': '购买频率',
    'feature.averageOrder': '平均订单价值',
    'feature.interests': '兴趣',
    'feature.preferences': '偏好',
    'feature.social': '社交影响力',
    'feature.churn': '流失风险',
    'feature.potential': '潜在价值',
    'insight.behavioral': '行为洞察',
    'insight.predictive': '预测洞察',
    'insight.recommendation': '推荐洞察',
    'action.create': '创建',
    'action.update': '更新',
    'action.delete': '删除',
    'action.view': '查看',
    'action.export': '导出',
    'action.import': '导入',
    'status.high': '高',
    'status.medium': '中',
    'status.low': '低',
    'status.frequent': '频繁',
    'status.occasional': '偶尔',
    'status.rare': '稀少',
    'status.positive': '积极',
    'status.neutral': '中性',
    'status.negative': '消极',
    'industry.retail': '零售',
    'industry.finance': '金融',
    'industry.healthcare': '医疗健康',
    'industry.technology': '科技',
    'error.required': '必填项',
    'error.invalid': '无效输入',
    'error.notFound': '未找到',
    'error.server': '服务器错误',
    'success.created': '创建成功',
    'success.updated': '更新成功',
    'success.deleted': '删除成功',
    'success.saved': '保存成功',
  },
  'en-US': {
    'app.title': 'Day AI SDK',
    'app.description': 'Intelligent Customer Profiling System',
    'nav.dashboard': 'Dashboard',
    'nav.customers': 'Customers',
    'nav.settings': 'Settings',
    'nav.help': 'Help',
    'customer.name': 'Name',
    'customer.company': 'Company',
    'customer.position': 'Position',
    'customer.phone': 'Phone',
    'customer.email': 'Email',
    'customer.wechat': 'WeChat',
    'customer.features': 'Customer Features',
    'customer.interactions': 'Interactions',
    'customer.insights': 'Insights',
    'feature.engagement': 'Engagement',
    'feature.purchase': 'Purchase Frequency',
    'feature.averageOrder': 'Average Order Value',
    'feature.interests': 'Interests',
    'feature.preferences': 'Preferences',
    'feature.social': 'Social Influence',
    'feature.churn': 'Churn Risk',
    'feature.potential': 'Potential Value',
    'insight.behavioral': 'Behavioral Insight',
    'insight.predictive': 'Predictive Insight',
    'insight.recommendation': 'Recommendation',
    'action.create': 'Create',
    'action.update': 'Update',
    'action.delete': 'Delete',
    'action.view': 'View',
    'action.export': 'Export',
    'action.import': 'Import',
    'status.high': 'High',
    'status.medium': 'Medium',
    'status.low': 'Low',
    'status.frequent': 'Frequent',
    'status.occasional': 'Occasional',
    'status.rare': 'Rare',
    'status.positive': 'Positive',
    'status.neutral': 'Neutral',
    'status.negative': 'Negative',
    'industry.retail': 'Retail',
    'industry.finance': 'Finance',
    'industry.healthcare': 'Healthcare',
    'industry.technology': 'Technology',
    'error.required': 'Required',
    'error.invalid': 'Invalid input',
    'error.notFound': 'Not found',
    'error.server': 'Server error',
    'success.created': 'Created successfully',
    'success.updated': 'Updated successfully',
    'success.deleted': 'Deleted successfully',
    'success.saved': 'Saved successfully',
  },
  'ja-JP': {
    'app.title': 'Day AI SDK',
    'app.description': 'インテリジェント顧客プロファイリングシステム',
    'nav.dashboard': 'ダッシュボード',
    'nav.customers': '顧客',
    'nav.settings': '設定',
    'nav.help': 'ヘルプ',
    'customer.name': '名前',
    'customer.company': '会社',
    'customer.position': '役職',
    'customer.phone': '電話',
    'customer.email': 'メール',
    'customer.wechat': 'WeChat',
    'customer.features': '顧客の特徴',
    'customer.interactions': 'インタラクション',
    'customer.insights': '洞察',
    'feature.engagement': '関与度',
    'feature.purchase': '購入頻度',
    'feature.averageOrder': '平均注文額',
    'feature.interests': '興味',
    'feature.preferences': '好み',
    'feature.social': '社会的影響力',
    'feature.churn': '離反リスク',
    'feature.potential': '潜在的価値',
    'insight.behavioral': '行動洞察',
    'insight.predictive': '予測洞察',
    'insight.recommendation': '推奨',
    'action.create': '作成',
    'action.update': '更新',
    'action.delete': '削除',
    'action.view': '表示',
    'action.export': 'エクスポート',
    'action.import': 'インポート',
    'status.high': '高い',
    'status.medium': '中',
    'status.low': '低い',
    'status.frequent': '頻繁',
    'status.occasional': '時々',
    'status.rare': 'まれ',
    'status.positive': '肯定的',
    'status.neutral': '中性',
    'status.negative': '否定的',
    'industry.retail': '小売',
    'industry.finance': '金融',
    'industry.healthcare': 'ヘルスケア',
    'industry.technology': 'テクノロジー',
    'error.required': '必須',
    'error.invalid': '無効な入力',
    'error.notFound': '見つかりません',
    'error.server': 'サーバーエラー',
    'success.created': '正常に作成されました',
    'success.updated': '正常に更新されました',
    'success.deleted': '正常に削除されました',
    'success.saved': '正常に保存されました',
  },
  'ko-KR': {
    'app.title': 'Day AI SDK',
    'app.description': '지능형 고객 프로파일링 시스템',
    'nav.dashboard': '대시보드',
    'nav.customers': '고객',
    'nav.settings': '설정',
    'nav.help': '도움말',
    'customer.name': '이름',
    'customer.company': '회사',
    'customer.position': '직위',
    'customer.phone': '전화',
    'customer.email': '이메일',
    'customer.wechat': '위챗',
    'customer.features': '고객 특징',
    'customer.interactions': '상호작용',
    'customer.insights': '인사이트',
    'feature.engagement': '참여도',
    'feature.purchase': '구매 빈도',
    'feature.averageOrder': '평균 주문 가치',
    'feature.interests': '관심사',
    'feature.preferences': '선호도',
    'feature.social': '소셜 영향력',
    'feature.churn': '이탈 위험',
    'feature.potential': '잠재 가치',
    'insight.behavioral': '행동 인사이트',
    'insight.predictive': '예측 인사이트',
    'insight.recommendation': '추천',
    'action.create': '생성',
    'action.update': '업데이트',
    'action.delete': '삭제',
    'action.view': '보기',
    'action.export': '내보내기',
    'action.import': '가져오기',
    'status.high': '높음',
    'status.medium': '중간',
    'status.low': '낮음',
    'status.frequent': '빈번',
    'status.occasional': '가끔',
    'status.rare': '드물게',
    'status.positive': '긍정',
    'status.neutral': '중립',
    'status.negative': '부정',
    'industry.retail': '소매',
    'industry.finance': '금융',
    'industry.healthcare': '의료',
    'industry.technology': '기술',
    'error.required': '필수',
    'error.invalid': '잘못된 입력',
    'error.notFound': '찾을 수 없음',
    'error.server': '서버 오류',
    'success.created': '성공적으로 생성되었습니다',
    'success.updated': '성공적으로 업데이트되었습니다',
    'success.deleted': '성공적으로 삭제되었습니다',
    'success.saved': '성공적으로 저장되었습니다',
  },
};

// 国际化服务类
export class I18nService {
  private currentLanguage: Language = 'zh-CN';

  /**
   * 设置当前语言
   */
  setLanguage(language: Language): void {
    this.currentLanguage = language;
  }

  /**
   * 获取当前语言
   */
  getLanguage(): Language {
    return this.currentLanguage;
  }

  /**
   * 翻译文本
   */
  t(key: string, params?: Record<string, string>): string {
    const translation = translations[this.currentLanguage][key];
    if (!translation) {
      return key;
    }

    if (params) {
      return Object.entries(params).reduce((translated, [param, value]) => {
        return translated.replace(new RegExp(`\{${param}\}`, 'g'), value);
      }, translation);
    }

    return translation;
  }

  /**
   * 获取所有支持的语言
   */
  getSupportedLanguages(): Language[] {
    return Object.keys(translations) as Language[];
  }

  /**
   * 获取语言名称
   */
  getLanguageName(language: Language): string {
    const names: Record<Language, string> = {
      'zh-CN': '中文',
      'en-US': 'English',
      'ja-JP': '日本語',
      'ko-KR': '한국어',
    };
    return names[language];
  }

  /**
   * 检测浏览器语言
   */
  detectBrowserLanguage(): Language {
    const browserLanguage = navigator.language || 'zh-CN';
    const supportedLanguages = this.getSupportedLanguages();
    
    // 尝试匹配完整语言代码
    for (const lang of supportedLanguages) {
      if (browserLanguage === lang) {
        return lang;
      }
    }
    
    // 尝试匹配语言代码的前两位
    const languageCode = browserLanguage.split('-')[0];
    for (const lang of supportedLanguages) {
      if (lang.split('-')[0] === languageCode) {
        return lang;
      }
    }
    
    // 默认返回中文
    return 'zh-CN';
  }
}

// 导出单例
export const i18n = new I18nService();
export default i18n;