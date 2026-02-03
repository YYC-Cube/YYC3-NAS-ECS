/**
 * @file Prompt模板管理服务实现
 * @description 实现Prompt模板的创建、编辑、保存、分类和调用功能
 * @module services/PromptTemplateService
 * @author YYC³
 * @version 1.0.0
 * @created 2025-01-19
 */

import { EventEmitter } from '@utils/EventEmitter';

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  content: string;
  variables: PromptVariable[];
  tags: string[];
  createdAt: number;
  updatedAt: number;
  usageCount: number;
  isFavorite: boolean;
}

export interface PromptVariable {
  name: string;
  type: 'text' | 'number' | 'boolean' | 'select';
  description: string;
  defaultValue?: string;
  required: boolean;
  options?: string[];
}

export interface TemplateCategory {
  id: string;
  name: string;
  description: string;
  icon?: string;
  color?: string;
}

export interface TemplateFilterOptions {
  category?: string;
  tags?: string[];
  searchQuery?: string;
  favoritesOnly?: boolean;
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'usageCount';
  sortOrder?: 'asc' | 'desc';
}

export interface CompiledTemplate {
  content: string;
  variables: Map<string, any>;
}

export class PromptTemplateService extends EventEmitter {
  private templates: Map<string, PromptTemplate> = new Map();
  private categories: Map<string, TemplateCategory> = new Map();
  private storageKey: string = 'yyc3-prompt-templates';
  private isInitialized: boolean = false;

  constructor(storageKey?: string) {
    super();
    if (storageKey) {
      this.storageKey = storageKey;
    }
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    await this.loadFromStorage();
    this.initializeDefaultCategories();
    this.initializeDefaultTemplates();

    this.isInitialized = true;
    this.emit('initialized');
  }

  private initializeDefaultCategories(): void {
    const defaultCategories: TemplateCategory[] = [
      {
        id: 'general',
        name: '通用',
        description: '通用Prompt模板',
        icon: '📝',
        color: '#3b82f6',
      },
      {
        id: 'coding',
        name: '编程',
        description: '编程相关Prompt模板',
        icon: '💻',
        color: '#10b981',
      },
      {
        id: 'writing',
        name: '写作',
        description: '写作相关Prompt模板',
        icon: '✍️',
        color: '#f59e0b',
      },
      {
        id: 'analysis',
        name: '分析',
        description: '数据分析Prompt模板',
        icon: '📊',
        color: '#8b5cf6',
      },
      {
        id: 'creative',
        name: '创意',
        description: '创意生成Prompt模板',
        icon: '🎨',
        color: '#ec4899',
      },
      {
        id: 'business',
        name: '商务',
        description: '商务相关Prompt模板',
        icon: '💼',
        color: '#6366f1',
      },
      {
        id: 'education',
        name: '教育',
        description: '教育学习Prompt模板',
        icon: '📚',
        color: '#14b8a6',
      },
    ];

    for (const category of defaultCategories) {
      this.categories.set(category.id, category);
    }
  }

