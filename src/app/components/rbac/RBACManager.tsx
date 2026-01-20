import React, { useState, useEffect } from 'react';
import { ModuleCard } from '../ModuleCard';
import { 
  Users, Shield, UserPlus, Edit, Trash2, Key, 
  Lock, Unlock, Search, Filter, MoreVertical, 
  ChevronDown, ChevronUp, RefreshCw, AlertCircle,
  CheckCircle2, XCircle, FileText, Settings
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  User, Role, Permission, RolePermissions, AuditLog 
} from '../../types/rbac';
import { rbacService } from '../../services/rbacService';

export const RBACManager: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermissions[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showAuditLogs, setShowAuditLogs] = useState(false);
  const [showPermissions, setShowPermissions] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<Role | ''>('');

  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    role: Role.USER,
    password: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setUsers(rbacService.getUsers());
    setRolePermissions(rbacService.getRolePermissions());
    setAuditLogs(rbacService.getAuditLogs(50));
  };

  const handleCreateUser = () => {
    if (!newUser.username || !newUser.email || !newUser.password) {
      toast.error('请填写完整信息');
      return;
    }

    try {
      rbacService.createUser({
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        permissions: rolePermissions.find(rp => rp.role === newUser.role)?.permissions || [],
        isActive: true
      });

      toast.success('用户创建成功');
      setShowCreateUser(false);
      setNewUser({ username: '', email: '', role: Role.USER, password: '' });
      loadData();
    } catch (error) {
      toast.error('用户创建失败');
    }
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm('确定要删除该用户吗？')) {
      try {
        rbacService.deleteUser(userId);
        toast.success('用户删除成功');
        loadData();
      } catch (error) {
        toast.error('用户删除失败');
      }
    }
  };

  const handleAssignRole = (userId: string, newRole: Role) => {
    try {
      rbacService.assignRole(userId, newRole);
      toast.success('角色分配成功');
      loadData();
    } catch (error) {
      toast.error('角色分配失败');
    }
  };

  const handleToggleUserStatus = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      rbacService.updateUser(userId, { isActive: !user.isActive });
      toast.success(user.isActive ? '用户已禁用' : '用户已启用');
      loadData();
    }
  };

  const getRoleColor = (role: Role): string => {
    switch (role) {
      case Role.SUPER_ADMIN: return 'bg-red-500/20 text-red-400';
      case Role.ADMIN: return 'bg-orange-500/20 text-orange-400';
      case Role.MANAGER: return 'bg-yellow-500/20 text-yellow-400';
      case Role.OPERATOR: return 'bg-blue-500/20 text-blue-400';
      case Role.USER: return 'bg-green-500/20 text-green-400';
      case Role.GUEST: return 'bg-gray-500/20 text-gray-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getRoleLabel = (role: Role): string => {
    switch (role) {
      case Role.SUPER_ADMIN: return '超级管理员';
      case Role.ADMIN: return '管理员';
      case Role.MANAGER: return '经理';
      case Role.OPERATOR: return '操作员';
      case Role.USER: return '用户';
      case Role.GUEST: return '访客';
      default: return role;
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !filterRole || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  return (
    <ModuleCard title="权限管理" level={1}>
      <div className="flex flex-col h-[700px] bg-[#2d3748] rounded-lg border border-gray-600 overflow-hidden shadow-2xl">
        
        {/* Toolbar */}
        <div className="flex items-center justify-between p-4 border-b border-gray-600 bg-[#374151]">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
              <input 
                type="text" 
                placeholder="搜索用户..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-[#4b5563] border border-gray-500 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-blue-500 transition-colors w-64"
              />
            </div>
            
            <select 
              className="bg-[#4b5563] border border-gray-500 rounded-lg py-2 px-4 text-sm focus:outline-none focus:border-blue-500"
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value as Role | '')}
            >
              <option value="">全部角色</option>
              {Object.values(Role).map(role => (
                <option key={role} value={role}>{getRoleLabel(role)}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPermissions(!showPermissions)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-sm font-medium ${
                showPermissions ? 'bg-purple-600 text-white' : 'bg-[#4b5563] text-gray-300 hover:bg-gray-600'
              }`}
            >
              <Shield size={16} />
              权限配置
              {showPermissions ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            <button
              onClick={() => setShowAuditLogs(!showAuditLogs)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-sm font-medium ${
                showAuditLogs ? 'bg-blue-600 text-white' : 'bg-[#4b5563] text-gray-300 hover:bg-gray-600'
              }`}
            >
              <FileText size={16} />
              审计日志
              {showAuditLogs ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            <button 
              onClick={loadData}
              className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors"
              title="刷新"
            >
              <RefreshCw size={18} />
            </button>
            <button 
              onClick={() => setShowCreateUser(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all text-sm font-medium"
            >
              <UserPlus size={16} />
              添加用户
            </button>
          </div>
        </div>

        {/* Permissions Panel */}
        {showPermissions && (
          <div className="p-4 border-b border-gray-600 bg-[#374151]/50">
            <div className="grid grid-cols-3 gap-4">
              {rolePermissions.map(rp => (
                <div key={rp.role} className="bg-[#4b5563] rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-white flex items-center gap-2">
                      <Shield size={16} className={getRoleColor(rp.role).split(' ')[1]} />
                      {getRoleLabel(rp.role)}
                    </h4>
                    <span className="text-xs text-gray-400">{rp.permissions.length} 权限</span>
                  </div>
                  <p className="text-xs text-gray-400 mb-3">{rp.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {rp.permissions.slice(0, 5).map(permission => (
                      <span 
                        key={permission}
                        className="text-xs bg-[#374151] text-gray-300 px-2 py-1 rounded"
                      >
                        {permission}
                      </span>
                    ))}
                    {rp.permissions.length > 5 && (
                      <span className="text-xs bg-[#374151] text-gray-400 px-2 py-1 rounded">
                        +{rp.permissions.length - 5}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Audit Logs Panel */}
        {showAuditLogs && (
          <div className="p-4 border-b border-gray-600 bg-[#374151]/50 max-h-64 overflow-auto">
            <h4 className="font-bold text-white mb-3 flex items-center gap-2">
              <FileText size={16} />
              最近审计日志
            </h4>
            <div className="space-y-2">
              {auditLogs.map(log => (
                <div key={log.id} className="flex items-center gap-3 bg-[#4b5563] rounded p-2 text-xs">
                  <span className="text-gray-400 w-32 shrink-0">
                    {new Date(log.timestamp).toLocaleString('zh-CN')}
                  </span>
                  <span className="font-medium text-white w-20 shrink-0">{log.username}</span>
                  <span className="text-blue-400 w-24 shrink-0">{log.action}</span>
                  <span className="text-gray-300 flex-1">{log.resource}</span>
                  {log.result === 'success' ? (
                    <CheckCircle2 size={14} className="text-green-400 shrink-0" />
                  ) : (
                    <XCircle size={14} className="text-red-400 shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Users Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full">
            <thead className="bg-[#374151] sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">用户</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">邮箱</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">角色</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">权限数</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">状态</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">创建时间</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-600">
              {filteredUsers.map(user => (
                <tr key={user.id} className="hover:bg-[#374151] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-white font-medium">{user.username}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-300 text-sm">{user.email}</td>
                  <td className="px-4 py-3">
                    <select 
                      value={user.role}
                      onChange={(e) => handleAssignRole(user.id, e.target.value as Role)}
                      className={`text-xs font-medium rounded px-2 py-1 focus:outline-none ${getRoleColor(user.role)}`}
                    >
                      {Object.values(Role).map(role => (
                        <option key={role} value={role}>{getRoleLabel(role)}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-gray-300 text-sm">{user.permissions.length}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleUserStatus(user.id)}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors ${
                        user.isActive 
                          ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' 
                          : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                      }`}
                    >
                      {user.isActive ? (
                        <>
                          <Unlock size={12} />
                          启用
                        </>
                      ) : (
                        <>
                          <Lock size={12} />
                          禁用
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {new Date(user.createdAt).toLocaleDateString('zh-CN')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedUser(user)}
                        className="p-1.5 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors"
                        title="查看详情"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="p-1.5 hover:bg-red-700 rounded text-gray-400 hover:text-red-400 transition-colors"
                        title="删除用户"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Create User Modal */}
        {showCreateUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowCreateUser(false)}>
            <div 
              className="bg-[#2d3748] rounded-lg border border-gray-600 max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-600">
                <h3 className="text-lg font-bold text-white">添加新用户</h3>
                <button 
                  onClick={() => setShowCreateUser(false)}
                  className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white"
                >
                  <XCircle size={20} />
                </button>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">用户名</label>
                  <input 
                    type="text" 
                    value={newUser.username}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    className="w-full bg-[#4b5563] border border-gray-500 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-blue-500"
                    placeholder="请输入用户名"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">邮箱</label>
                  <input 
                    type="email" 
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="w-full bg-[#4b5563] border border-gray-500 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-blue-500"
                    placeholder="请输入邮箱"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">密码</label>
                  <input 
                    type="password" 
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className="w-full bg-[#4b5563] border border-gray-500 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-blue-500"
                    placeholder="请输入密码"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">角色</label>
                  <select 
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value as Role })}
                    className="w-full bg-[#4b5563] border border-gray-500 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-blue-500"
                  >
                    {Object.values(Role).map(role => (
                      <option key={role} value={role}>{getRoleLabel(role)}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 p-4 border-t border-gray-600">
                <button 
                  onClick={() => setShowCreateUser(false)}
                  className="px-4 py-2 bg-[#4b5563] hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  取消
                </button>
                <button 
                  onClick={handleCreateUser}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  创建
                </button>
              </div>
            </div>
          </div>
        )}

        {/* User Detail Modal */}
        {selectedUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedUser(null)}>
            <div 
              className="bg-[#2d3748] rounded-lg border border-gray-600 max-w-lg w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-600">
                <h3 className="text-lg font-bold text-white">用户详情</h3>
                <button 
                  onClick={() => setSelectedUser(null)}
                  className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white"
                >
                  <XCircle size={20} />
                </button>
              </div>
              <div className="p-4 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl">
                    {selectedUser.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-white">{selectedUser.username}</h4>
                    <p className="text-gray-400">{selectedUser.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#4b5563] rounded-lg p-3">
                    <label className="block text-xs text-gray-400 mb-1">角色</label>
                    <div className={`text-sm font-medium ${getRoleColor(selectedUser.role)}`}>
                      {getRoleLabel(selectedUser.role)}
                    </div>
                  </div>
                  <div className="bg-[#4b5563] rounded-lg p-3">
                    <label className="block text-xs text-gray-400 mb-1">权限数量</label>
                    <div className="text-sm font-medium text-white">{selectedUser.permissions.length}</div>
                  </div>
                  <div className="bg-[#4b5563] rounded-lg p-3">
                    <label className="block text-xs text-gray-400 mb-1">状态</label>
                    <div className={`text-sm font-medium ${selectedUser.isActive ? 'text-green-400' : 'text-red-400'}`}>
                      {selectedUser.isActive ? '启用' : '禁用'}
                    </div>
                  </div>
                  <div className="bg-[#4b5563] rounded-lg p-3">
                    <label className="block text-xs text-gray-400 mb-1">创建时间</label>
                    <div className="text-sm font-medium text-white">
                      {new Date(selectedUser.createdAt).toLocaleString('zh-CN')}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">权限列表</label>
                  <div className="bg-[#4b5563] rounded-lg p-3 max-h-48 overflow-auto">
                    <div className="flex flex-wrap gap-2">
                      {selectedUser.permissions.map(permission => (
                        <span 
                          key={permission}
                          className="text-xs bg-[#374151] text-blue-300 px-2 py-1 rounded"
                        >
                          {permission}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ModuleCard>
  );
};
