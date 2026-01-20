const { RBACService } = require('./src/app/services/rbacService');

const rbacService = new RBACService();

// 测试使用任何密码登录admin用户
const user1 = rbacService.login('admin', 'any-password');
console.log('Login with any password:', user1 ? '成功' : '失败');
console.log('Current user:', rbacService.getCurrentUser());

// 测试权限检查
console.log('Has SYSTEM_CONFIG permission:', rbacService.hasPermission('SYSTEM_CONFIG'));
