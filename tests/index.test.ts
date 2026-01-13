import { describe, it, expect, mock, afterEach } from 'bun:test';
import { render } from 'ink';

// Mock the dependencies
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

    // Import the module to trigger the render call
    await import('../src/index');

    expect(mockRender).toHaveBeenCalledTimes(1);
    // Check that render was called with exitOnCtrlC: true
    const [, options] = mockRender.mock.calls[0];
    expect(options).toEqual({ exitOnCtrlC: true });
  });
});