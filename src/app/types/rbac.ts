export enum Permission {
  // Dashboard permissions
  DASHBOARD_VIEW = 'dashboard:view',
  DASHBOARD_EDIT = 'dashboard:edit',

  // Monitoring permissions
  MONITORING_VIEW = 'monitoring:view',
  MONITORING_EDIT = 'monitoring:edit',
  MONITORING_ALERTS = 'monitoring:alerts',

  // Email permissions
  EMAIL_VIEW = 'email:view',
  EMAIL_SEND = 'email:send',
  EMAIL_DELETE = 'email:delete',
  EMAIL_MANAGE = 'email:manage',

  // FRP permissions
  FRP_VIEW = 'frp:view',
  FRP_CREATE = 'frp:create',
  FRP_EDIT = 'frp:edit',
  FRP_DELETE = 'frp:delete',
  FRP_MANAGE = 'frp:manage',

  // LLM permissions
  LLM_VIEW = 'llm:view',
  LLM_CHAT = 'llm:chat',
  LLM_MANAGE = 'llm:manage',

  // DDNS permissions
  DDNS_VIEW = 'ddns:view',
  DDNS_EDIT = 'ddns:edit',
  DDNS_MANAGE = 'ddns:manage',

  // NAS permissions
  NAS_VIEW = 'nas:view',
  NAS_EDIT = 'nas:edit',
  NAS_MANAGE = 'nas:manage',

  // API permissions
  API_VIEW = 'api:view',
  API_EDIT = 'api:edit',
  API_MANAGE = 'api:manage',

  // Logs permissions
  LOGS_VIEW = 'logs:view',
  LOGS_EXPORT = 'logs:export',
  LOGS_DELETE = 'logs:delete',
  LOGS_MANAGE = 'logs:manage',

  // RBAC permissions
  RBAC_VIEW = 'rbac:view',
  RBAC_EDIT = 'rbac:edit',
  RBAC_MANAGE = 'rbac:manage',

  // Backup permissions
  BACKUP_VIEW = 'backup:view',
  BACKUP_CREATE = 'backup:create',
  BACKUP_RESTORE = 'backup:restore',
  BACKUP_MANAGE = 'backup:manage',

  // Settings permissions
  SETTINGS_VIEW = 'settings:view',
  SETTINGS_EDIT = 'settings:edit',
  SETTINGS_MANAGE = 'settings:manage',

  // System permissions
  SYSTEM_VIEW = 'system:view',
  SYSTEM_EDIT = 'system:edit',
  SYSTEM_MANAGE = 'system:manage'
}

export enum Role {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  MANAGER = 'manager',
  OPERATOR = 'operator',
  USER = 'user',
  GUEST = 'guest'
}

export interface RolePermissions {
  role: Role;
  permissions: Permission[];
  description: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: Role;
  permissions: Permission[];
  createdAt: string;
  lastLogin?: string;
  isActive: boolean;
}

export interface RoleAssignment {
  userId: string;
  role: Role;
  assignedBy: string;
  assignedAt: string;
  expiresAt?: string;
}

export interface PermissionCheck {
  permission: Permission;
  resource?: string;
  action?: string;
}

export interface AccessControlPolicy {
  id: string;
  name: string;
  description: string;
  roles: Role[];
  permissions: Permission[];
  conditions?: {
    timeRange?: { start: string; end: string };
    ipWhitelist?: string[];
    custom?: Record<string, any>;
  };
  isActive: boolean;
}

export interface AuditLog {
  id: string;
  userId: string;
  username: string;
  action: string;
  resource: string;
  result: 'success' | 'failure';
  timestamp: string;
  ip?: string;
  details?: Record<string, any>;
}
