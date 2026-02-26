import { DayAIClient, CustomerProfileService, defaultProfileConfig, DoubaoClient } from './src';

/**
 * 测试智能客户画像模块
 */
async function testCustomerProfile() {
  try {
    console.log('=== 智能客户画像模块测试 ===\n');

    // 1. 初始化 DayAIClient
    console.log('1. 初始化 DayAIClient...');
    const dayAIClient = new DayAIClient();
    
    // 2. 初始化 LLM 客户端
    console.log('2. 初始化 LLM 客户端...');
    const llmClient = new DoubaoClient({
      apiKey: process.env.DOUBAO_API_KEY || 'your-doubao-api-key',
      model: 'doubao-pro-1.5',
    });

    // 3. 初始化客户画像服务
    console.log('3. 初始化客户画像服务...');
    const profileService = new CustomerProfileService(
      dayAIClient,
      llmClient,
      defaultProfileConfig
    );

    // 4. 测试获取所有客户画像
    console.log('4. 测试获取所有客户画像...');
    const profiles = await profileService.getAllCustomerProfiles();
    console.log(`   获取到 ${profiles.length} 个客户画像`);
    
    if (profiles.length > 0) {
      const profile = profiles[0];
      console.log(`   第一个客户: ${profile.name}`);
      console.log(`   客户标签: ${profile.tags.join(', ')}`);
      console.log(`   参与度: ${profile.features.engagementLevel}`);
      console.log(`   潜在价值: ${profile.features.potentialValue}`);
    }

    // 5. 测试客户分群
    console.log('\n5. 测试客户分群...');
    const segments = await profileService.segmentCustomers();
    console.log(`   分群数量: ${segments.size}`);
    
    segments.forEach((segmentProfiles, segmentKey) => {
      console.log(`   ${segmentKey}: ${segmentProfiles.length} 个客户`);
    });

    // 6. 测试客户行为预测
    if (profiles.length > 0) {
      console.log('\n6. 测试客户行为预测...');
      const prediction = await profileService.predictCustomerBehavior(profiles[0].id);
      console.log('   预测结果:', prediction);
    }

    // 7. 测试数据可视化
    if (profiles.length > 0) {
      console.log('\n7. 测试数据可视化...');
      const visualizationData = profileService.generateProfileVisualization(profiles[0]);
      console.log('   生成了可视化数据:', Object.keys(visualizationData));
    }

    console.log('\n=== 测试完成 ===');
  } catch (error) {
    console.error('测试过程中出现错误:', error);
  }
}

// 运行测试
testCustomerProfile();
