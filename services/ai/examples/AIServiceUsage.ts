/**
 * @file AI服务使用示例
 * @description 展示如何使用AI服务管理器和各个服务
 * @module examples/AIServiceUsage
 * @author YYC³
 * @version 1.0.0
 * @created 2025-01-19
 */

import { AIServiceManager } from '../core/services/AIServiceManager';
import type { ChatOptions, StreamChunk } from '../core/services/AIServiceManager';

export async function basicUsageExample(): Promise<void> {
  console.log('=== AI服务基本使用示例 ===\n');

  const manager = new AIServiceManager();

  await manager.initialize();
  console.log('✓ AI服务管理器初始化成功\n');

  const providers = manager.getProviders();
  console.log('可用的AI提供商:');
  providers.forEach(provider => {
    console.log(`  - ${provider.name} (${provider.id})`);
    console.log(`    模型数量: ${provider.models.length}`);
  });
  console.log('');

  const templates = manager.getTemplates();
  console.log(`可用的Prompt模板: ${templates.length}个`);
  templates.slice(0, 3).forEach(template => {
    console.log(`  - ${template.name}: ${template.description}`);
  });
  console.log('');

  const stats = manager.getStatistics();
  console.log('服务统计:');
  console.log(`  - 对话历史: ${stats.chat.conversationLength}条消息`);
  console.log(`  - 模型总数: ${stats.models.totalModels}个`);
  console.log(`  - 模板总数: ${stats.templates.totalTemplates}个`);
  console.log(`  - API Key总数: ${stats.keys.totalKeys}个`);
  console.log('');
}

export async function sendMessageExample(): Promise<void> {
  console.log('=== 发送消息示例 ===\n');

  const manager = new AIServiceManager();
  await manager.initialize();

  try {
    const message = await manager.sendMessage('你好，请介绍一下你自己', {
      model: 'gpt-3.5-turbo',
      temperature: 0.7,
      maxTokens: 500,
    });

    console.log('用户: 你好，请介绍一下你自己');
    console.log(`助手: ${message.content}`);
    console.log('');
  } catch (error) {
    console.error('发送消息失败:', error);
  }
}

export async function sendMessageStreamExample(): Promise<void> {
  console.log('=== 流式发送消息示例 ===\n');

  const manager = new AIServiceManager();
  await manager.initialize();

  try {
    console.log('用户: 请写一首关于春天的诗');
    console.log('助手: ');

    await manager.sendMessageStream(
      '请写一首关于春天的诗',
      {
        model: 'gpt-3.5-turbo',
        temperature: 0.8,
        maxTokens: 300,
      },
      (chunk: StreamChunk) => {
        if (!chunk.done) {
          process.stdout.write(chunk.content);
        }
      }
    );

    console.log('\n');
  } catch (error) {
    console.error('发送消息失败:', error);
  }
}

export async function useTemplateExample(): Promise<void> {
  console.log('=== 使用Prompt模板示例 ===\n');

  const manager = new AIServiceManager();
  await manager.initialize();

  const templates = manager.getTemplates();
  const codeReviewTemplate = templates.find(t => t.id === 'code-review');

  if (!codeReviewTemplate) {
    console.log('未找到代码审查模板');
    return;
  }

  console.log(`使用模板: ${codeReviewTemplate.name}`);
  console.log(`描述: ${codeReviewTemplate.description}\n`);

  try {
    const message = await manager.sendMessageWithTemplate(
      'code-review',
      {
        code: 'function add(a, b) { return a + b; }',
        language: 'JavaScript',
        depth: '标准',
      },
      {
        model: 'gpt-3.5-turbo',
        temperature: 0.3,
      }
    );

    console.log('代码审查结果:');
    console.log(message.content);
    console.log('');
  } catch (error) {
    console.error('使用模板失败:', error);
  }
}

export async function manageAPIKeysExample(): Promise<void> {
  console.log('=== API Key管理示例 ===\n');

  const manager = new AIServiceManager();
  await manager.initialize();

  try {
    console.log('添加API Key...');
    const key = await manager.addAPIKey({
      name: '我的OpenAI Key',
      provider: 'openai',
      key: 'sk-xxxxxxxxxxxxxxxxxxxxxxxx',
      isActive: true,
      description: '用于开发测试',
    });

    console.log(`✓ API Key添加成功: ${key.name}\n`);

    console.log('测试API Key...');
    const testResult = await manager.testAPIKey(key.id);
    console.log(`测试结果: ${testResult.success ? '成功' : '失败'}`);
    console.log(`消息: ${testResult.message}\n`);

    const keys = manager.getAPIKeys();
    console.log('当前API Keys:');
    keys.forEach(k => {
      console.log(`  - ${k.name} (${k.provider})`);
      console.log(`    状态: ${k.isActive ? '激活' : '未激活'}`);
      console.log(`    使用次数: ${k.usageCount}`);
    });
    console.log('');

    console.log('删除API Key...');
    await manager.deleteAPIKey(key.id);
    console.log('✓ API Key删除成功\n');
  } catch (error) {
    console.error('API Key管理失败:', error);
  }
}

