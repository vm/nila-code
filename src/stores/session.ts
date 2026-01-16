import { createStore, useStore } from 'zustand';
import { persist, type StateStorage } from 'zustand/middleware';
import { randomUUID } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  unlinkSync,
  renameSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import type { Message } from '../agent/types';

export type SessionData = {
  runId: string | null;
  createdAt: number;
  workingDir: string;
  model: string;
  conversation: Message[];
};

export type SessionState = SessionData & {
  addConversationMessage: (msg: Message) => void;
  setConversation: (conv: Message[]) => void;
  setModel: (model: string) => void;
  reset: () => void;
};

export type SessionStore = ReturnType<typeof createSessionStore>;

type RawSessionData = {
  runId?: unknown;
  createdAt?: unknown;
  workingDir?: unknown;
  model?: unknown;
  conversation?: unknown;
};

type StorageOptions = {
  baseDir?: string;
};

function getSessionsBaseDir(baseDir?: string): string {
  return join(baseDir ?? process.cwd(), '.nila', 'sessions');
}

function getSessionFilePath(runId: string, baseDir?: string): string {
  return join(getSessionsBaseDir(baseDir), runId, 'session.json');
}

function ensureRunDir(runId: string, baseDir?: string): string {
  const runDir = join(getSessionsBaseDir(baseDir), runId);
  mkdirSync(runDir, { recursive: true });
  return runDir;
}

export function createFileStorage(
  getRunId: () => string | null,
  options?: StorageOptions
): StateStorage {
  return {
    getItem: (_name: string): string | null => {
      const runId = getRunId();
      if (!runId) return null;
      const sessionPath = getSessionFilePath(runId, options?.baseDir);
      if (!existsSync(sessionPath)) return null;
      try {
        return readFileSync(sessionPath, 'utf-8');
      } catch {
        return null;
      }
    },
    setItem: (_name: string, value: string): void => {
      const runId = getRunId();
      if (!runId) return;
      const runDir = ensureRunDir(runId, options?.baseDir);
      const tempPath = join(runDir, 'session.json.tmp');
      const finalPath = join(runDir, 'session.json');
      writeFileSync(tempPath, value, 'utf-8');
      renameSync(tempPath, finalPath);
    },
    removeItem: (_name: string): void => {
      const runId = getRunId();
      if (!runId) return;
      const sessionPath = getSessionFilePath(runId, options?.baseDir);
      try {
        if (existsSync(sessionPath)) {
          unlinkSync(sessionPath);
        }
      } catch {}
    },
  };
}

const createInitialState = (): SessionData => ({
  runId: null,
  createdAt: Date.now(),
  workingDir: process.cwd(),
  model: '',
  conversation: [],
});

function isMessage(value: unknown): value is Message {
  if (!value || typeof value !== 'object') return false;
  const role = (value as { role?: unknown }).role;
  return typeof role === 'string';
}

function normalizeSessionData(raw: unknown): SessionData | null {
  if (!raw || typeof raw !== 'object') return null;
  const data = raw as RawSessionData;
  const runId = typeof data.runId === 'string' ? data.runId : null;
  if (!runId) return null;
  const createdAt =
    typeof data.createdAt === 'number' ? data.createdAt : Date.now();
  const workingDir =
    typeof data.workingDir === 'string' ? data.workingDir : process.cwd();
  const model = typeof data.model === 'string' ? data.model : '';
  const conversation = Array.isArray(data.conversation)
    ? data.conversation.filter(isMessage)
    : [];
  return {
    runId,
    createdAt,
    workingDir,
    model,
    conversation,
  };
}

export type CreateSessionStoreOptions = {
  initialState?: Partial<SessionData>;
  storage?: StateStorage;
  enablePersist?: boolean;
};

type PersistedSessionState = Pick<
  SessionState,
  | 'runId'
  | 'createdAt'
  | 'workingDir'
  | 'model'
  | 'conversation'
>;

