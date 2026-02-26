import { useState, useEffect } from 'react';
import { CustomerProfile } from '../../../src';

interface CustomerProfileManagerProps {
  onProfileSelect?: (profile: CustomerProfile) => void;
}

const CustomerProfileManager: React.FC<CustomerProfileManagerProps> = ({ onProfileSelect }) => {
  const [profiles, setProfiles] = useState<CustomerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState<CustomerProfile | null>(null);
  const [visualizationData, setVisualizationData] = useState<any>(null);

  // 加载客户画像数据
  useEffect(() => {
    loadCustomerProfiles();
  }, []);

  const loadCustomerProfiles = async () => {
    try {
      setLoading(true);
      // 这里需要调用后端API获取客户画像数据
      // 暂时使用模拟数据
      const mockProfiles: CustomerProfile[] = [
        {
          id: '1',
          name: '张三',
          phone: '13800138000',
          email: 'zhangsan@example.com',
          wechatId: 'wx123456',
          company: 'ABC公司',
          position: '总经理',
          tags: ['重要客户', '高价值'],
          features: {
            age: 35,
            gender: 'male',
            location: '北京',
            engagementLevel: 'high',
            purchaseFrequency: 'frequent',
            averageOrderValue: 10000,
            interests: ['技术', '投资', '旅游'],
            preferences: ['高端服务', '个性化方案'],
            socialInfluence: 'high',
            networkSize: 500,
            customerLifetimeValue: 500000,
            churnRisk: 'low',
            potentialValue: 'high',
          },
          interactions: [
            {
              id: '1',
              type: 'wechat',
              content: '您好，请问贵公司的产品价格是多少？',
              timestamp: new Date('2024-01-02'),
              sentiment: 'neutral',
              tags: ['询价'],
            },
            {
              id: '2',
              type: 'email',
              content: '感谢您的回复，我想了解一下产品的价格和交付时间。',
              timestamp: new Date('2024-01-05'),
              sentiment: 'neutral',
              tags: ['询价'],
            },
          ],
          insights: [
            {
              id: '1',
              type: 'behavioral',
              content: '客户经常在工作日下午咨询产品信息',
              confidence: 0.9,
              timestamp: new Date(),
              actionItems: ['在工作日下午安排专门的客服人员'],
            },
            {
              id: '2',
              type: 'predictive',
              content: '客户可能在未来30天内有购买意向',
              confidence: 0.8,
              timestamp: new Date(),
              actionItems: ['发送个性化的产品推荐', '安排销售跟进'],
            },
          ],
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2024-01-05'),
        },
        {
          id: '2',
          name: '李四',
          phone: '13900139000',
          email: 'lisi@example.com',
          company: 'XYZ公司',
          position: '技术总监',
          tags: ['技术专家', '潜在客户'],
          features: {
            age: 30,
            gender: 'male',
            location: '上海',
            engagementLevel: 'medium',
            purchaseFrequency: 'occasional',
            averageOrderValue: 5000,
            interests: ['技术', '编程', '音乐'],
            preferences: ['技术支持', '产品演示'],
            socialInfluence: 'medium',
            networkSize: 300,
            customerLifetimeValue: 200000,
            churnRisk: 'medium',
            potentialValue: 'medium',
          },
          interactions: [],
          insights: [],
          createdAt: new Date('2023-06-01'),
          updatedAt: new Date('2023-12-01'),
        },
      ];
      setProfiles(mockProfiles);
    } catch (error) {
      console.error('Error loading customer profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  // 处理客户画像选择
  const handleProfileSelect = (profile: CustomerProfile) => {
    setSelectedProfile(profile);
    // 生成可视化数据
    generateVisualizationData(profile);
    if (onProfileSelect) {
      onProfileSelect(profile);
    }
  };

  // 生成可视化数据
  const generateVisualizationData = (profile: CustomerProfile) => {
    // 这里可以调用后端API生成可视化数据
    // 暂时使用模拟数据
    setVisualizationData({
      overview: {
        basicInfo: {
          name: profile.name,
          company: profile.company,
          position: profile.position,
          contact: {
            phone: profile.phone,
            email: profile.email,
            wechatId: profile.wechatId,
          },
        },
        keyMetrics: {
          engagementLevel: profile.features.engagementLevel,
          purchaseFrequency: profile.features.purchaseFrequency,
          customerLifetimeValue: profile.features.customerLifetimeValue,
          churnRisk: profile.features.churnRisk,
          potentialValue: profile.features.potentialValue,
        },
      },
      featureRadar: {
        labels: ['参与度', '购买频率', '社交影响力', '流失风险', '潜在价值'],
        datasets: [
          {
            label: '客户特征',
            data: [80, 70, 85, 20, 90],
          },
        ],
      },
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
          <p>加载客户画像中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* 标题 */}
      <div className="p-4 border-b">
        <h2 className="text-xl font-semibold">客户画像管理</h2>
        <p className="text-sm text-gray-500">管理和分析客户画像数据</p>
      </div>

      {/* 客户列表和详情 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 客户列表 */}
        <div className="w-1/3 border-r overflow-y-auto">
          <div className="p-4">
            <input
              type="text"
              placeholder="搜索客户..."
              className="w-full p-2 border rounded-md"
            />
          </div>
          <div className="divide-y">
            {profiles.map((profile) => (
              <div
                key={profile.id}
                className={`p-4 cursor-pointer ${selectedProfile?.id === profile.id ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                onClick={() => handleProfileSelect(profile)}
              >
                <div className="font-medium">{profile.name}</div>
                <div className="text-sm text-gray-500">{profile.company}</div>
                <div className="text-xs text-gray-400 mt-1">
                  {profile.features.engagementLevel === 'high' && (
                    <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded-full">高参与度</span>
                  )}
                  {profile.features.potentialValue === 'high' && (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full ml-2">高潜力</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 客户详情 */}
        <div className="w-2/3 overflow-y-auto">
          {selectedProfile ? (
            <div className="p-4">
              {/* 基本信息 */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">基本信息</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">姓名</p>
                    <p className="font-medium">{selectedProfile.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">公司</p>
                    <p className="font-medium">{selectedProfile.company}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">职位</p>
                    <p className="font-medium">{selectedProfile.position}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">电话</p>
                    <p className="font-medium">{selectedProfile.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">邮箱</p>
                    <p className="font-medium">{selectedProfile.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">微信</p>
                    <p className="font-medium">{selectedProfile.wechatId}</p>
                  </div>
                </div>
              </div>

              {/* 客户特征 */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">客户特征</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">参与度</p>
                    <p className="font-medium">
                      {selectedProfile.features.engagementLevel === 'high' && '高'}
                      {selectedProfile.features.engagementLevel === 'medium' && '中'}
                      {selectedProfile.features.engagementLevel === 'low' && '低'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">购买频率</p>
                    <p className="font-medium">
                      {selectedProfile.features.purchaseFrequency === 'frequent' && '频繁'}
                      {selectedProfile.features.purchaseFrequency === 'occasional' && '偶尔'}
                      {selectedProfile.features.purchaseFrequency === 'rare' && '稀少'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">平均订单价值</p>
                    <p className="font-medium">¥{selectedProfile.features.averageOrderValue || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">客户终身价值</p>
                    <p className="font-medium">¥{selectedProfile.features.customerLifetimeValue || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">流失风险</p>
                    <p className="font-medium">
                      {selectedProfile.features.churnRisk === 'high' && '高'}
                      {selectedProfile.features.churnRisk === 'medium' && '中'}
                      {selectedProfile.features.churnRisk === 'low' && '低'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">潜在价值</p>
                    <p className="font-medium">
                      {selectedProfile.features.potentialValue === 'high' && '高'}
                      {selectedProfile.features.potentialValue === 'medium' && '中'}
                      {selectedProfile.features.potentialValue === 'low' && '低'}
                    </p>
                  </div>
                </div>
              </div>

              {/* 兴趣和偏好 */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">兴趣和偏好</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedProfile.features.interests.map((interest, index) => (
                    <span key={index} className="px-3 py-1 bg-gray-100 rounded-full text-sm">
                      {interest}
                    </span>
                  ))}
                </div>
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">偏好</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedProfile.features.preferences.map((preference, index) => (
                      <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        {preference}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* 最近互动 */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">最近互动</h3>
                {selectedProfile.interactions.length > 0 ? (
                  <div className="space-y-4">
                    {selectedProfile.interactions.map((interaction) => (
                      <div key={interaction.id} className="border rounded-lg p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">
                              {interaction.type === 'wechat' && '微信'}
                              {interaction.type === 'email' && '邮件'}
                              {interaction.type === 'phone' && '电话'}
                              {interaction.type === 'meeting' && '会议'}
                              {interaction.type === 'purchase' && '购买'}
                            </p>
                            <p className="text-sm text-gray-500">
                              {interaction.timestamp.toLocaleString()}
                            </p>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-xs ${
                            interaction.sentiment === 'positive' ? 'bg-green-100 text-green-800' :
                            interaction.sentiment === 'negative' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {interaction.sentiment === 'positive' && '积极'}
                            {interaction.sentiment === 'negative' && '消极'}
                            {interaction.sentiment === 'neutral' && '中性'}
                          </span>
                        </div>
                        <p className="mt-2 text-sm">{interaction.content}</p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {interaction.tags.map((tag, index) => (
                            <span key={index} className="px-2 py-0.5 bg-gray-100 rounded-full text-xs">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">暂无互动记录</p>
                )}
              </div>

              {/* 客户洞察 */}
              <div>
                <h3 className="text-lg font-semibold mb-4">客户洞察</h3>
                {selectedProfile.insights.length > 0 ? (
                  <div className="space-y-4">
                    {selectedProfile.insights.map((insight) => (
                      <div key={insight.id} className="border rounded-lg p-3 bg-blue-50">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">
                              {insight.type === 'behavioral' && '行为洞察'}
                              {insight.type === 'predictive' && '预测洞察'}
                              {insight.type === 'recommendation' && '推荐洞察'}
                            </p>
                            <p className="text-sm text-gray-500">
                              置信度: {Math.round(insight.confidence * 100)}%
                            </p>
                          </div>
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs">
                            {insight.type === 'behavioral' && '行为'}
                            {insight.type === 'predictive' && '预测'}
                            {insight.type === 'recommendation' && '推荐'}
                          </span>
                        </div>
                        <p className="mt-2">{insight.content}</p>
                        {insight.actionItems.length > 0 && (
                          <div className="mt-3">
                            <h4 className="text-sm font-medium mb-2">建议行动</h4>
                            <ul className="list-disc list-inside text-sm space-y-1">
                              {insight.actionItems.map((action, index) => (
                                <li key={index}>{action}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">暂无洞察数据</p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">请选择一个客户查看详情</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerProfileManager;
