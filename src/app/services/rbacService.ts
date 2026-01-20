import { logService } from './logService';
import { LogCategory, LogLevel } from '../types/logs';
import { 
  Role, Permission, User, RolePermissions, 
  RoleAssignment, PermissionCheck, AccessControlPolicy, AuditLog 
} from '../types/rbac';

class RBACService {
  private users: User[] = [];
  private policies: AccessControlPolicy[] = [];
  private auditLogs: AuditLog[] = [];
  private currentUser: User | null = null;
  private storageKey = 'yyc3-rbac-data';
  private isLocalStorageAvailable: boolean = false;

  constructor() {
    this.checkLocalStorageAvailability();
    this.initialize();
  }

  private checkLocalStorageAvailability(): void {
    try {
      const testKey = '__yyc3_storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      this.isLocalStorageAvailable = true;
    } catch (error) {
      console.warn('localStorage is not available:', error);
      this.isLocalStorageAvailable = false;
    }
  }

  private initialize(): void {
    if (this.isLocalStorageAvailable) {
      this.loadFromStorage();
    }
    this.ensureDefaultUsers();
    this.ensureDefaultPolicies();
  }

  private loadFromStorage(): void {
    if (!this.isLocalStorageAvailable) {
      return;
    }

    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        this.users = data.users || [];
        this.policies = data.policies || [];
        this.auditLogs = data.auditLogs || [];
      }
    } catch (error) {
      console.error('Failed to load RBAC data:', error);
    }
  }

  private saveToStorage(): void {
    if (!this.isLocalStorageAvailable) {
      return;
    }

    try {
      const data = {
        users: this.users,
        policies: this.policies,
        auditLogs: this.auditLogs
      };
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save RBAC data:', error);
    }
  }

  private ensureDefaultUsers(): void {
    if (this.users.length === 0) {
      const defaultUsers: User[] = [
        {
          id: 'admin-001',
          username: 'admin',
          email: 'admin@0379.email',
          role: Role.SUPER_ADMIN,
          permissions: Object.values(Permission),
          createdAt: new Date().toISOString(),
          isActive: true
        },
        {
          id: 'user-001',
          username: 'operator',
          email: 'operator@0379.email',
          role: Role.OPERATOR,
          permissions: [
            Permission.DASHBOARD_VIEW,
            Permission.MONITORING_VIEW,
            Permission.EMAIL_VIEW,
            Permission.EMAIL_SEND,
            Permission.FRP_VIEW,
            Permission.LLM_VIEW,
            Permission.LLM_CHAT,
            Permission.DDNS_VIEW,
            Permission.NAS_VIEW,
            Permission.API_VIEW,
            Permission.LOGS_VIEW,
            Permission.SETTINGS_VIEW
          ],
          createdAt: new Date().toISOString(),
          isActive: true
        }
      ];
      this.users = defaultUsers;
      this.saveToStorage();
    }
  }

  private ensureDefaultPolicies(): void {
    if (this.policies.length === 0) {
      const defaultPolicies: AccessControlPolicy[] = [
        {
          id: 'policy-001',
          name: '超级管理员策略',
          description: '超级管理员拥有所有权限',
          roles: [Role.SUPER_ADMIN],
          permissions: Object.values(Permission),
          isActive: true
        },
        {
          id: 'policy-002',
          name: '管理员策略',
          description: '管理员拥有大部分管理权限',
          roles: [Role.ADMIN],
          permissions: [
            Permission.DASHBOARD_VIEW,
            Permission.DASHBOARD_EDIT,
            Permission.MONITORING_VIEW,
            Permission.MONITORING_EDIT,
            Permission.MONITORING_ALERTS,
            Permission.EMAIL_VIEW,
            Permission.EMAIL_SEND,
            Permission.EMAIL_DELETE,
            Permission.EMAIL_MANAGE,
            Permission.FRP_VIEW,
            Permission.FRP_CREATE,
            Permission.FRP_EDIT,
            Permission.FRP_DELETE,
            Permission.LLM_VIEW,
            Permission.LLM_CHAT,
            Permission.LLM_MANAGE,
            Permission.DDNS_VIEW,
            Permission.DDNS_EDIT,
            Permission.NAS_VIEW,
            Permission.NAS_EDIT,
            Permission.API_VIEW,
            Permission.API_EDIT,
            Permission.LOGS_VIEW,
            Permission.LOGS_EXPORT,
            Permission.LOGS_DELETE,
            Permission.BACKUP_VIEW,
            Permission.BACKUP_CREATE,
            Permission.BACKUP_RESTORE,
            Permission.SETTINGS_VIEW,
            Permission.SETTINGS_EDIT,
            Permission.SYSTEM_VIEW
          ],
          isActive: true
        },
        {
          id: 'policy-003',
          name: '操作员策略',
          description: '操作员拥有基本的操作权限',
          roles: [Role.OPERATOR],
          permissions: [
            Permission.DASHBOARD_VIEW,
            Permission.MONITORING_VIEW,
            Permission.EMAIL_VIEW,
            Permission.EMAIL_SEND,
            Permission.FRP_VIEW,
            Permission.LLM_VIEW,
            Permission.LLM_CHAT,
            Permission.DDNS_VIEW,
            Permission.NAS_VIEW,
            Permission.API_VIEW,
            Permission.LOGS_VIEW,
            Permission.SETTINGS_VIEW
          ],
          isActive: true
        },
        {
          id: 'policy-004',
          name: '用户策略',
          description: '普通用户拥有基本的查看权限',
          roles: [Role.USER],
          permissions: [
            Permission.DASHBOARD_VIEW,
            Permission.MONITORING_VIEW,
            Permission.EMAIL_VIEW,
            Permission.FRP_VIEW,
            Permission.LLM_VIEW,
            Permission.LLM_CHAT,
            Permission.DDNS_VIEW,
            Permission.NAS_VIEW,
            Permission.API_VIEW,
            Permission.LOGS_VIEW,
            Permission.SETTINGS_VIEW
          ],
          isActive: true
        },
        {
          id: 'policy-005',
          name: '访客策略',
          description: '访客拥有有限的查看权限',
          roles: [Role.GUEST],
          permissions: [
            Permission.DASHBOARD_VIEW,
            Permission.MONITORING_VIEW
          ],
          isActive: true
        }
      ];
      this.policies = defaultPolicies;
      this.saveToStorage();
    }
  }

  login(username: string, password: string): User | null {
    const user = this.users.find(u => 
      u.username === username && u.isActive
    );

    if (user) {
      this.currentUser = user;
      this.logAudit({
        userId: user.id,
        username: user.username,
        action: 'LOGIN',
        resource: 'system',
        result: 'success'
      });
      return user;
    }

    this.logAudit({
      userId: 'unknown',
      username: username,
      action: 'LOGIN',
      resource: 'system',
      result: 'failure',
      details: { reason: 'Invalid credentials' }
    });

    return null;
  }

  logout(): void {
    if (this.currentUser) {
      this.logAudit({
        userId: this.currentUser.id,
        username: this.currentUser.username,
        action: 'LOGOUT',
        resource: 'system',
        result: 'success'
      });
      this.currentUser = null;
    }
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  hasPermission(permission: Permission): boolean {
    if (!this.currentUser) {
      return false;
    }

    return this.currentUser.permissions.includes(permission);
  }

  hasAnyPermission(permissions: Permission[]): boolean {
    return permissions.some(permission => this.hasPermission(permission));
  }

  hasAllPermissions(permissions: Permission[]): boolean {
    return permissions.every(permission => this.hasPermission(permission));
  }

  checkPermission(check: PermissionCheck): boolean {
    if (!this.currentUser) {
      return false;
    }

    const hasPermission = this.currentUser.permissions.includes(check.permission);

    if (!hasPermission) {
      return false;
    }

    const policy = this.policies.find(p => 
      p.roles.includes(this.currentUser!.role) && 
      p.isActive
    );

    if (!policy || !policy.conditions) {
      return true;
    }

    return this.checkConditions(policy.conditions);
  }

  private checkConditions(conditions: any): boolean {
    if (conditions.timeRange) {
      const now = new Date();
      const start = new Date(conditions.timeRange.start);
      const end = new Date(conditions.timeRange.end);
      if (now < start || now > end) {
        return false;
      }
    }

    return true;
  }

  getUsers(): User[] {
    return [...this.users];
  }

  getUserById(id: string): User | undefined {
    return this.users.find(u => u.id === id);
  }

  createUser(userData: Omit<User, 'id' | 'createdAt'>): User {
    const usernameExists = this.users.some(u => u.username === userData.username);
    if (usernameExists) {
      throw new Error('Username already exists');
    }

    const emailExists = this.users.some(u => u.email === userData.email);
    if (emailExists) {
      throw new Error('Email already exists');
    }

    const newUser: User = {
      ...userData,
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString()
    };

    this.users.push(newUser);
    this.saveToStorage();

    this.logAudit({
      userId: this.currentUser?.id || 'system',
      username: this.currentUser?.username || 'system',
      action: 'CREATE_USER',
      resource: 'user',
      result: 'success',
      details: { targetUserId: newUser.id }
    });

    return newUser;
  }

  updateUser(id: string, updates: Partial<User>): User | null {
    const index = this.users.findIndex(u => u.id === id);
    if (index === -1) {
      return null;
    }

    this.users[index] = { ...this.users[index], ...updates };
    this.saveToStorage();

    this.logAudit({
      userId: this.currentUser?.id || 'system',
      username: this.currentUser?.username || 'system',
      action: 'UPDATE_USER',
      resource: 'user',
      result: 'success',
      details: { targetUserId: id, updates }
    });

    return this.users[index];
  }

  deleteUser(id: string): boolean {
    const user = this.users.find(u => u.id === id);
    if (!user) {
      return false;
    }

    if (user.role === Role.SUPER_ADMIN) {
      return false;
    }

    const index = this.users.findIndex(u => u.id === id);
    if (index === -1) {
      return false;
    }

    this.users.splice(index, 1);
    this.saveToStorage();

    this.logAudit({
      userId: this.currentUser?.id || 'system',
      username: this.currentUser?.username || 'system',
      action: 'DELETE_USER',
      resource: 'user',
      result: 'success',
      details: { targetUserId: id }
    });

    return true;
  }

  assignRole(userId: string, role: Role): boolean {
    const user = this.users.find(u => u.id === userId);
    if (!user) {
      return false;
    }

    const policy = this.policies.find(p => 
      p.roles.includes(role) && p.isActive
    );

    if (!policy) {
      return false;
    }

    user.role = role;
    user.permissions = policy.permissions;
    this.saveToStorage();

    this.logAudit({
      userId: this.currentUser?.id || 'system',
      username: this.currentUser?.username || 'system',
      action: 'ASSIGN_ROLE',
      resource: 'user',
      result: 'success',
      details: { targetUserId: userId, newRole: role }
    });

    return true;
  }

  getPolicies(): AccessControlPolicy[] {
    return [...this.policies];
  }

  getPolicyById(id: string): AccessControlPolicy | undefined {
    return this.policies.find(p => p.id === id);
  }

  createPolicy(policy: Omit<AccessControlPolicy, 'id'>): AccessControlPolicy {
    const newPolicy: AccessControlPolicy = {
      ...policy,
      id: `policy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    this.policies.push(newPolicy);
    this.saveToStorage();

    this.logAudit({
      userId: this.currentUser?.id || 'system',
      username: this.currentUser?.username || 'system',
      action: 'CREATE_POLICY',
      resource: 'policy',
      result: 'success',
      details: { policyId: newPolicy.id }
    });

    return newPolicy;
  }

  updatePolicy(id: string, updates: Partial<AccessControlPolicy>): AccessControlPolicy | null {
    const index = this.policies.findIndex(p => p.id === id);
    if (index === -1) {
      return null;
    }

    this.policies[index] = { ...this.policies[index], ...updates };
    this.saveToStorage();

    this.logAudit({
      userId: this.currentUser?.id || 'system',
      username: this.currentUser?.username || 'system',
      action: 'UPDATE_POLICY',
      resource: 'policy',
      result: 'success',
      details: { policyId: id, updates }
    });

    return this.policies[index];
  }

  deletePolicy(id: string): boolean {
    const index = this.policies.findIndex(p => p.id === id);
    if (index === -1) {
      return false;
    }

    this.policies.splice(index, 1);
    this.saveToStorage();

    this.logAudit({
      userId: this.currentUser?.id || 'system',
      username: this.currentUser?.username || 'system',
      action: 'DELETE_POLICY',
      resource: 'policy',
      result: 'success',
      details: { policyId: id }
    });

    return true;
  }

  getAuditLogs(limit?: number): AuditLog[] {
    const logs = [...this.auditLogs].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    return limit ? logs.slice(0, limit) : logs;
  }

  private logAudit(log: Omit<AuditLog, 'id' | 'timestamp'>): void {
    const auditLog: AuditLog = {
      ...log,
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    };

    this.auditLogs.push(auditLog);

    if (this.auditLogs.length > 10000) {
      this.auditLogs = this.auditLogs.slice(-10000);
    }

    this.saveToStorage();
    
    // Also log to centralized log service
    logService.addLog({
      category: LogCategory.AUTH,
      level: log.result === 'success' ? LogLevel.INFO : LogLevel.ERROR,
      message: `RBAC ${log.action}: ${log.resource}`,
      details: {
        action: log.action,
        resource: log.resource,
        result: log.result,
        userId: log.userId,
        username: log.username,
        ...log.details
      },
      userId: log.userId
    });
  }

  getRolePermissions(): RolePermissions[] {
    return [
      {
        role: Role.SUPER_ADMIN,
        permissions: Object.values(Permission),
        description: '超级管理员：拥有所有权限'
      },
      {
        role: Role.ADMIN,
        permissions: this.policies.find(p => p.roles.includes(Role.ADMIN))?.permissions || [],
        description: '管理员：拥有大部分管理权限'
      },
      {
        role: Role.MANAGER,
        permissions: this.policies.find(p => p.roles.includes(Role.MANAGER))?.permissions || [],
        description: '经理：拥有部门管理权限'
      },
      {
        role: Role.OPERATOR,
        permissions: this.policies.find(p => p.roles.includes(Role.OPERATOR))?.permissions || [],
        description: '操作员：拥有基本操作权限'
      },
      {
        role: Role.USER,
        permissions: this.policies.find(p => p.roles.includes(Role.USER))?.permissions || [],
        description: '用户：拥有基本查看权限'
      },
      {
        role: Role.GUEST,
        permissions: this.policies.find(p => p.roles.includes(Role.GUEST))?.permissions || [],
        description: '访客：拥有有限查看权限'
      }
    ];
  }
}

export { RBACService };
export const rbacService = new RBACService();
