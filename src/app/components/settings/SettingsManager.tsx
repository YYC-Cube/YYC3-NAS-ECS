import React, { useState, useEffect } from 'react';
import { ModuleCard } from '../ModuleCard';
import { 
  Settings, Save, RefreshCw, Search, ChevronDown, ChevronUp,
  Shield, Bell, Palette, Network, HardDrive, Zap,
  FileText, Database, Code, Info, CheckCircle2,
  XCircle, Lock, Unlock, Eye, EyeOff, Download
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  SystemSetting, SettingGroup, SettingCategory, SettingType
} from '../../types/settings';
import { settingsService } from '../../services/settingsService';

export const SettingsManager: React.FC = () => {
  const [groups, setGroups] = useState<SettingGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<SettingGroup | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});
  const [modifiedSettings, setModifiedSettings] = useState<Record<string, any>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setGroups(settingsService.getSettingGroups());
  };

  const handleUpdateSetting = (settingId: string, value: any) => {
    setModifiedSettings({ ...modifiedSettings, [settingId]: value });
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      for (const [settingId, value] of Object.entries(modifiedSettings)) {
        await settingsService.updateSetting(settingId, value);
      }
      toast.success('设置保存成功');
      setModifiedSettings({});
      loadData();
    } catch (error) {
      toast.error('设置保存失败');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetSetting = async (settingId: string) => {
    try {
      await settingsService.resetSetting(settingId);
      toast.success('设置重置成功');
      loadData();
    } catch (error) {
      toast.error('设置重置失败');
    }
  };

  const handleResetAllSettings = async () => {
    if (!confirm('确定要重置所有设置吗？此操作不可撤销。')) {
      return;
    }

    try {
      await settingsService.resetAllSettings();
      toast.success('所有设置已重置');
      loadData();
    } catch (error) {
      toast.error('设置重置失败');
    }
  };

  const handleExportSettings = () => {
    try {
      const settings = settingsService.exportSettings();
      const blob = new Blob([settings], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `settings-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('设置导出成功');
    } catch (error) {
      toast.error('设置导出失败');
    }
  };

  const getIconComponent = (iconName: string) => {
    const icons: Record<string, any> = {
      Settings,
      Shield,
      Bell,
      Palette,
      Network,
      HardDrive,
      Zap,
      FileText,
      Database,
      Code
    };
    return icons[iconName] || Settings;
  };

  const getCategoryColor = (category: SettingCategory): string => {
    switch (category) {
      case SettingCategory.GENERAL: return 'bg-blue-500/20 text-blue-400';
      case SettingCategory.SECURITY: return 'bg-red-500/20 text-red-400';
      case SettingCategory.NOTIFICATION: return 'bg-purple-500/20 text-purple-400';
      case SettingCategory.APPEARANCE: return 'bg-pink-500/20 text-pink-400';
      case SettingCategory.NETWORK: return 'bg-cyan-500/20 text-cyan-400';
      case SettingCategory.STORAGE: return 'bg-orange-500/20 text-orange-400';
      case SettingCategory.PERFORMANCE: return 'bg-yellow-500/20 text-yellow-400';
      case SettingCategory.LOGGING: return 'bg-green-500/20 text-green-400';
      case SettingCategory.BACKUP: return 'bg-indigo-500/20 text-indigo-400';
      case SettingCategory.API: return 'bg-teal-500/20 text-teal-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const renderSettingInput = (setting: SystemSetting) => {
    const value = modifiedSettings[setting.id] !== undefined 
      ? modifiedSettings[setting.id] 
      : setting.value;

    switch (setting.type) {
      case SettingType.STRING:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleUpdateSetting(setting.id, e.target.value)}
            className="w-full bg-[#4b5563] border border-gray-500 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-blue-500"
            placeholder={setting.description}
          />
        );

      case SettingType.NUMBER:
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleUpdateSetting(setting.id, parseInt(e.target.value))}
            min={setting.min}
            max={setting.max}
            step={setting.step}
            className="w-full bg-[#4b5563] border border-gray-500 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-blue-500"
          />
        );

      case SettingType.BOOLEAN:
        return (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={value}
              onChange={(e) => handleUpdateSetting(setting.id, e.target.checked)}
              className="w-5 h-5 rounded"
            />
            <span className="text-sm text-gray-300">
              {value ? '启用' : '禁用'}
            </span>
          </label>
        );

      case SettingType.SELECT:
        return (
          <select
            value={value}
            onChange={(e) => handleUpdateSetting(setting.id, e.target.value)}
            className="w-full bg-[#4b5563] border border-gray-500 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-blue-500"
          >
            {setting.options?.map((option, idx) => (
              <option key={idx} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case SettingType.PASSWORD:
        return (
          <div className="relative">
            <input
              type={showPassword[setting.id] ? 'text' : 'password'}
              value={value}
              onChange={(e) => handleUpdateSetting(setting.id, e.target.value)}
              className="w-full bg-[#4b5563] border border-gray-500 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-blue-500 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword({ ...showPassword, [setting.id]: !showPassword[setting.id] })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
            >
              {showPassword[setting.id] ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        );

      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleUpdateSetting(setting.id, e.target.value)}
            className="w-full bg-[#4b5563] border border-gray-500 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-blue-500"
          />
        );
    }
  };

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const hasModifications = Object.keys(modifiedSettings).length > 0;

  return (
    <ModuleCard title="系统设置" level={1}>
      <div className="flex flex-col h-[700px] bg-[#2d3748] rounded-lg border border-gray-600 overflow-hidden shadow-2xl">
        
        {/* Toolbar */}
        <div className="flex items-center justify-between p-4 border-b border-gray-600 bg-[#374151]">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
              <input 
                type="text" 
                placeholder="搜索设置..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-[#4b5563] border border-gray-500 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-blue-500 transition-colors w-64"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={loadData}
              className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors"
              title="刷新"
            >
              <RefreshCw size={18} />
            </button>
            <button 
              onClick={handleExportSettings}
              className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors"
              title="导出设置"
            >
              <Download size={18} />
            </button>
            <button 
              onClick={handleResetAllSettings}
              className="p-2 hover:bg-red-700 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
              title="重置所有设置"
            >
              <XCircle size={18} />
            </button>
            <button 
              onClick={handleSaveSettings}
              disabled={!hasModifications || isSaving}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-sm font-medium ${
                hasModifications 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              } disabled:opacity-50`}
            >
              {isSaving ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  保存中...
                </>
              ) : (
                <>
                  <Save size={16} />
                  保存设置
                </>
              )}
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-64 border-r border-gray-600 bg-[#374151]/30 overflow-auto">
            {filteredGroups.map(group => (
              <button
                key={group.id}
                onClick={() => setSelectedGroup(group)}
                className={`w-full text-left px-4 py-3 border-b border-gray-600/50 transition-colors ${
                  selectedGroup?.id === group.id 
                    ? 'bg-[#4b5563] text-white' 
                    : 'text-gray-300 hover:bg-[#4b5563]/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  {React.createElement(getIconComponent(group.icon), { 
                    size: 18, 
                    className: selectedGroup?.id === group.id ? 'text-blue-400' : 'text-gray-500' 
                  })}
                  <div className="flex-1">
                    <div className="font-medium text-sm">{group.name}</div>
                    <div className="text-xs text-gray-500">{group.description}</div>
                  </div>
                  {selectedGroup?.id === group.id ? (
                    <ChevronUp size={16} className="text-gray-500" />
                  ) : (
                    <ChevronDown size={16} className="text-gray-500" />
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Settings Panel */}
          <div className="flex-1 overflow-auto p-6">
            {!selectedGroup ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <Settings size={64} className="mb-4 opacity-50" />
                <p className="text-lg">请选择一个设置分类</p>
                <p className="text-sm mt-2">从左侧选择要查看和修改的设置</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  {React.createElement(getIconComponent(selectedGroup.icon), { 
                    size: 32, 
                    className: `text-blue-400 ${getCategoryColor(selectedGroup.category)}` 
                  })}
                  <div>
                    <h2 className="text-xl font-bold text-white">{selectedGroup.name}</h2>
                    <p className="text-sm text-gray-400">{selectedGroup.description}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {selectedGroup.settings.map(setting => (
                    <div key={setting.id} className="bg-[#4b5563] rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <label className="font-medium text-white">{setting.label}</label>
                            {setting.required && (
                              <span className="text-red-400 text-xs">*</span>
                            )}
                            {setting.sensitive && (
                              <Lock size={14} className="text-yellow-400" />
                            )}
                          </div>
                          <p className="text-xs text-gray-400 mt-1">{setting.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {modifiedSettings[setting.id] !== undefined && (
                            <CheckCircle2 size={16} className="text-blue-400" />
                          )}
                          <button
                            onClick={() => handleResetSetting(setting.id)}
                            className="p-1 hover:bg-gray-700 rounded text-gray-500 hover:text-gray-300 transition-colors"
                            title="重置为默认值"
                          >
                            <RefreshCw size={14} />
                          </button>
                        </div>
                      </div>
                      <div className="mt-3">
                        {renderSettingInput(setting)}
                      </div>
                      {setting.type === SettingType.NUMBER && (setting.min !== undefined || setting.max !== undefined) && (
                        <div className="text-xs text-gray-500 mt-2">
                          {setting.min !== undefined && `最小值: ${setting.min}`}
                          {setting.min !== undefined && setting.max !== undefined && ' | '}
                          {setting.max !== undefined && `最大值: ${setting.max}`}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ModuleCard>
  );
};
