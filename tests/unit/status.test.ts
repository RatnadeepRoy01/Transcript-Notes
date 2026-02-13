let mockGenerateContent: jest.Mock;

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

jest.mock('@/lib/mongodb', () => ({
  getDB: jest.fn(),
}));

jest.mock('@google/genai', () => {
  mockGenerateContent = jest.fn();
  return {
    GoogleGenAI: jest.fn().mockImplementation(() => ({
      models: {
        generateContent: mockGenerateContent,
      },
    })),
  };
});

import { GET } from "@/app/api/status/route";
import { getDB } from '@/lib/mongodb';

describe('Status API - unit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.GEMINI_API_KEY;
  });

  it('returns all ok when DB and LLM succeed', async () => {
    (getDB as jest.Mock).mockResolvedValue({
      command: () => Promise.resolve({ ok: 1 }),
    });

    process.env.GEMINI_API_KEY = 'dummy_key';
    mockGenerateContent.mockResolvedValue({ text: 'LLM OK' });

    const res = await GET();
    const body = await res.json();

    expect(body.backend.status).toBe('ok');
    expect(body.database.status).toBe('ok');
    expect(body.llm.status).toBe('ok');
  });

  it('returns error if DB ping fails', async () => {
    (getDB as jest.Mock).mockRejectedValue(new Error('DB down'));

    process.env.GEMINI_API_KEY = 'dummy_key';
    mockGenerateContent.mockResolvedValue({ text: 'LLM OK' });

    const res = await GET();
    const body = await res.json();

    expect(body.database.status).toBe('error');
    expect(body.database.message).toBe('DB down');
    expect(body.llm.status).toBe('ok');
  });

  it('returns LLM error if GEMINI_API_KEY not set', async () => {
    (getDB as jest.Mock).mockResolvedValue({
      command: () => Promise.resolve({ ok: 1 }),
    });

    const res = await GET();
    const body = await res.json();

    expect(body.llm.status).toBe('error');
    expect(body.llm.message).toBe('GEMINI_API_KEY not set');
    expect(body.database.status).toBe('ok');
  });

  it('returns LLM error if LLM request fails', async () => {
    (getDB as jest.Mock).mockResolvedValue({
      command: () => Promise.resolve({ ok: 1 }),
    });

    process.env.GEMINI_API_KEY = 'dummy_key';
    mockGenerateContent.mockRejectedValue(new Error('LLM failed'));

    const res = await GET();
    const body = await res.json();

    expect(body.llm.status).toBe('error');
    expect(body.llm.message).toBe('LLM failed');
    expect(body.database.status).toBe('ok');
  });
});