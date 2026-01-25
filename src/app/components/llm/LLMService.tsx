/**
 * @file LLMService - 大语言模型服务组件
 * @description 提供基于大语言模型的智能对话服务，支持多模态交互和智能推荐
 * @module components/llm
 * @author YYC³
 * @version 1.0.0
 * @created 2026-01-24
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  Send, 
  Bot, 
  User, 
  Loader2, 
  Sparkles,
  RefreshCw,
  Settings,
  Trash2,
  Copy
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { toast } from 'sonner';
import { PromptTemplateManager } from './PromptTemplateManager';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface Model {
  name: string;
  size: string;
  modified_at: string;
}

export const LLMService: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState('qwen:7b');
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('你是一个有用的AI助手，可以帮助用户管理NAS系统。');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadModels();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isStreaming]);

  const loadModels = async () => {
    try {
      const response = await fetch('/api/v2/llm/tags');
      if (response.ok) {
        const data = await response.json();
        if (data.models) {
          setModels(data.models);
          if (data.models.length > 0) {
            setSelectedModel(data.models[0].name);
          }
        }
      }
    } catch (error) {
      console.error('Load models error:', error);
      toast.error('加载模型列表失败');
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) {
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setIsStreaming(true);

    try {
      const response = await fetch('/api/v2/llm/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: selectedModel,
          prompt: input.trim(),
          stream: true
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate response');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }

      const decoder = new TextDecoder();
      let assistantContent = '';
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMessage]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.trim() === '') continue;
          
          try {
            const data = JSON.parse(line);
            if (data.response) {
              assistantContent += data.response;
              setMessages(prev => 
                prev.map(msg => 
                  msg.id === assistantMessage.id 
                    ? { ...msg, content: assistantContent }
                    : msg
                )
              );
            }
          } catch (e) {
            console.error('Parse error:', e);
          }
        }
      }

      setIsStreaming(false);
      setIsLoading(false);
    } catch (error) {
      console.error('Send message error:', error);
      toast.error('发送消息失败');
      setIsStreaming(false);
      setIsLoading(false);
    }
  };

  const clearMessages = () => {
    setMessages([]);
    toast.success('对话已清空');
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success('已复制到剪贴板');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col bg-white">
      {/* 顶部工具栏 */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Bot className="h-6 w-6 text-blue-600" />
            <h1 className="text-xl font-semibold">AI智能助手</h1>
          </div>
          <Badge variant="secondary">
            {models.length} 个模型
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="chat" className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-4">
          <TabsTrigger value="chat">对话</TabsTrigger>
          <TabsTrigger value="templates">
            <Sparkles className="h-4 w-4 mr-1" />
            模板管理
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="flex-1 flex flex-col m-0">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowSettings(!showSettings)}
                title="设置"
              >
                <Settings className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={loadModels}
                title="刷新模型"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={clearMessages}
                title="清空对话"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

      {/* 设置面板 */}
      {showSettings && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="border-b bg-gray-50"
        >
          <Card className="m-4">
            <CardHeader>
              <CardTitle className="text-sm">AI助手设置</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">选择模型</label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full border rounded-md px-3 py-2"
                >
                  {models.map(model => (
                    <option key={model.name} value={model.name}>
                      {model.name} ({model.size})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">系统提示词</label>
                <textarea
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 min-h-[80px]"
                  placeholder="输入系统提示词..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">API Key</label>
                <Input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="输入API Key..."
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* 消息列表 */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div ref={scrollRef} className="p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <Sparkles className="h-16 w-16 mb-4 opacity-20" />
                <p className="text-lg">开始与AI助手对话</p>
                <p className="text-sm mt-2">我可以帮助您管理NAS系统、解答问题等</p>
              </div>
            ) : (
              messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      message.role === 'user' ? 'bg-blue-600' : 'bg-green-600'
                    }`}
                  >
                    {message.role === 'user' ? (
                      <User className="h-5 w-5 text-white" />
                    ) : (
                      <Bot className="h-5 w-5 text-white" />
                    )}
                  </div>
                  <div
                    className={`max-w-[70%] rounded-lg p-4 ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="whitespace-pre-wrap flex-1">{message.content}</p>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyMessage(message.content)}
                        className="shrink-0 h-6 w-6"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <div
                      className={`text-xs mt-2 ${
                        message.role === 'user' ? 'text-blue-200' : 'text-gray-500'
                      }`}
                    >
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
            {isStreaming && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-3"
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-green-600">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <div className="bg-gray-100 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-600" />
                    <span className="text-sm text-gray-600">AI正在思考...</span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* 输入区域 */}
      <div className="p-4 border-t bg-gray-50">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="输入消息... (Enter发送，Shift+Enter换行)"
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
          <span>当前模型: {selectedModel}</span>
          <span>流式输出: {isStreaming ? '启用' : '禁用'}</span>
        </div>
      </div>
      </TabsContent>
      
      <TabsContent value="templates" className="flex-1 overflow-y-auto m-0">
        <PromptTemplateManager />
      </TabsContent>
      </Tabs>
    </div>
  );
};

export default LLMService;