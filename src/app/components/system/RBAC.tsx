/**
 * @file RBAC - 基于角色的访问控制组件
 * @description 提供用户管理、角色分配、权限控制等功能
 * @module components/system
 * @author YYC³
 * @version 1.0.0
 * @created 2026-01-24
 */

import React from 'react';
import { ModuleCard } from '../ModuleCard';
import { Shield, Edit, Plus } from 'lucide-react';

export const RBAC: React.FC = () => {
  const users = [
    { id: 1, name: 'Admin User', email: 'admin@company.com', role: 'Super Admin', active: true },
    { id: 2, name: 'Dev Ops', email: 'ops@company.com', role: 'Operator', active: true },
    { id: 3, name: 'John Doe', email: 'john@company.com', role: 'Viewer', active: true },
    { id: 4, name: 'Jane Smith', email: 'jane@company.com', role: 'Editor', active: false },
  ];

  return (
    <ModuleCard title="用户与权限管理" level={1}>
      <div className="flex justify-end mb-4">
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium">
          <Plus size={16} /> 新增用户
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-sm text-gray-500 border-b border-gray-200">
              <th className="py-3 pl-2">用户</th>
              <th className="py-3">角色</th>
              <th className="py-3">状态</th>
              <th className="py-3 text-right pr-2">操作</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors group">
                <td className="py-3 pl-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                      {user.name[0]}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{user.name}</div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="py-3">
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium border border-purple-200">
                    <Shield size={10} />
                    {user.role}
                  </span>
                </td>
                <td className="py-3">
                  <span className={`flex items-center gap-1 text-sm ${user.active ? 'text-green-600' : 'text-gray-400'}`}>
                    <span className={`w-2 h-2 rounded-full ${user.active ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                    {user.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="py-3 text-right pr-2">
                  <button className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition-colors opacity-0 group-hover:opacity-100">
                    <Edit size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ModuleCard>
  );
};
