import { v4 as uuidv4 } from 'uuid';

// 用户类型定义
export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user' | 'guest' | 'sales_director' | 'sales_manager' | 'sales_employee';
  createdAt: Date;
  lastLogin: Date;
  department?: string;
  team?: string;
  managerId?: string; // 直接上级ID
  teamId?: string; // 团队ID
  directorId?: string; // 销售总监ID
}

// 权限类型定义
export type Permission = 'read' | 'write' | 'delete' | 'admin';

// 审计日志类型定义
export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  details: Record<string, any>;
  success: boolean;
}

// 安全服务类
export class SecurityService {
  private users: Map<string, User> = new Map();
  private auditLogs: AuditLog[] = [];
  private apiKeys: Map<string, { userId: string; expiresAt: Date }> = new Map();

  constructor() {
    // 初始化默认管理员用户
    this.users.set('admin', {
      id: 'admin',
      username: 'admin',
      email: 'admin@example.com',
      role: 'admin',
      createdAt: new Date(),
      lastLogin: new Date(),
    });
  }

  /**
   * 用户认证
   */
  async authenticate(username: string, password: string): Promise<{ token: string; user: User } | null> {
    const user = this.users.get(username);
    if (!user) {
      this.logAudit('authenticate', 'user', username, false, { error: 'User not found' });
      return null;
    }

    // 这里应该验证密码，暂时简化为直接返回成功
    // 在实际应用中，应该使用密码哈希和验证
    
    user.lastLogin = new Date();
    this.users.set(username, user);
    
    const token = this.generateApiKey(user.id);
    this.logAudit('authenticate', 'user', username, true);
    
    return { token, user };
  }

  /**
   * 验证API密钥
   */
  validateApiKey(apiKey: string): { userId: string; valid: boolean } {
    const apiKeyData = this.apiKeys.get(apiKey);
    if (!apiKeyData) {
      return { userId: '', valid: false };
    }

    if (apiKeyData.expiresAt < new Date()) {
      this.apiKeys.delete(apiKey);
      return { userId: '', valid: false };
    }

    return { userId: apiKeyData.userId, valid: true };
  }

  /**
   * 生成API密钥
   */
  private generateApiKey(userId: string): string {
    const apiKey = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30天过期
    
    this.apiKeys.set(apiKey, { userId, expiresAt });
    return apiKey;
  }

  /**
   * 检查权限
   */
  checkPermission(userId: string, resource: string, permission: Permission): boolean {
    const user = this.users.get(userId);
    if (!user) {
      return false;
    }

    // 管理员拥有所有权限
    if (user.role === 'admin') {
      return true;
    }

    // 基于角色的权限检查
    switch (user.role) {
      case 'user':
        return permission === 'read' || permission === 'write';
      case 'sales_director':
        // 销售总监拥有除管理员外的所有权限
        return permission !== 'admin';
      case 'sales_manager':
        // 销售经理拥有读写权限
        return permission === 'read' || permission === 'write';
      case 'sales_employee':
        // 销售员工拥有读写权限
        return permission === 'read' || permission === 'write';
      case 'guest':
        return permission === 'read';
      default:
        return false;
    }
  }

  /**
   * 数据加密
   */
  encrypt(data: string, key: string): string {
    // 这里应该实现实际的加密算法
    // 暂时简化为Base64编码
    const encoded = Buffer.from(data).toString('base64');
    return encoded;
  }

  /**
   * 数据解密
   */
  decrypt(encryptedData: string, key: string): string {
    // 这里应该实现实际的解密算法
    // 暂时简化为Base64解码
    const decoded = Buffer.from(encryptedData, 'base64').toString('utf8');
    return decoded;
  }

  /**
   * 记录审计日志
   */
  logAudit(action: string, resource: string, userId: string, success: boolean, details: Record<string, any> = {}): void {
    const auditLog: AuditLog = {
      id: uuidv4(),
      userId,
      action,
      resource,
      timestamp: new Date(),
      ipAddress: '127.0.0.1', // 实际应用中应该从请求中获取
      userAgent: 'Day AI SDK', // 实际应用中应该从请求中获取
      details,
      success,
    };

    this.auditLogs.push(auditLog);
    console.log('Audit log:', auditLog);
  }

