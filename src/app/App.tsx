import React, { useState } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/Layout';
import { MonitorPanel } from './components/dashboard/MonitorPanel';
import { ConfigManager } from './components/frp/ConfigManager';
import { LogViewer } from './components/logs/LogViewer';
import { LLMService } from './components/ai/LLMService';
import { RBAC } from './components/system/RBAC';
import { EmailService } from './components/email/EmailService';
import { ModuleCard } from './components/ModuleCard';

import { NasManager } from './components/nas/NasManager';
import { DraggableAIAssistant } from './components/ai/DraggableAIAssistant';
import { DDNSService } from './components/ddns/DDNSService';
import { APIModule } from './components/api/APIModule';

// Placeholder components for services not yet implemented

const BackupService = () => (
  <ModuleCard title="备份与恢复" level={1}>
    <div className="p-8 text-center text-gray-500">系统备份模块正在开发中...</div>
  </ModuleCard>
);

const SettingsPage = () => (
  <ModuleCard title="系统设置" level={1}>
    <div className="p-8 text-center text-gray-500">全局设置模块正在开发中...</div>
  </ModuleCard>
);

const HelpPage = () => (
  <ModuleCard title="帮助中心" level={1}>
    <div className="p-8 text-center text-gray-500">帮助文档与支持...</div>
  </ModuleCard>
);

export default function App() {
  const [currentPath, setCurrentPath] = useState('/');

  const renderContent = () => {
    switch (currentPath) {
      case '/':
        return <MonitorPanel />;
      case '/mail':
        // Show both Email List (User View) and Email Service (Admin View) in tabs or stacked?
        // For now, let's render EmailList as the main view, and maybe a button to toggle Admin view?
        // Or render EmailService (The Admin Dashboard requested in prompt D)
        // The prompt D specifically asks for "Email Service" view with queues.
        // I'll render the Admin EmailService for "/mail" as it matches the "Services" context of other menu items.
        // But the user upgraded "Email Example" (likely EmailList) to "Enterprise System".
        // Let's render EmailList by default as it's the "App", and maybe put EmailService stats at the top of it?
        // To be safe and follow the specific component request D, I'll render EmailService here.
        // Wait, "Email entry moved to left... name: MAIL Service".
        // If I replace EmailList with EmailService (stats), I lose the inbox.
        // I will render a combination or a tab switcher if possible.
        // Let's render the Admin Dashboard (EmailService) as that seems to be the "New" requirement for the "Service" menu.
        // Actually, let's render EmailService (the new component).
        return <EmailService />; 
      case '/frp':
        return <ConfigManager />;
      case '/llm':
        return <LLMService />;
      case '/ddns':
        return <DDNSService />;
      case '/nas':
        return <NasManager />;
      case '/api':
        return <APIModule />;
      case '/system/logs':
        return <LogViewer />;
      case '/system/rbac':
        return <RBAC />;
      case '/system/backup':
        return <BackupService />;
      case '/settings':
        return <SettingsPage />;
      case '/help':
        return <HelpPage />;
      default:
        return <MonitorPanel />;
    }
  };

  return (
    <ThemeProvider>
      <Layout currentPath={currentPath} onNavigate={setCurrentPath}>
        {renderContent()}
        <DraggableAIAssistant />
      </Layout>
    </ThemeProvider>
  );
}