export async function manageModelsExample(): Promise<void> {
  console.log('=== 模型管理示例 ===\n');

  const manager = new AIServiceManager();
  await manager.initialize();

  try {
    console.log('刷新OpenAI模型列表...');
    const models = await manager.refreshModels('openai');
    console.log(`✓ 刷新成功，共${models.length}个模型\n`);

    console.log('支持流式输出的模型:');
    const streamingModels = manager.getModels({ supportsStreaming: true });
    streamingModels.slice(0, 5).forEach(model => {
      console.log(`  - ${model.name} (${model.id})`);
      console.log(`    上下文长度: ${model.contextLength}`);
      console.log(`    支持工具: ${model.supportsTools ? '是' : '否'}`);
    });
    console.log('');

    console.log('搜索模型:');
    const searchResults = manager.getModels({ searchQuery: 'gpt-4' });
    searchResults.forEach(model => {
      console.log(`  - ${model.name} (${model.id})`);
    });
    console.log('');
  } catch (error) {
    console.error('模型管理失败:', error);
  }
}

export async function manageTemplatesExample(): Promise<void> {
  console.log('=== Prompt模板管理示例 ===\n');

  const manager = new AIServiceManager();
  await manager.initialize();

  try {
    console.log('创建新模板...');
    const newTemplate = await manager.createTemplate({
      name: '文本摘要',
      description: '对长文本进行摘要',
      category: 'general',
      content: `请对以下文本进行摘要：

{{text}}

摘要要求：
- 长度：{{length}}字左右
- 语言：{{language}}
- 风格：{{style}}`,
      variables: [
        {
          name: 'text',
          type: 'text',
          description: '需要摘要的文本',
          required: true,
        },
        {
          name: 'length',
          type: 'number',
          description: '摘要长度',
          required: true,
          defaultValue: '200',
        },
        {
          name: 'language',
          type: 'select',
          description: '摘要语言',
          required: true,
          options: ['中文', '英文', '日文'],
          defaultValue: '中文',
        },
        {
          name: 'style',
          type: 'select',
          description: '摘要风格',
          required: true,
          options: ['简洁', '详细', '要点'],
          defaultValue: '简洁',
        },
      ],
      tags: ['摘要', '文本处理'],
      isFavorite: false,
    });

    console.log(`✓ 模板创建成功: ${newTemplate.name}\n`);

    console.log('搜索模板:');
    const searchResults = manager.getTemplates({ searchQuery: '摘要' });
    searchResults.forEach(template => {
      console.log(`  - ${template.name}: ${template.description}`);
    });
    console.log('');

    console.log('按分类查看模板:');
    const categories = manager.getCategories();
    categories.forEach(category => {
      const templatesInCategory = manager.getTemplates({ category: category.id });
      console.log(`  ${category.name} (${category.icon}): ${templatesInCategory.length}个模板`);
    });
    console.log('');

    console.log('删除模板...');
    await manager.deleteTemplate(newTemplate.id);
    console.log('✓ 模板删除成功\n');
  } catch (error) {
    console.error('模板管理失败:', error);
  }
}