export function createSessionStore(options?: CreateSessionStoreOptions) {
  const { initialState, storage, enablePersist = false } = options ?? {};

  const storeCreator = (set: (fn: (state: SessionState) => Partial<SessionState>) => void) => ({
    ...createInitialState(),
    ...initialState,

    addConversationMessage: (msg: Message) =>
      set((state) => ({ conversation: [...state.conversation, msg] })),

    setConversation: (conv: Message[]) => set(() => ({ conversation: conv })),

    setModel: (model: string) => set(() => ({ model })),

    reset: () => set(() => createInitialState()),
  });

  if (enablePersist && storage) {
    return createStore<SessionState>()(
      persist(storeCreator, {
        name: 'session',
        storage: {
          getItem: async (name) => {
            const str = await storage.getItem(name);
            if (!str) return null;
            try {
              return JSON.parse(str);
            } catch {
              return null;
            }
          },
          setItem: async (name, value) => {
            await storage.setItem(name, JSON.stringify(value, null, 2));
          },
          removeItem: async (name) => {
            await storage.removeItem(name);
          },
        },
        partialize: (state): PersistedSessionState => ({
          runId: state.runId,
          createdAt: state.createdAt,
          workingDir: state.workingDir,
          model: state.model,
          conversation: state.conversation,
        }),
      })
    );
  }

  return createStore<SessionState>()(storeCreator);
}

export function generateRunId(): string {
  return randomUUID();
}

export function listRunIds(baseDir?: string): string[] {
  const sessionsDir = getSessionsBaseDir(baseDir);
  if (!existsSync(sessionsDir)) return [];
  try {
    const entries = readdirSync(sessionsDir);
    return entries.filter((entry) => {
      const runDir = join(sessionsDir, entry);
      const sessionPath = join(runDir, 'session.json');
      try {
        return statSync(runDir).isDirectory() && existsSync(sessionPath);
      } catch {
        return false;
      }
    });
  } catch {
    return [];
  }
}

export function loadSessionData(
  runId: string,
  baseDir?: string
): SessionData | null {
  const sessionPath = getSessionFilePath(runId, baseDir);
  if (!existsSync(sessionPath)) return null;
  try {
    const content = readFileSync(sessionPath, 'utf-8');
    const parsed = JSON.parse(content) as { state?: unknown };
    if (parsed.state) {
      const normalized = normalizeSessionData(parsed.state);
      if (normalized) return normalized;
    }
    return normalizeSessionData(parsed);
  } catch {
    return null;
  }
}

export function findLatestRunId(baseDir?: string): string | null {
  const runIds = listRunIds(baseDir);
  let latestId: string | null = null;
  let latestTime = -1;

  for (const runId of runIds) {
    const sessionPath = getSessionFilePath(runId, baseDir);
    let time = -1;
    const session = loadSessionData(runId, baseDir);
    if (session && Number.isFinite(session.createdAt)) {
      time = session.createdAt;
    } else {
      try {
        const stat = statSync(sessionPath);
        time = stat.mtimeMs;
      } catch {
        time = -1;
      }
    }
    if (time > latestTime) {
      latestTime = time;
      latestId = runId;
    }
  }

  return latestId;
}

let defaultStore: SessionStore | null = null;

export function initializeDefaultStore(options?: {
  runId?: string | null;
  initialData?: SessionData | null;
  baseDir?: string;
}): SessionStore {
  const { runId, initialData, baseDir } = options ?? {};

  const storage = createFileStorage(() => defaultStore?.getState().runId ?? null, {
    baseDir,
  });

  defaultStore = createSessionStore({
    initialState: initialData ?? { runId, workingDir: baseDir ?? process.cwd() },
    storage,
    enablePersist: true,
  });

  return defaultStore;
}

export function getDefaultStore(): SessionStore {
  if (!defaultStore) {
    defaultStore = createSessionStore();
  }
  return defaultStore;
}

export function useSessionStore<T>(
  selector: (state: SessionState) => T,
  store?: SessionStore
): T {
  return useStore(store ?? getDefaultStore(), selector);
}

export function resetDefaultStore(): void {
  if (defaultStore) {
    defaultStore.getState().reset();
  }
  defaultStore = null;
}
