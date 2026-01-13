import { describe, it, expect, mock, afterEach } from 'bun:test';
import { render } from 'ink';

mock.module('ink', () => ({
  render: mock(() => {}),
}));

mock.module('../src/components/App', () => ({
  App: () => 'MockedApp',
}));

describe('index', () => {
  afterEach(() => {
    mock.restore();
  });

  it('should render the App component with correct options', async () => {
    const mockRender = mock(() => {});
    mock.module('ink', () => ({
      render: mockRender,
    }));

    await import('../src/index');

    expect(mockRender).toHaveBeenCalledTimes(1);
    const [, options] = mockRender.mock.calls[0];
    expect(options).toEqual({ exitOnCtrlC: true });
  });
});