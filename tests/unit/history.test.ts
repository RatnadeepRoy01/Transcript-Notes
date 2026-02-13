jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn() },
}));

jest.mock('@/lib/mongodb', () => ({
  getDB: jest.fn(),
}));

import { GET } from "@/app/api/history/route";
import { getDB } from '@/lib/mongodb';

describe('History API - unit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns formatted transcripts on success', async () => {
    const mockDocs = [
      {
        _id: { toString: () => 'id-1' },
        text: 'hello',
        actions: [],
        createdAt: new Date('2023-01-01'),
      },
    ];

    (getDB as jest.Mock).mockResolvedValue({
      collection: () => ({
        find: () => ({ sort: () => ({ toArray: () => Promise.resolve(mockDocs) }) }),
      }),
    });

    const res = await GET();
    const body = await res.json();

    expect(body).toHaveProperty('transcripts');
    expect(Array.isArray(body.transcripts)).toBe(true);
    expect(body.transcripts[0]._id).toBe('id-1');
  });

  it('returns 500 when DB throws', async () => {
    (getDB as jest.Mock).mockImplementation(() => {
      throw new Error('db-fail');
    });

    const res = await GET();
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toHaveProperty('error');
  });
});