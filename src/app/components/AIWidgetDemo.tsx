import React, { useState } from 'react';
import { useAIWidget } from '@/app/lib/ai-integration';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Bot, MessageSquare, Settings, Zap, Shield, Database, 
  Activity, Clock, CheckCircle, XCircle, AlertCircle 
} from 'lucide-react';

export default function AIWidgetDemo() {
  const { 
    isVisible, 
    isInitialized, 
    showWidget, 
    hideWidget, 
    toggleWidget,
    sendMessage,
    messages,
    sessions,
    activeSessionId,
    createSession,
    switchSession,
    deleteSession,
    messageBus,
    taskScheduler,
    stateManager,
    toolRegistry,
    knowledgeBase
  } = useAIWidget();

  const [messageInput, setMessageInput] = useState('');
  const [sessionName, setSessionName] = useState('');

  const handleSendMessage = async () => {
    if (messageInput.trim()) {
      await sendMessage(messageInput);
      setMessageInput('');
    }
  };

  const handleCreateSession = async () => {
    if (sessionName.trim()) {
      await createSession(sessionName);
      setSessionName('');
    }
  };

  const stats = [
    { label: '消息数量', value: messages.length, icon: MessageSquare },
    { label: '会话数量', value: sessions.length, icon: Database },
    { label: '消息总线', value: messageBus ? '已连接' : '未连接', icon: Zap },
    { label: '任务调度器', value: taskScheduler ? '已连接' : '未连接', icon: Activity },
    { label: '状态管理器', value: stateManager ? '已连接' : '未连接', icon: Shield },
    { label: '工具注册表', value: toolRegistry ? '已连接' : '未连接', icon: CheckCircle },
    { label: '知识库', value: knowledgeBase ? '已连接' : '未连接', icon: Database },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bot className="h-8 w-8 text-blue-600" />
            AI Widget 集成示例
          </h1>
          <p className="text-muted-foreground mt-2">
            展示AI Widget集成层的各种功能和特性
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={showWidget} disabled={isVisible}>
            显示 Widget
          </Button>
          <Button onClick={hideWidget} disabled={!isVisible} variant="outline">
            隐藏 Widget
          </Button>
          <Button onClick={toggleWidget} variant="secondary">
            切换 Widget
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.label}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs defaultValue="messages" className="space-y-4">
        <TabsList>
          <TabsTrigger value="messages">消息管理</TabsTrigger>
          <TabsTrigger value="sessions">会话管理</TabsTrigger>
          <TabsTrigger value="status">状态监控</TabsTrigger>
          <TabsTrigger value="config">配置选项</TabsTrigger>
        </TabsList>

        <TabsContent value="messages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>发送消息</CardTitle>
              <CardDescription>
                向AI Widget发送消息并查看响应
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="输入消息内容..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <Button onClick={handleSendMessage}>
                  发送
                </Button>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">消息历史</h4>
                {messages.length === 0 ? (
                  <p className="text-muted-foreground">暂无消息</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {messages.map((msg, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg ${
                          msg.role === 'user'
                            ? 'bg-blue-50 ml-8'
                            : 'bg-gray-50 mr-8'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={msg.role === 'user' ? 'default' : 'secondary'}>
                            {msg.role === 'user' ? '用户' : 'AI'}
                          </Badge>
                          {msg.timestamp && (
                            <span className="text-xs text-muted-foreground">
                              {new Date(msg.timestamp).toLocaleString()}
                            </span>
                          )}
                        </div>
                        <p className="text-sm">{msg.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>会话管理</CardTitle>
              <CardDescription>
                创建、切换和删除AI对话会话
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="输入会话名称..."
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateSession()}
                />
                <Button onClick={handleCreateSession}>
                  创建会话
                </Button>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">会话列表</h4>
                {sessions.length === 0 ? (
                  <p className="text-muted-foreground">暂无会话</p>
                ) : (
                  <div className="space-y-2">
                    {sessions.map((session) => (
                      <div
                        key={session.id}
                        className={`p-3 rounded-lg border ${
                          session.id === activeSessionId
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{session.name}</span>
                              {session.id === activeSessionId && (
                                <Badge variant="default">活跃</Badge>
                              )}
                            </div>
                            {session.createdAt && (
                              <p className="text-xs text-muted-foreground">
                                创建于 {new Date(session.createdAt).toLocaleString()}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => switchSession(session.id)}
                              disabled={session.id === activeSessionId}
                            >
                              切换
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => deleteSession(session.id)}
                              disabled={session.id === activeSessionId}
                            >
                              删除
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>状态监控</CardTitle>
              <CardDescription>
                监控AI Widget和各组件的运行状态
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <h4 className="font-semibold">Widget 状态</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">初始化状态</span>
                      <Badge variant={isInitialized ? 'default' : 'secondary'}>
                        {isInitialized ? '已初始化' : '未初始化'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">可见状态</span>
                      <Badge variant={isVisible ? 'default' : 'secondary'}>
                        {isVisible ? '可见' : '隐藏'}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">组件连接状态</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">消息总线</span>
                      {messageBus ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">任务调度器</span>
                      {taskScheduler ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">状态管理器</span>
                      {stateManager ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">工具注册表</span>
                      {toolRegistry ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">知识库</span>
                      {knowledgeBase ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>配置选项</CardTitle>
              <CardDescription>
                AI Widget的配置和功能说明
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Bot className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <h4 className="font-semibold">智能对话</h4>
                    <p className="text-sm text-muted-foreground">
                      支持多轮对话、上下文理解和智能回复
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Zap className="h-5 w-5 text-yellow-500 mt-0.5" />
                  <div>
                    <h4 className="font-semibold">消息总线</h4>
                    <p className="text-sm text-muted-foreground">
                      高性能消息传递系统，支持优先级和历史记录
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Activity className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h4 className="font-semibold">任务调度</h4>
                    <p className="text-sm text-muted-foreground">
                      智能任务调度和执行，支持优先级和依赖管理
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-purple-500 mt-0.5" />
                  <div>
                    <h4 className="font-semibold">状态管理</h4>
                    <p className="text-sm text-muted-foreground">
                      持久化状态管理，支持快照和版本控制
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Database className="h-5 w-5 text-orange-500 mt-0.5" />
                  <div>
                    <h4 className="font-semibold">知识库</h4>
                    <p className="text-sm text-muted-foreground">
                      集成知识库，支持语义搜索和知识推理
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
