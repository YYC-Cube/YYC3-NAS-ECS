import { vi, beforeEach } from 'vitest';

vi.mock('uuid', () => ({
  v4: () => 'test-uuid-12345',
  v5: () => 'test-uuid-v5-67890'
}));

global.console = {
  ...console,
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
  log: vi.fn()
};

global.fetch = vi.fn((_url: string, _options?: RequestInit) => {
  return Promise.resolve({
    ok: true,
    status: 200,
    json: async () => ({
      content: '模拟的AI响应',
      toolUsed: false,
      usage: {
        prompt_tokens: 100,
        completion_tokens: 50,
        total_tokens: 150
      }
    })
  } as Response);
}) as any;

beforeEach(() => {
  vi.clearAllMocks();
});
