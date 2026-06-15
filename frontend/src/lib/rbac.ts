import type { RuntimeUser } from '../types';

export type AppSection = 'dashboard' | 'admin' | 'data-hub' | 'operations' | 'intelligence';

const sectionAccess: Record<RuntimeUser['role'], AppSection[]> = {
  super_admin: ['dashboard', 'admin', 'data-hub', 'operations', 'intelligence'],
  account_owner: ['dashboard', 'admin', 'data-hub', 'operations', 'intelligence'],
  organization_admin: ['dashboard', 'admin', 'data-hub', 'operations', 'intelligence'],
  admin: ['dashboard', 'admin', 'data-hub', 'operations', 'intelligence'],
  team_manager: ['dashboard', 'data-hub', 'operations', 'intelligence'],
  supervisor: ['dashboard', 'data-hub', 'operations', 'intelligence'],
  auditor: ['dashboard', 'data-hub', 'operations', 'intelligence'],
  qa_tester: ['dashboard', 'data-hub', 'operations', 'intelligence'],
  operator: ['dashboard', 'operations'],
  custom: ['dashboard', 'operations'],
  user: ['dashboard', 'operations'],
};

export function canAccessSection(user: RuntimeUser, section: AppSection) {
  return sectionAccess[user.role].includes(section);
}

export function canManagePlatform(user: RuntimeUser) {
  return canAccessSection(user, 'admin');
}

export function canWriteOperationalData(user: RuntimeUser) {
  return user.permissions.includes('data.write');
}

export function canReadAuditLogs(user: RuntimeUser) {
  return user.permissions.includes('audit.read');
}
