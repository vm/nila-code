import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { render } from 'ink-testing-library';
import { App, type AppAgentFactory } from '../../src/components/App';
import {
  createSessionStore,
  initializeDefaultStore,
  resetDefaultStore,
} from '../../src/stores/session';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Message } from '../../src/agent/types';

describe('App', () => {
  let testDir: string;
  const createTestAgentFactory = (): AppAgentFactory => (options) => {
    let conversation: Message[] = [];
    return {
      getModel: () => 'test-model',
      getConversation: () => [...conversation],
      restoreConversation: (messages) => {
        conversation = [...messages];
      },
      chat: async (userMessage) => {
        conversation = [...conversation, { role: 'user', content: userMessage }];
        if (conversation.length > 1) {
          options.onToolStart?.('tool_1', 'read_file', {});
          options.onToolComplete?.('tool_1', 'read_file', {}, 'ok', false);
        }
        return { text: '', toolCalls: [] };
      },
    };
  };

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), 'app-test-'));
    resetDefaultStore();
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
    resetDefaultStore();
  });

  it('renders banner when no messages', () => {
    const store = createSessionStore();
    const { lastFrame } = render(
      <App store={store} agentFactory={createTestAgentFactory()} />
    );

    const output = lastFrame() ?? '';
    expect(output).toContain('███╗   ██╗');
  });

  it('renders input component', () => {
    const store = createSessionStore();
    const { lastFrame } = render(
      <App store={store} agentFactory={createTestAgentFactory()} />
    );

    const output = lastFrame() ?? '';
    expect(output).toContain('›');
  });

  it('restores messages from store', () => {
    const store = createSessionStore({
      initialState: {
        runId: 'run_1',
        conversation: [{ role: 'user', content: 'Hello from store' }],
      },
    });

    const { lastFrame, unmount } = render(
      <App store={store} agentFactory={createTestAgentFactory()} />
    );

    const output = lastFrame() ?? '';
    expect(output).toContain('Hello from store');
    unmount();
  });

  it('reads messages from initialized default store', () => {
    initializeDefaultStore({
      runId: 'run_2',
      initialData: {
        runId: 'run_2',
        createdAt: Date.now(),
        workingDir: '/test',
        model: 'test-model',
        conversation: [{ role: 'user', content: 'Default store message' }],
      },
      baseDir: testDir,
    });

    const { lastFrame, unmount } = render(
      <App agentFactory={createTestAgentFactory()} />
    );

    const output = lastFrame() ?? '';
    expect(output).toContain('Default store message');
    unmount();
  });
});
