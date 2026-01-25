import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Sparkles, 
  Plus, 
  Edit, 
  Trash2, 
  Copy, 
  Save, 
  X, 
  Search, 
  Star,
  StarOff,
  Play,
  FileText,
  Code,
  MessageSquare,
  Briefcase,
  GraduationCap,
  Lightbulb
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  category: 'general' | 'code' | 'writing' | 'business' | 'education' | 'creative';
  prompt: string;
  variables: string[];
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
  usageCount: number;
}

const defaultTemplates: PromptTemplate[] = [
  {
    id: '1',
    name: '代码审查',
    description: '审查代码并提供改进建议',
    category: 'code',
    prompt: '请审查以下代码，并提供改进建议：\n\n```{language}\n{code}\n```\n\n请从以下几个方面进行审查：\n1. 代码质量和可读性\n2. 性能优化\n3. 安全性\n4. 最佳实践\n5. 潜在的bug',
    variables: ['language', 'code'],
    isFavorite: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    usageCount: 42
  },
  {
    id: '2',
    name: '文档生成',
    description: '根据代码生成API文档',
    category: 'code',
    prompt: '请为以下代码生成详细的API文档：\n\n```{language}\n{code}\n```\n\n文档应包含：\n1. 函数/方法描述\n2. 参数说明\n3. 返回值说明\n4. 使用示例\n5. 注意事项',
    variables: ['language', 'code'],
    isFavorite: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    usageCount: 28
  },
  {
    id: '3',
    name: '邮件撰写',
    description: '撰写专业的商务邮件',
    category: 'business',
    prompt: '请撰写一封专业的商务邮件：\n\n收件人：{recipient}\n主题：{subject}\n目的：{purpose}\n\n邮件要求：\n1. 语气专业礼貌\n2. 内容简洁明了\n3. 结构清晰\n4. 包含必要的行动号召',
    variables: ['recipient', 'subject', 'purpose'],
    isFavorite: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    usageCount: 35
  },
  {
    id: '4',
    name: '学习计划',
    description: '制定个性化学习计划',
    category: 'education',
    prompt: '请为我制定一个{subject}的学习计划：\n\n学习目标：{goal}\n可用时间：{time}\n当前水平：{level}\n\n计划应包含：\n1. 学习阶段划分\n2. 每个阶段的学习内容\n3. 推荐的学习资源\n4. 学习方法和技巧\n5. 进度检查点',
    variables: ['subject', 'goal', 'time', 'level'],
    isFavorite: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    usageCount: 18
  },
  {
    id: '5',
    name: '创意写作',
    description: '激发创意写作灵感',
    category: 'creative',
    prompt: '请帮我进行创意写作：\n\n主题：{topic}\n风格：{style}\n篇幅：{length}\n\n要求：\n1. 内容富有创意\n2. 语言生动有趣\n3. 结构完整\n4. 符合指定风格',
    variables: ['topic', 'style', 'length'],
    isFavorite: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    usageCount: 56
  },
  {
    id: '6',
    name: '问题解决',
    description: '分析和解决技术问题',
    category: 'general',
    prompt: '请帮我分析和解决以下技术问题：\n\n问题描述：{problem}\n\n请提供：\n1. 问题分析\n2. 可能的原因\n3. 解决方案\n4. 预防措施\n5. 相关资源',
    variables: ['problem'],
    isFavorite: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    usageCount: 67
  }
];