  private initializeDefaultTemplates(): void {
    const defaultTemplates: PromptTemplate[] = [
      {
        id: 'code-review',
        name: '代码审查',
        description: '对代码进行全面的审查和分析',
        category: 'coding',
        content: `请对以下代码进行全面的审查和分析：

\`\`\`
{{code}}
\`\`\`

请从以下几个方面进行审查：
1. 代码质量和可读性
2. 潜在的bug和错误
3. 性能优化建议
4. 安全性考虑
5. 最佳实践建议

语言：{{language}}
审查深度：{{depth}}`,
        variables: [
          {
            name: 'code',
            type: 'text',
            description: '需要审查的代码',
            required: true,
          },
          {
            name: 'language',
            type: 'select',
            description: '编程语言',
            required: true,
            options: ['JavaScript', 'TypeScript', 'Python', 'Java', 'Go', 'Rust'],
            defaultValue: 'JavaScript',
          },
          {
            name: 'depth',
            type: 'select',
            description: '审查深度',
            required: true,
            options: ['基础', '标准', '详细'],
            defaultValue: '标准',
          },
        ],
        tags: ['代码', '审查', '质量'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        usageCount: 0,
        isFavorite: false,
      },
      {
        id: 'blog-post',
        name: '博客文章生成',
        description: '根据主题生成博客文章',
        category: 'writing',
        content: `请为一篇博客文章撰写内容，主题为：{{topic}}

文章要求：
- 标题：{{title}}
- 字数：{{wordCount}}字左右
- 风格：{{style}}
- 目标读者：{{audience}}

文章结构：
1. 引人入胜的开头
2. 清晰的主体段落
3. 有力的结尾

请确保内容原创、有价值且易于理解。`,
        variables: [
          {
            name: 'topic',
            type: 'text',
            description: '文章主题',
            required: true,
          },
          {
            name: 'title',
            type: 'text',
            description: '文章标题',
            required: true,
          },
          {
            name: 'wordCount',
            type: 'number',
            description: '目标字数',
            required: true,
            defaultValue: '1000',
          },
          {
            name: 'style',
            type: 'select',
            description: '写作风格',
            required: true,
            options: ['专业', '轻松', '幽默', '教育'],
            defaultValue: '专业',
          },
          {
            name: 'audience',
            type: 'text',
            description: '目标读者',
            required: true,
            defaultValue: '普通读者',
          },
        ],
        tags: ['博客', '写作', '内容生成'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        usageCount: 0,
        isFavorite: false,
      },
      {
        id: 'data-analysis',
        name: '数据分析',
        description: '对提供的数据进行分析和洞察',
        category: 'analysis',
        content: `请对以下数据进行分析：

数据：
{{data}}

分析要求：
- 分析维度：{{dimensions}}
- 关注指标：{{metrics}}
- 时间范围：{{timeRange}}

请提供：
1. 数据概览
2. 关键发现
3. 趋势分析
4. 异常检测
5. 可执行建议`,
        variables: [
          {
            name: 'data',
            type: 'text',
            description: '待分析的数据',
            required: true,
          },
          {
            name: 'dimensions',
            type: 'text',
            description: '分析维度',
            required: true,
            defaultValue: '时间、类别、地区',
          },
          {
            name: 'metrics',
            type: 'text',
            description: '关注指标',
            required: true,
            defaultValue: '销售额、用户数、转化率',
          },
          {
            name: 'timeRange',
            type: 'text',
            description: '时间范围',
            required: true,
            defaultValue: '最近30天',
          },
        ],
        tags: ['数据', '分析', '洞察'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        usageCount: 0,
        isFavorite: false,
      },
    ];

    for (const template of defaultTemplates) {
      if (!this.templates.has(template.id)) {
        this.templates.set(template.id, template);
      }
    }

    this.saveToStorage();
  }

  async createTemplate(template: Omit<PromptTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>): Promise<PromptTemplate> {
    const newTemplate: PromptTemplate = {
      ...template,
      id: this.generateId(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      usageCount: 0,
    };

    this.templates.set(newTemplate.id, newTemplate);
    await this.saveToStorage();

    this.emit('template:created', newTemplate);
    return newTemplate;
  }

  async updateTemplate(id: string, updates: Partial<PromptTemplate>): Promise<PromptTemplate> {
    const template = this.templates.get(id);
    if (!template) {
      throw new Error(`Template not found: ${id}`);
    }

    const updatedTemplate: PromptTemplate = {
      ...template,
      ...updates,
      id: template.id,
      createdAt: template.createdAt,
      updatedAt: Date.now(),
    };

    this.templates.set(id, updatedTemplate);
    await this.saveToStorage();

    this.emit('template:updated', updatedTemplate);
    return updatedTemplate;
  }

  async deleteTemplate(id: string): Promise<void> {
    const template = this.templates.get(id);
    if (!template) {
      throw new Error(`Template not found: ${id}`);
    }

    this.templates.delete(id);
    await this.saveToStorage();

    this.emit('template:deleted', template);
  }

  getTemplate(id: string): PromptTemplate | undefined {
    return this.templates.get(id);
  }

  getTemplates(options?: TemplateFilterOptions): PromptTemplate[] {
    let templates = Array.from(this.templates.values());

    if (options?.category) {
      templates = templates.filter(t => t.category === options.category);
    }

    if (options?.tags && options.tags.length > 0) {
      templates = templates.filter(t => 
        options.tags!.some(tag => t.tags.includes(tag))
      );
    }

    if (options?.searchQuery) {
      const query = options.searchQuery.toLowerCase();
      templates = templates.filter(t =>
        t.name.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        t.content.toLowerCase().includes(query)
      );
    }

    if (options?.favoritesOnly) {
      templates = templates.filter(t => t.isFavorite);
    }

    if (options?.sortBy) {
      templates.sort((a, b) => {
        const comparison = a[options.sortBy!] > b[options.sortBy!] ? 1 : -1;
        return options.sortOrder === 'desc' ? -comparison : comparison;
      });
    }

    return templates;
  }

  async compileTemplate(id: string, variables: Record<string, any>): Promise<CompiledTemplate> {
    const template = this.templates.get(id);
    if (!template) {
      throw new Error(`Template not found: ${id}`);
    }

    let content = template.content;
    const variableMap = new Map<string, any>();

    for (const variable of template.variables) {
      const value = variables[variable.name] ?? variable.defaultValue;
      
      if (variable.required && value === undefined) {
        throw new Error(`Required variable not provided: ${variable.name}`);
      }

      const placeholder = `{{${variable.name}}}`;
      content = content.replace(new RegExp(placeholder, 'g'), String(value));
      variableMap.set(variable.name, value);
    }

    template.usageCount++;
    template.updatedAt = Date.now();
    this.templates.set(id, template);
    await this.saveToStorage();

    this.emit('template:used', { templateId: id, variables });

    return { content, variables: variableMap };
  }

  async toggleFavorite(id: string): Promise<PromptTemplate> {
    const template = this.templates.get(id);
    if (!template) {
      throw new Error(`Template not found: ${id}`);
    }

    template.isFavorite = !template.isFavorite;
    template.updatedAt = Date.now();
    this.templates.set(id, template);
    await this.saveToStorage();

    this.emit('template:favorite-toggled', template);
    return template;
  }

  async duplicateTemplate(id: string): Promise<PromptTemplate> {
    const template = this.templates.get(id);
    if (!template) {
      throw new Error(`Template not found: ${id}`);
    }

    const duplicatedTemplate: PromptTemplate = {
      ...template,
      id: this.generateId(),
      name: `${template.name} (副本)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      usageCount: 0,
    };

    this.templates.set(duplicatedTemplate.id, duplicatedTemplate);
    await this.saveToStorage();

    this.emit('template:duplicated', duplicatedTemplate);
    return duplicatedTemplate;
  }

  getCategories(): TemplateCategory[] {
    return Array.from(this.categories.values());
  }

  getCategory(id: string): TemplateCategory | undefined {
    return this.categories.get(id);
  }

  async createCategory(category: Omit<TemplateCategory, 'id'>): Promise<TemplateCategory> {
    const newCategory: TemplateCategory = {
      ...category,
      id: this.generateId(),
    };

    this.categories.set(newCategory.id, newCategory);
    this.emit('category:created', newCategory);

    return newCategory;
  }

  async updateCategory(id: string, updates: Partial<TemplateCategory>): Promise<TemplateCategory> {
    const category = this.categories.get(id);
    if (!category) {
      throw new Error(`Category not found: ${id}`);
    }

    const updatedCategory: TemplateCategory = {
      ...category,
      ...updates,
      id: category.id,
    };

    this.categories.set(id, updatedCategory);
    this.emit('category:updated', updatedCategory);

    return updatedCategory;
  }

  async deleteCategory(id: string): Promise<void> {
    const category = this.categories.get(id);
    if (!category) {
      throw new Error(`Category not found: ${id}`);
    }

    this.categories.delete(id);

    const templatesInCategory = Array.from(this.templates.values()).filter(t => t.category === id);
    for (const template of templatesInCategory) {
      template.category = 'general';
      this.templates.set(template.id, template);
    }

    await this.saveToStorage();
    this.emit('category:deleted', category);
  }

  searchTemplates(query: string): PromptTemplate[] {
    return this.getTemplates({ searchQuery: query });
  }

  getPopularTemplates(limit: number = 10): PromptTemplate[] {
    return this.getTemplates({
      sortBy: 'usageCount',
      sortOrder: 'desc',
    }).slice(0, limit);
  }

  getRecentTemplates(limit: number = 10): PromptTemplate[] {
    return this.getTemplates({
      sortBy: 'updatedAt',
      sortOrder: 'desc',
    }).slice(0, limit);
  }

  getFavoriteTemplates(): PromptTemplate[] {
    return this.getTemplates({ favoritesOnly: true });
  }

  getTemplateStatistics(): {
    totalTemplates: number;
    templatesByCategory: Map<string, number>;
    totalUsage: number;
    favoriteCount: number;
  } {
    const templatesByCategory = new Map<string, number>();
    let totalUsage = 0;
    let favoriteCount = 0;

    for (const template of this.templates.values()) {
      const count = templatesByCategory.get(template.category) || 0;
      templatesByCategory.set(template.category, count + 1);
      totalUsage += template.usageCount;
      if (template.isFavorite) favoriteCount++;
    }

    return {
      totalTemplates: this.templates.size,
      templatesByCategory,
      totalUsage,
      favoriteCount,
    };
  }

  async importTemplates(templates: PromptTemplate[]): Promise<void> {
    for (const template of templates) {
      const existingTemplate = this.templates.get(template.id);
      if (existingTemplate) {
        await this.updateTemplate(template.id, template);
      } else {
        await this.createTemplate(template);
      }
    }

    this.emit('templates:imported', { count: templates.length });
  }

  async exportTemplates(templateIds?: string[]): Promise<PromptTemplate[]> {
    if (templateIds) {
      return templateIds
        .map(id => this.templates.get(id))
        .filter((t): t is PromptTemplate => t !== undefined);
    }
    return Array.from(this.templates.values());
  }

  private async saveToStorage(): Promise<void> {
    try {
      const data = {
        templates: Array.from(this.templates.entries()),
        categories: Array.from(this.categories.entries()),
      };
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save templates to storage:', error);
    }
  }

  private async loadFromStorage(): Promise<void> {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (data) {
        const parsed = JSON.parse(data);
        this.templates = new Map(parsed.templates || []);
        this.categories = new Map(parsed.categories || []);
      }
    } catch (error) {
      console.error('Failed to load templates from storage:', error);
    }
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  isInitialized(): boolean {
    return this.isInitialized;
  }
}
