import type { RuntimeUser } from '../types';

export type AppSection = 'dashboard' | 'admin' | 'data-hub' | 'operations' | 'intelligence';

const sectionAccess: Record<RuntimeUser['role'], AppSection[]> = {
  super_admin: ['dashboard', 'admin', 'data-hub', 'operations', 'intelligence'],
  account_owner: ['dashboard', 'admin', 'data-hub', 'operations', 'intelligence'],
  organization_admin: ['dashboard', 'admin', 'data-hub', 'operations', 'intelligence'],
  admin: ['dashboard', 'admin', 'data-hub', 'operations', 'intelligence'],
  team_manager: ['dashboard', 'operations', 'intelligence'],
  supervisor: ['dashboard', 'operations', 'intelligence'],
  auditor: ['dashboard', 'operations', 'intelligence'],
  qa_tester: ['dashboard', 'operations', 'intelligence'],
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

export function canCreateCompanies(user: RuntimeUser) {
  return ['super_admin', 'account_owner'].includes(user.role);
}

export function canWriteOperationalData(user: RuntimeUser) {
  return user.permissions.includes('data.write');
}

export function canReadAuditLogs(user: RuntimeUser) {
  return user.permissions.includes('audit.read');
}

export function canEditExecutiveMetrics(user: RuntimeUser) {
  return ['admin', 'super_admin'].includes(user.role);
}

export function canUseDataHubUploads(user: RuntimeUser) {
  return ['admin', 'super_admin'].includes(user.role);
}