  /**
   * 获取审计日志
   */
  getAuditLogs(options?: {
    limit?: number;
    offset?: number;
    userId?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
  }): AuditLog[] {
    let logs = [...this.auditLogs];

    // 应用过滤条件
    if (options?.userId) {
      logs = logs.filter(log => log.userId === options.userId);
    }

    if (options?.action) {
      logs = logs.filter(log => log.action === options.action);
    }

    if (options?.startDate) {
      logs = logs.filter(log => log.timestamp >= options.startDate!);
    }

    if (options?.endDate) {
      logs = logs.filter(log => log.timestamp <= options.endDate!);
    }

    // 排序和分页
    logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    if (options?.limit) {
      const offset = options.offset || 0;
      logs = logs.slice(offset, offset + options.limit);
    }

    return logs;
  }

  /**
   * 创建用户
   */
  createUser(user: Omit<User, 'id' | 'createdAt' | 'lastLogin'>, password: string): User {
    const newUser: User = {
      ...user,
      id: uuidv4(),
      createdAt: new Date(),
      lastLogin: new Date(),
    };

    this.users.set(newUser.username, newUser);
    this.logAudit('create_user', 'user', 'system', true, { username: newUser.username });
    
    return newUser;
  }

  /**
   * 获取用户
   */
  getUser(username: string): User | null {
    return this.users.get(username) || null;
  }

  /**
   * 更新用户
   */
  updateUser(username: string, updates: Partial<Omit<User, 'id' | 'createdAt' | 'lastLogin'>>): boolean {
    const user = this.users.get(username);
    if (!user) {
      return false;
    }

    const updatedUser = {
      ...user,
      ...updates,
    };

    this.users.set(username, updatedUser);
    this.logAudit('update_user', 'user', username, true, updates);
    
    return true;
  }

  /**
   * 删除用户
   */
  deleteUser(username: string): boolean {
    const user = this.users.get(username);
    if (!user) {
      return false;
    }

    this.users.delete(username);
    this.logAudit('delete_user', 'user', username, true);
    
    return true;
  }

  /**
   * 获取所有用户
   */
  getUsers(): User[] {
    return Array.from(this.users.values());
  }

  /**
   * 获取用户的团队成员
   */
  getTeamMembers(userId: string): User[] {
    const user = this.users.get(userId);
    if (!user) {
      return [];
    }

    switch (user.role) {
      case 'sales_director':
        // 销售总监可以看到所有销售经理和销售员工
        return Array.from(this.users.values()).filter(u => 
          (u.role === 'sales_manager' && u.directorId === userId) ||
          (u.role === 'sales_employee' && u.directorId === userId)
        );
      case 'sales_manager':
        // 销售经理可以看到自己团队的销售员工
        return Array.from(this.users.values()).filter(u => 
          u.role === 'sales_employee' && u.managerId === userId
        );
      default:
        return [];
    }
  }

  /**
   * 检查用户是否有权限查看其他用户的数据
   */
  canViewUser(userId: string, targetUserId: string): boolean {
    const user = this.users.get(userId);
    const targetUser = this.users.get(targetUserId);

    if (!user || !targetUser) {
      return false;
    }

    // 管理员可以查看所有用户
    if (user.role === 'admin') {
      return true;
    }

    // 销售总监可以查看所有销售经理和销售员工
    if (user.role === 'sales_director') {
      return targetUser.role === 'sales_manager' || targetUser.role === 'sales_employee';
    }

    // 销售经理可以查看自己团队的销售员工
    if (user.role === 'sales_manager' && targetUser.role === 'sales_employee') {
      return targetUser.managerId === userId;
    }

    // 销售员工只能查看自己的数据
    if (user.role === 'sales_employee') {
      return userId === targetUserId;
    }

    return false;
  }

  /**
   * 检查用户是否有权限查看团队的客户数据
   */
  canViewTeamCustomers(userId: string, teamId: string): boolean {
    const user = this.users.get(userId);
    if (!user) {
      return false;
    }

    // 管理员可以查看所有数据
    if (user.role === 'admin') {
      return true;
    }

    // 销售总监可以查看所有团队的数据
    if (user.role === 'sales_director') {
      return true;
    }

    // 销售经理可以查看自己团队的数据
    if (user.role === 'sales_manager' && user.teamId === teamId) {
      return true;
    }

    return false;
  }
}

export default SecurityService;