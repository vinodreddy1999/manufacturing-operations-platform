import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import type { RuntimeUser } from '../types';
import { initialPlatformState, initialWidgets, platformModules } from './data';
import type { PlatformAuditLog, PlatformClient, PlatformState, PlatformUser, WidgetConfig } from './types';

const storageKey = 'metam.platform.demo.v1';

type PlatformContextValue = {
  state: PlatformState;
  runtimeUser: RuntimeUser;
  platformUser: PlatformUser;
  selectedClientId: string | null;
  selectedClient?: PlatformClient;
  isPlatformContext: boolean;
  currency: PlatformClient['currency'] | 'USD';
  canSelectPlatform: boolean;
  selectClient: (clientId: string | null) => void;
  createClient: (client: Omit<PlatformClient, 'clientId' | 'createdDate' | 'disabledModules'>) => PlatformClient;
  createUser: (user: Omit<PlatformUser, 'userId' | 'fullName' | 'clientName' | 'createdDate' | 'lastLogin'>) => PlatformUser;
  updateWidget: (widgetId: string, payload: Partial<WidgetConfig>) => void;
  resetWidgets: () => void;
};

const PlatformContext = createContext<PlatformContextValue | null>(null);

function loadState() {
  try {
    const value = localStorage.getItem(storageKey);
    return value ? JSON.parse(value) as PlatformState : initialPlatformState;
  } catch {
    return initialPlatformState;
  }
}

function nextId(prefix: string, values: string[]) {
  const next = Math.max(0, ...values.map((value) => Number(value.split('-').at(-1)) || 0)) + 1;
  return `${prefix}-${String(next).padStart(6, '0')}`;
}

export function PlatformProvider({ runtimeUser, children }: { runtimeUser: RuntimeUser; children: ReactNode }) {
  const [state, setState] = useState<PlatformState>(loadState);
  const canSelectPlatform = runtimeUser.role === 'super_admin';
  const matchedUser = state.users.find((user) => user.email.toLowerCase() === runtimeUser.email.toLowerCase()) ?? state.users.find((user) => user.email === 'user@metam.local')!;
  const [selectedClientId, setSelectedClientId] = useState<string | null>(() => canSelectPlatform ? null : matchedUser.clientId ?? state.clients[0].clientId);
  const selectedClient = state.clients.find((client) => client.clientId === selectedClientId);

  function persist(next: PlatformState) {
    setState(next);
    localStorage.setItem(storageKey, JSON.stringify(next));
  }

  function addAudit(next: PlatformState, log: Omit<PlatformAuditLog, 'logId' | 'timestamp'>) {
    return { ...next, auditLogs: [{ ...log, logId: nextId('LOG', next.auditLogs.map((item) => item.logId)), timestamp: new Date().toISOString() }, ...next.auditLogs] };
  }

  const value = useMemo<PlatformContextValue>(() => ({
    state,
    runtimeUser,
    platformUser: matchedUser,
    selectedClientId,
    selectedClient,
    isPlatformContext: selectedClientId === null,
    currency: selectedClient?.currency ?? 'USD',
    canSelectPlatform,
    selectClient: (clientId) => setSelectedClientId(canSelectPlatform ? clientId : matchedUser.clientId ?? state.clients[0].clientId),
    createClient: (input) => {
      const clientId = nextId('CLT', state.clients.map((client) => client.clientId));
      const client: PlatformClient = {
        ...input,
        clientId,
        disabledModules: platformModules.filter((module) => module !== 'Admin' && !input.enabledModules.includes(module)),
        createdDate: new Date().toISOString().slice(0, 10),
      };
      let next = { ...state, clients: [...state.clients, client] };
      next = addAudit(next, { clientId, clientName: client.clientName, userId: matchedUser.userId, moduleName: 'Admin', action: 'Created client' });
      persist(next);
      return client;
    },
    createUser: (input) => {
      const client = state.clients.find((item) => item.clientId === input.clientId)!;
      const userId = nextId('USR', state.users.map((user) => user.userId));
      const user: PlatformUser = { ...input, userId, fullName: `${input.firstName} ${input.lastName}`.trim(), clientName: client.clientName, createdDate: new Date().toISOString().slice(0, 10), lastLogin: 'Never' };
      let next = { ...state, users: [...state.users, user] };
      next = addAudit(next, { clientId: client.clientId, clientName: client.clientName, userId, moduleName: 'Admin', action: 'Created user' });
      persist(next);
      return user;
    },
    updateWidget: (widgetId, payload) => persist({ ...state, widgets: state.widgets.map((widget) => widget.widgetId === widgetId ? { ...widget, ...payload } : widget) }),
    resetWidgets: () => persist({ ...state, widgets: initialWidgets }),
  }), [state, runtimeUser, matchedUser, selectedClientId, selectedClient, canSelectPlatform]);

  return <PlatformContext.Provider value={value}>{children}</PlatformContext.Provider>;
}

// Provider and hook intentionally share this module as one context boundary.
// eslint-disable-next-line react-refresh/only-export-components
export function usePlatform() {
  const value = useContext(PlatformContext);
  if (!value) throw new Error('usePlatform must be used inside PlatformProvider');
  return value;
}