export const PromptTemplateManager: React.FC = () => {
  const [templates, setTemplates] = useState<PromptTemplate[]>(defaultTemplates);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PromptTemplate | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<PromptTemplate | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const filteredTemplates = useMemo(() => {
    let filtered = [...templates];

    if (searchQuery) {
      filtered = filtered.filter(t =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(t => t.category === selectedCategory);
    }

    if (showFavoritesOnly) {
      filtered = filtered.filter(t => t.isFavorite);
    }

    filtered.sort((a, b) => b.usageCount - a.usageCount);
    return filtered;
  }, [templates, searchQuery, selectedCategory, showFavoritesOnly]);

  const loadTemplates = useCallback(async () => {
    try {
      const saved = localStorage.getItem('prompt-templates');
      if (saved) {
        setTemplates(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Load templates error:', error);
    }
  }, []);

  const saveTemplates = useCallback(async (newTemplates: PromptTemplate[]) => {
    try {
      localStorage.setItem('prompt-templates', JSON.stringify(newTemplates));
      setTemplates(newTemplates);
    } catch (error) {
      console.error('Save templates error:', error);
      toast.error('保存模板失败');
    }
  }, []);

  const handleCreateTemplate = useCallback(() => {
    const newTemplate: PromptTemplate = {
      id: Date.now().toString(),
      name: '新模板',
      description: '模板描述',
      category: 'general',
      prompt: '',
      variables: [],
      isFavorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0
    };
    setEditingTemplate(newTemplate);
    setIsDialogOpen(true);
  }, []);

  const handleEditTemplate = useCallback((template: PromptTemplate) => {
    setEditingTemplate({ ...template });
    setIsDialogOpen(true);
  }, []);

  const handleSaveTemplate = useCallback(() => {
    if (!editingTemplate) return;

    if (!editingTemplate.name.trim()) {
      toast.error('模板名称不能为空');
      return;
    }

    if (!editingTemplate.prompt.trim()) {
      toast.error('模板内容不能为空');
      return;
    }

    const existingIndex = templates.findIndex(t => t.id === editingTemplate.id);
    let newTemplates: PromptTemplate[];

    if (existingIndex >= 0) {
      newTemplates = [...templates];
      newTemplates[existingIndex] = {
        ...editingTemplate,
        updatedAt: new Date().toISOString()
      };
      toast.success('模板已更新');
    } else {
      newTemplates = [...templates, editingTemplate];
      toast.success('模板已创建');
    }

    saveTemplates(newTemplates);
    setIsDialogOpen(false);
    setEditingTemplate(null);
  }, [editingTemplate, templates, saveTemplates]);

  const handleDeleteTemplate = useCallback((id: string) => {
    const newTemplates = templates.filter(t => t.id !== id);
    saveTemplates(newTemplates);
    toast.success('模板已删除');
  }, [templates, saveTemplates]);

  const handleToggleFavorite = useCallback((id: string) => {
    const newTemplates = templates.map(t =>
      t.id === id ? { ...t, isFavorite: !t.isFavorite } : t
    );
    saveTemplates(newTemplates);
  }, [templates, saveTemplates]);

  const handleCopyTemplate = useCallback((template: PromptTemplate) => {
    navigator.clipboard.writeText(template.prompt);
    toast.success('模板已复制到剪贴板');
    const newTemplates = templates.map(t =>
      t.id === template.id ? { ...t, usageCount: t.usageCount + 1 } : t
    );
    saveTemplates(newTemplates);
  }, [templates, saveTemplates]);

  const handleUseTemplate = useCallback((template: PromptTemplate) => {
    const newTemplates = templates.map(t =>
      t.id === template.id ? { ...t, usageCount: t.usageCount + 1 } : t
    );
    saveTemplates(newTemplates);
    toast.success('模板已应用');
  }, [templates, saveTemplates]);

  const getCategoryIcon = useCallback((category: PromptTemplate['category']) => {
    switch (category) {
      case 'code':
        return <Code className="h-4 w-4" />;
      case 'business':
        return <Briefcase className="h-4 w-4" />;
      case 'education':
        return <GraduationCap className="h-4 w-4" />;
      case 'creative':
        return <Lightbulb className="h-4 w-4" />;
      case 'writing':
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  }, []);

  const getCategoryColor = useCallback((category: PromptTemplate['category']) => {
    switch (category) {
      case 'code':
        return 'bg-blue-500';
      case 'business':
        return 'bg-green-500';
      case 'education':
        return 'bg-purple-500';
      case 'creative':
        return 'bg-pink-500';
      case 'writing':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  }, []);

  const extractVariables = useCallback((prompt: string): string[] => {
    const matches = prompt.match(/\{(\w+)\}/g);
    return matches ? [...new Set(matches.map(m => m.slice(1, -1)))] : [];
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            Prompt模板管理
          </CardTitle>
          <CardDescription>
            创建和管理可重用的Prompt模板，提高AI对话效率
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="搜索模板..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="选择分类" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部分类</SelectItem>
                <SelectItem value="general">通用</SelectItem>
                <SelectItem value="code">代码</SelectItem>
                <SelectItem value="writing">写作</SelectItem>
                <SelectItem value="business">商务</SelectItem>
                <SelectItem value="education">教育</SelectItem>
                <SelectItem value="creative">创意</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant={showFavoritesOnly ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            >
              {showFavoritesOnly ? <Star className="h-4 w-4 mr-2 fill-current" /> : <StarOff className="h-4 w-4 mr-2" />}
              收藏
            </Button>
            <Button onClick={handleCreateTemplate}>
              <Plus className="h-4 w-4 mr-2" />
              新建模板
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {filteredTemplates.map((template) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              layout
            >
              <Card className="h-full hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(template.category)}
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleFavorite(template.id)}
                    >
                      {template.isFavorite ? (
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ) : (
                        <StarOff className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Badge className={getCategoryColor(template.category)}>
                        {template.category}
                      </Badge>
                      <Badge variant="outline">
                        使用 {template.usageCount} 次
                      </Badge>
                    </div>
                    
                    {template.variables.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {template.variables.map((variable: string, index: number) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {`{${variable}}`}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleCopyTemplate(template)}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        复制
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleEditTemplate(template)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        编辑
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPreviewTemplate(template)}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteTemplate(template.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate && templates.find(t => t.id === editingTemplate.id) ? '编辑模板' : '新建模板'}
            </DialogTitle>
            <DialogDescription>
              创建或编辑Prompt模板，使用 {`{variable}`} 格式定义变量
            </DialogDescription>
          </DialogHeader>
          {editingTemplate && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="template-name">模板名称</Label>
                <Input
                  id="template-name"
                  value={editingTemplate.name}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                  placeholder="输入模板名称"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="template-description">描述</Label>
                <Input
                  id="template-description"
                  value={editingTemplate.description}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, description: e.target.value })}
                  placeholder="输入模板描述"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="template-category">分类</Label>
                <Select
                  value={editingTemplate.category}
                  onValueChange={(value: any) => setEditingTemplate({ ...editingTemplate, category: value })}
                >
                  <SelectTrigger id="template-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">通用</SelectItem>
                    <SelectItem value="code">代码</SelectItem>
                    <SelectItem value="writing">写作</SelectItem>
                    <SelectItem value="business">商务</SelectItem>
                    <SelectItem value="education">教育</SelectItem>
                    <SelectItem value="creative">创意</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="template-prompt">模板内容</Label>
                <Textarea
                  id="template-prompt"
                  value={editingTemplate.prompt}
                  onChange={(e) => {
                    const newPrompt = e.target.value;
                    setEditingTemplate({
                      ...editingTemplate,
                      prompt: newPrompt,
                      variables: extractVariables(newPrompt)
                    });
                  }}
                  placeholder="输入模板内容，使用 {variable} 格式定义变量"
                  className="min-h-[200px] font-mono text-sm"
                />
              </div>

              {editingTemplate.variables.length > 0 && (
                <div className="space-y-2">
                  <Label>检测到的变量</Label>
                  <div className="flex flex-wrap gap-2">
                    {editingTemplate.variables.map((variable, index) => (
                      <Badge key={index} variant="secondary">
                        {`{${variable}}`}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  <X className="h-4 w-4 mr-2" />
                  取消
                </Button>
                <Button onClick={handleSaveTemplate}>
                  <Save className="h-4 w-4 mr-2" />
                  保存
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{previewTemplate?.name}</DialogTitle>
            <DialogDescription>{previewTemplate?.description}</DialogDescription>
          </DialogHeader>
          {previewTemplate && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <pre className="whitespace-pre-wrap text-sm font-mono">{previewTemplate.prompt}</pre>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setPreviewTemplate(null)}>
                  关闭
                </Button>
                <Button onClick={() => {
                  handleUseTemplate(previewTemplate);
                  setPreviewTemplate(null);
                }}>
                  <Play className="h-4 w-4 mr-2" />
                  使用模板
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