export async function completeWorkflowExample(): Promise<void> {
  console.log('=== 完整工作流示例 ===\n');

  const manager = new AIServiceManager();
  await manager.initialize();

  try {
    console.log('步骤1: 配置API Key');
    const apiKey = await manager.addAPIKey({
      name: '开发测试Key',
      provider: 'openai',
      key: 'sk-xxxxxxxxxxxxxxxxxxxxxxxx',
      isActive: true,
    });
    console.log(`✓ API Key配置完成\n`);

    console.log('步骤2: 刷新模型列表');
    await manager.refreshModels('openai');
    console.log('✓ 模型列表刷新完成\n');

    console.log('步骤3: 创建自定义模板');
    const template = await manager.createTemplate({
      name: '代码优化',
      description: '优化代码质量和性能',
      category: 'coding',
      content: `请优化以下代码：

\`\`\`
{{code}}
\`\`\`

优化要求：
- 语言：{{language}}
- 优化目标：{{goal}}
- 保持功能不变`,
      variables: [
        {
          name: 'code',
          type: 'text',
          description: '需要优化的代码',
          required: true,
        },
        {
          name: 'language',
          type: 'select',
          description: '编程语言',
          required: true,
          options: ['JavaScript', 'TypeScript', 'Python'],
          defaultValue: 'JavaScript',
        },
        {
          name: 'goal',
          type: 'select',
          description: '优化目标',
          required: true,
          options: ['性能', '可读性', '安全性'],
          defaultValue: '性能',
        },
      ],
      tags: ['代码', '优化'],
      isFavorite: false,
    });
    console.log(`✓ 模板创建完成: ${template.name}\n`);

    console.log('步骤4: 使用模板发送消息');
    const message = await manager.sendMessageWithTemplate(
      template.id,
      {
        code: 'function sum(arr) { let total = 0; for (let i = 0; i < arr.length; i++) { total += arr[i]; } return total; }',
        language: 'JavaScript',
        goal: '性能',
      },
      {
        model: 'gpt-3.5-turbo',
        temperature: 0.3,
      }
    );
    console.log('✓ 消息发送完成\n');

    console.log('优化结果:');
    console.log(message.content);
    console.log('');

    console.log('步骤5: 查看统计信息');
    const stats = manager.getStatistics();
    console.log('服务统计:');
    console.log(`  - 对话消息数: ${stats.chat.conversationLength}`);
    console.log(`  - 模型总数: ${stats.models.totalModels}`);
    console.log(`  - 模板总数: ${stats.templates.totalTemplates}`);
    console.log(`  - 模板使用次数: ${stats.templates.totalUsage}`);
    console.log(`  - API Key总数: ${stats.keys.totalKeys}`);
    console.log(`  - API Key使用次数: ${stats.keys.totalUsage}`);
    console.log('');

    console.log('步骤6: 导出数据');
    const exportedData = await manager.exportData();
    console.log(`✓ 数据导出完成`);
    console.log(`  - 模板数量: ${exportedData.templates.length}`);
    console.log(`  - API Key数量: ${exportedData.keys.length}`);
    console.log('');

    console.log('✓ 完整工作流执行成功！');
  } catch (error) {
    console.error('工作流执行失败:', error);
  }
}

export async function errorHandlingExample(): Promise<void> {
  console.log('=== 错误处理示例 ===\n');

  const manager = new AIServiceManager();
  await manager.initialize();

  try {
    console.log('测试1: 发送消息时没有配置API Key');
    try {
      await manager.sendMessage('你好', {
        model: 'gpt-3.5-turbo',
      });
    } catch (error) {
      console.log(`✓ 错误被捕获: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
    }

    console.log('测试2: 使用不存在的模板');
    try {
      await manager.sendMessageWithTemplate(
        'non-existent-template',
        {},
        { model: 'gpt-3.5-turbo' }
      );
    } catch (error) {
      console.log(`✓ 错误被捕获: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
    }

    console.log('测试3: 测试无效的API Key');
    try {
      const key = await manager.addAPIKey({
        name: '无效Key',
        provider: 'openai',
        key: 'invalid-key',
        isActive: true,
      });

      const testResult = await manager.testAPIKey(key.id);
      console.log(`✓ 测试结果: ${testResult.success ? '成功' : '失败'}`);
      console.log(`✓ 错误消息: ${testResult.message}\n`);

      await manager.deleteAPIKey(key.id);
    } catch (error) {
      console.log(`✓ 错误被捕获: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
    }

    console.log('✓ 所有错误处理测试完成！');
  } catch (error) {
    console.error('错误处理测试失败:', error);
  }
}

export async function runAllExamples(): Promise<void> {
  console.log('========================================');
  console.log('  AI服务使用示例集合');
  console.log('========================================\n');

  await basicUsageExample();
  console.log('----------------------------------------\n');

  await sendMessageExample();
  console.log('----------------------------------------\n');

  await sendMessageStreamExample();
  console.log('----------------------------------------\n');

  await useTemplateExample();
  console.log('----------------------------------------\n');

  await manageAPIKeysExample();
  console.log('----------------------------------------\n');

  await manageModelsExample();
  console.log('----------------------------------------\n');

  await manageTemplatesExample();
  console.log('----------------------------------------\n');

  await completeWorkflowExample();
  console.log('----------------------------------------\n');

  await errorHandlingExample();
  console.log('----------------------------------------\n');

  console.log('========================================');
  console.log('  所有示例执行完成！');
  console.log('========================================');
}
