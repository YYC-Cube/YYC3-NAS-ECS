import { useState } from 'react';
import { Layout } from './app/components/Layout';
import { AIWidgetProvider, IntelligentAIWidgetWrapper } from './app/lib/ai-integration';
import { MonitorPanel } from './app/components/dashboard/MonitorPanel';
import { Mailbox } from './app/components/email/Mailbox';
import { ConfigManager } from './app/components/frp/ConfigManager';
import { LLMService } from './app/components/llm/LLMService';
import { DDNSService } from './app/components/ddns/DDNSService';
import { NasManager } from './app/components/nas/NasManager';
import { APIModule } from './app/components/api/APIModule';
import { RBAC } from './app/components/system/RBAC';
import { BackupManager } from './app/components/backup/BackupManager';
import { SettingsManager } from './app/components/settings/SettingsManager';
import { HelpCenter } from './app/components/help/HelpCenter';
import { LogViewer } from './app/components/logs/LogViewer';
import AIWidgetDemo from './app/components/AIWidgetDemo';

type Route = '/' | '/mail' | '/frp' | '/llm' | '/ddns' | '/nas' | '/api' | '/system/logs' | '/system/rbac' | '/system/backup' | '/settings' | '/help' | '/ai-demo';

export default function App() {
  const [currentPath, setCurrentPath] = useState<Route>('/');

  const handleNavigate = (path: string) => {
    setCurrentPath(path as Route);
    window.scrollTo(0, 0);
  };

  const renderContent = () => {
    switch (currentPath) {
      case '/':
        return <MonitorPanel />;
      case '/mail':
        return <Mailbox />;
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
        return <BackupManager />;
      case '/settings':
        return <SettingsManager />;
      case '/help':
        return <HelpCenter />;
      case '/ai-demo':
        return <AIWidgetDemo />;
      default:
        return <MonitorPanel />;
    }
  };

  return (
    <AIWidgetProvider autoInitialize={true}>
      <Layout currentPath={currentPath} onNavigate={handleNavigate}>
        {renderContent()}
      </Layout>
      <IntelligentAIWidgetWrapper />
    </AIWidgetProvider>
  );
}
