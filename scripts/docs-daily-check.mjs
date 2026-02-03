#!/usr/bin/env node

/**
 * @file 文档每日自动检查脚本
 * @description 执行文档的每日自动检查，包括链接有效性、格式规范等
 * @module scripts/docs-daily-check
 * @author YYC³
 * @version 1.0.0
 * @created 2026-01-31
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const DOCS_DIR = path.join(PROJECT_ROOT, 'docs');

interface CheckResult {
  passed: boolean;
  errors: Array<{
    ruleId: string;
    message: string;
    file: string;
    line?: number;
    suggestion?: string;
  }>;
  warnings: Array<{
    ruleId: string;
    message: string;
    file: string;
    suggestion?: string;
  }>;
}

interface DocFile {
  path: string;
  name: string;
  content: string;
}

async function findDocFiles(): Promise<DocFile[]> {
  const files: DocFile[] = [];
  
  function walkDir(dir: string) {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        walkDir(fullPath);
      } else if (item.endsWith('.md') || item.endsWith('.mdx')) {
        files.push({
          path: fullPath,
          name: item,
          content: fs.readFileSync(fullPath, 'utf-8')
        });
      }
    }
  }
  
  walkDir(DOCS_DIR);
  return files;
}

function checkFileExistence(files: DocFile[]): CheckResult {
  const errors = [];
  const warnings = [];
  
  for (const file of files) {
    const content = file.content;
    
    const filePathMatches = content.match(/file:\/\/([^)\s\)]+)/g);
    if (filePathMatches) {
      for (const match of filePathMatches) {
        const filePath = match[1];
        const fullPath = path.join(PROJECT_ROOT, filePath);
        
        if (!fs.existsSync(fullPath)) {
          errors.push({
            ruleId: 'DOC-001',
            message: `文件不存在: ${filePath}`,
            file: file.name,
            suggestion: `请创建文件 ${filePath} 或移除相关引用`
          });
        }
      }
    }
  }
  
  return {
    passed: errors.length === 0,
    errors,
    warnings
  };
}

function checkLinkValidity(files: DocFile[]): CheckResult {
  const errors = [];
  const warnings = [];
  
  for (const file of files) {
    const content = file.content;
    
    const httpLinks = content.match(/https?:\/\/[^\s\)]+/g);
    if (httpLinks) {
      for (const link of httpLinks) {
        try {
          const url = new URL(link);
          if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
            continue;
          }
          
          warnings.push({
            ruleId: 'DOC-002',
            message: `外部链接需要验证: ${link}`,
            file: file.name,
            suggestion: '请手动验证此链接的有效性'
          });
        } catch (error) {
          errors.push({
            ruleId: 'DOC-002',
            message: `无效的链接格式: ${link}`,
            file: file.name,
            suggestion: '请修正链接格式'
          });
        }
      }
    }
  }
  
  return {
    passed: errors.length === 0,
    errors,
    warnings
  };
}

function checkMarkdownFormat(files: DocFile[]): CheckResult {
  const errors = [];
  const warnings = [];
  
  for (const file of files) {
    const lines = file.content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;
      
      if (line.trim().startsWith('#')) {
        const match = line.match(/^(#+)\s+(.+)/);
        if (match) {
          const level = match[1].length;
          const title = match[2].trim();
          
          if (level === 1 && !title.includes('YYC³')) {
            warnings.push({
              ruleId: 'DOC-003',
              message: '一级标题未包含 YYC³ 标识',
              file: file.name,
              line: lineNum,
              suggestion: '建议在标题中包含 YYC³ 标识'
            });
          }
          
          if (title.length > 100) {
            warnings.push({
              ruleId: 'DOC-003',
              message: `标题过长: ${title.length} 字符`,
              file: file.name,
              line: lineNum,
              suggestion: '建议缩短标题长度'
            });
          }
        }
      }
      
      if (line.includes('```')) {
        const codeBlockMatch = line.match(/```(\w*)/);
        if (codeBlockMatch && !codeBlockMatch[1]) {
          warnings.push({
            ruleId: 'DOC-004',
            message: '代码块未指定语言',
            file: file.name,
            line: lineNum,
            suggestion: '建议为代码块指定语言标识，如 ```typescript'
          });
        }
      }
    }
  }
  
  return {
    passed: errors.length === 0,
    errors,
    warnings
  };
}

function checkVersionConsistency(files: DocFile[]): CheckResult {
  const errors = [];
  const warnings = [];
  
  const versionPattern = /\*\*版本\*\*:\s*(\d+\.\d+\.\d+)/;
  const docVersions = new Map<string, string[]>();
  
  for (const file of files) {
    const match = file.content.match(versionPattern);
    if (match) {
      const version = match[1];
      const fileName = file.name;
      
      if (!docVersions.has(version)) {
        docVersions.set(version, []);
      }
      docVersions.get(version)!.push(fileName);
    }
  }
  
  for (const [version, fileList] of docVersions.entries()) {
    if (fileList.length > 1) {
      const relatedDocs = fileList.join(', ');
      warnings.push({
        ruleId: 'DOC-005',
        message: `多个文档使用相同版本号: ${version}`,
        file: relatedDocs,
        suggestion: '建议检查相关文档是否需要同步版本号'
      });
    }
  }
  
  return {
    passed: errors.length === 0,
    errors,
    warnings
  };
}

function checkCodeExamples(files: DocFile[]): CheckResult {
  const errors = [];
  const warnings = [];
  
  for (const file of files) {
    const content = file.content;
    
    const codeBlocks = content.match(/```[\s\S]*?\n([\s\S]*?)\n```/g);
    if (codeBlocks) {
      for (const block of codeBlocks) {
        const code = block.replace(/```[\s\S]*?\n/, '').replace(/\n```$/, '');
        
        if (code.includes('import') && !code.includes('from')) {
          errors.push({
            ruleId: 'DOC-006',
            message: '代码示例中的 import 语句不完整',
            file: file.name,
            suggestion: '请检查 import 语句是否包含 from 子句'
          });
        }
        
        if (code.includes('// TODO') || code.includes('// FIXME')) {
          warnings.push({
            ruleId: 'DOC-007',
            message: '代码示例包含 TODO 或 FIXME 注释',
            file: file.name,
            suggestion: '建议在发布前完成或移除这些注释'
          });
        }
      }
    }
  }
  
  return {
    passed: errors.length === 0,
    errors,
    warnings
  };
}

function checkMetadata(files: DocFile[]): CheckResult {
  const errors = [];
  const warnings = [];
  
  for (const file of files) {
    const content = file.content;
    
    const hasVersion = /\*\*版本\*\*:/.test(content);
    const hasAuthor = /\*\*作者\*\*:/.test(content);
    const hasCreated = /\*\*创建日期\*\*:/.test(content);
    const hasUpdated = /\*\*更新日期\*\*:/.test(content);
    
    if (!hasVersion) {
      errors.push({
        ruleId: 'DOC-008',
        message: '文档缺少版本号',
        file: file.name,
        suggestion: '请在文档头部添加版本号，格式: **版本**: 1.0.0'
      });
    }
    
    if (!hasAuthor) {
      warnings.push({
        ruleId: 'DOC-008',
        message: '文档缺少作者信息',
        file: file.name,
        suggestion: '建议在文档头部添加作者信息'
      });
    }
    
    if (!hasCreated) {
      warnings.push({
        ruleId: 'DOC-008',
        message: '文档缺少创建日期',
        file: file.name,
        suggestion: '建议在文档头部添加创建日期'
      });
    }
  }
  
  return {
    passed: errors.length === 0,
    errors,
    warnings
  };
}

function generateReport(results: Map<string, CheckResult>): string {
  let report = '# 文档每日检查报告\n\n';
  report += `**检查时间**: ${new Date().toISOString()}\n`;
  report += `**检查文件数**: ${results.size}\n\n`;
  
  let totalErrors = 0;
  let totalWarnings = 0;
  
  for (const [ruleName, result] of results.entries()) {
    report += `## ${ruleName}\n\n`;
    report += `**状态**: ${result.passed ? '✅ 通过' : '❌ 失败'}\n\n`;
    
    if (result.errors.length > 0) {
      report += '### 错误\n\n';
      for (const error of result.errors) {
        report += `- **[${error.ruleId}]** ${error.message}\n`;
        if (error.line) {
          report += `  - 位置: ${error.file}:${error.line}\n`;
        }
        if (error.suggestion) {
          report += `  - 建议: ${error.suggestion}\n`;
        }
      }
      totalErrors += result.errors.length;
    }
    
    if (result.warnings.length > 0) {
      report += '### 警告\n\n';
      for (const warning of result.warnings) {
        report += `- **[${warning.ruleId}]** ${warning.message}\n`;
        if (warning.suggestion) {
          report += `  - 建议: ${warning.suggestion}\n`;
        }
      }
      totalWarnings += result.warnings.length;
    }
    
    report += '\n';
  }
  
  report += '## 总结\n\n';
  report += `| 指标 | 数值 |\n`;
  report += `|------|------|\n`;
  report += `| 检查规则数 | ${results.size} |\n`;
  report += `| 错误总数 | ${totalErrors} |\n`;
  report += `| 警告总数 | ${totalWarnings} |\n`;
  report += `| 检查状态 | ${totalErrors === 0 ? '✅ 通过' : '❌ 失败'} |\n\n`;
  
  if (totalErrors > 0) {
    report += '## 后续行动\n\n';
    report += '1. 立即修复所有错误\n';
    report += '2. 评估警告的严重性\n';
    report += '3. 更新相关文档\n';
    report += '4. 重新运行检查脚本\n';
  }
  
  return report;
}

async function main() {
  console.log('🔍 开始执行文档每日检查...\n');
  
  try {
    const files = await findDocFiles();
    console.log(`📁 找到 ${files.length} 个文档文件\n`);
    
    const results = new Map<string, CheckResult>();
    
    console.log('🔍 检查文件存在性...');
    results.set('文件存在性检查', checkFileExistence(files));
    
    console.log('🔗 检查链接有效性...');
    results.set('链接有效性检查', checkLinkValidity(files));
    
    console.log('📝 检查 Markdown 格式...');
    results.set('Markdown 格式检查', checkMarkdownFormat(files));
    
    console.log('🔢 检查版本一致性...');
    results.set('版本一致性检查', checkVersionConsistency(files));
    
    console.log('💻 检查代码示例...');
    results.set('代码示例检查', checkCodeExamples(files));
    
    console.log('📋 检查文档元数据...');
    results.set('文档元数据检查', checkMetadata(files));
    
    console.log('\n📊 生成检查报告...');
    const report = generateReport(results);
    
    const reportPath = path.join(DOCS_DIR, 'reviews', 'daily');
    if (!fs.existsSync(reportPath)) {
      fs.mkdirSync(reportPath, { recursive: true });
    }
    
    const reportFileName = `daily-check-${new Date().toISOString().split('T')[0]}.md`;
    const reportFilePath = path.join(reportPath, reportFileName);
    fs.writeFileSync(reportFilePath, report, 'utf-8');
    
    console.log(`\n✅ 检查完成！报告已保存到: ${reportFilePath}\n`);
    
    const totalErrors = Array.from(results.values()).reduce((sum, r) => sum + r.errors.length, 0);
    const totalWarnings = Array.from(results.values()).reduce((sum, r) => sum + r.warnings.length, 0);
    
    console.log(`📊 检查结果:`);
    console.log(`   错误: ${totalErrors}`);
    console.log(`   警告: ${totalWarnings}`);
    console.log(`   状态: ${totalErrors === 0 ? '✅ 通过' : '❌ 失败'}\n`);
    
    if (totalErrors > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ 检查过程中发生错误:', error);
    process.exit(1);
  }
}

main();
