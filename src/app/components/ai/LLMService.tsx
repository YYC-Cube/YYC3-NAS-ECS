import React, { useState } from 'react';
import { ModuleCard } from '../ModuleCard';
import { Bot, Key, Sparkles, Plus, Edit2 } from 'lucide-react';

export const LLMService: React.FC = () => {
  const [prompts] = useState([
    { id: 1, name: '日志分析专家', type: 'System', content: 'You are an expert system administrator...' },
    { id: 2, name: 'FRP 配置生成', type: 'Config', content: 'Generate FRP configuration based on...' },
    { id: 3, name: '邮件回复助手', type: 'Email', content: 'Draft a professional email reply...' },
  ]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 模型配置 */}
      <ModuleCard title="模型配置" level={1}>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-600 block mb-1">Provider</label>
            <div className="relative">
              <Bot className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <select className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white">
                <option>OpenAI (GPT-4)</option>
                <option>Local Llama 3</option>
                <option>Azure OpenAI</option>
                <option>Anthropic Claude 3.5</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-600 block mb-1">API Key</label>
            <div className="relative">
              <Key className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <input 
                type="password" 
                value="sk-xxxxxxxx" 
                readOnly
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" 
              />
            </div>
          </div>
          <button className="w-full py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors">
            保存配置
          </button>
        </div>
      </ModuleCard>

      {/* Prompt 工作台 */}
      <div className="lg:col-span-2">
        <ModuleCard title="Prompt 模板管理" level={1}>
          <div className="mb-4 flex justify-between items-center">
            <span className="text-sm text-gray-500">管理系统预设提示词</span>
            <button className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700">
              <Plus size={16} /> 新增模板
            </button>
          </div>
          <div className="space-y-3">
            {prompts.map((prompt) => (
              <div 
                key={prompt.id} 
                className="group p-4 border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50/30 transition cursor-pointer"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-blue-500" />
                    <span className="font-bold text-gray-800">{prompt.name}</span>
                  </div>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                    {prompt.type}
                  </span>
                </div>
                <p className="text-sm text-gray-500 line-clamp-2 pl-6 font-mono bg-gray-50 p-2 rounded">
                  {prompt.content}
                </p>
                <div className="mt-2 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="text-xs text-gray-500 hover:text-blue-600 flex items-center gap-1">
                    <Edit2 size={12} /> 编辑
                  </button>
                </div>
              </div>
            ))}
          </div>
        </ModuleCard>
      </div>
    </div>
  );
};
