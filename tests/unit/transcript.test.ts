let mockGenerateContent: jest.Mock;

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

jest.mock('@/lib/mongodb', () => ({
  getDB: jest.fn(),
}));

jest.mock('@/lib/validators', () => ({
  TranscriptSchema: {
    safeParse: jest.fn(),
  },
}));

jest.mock('@/lib/ai-schemas', () => ({
  validateAIOutput: jest.fn((data) => data),
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

import { POST } from "@/app/api/transcript/route";
import { getDB } from '@/lib/mongodb';
import { TranscriptSchema } from '@/lib/validators';

describe('Transcript Creation API', () => {
  const mockInsertResult = { insertedId: { toString: () => 'id-123' } };

  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.GEMINI_API_KEY;

    (TranscriptSchema.safeParse as jest.Mock).mockReturnValue({
      success: true,
      data: { text: 'default text' },
    });
  });

  describe('Success Cases', () => {
    it('creates transcript with actions and mood', async () => {
      process.env.GEMINI_API_KEY = 'dummy_key';

      (getDB as jest.Mock).mockResolvedValue({
        collection: () => ({
          insertOne: () => Promise.resolve(mockInsertResult),
        }),
      });

      mockGenerateContent
        .mockResolvedValueOnce({
          text: JSON.stringify([{ task: 'Review', owner: 'John', dueDate: '2024-01-15' }]),
        })
        .mockResolvedValueOnce({
          text: JSON.stringify({ overall: 'positive', score: 78 }),
        });

      const req = new Request('http://localhost/api/transcripts', {
        method: 'POST',
        body: JSON.stringify({ text: 'Meeting here' }),
      });

      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body._id).toBe('id-123');
      expect(body.actions[0].status).toBe('open');
      expect(body.mood.overall).toBe('positive');
      expect(body.mood.score).toBe(78);
    });

    it('handles negative mood sentiment', async () => {
      process.env.GEMINI_API_KEY = 'dummy_key';

      (getDB as jest.Mock).mockResolvedValue({
        collection: () => ({
          insertOne: () => Promise.resolve(mockInsertResult),
        }),
      });

      mockGenerateContent
        .mockResolvedValueOnce({
          text: JSON.stringify([{ task: 'Fix issues', owner: null, dueDate: null }]),
        })
        .mockResolvedValueOnce({
          text: JSON.stringify({ overall: 'negative', score: 25 }),
        });

      const req = new Request('http://localhost/api/transcripts', {
        method: 'POST',
        body: JSON.stringify({ text: 'Difficult meeting' }),
      });

      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.mood.overall).toBe('negative');
      expect(body.mood.score).toBe(25);
    });

    it('parses AI response with markdown fence', async () => {
      process.env.GEMINI_API_KEY = 'dummy_key';

      (getDB as jest.Mock).mockResolvedValue({
        collection: () => ({
          insertOne: () => Promise.resolve(mockInsertResult),
        }),
      });

      mockGenerateContent
        .mockResolvedValueOnce({
          text: '```json\n[{"task":"Review","owner":"Alice","dueDate":"2024-01-20"}]\n```',
        })
        .mockResolvedValueOnce({
          text: '```json\n{"overall":"positive","score":85}\n```',
        });

      const req = new Request('http://localhost/api/transcripts', {
        method: 'POST',
        body: JSON.stringify({ text: 'Review meeting' }),
      });

      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.actions[0].task).toBe('Review');
      expect(body.mood.score).toBe(85);
    });

    it('handles null action values', async () => {
      process.env.GEMINI_API_KEY = 'dummy_key';

      (getDB as jest.Mock).mockResolvedValue({
        collection: () => ({
          insertOne: () => Promise.resolve(mockInsertResult),
        }),
      });

      mockGenerateContent
        .mockResolvedValueOnce({
          text: JSON.stringify([{ task: 'Task', owner: null, dueDate: null }]),
        })
        .mockResolvedValueOnce({
          text: JSON.stringify({ overall: 'neutral', score: 50 }),
        });

      const req = new Request('http://localhost/api/transcripts', {
        method: 'POST',
        body: JSON.stringify({ text: 'Meeting' }),
      });

      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.actions[0].owner).toBeNull();
      expect(body.actions[0].dueDate).toBeNull();
    });
  });

  describe('Error Cases', () => {
    it('returns 500 on validation error', async () => {
      process.env.GEMINI_API_KEY = 'dummy_key';

      (TranscriptSchema.safeParse as jest.Mock).mockReturnValue({
        success: false,
        error: { flatten: () => ({ fieldErrors: { text: ['Required'] } }) },
      });

      const req = new Request('http://localhost/api/transcripts', {
        method: 'POST',
        body: JSON.stringify({ text: '' }),
      });

      const res = await POST(req);
      expect(res.status).toBe(500);
      expect((await res.json()).error).toBe('Failed to process transcript');
    });

    it('returns 500 when GEMINI_API_KEY not set', async () => {
      delete process.env.GEMINI_API_KEY;

      const req = new Request('http://localhost/api/transcripts', {
        method: 'POST',
        body: JSON.stringify({ text: 'Meeting' }),
      });

      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('GEMINI_API_KEY is not configured');
    });

    it('returns 500 on AI generation failure', async () => {
      process.env.GEMINI_API_KEY = 'dummy_key';

      mockGenerateContent.mockRejectedValue(new Error('AI error'));

      const req = new Request('http://localhost/api/transcripts', {
        method: 'POST',
        body: JSON.stringify({ text: 'Meeting' }),
      });

      const res = await POST(req);
      expect(res.status).toBe(500);
      expect((await res.json()).error).toBe('Failed to process transcript');
    });

    it('returns 500 on invalid JSON from AI', async () => {
      process.env.GEMINI_API_KEY = 'dummy_key';

      mockGenerateContent.mockResolvedValue({ text: 'not json' });

      const req = new Request('http://localhost/api/transcripts', {
        method: 'POST',
        body: JSON.stringify({ text: 'Meeting' }),
      });

      const res = await POST(req);
      expect(res.status).toBe(500);
      expect((await res.json()).error).toBe('Failed to process transcript');
    });

    it('returns 500 on empty AI response', async () => {
      process.env.GEMINI_API_KEY = 'dummy_key';

      mockGenerateContent.mockResolvedValue({ text: '' });

      const req = new Request('http://localhost/api/transcripts', {
        method: 'POST',
        body: JSON.stringify({ text: 'Meeting' }),
      });

      const res = await POST(req);
      expect(res.status).toBe(500);
      expect((await res.json()).error).toBe('Failed to process transcript');
    });
  });

  describe('Retry Logic', () => {
    it('retries on temporary AI failure', async () => {
      process.env.GEMINI_API_KEY = 'dummy_key';

      (getDB as jest.Mock).mockResolvedValue({
        collection: () => ({
          insertOne: () => Promise.resolve(mockInsertResult),
        }),
      });

      mockGenerateContent
        .mockResolvedValueOnce({
          text: JSON.stringify([{ task: 'Task', owner: null, dueDate: null }]),
        })
        .mockRejectedValueOnce(new Error('Temp error'))
        .mockResolvedValueOnce({
          text: JSON.stringify([{ task: 'Task', owner: null, dueDate: null }]),
        })
        .mockResolvedValueOnce({
          text: JSON.stringify({ overall: 'neutral', score: 50 }),
        });

      const req = new Request('http://localhost/api/transcripts', {
        method: 'POST',
        body: JSON.stringify({ text: 'Meeting' }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      expect(mockGenerateContent).toHaveBeenCalledTimes(4);
    });

    it('fails after max retries (6 calls total)', async () => {
      process.env.GEMINI_API_KEY = 'dummy_key';

      mockGenerateContent.mockRejectedValue(new Error('Persistent error'));

      const req = new Request('http://localhost/api/transcripts', {
        method: 'POST',
        body: JSON.stringify({ text: 'Meeting' }),
      });

      const res = await POST(req);
      expect(res.status).toBe(500);
      expect(mockGenerateContent).toHaveBeenCalledTimes(6);
    });
  });
});