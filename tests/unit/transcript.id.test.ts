jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

jest.mock('@/lib/mongodb', () => ({
  getDB: jest.fn(),
}));

import { GET, PATCH } from "@/app/api/transcript/[id]/route";
import { getDB } from '@/lib/mongodb';
import { ObjectId } from "mongodb";

describe('Transcript API - unit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('returns transcript on success', async () => {
      const mockDoc = {
        _id: new ObjectId(),
        text: 'hello world',
        actions: [],
        createdAt: new Date('2023-01-01'),
      };

      (getDB as jest.Mock).mockResolvedValue({
        collection: () => ({
          findOne: () => Promise.resolve(mockDoc),
        }),
      });

      const res = await GET(new Request('http://localhost/api/transcripts/123'), {
        params: Promise.resolve({ id: mockDoc._id.toString() }),
      });

      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body._id).toBe(mockDoc._id.toString());
      expect(body.text).toBe('hello world');
      expect(Array.isArray(body.actions)).toBe(true);
    });

    it('returns 404 when transcript not found', async () => {
      (getDB as jest.Mock).mockResolvedValue({
        collection: () => ({
          findOne: () => Promise.resolve(null),
        }),
      });

      const res = await GET(new Request('http://localhost/api/transcripts/123'), {
        params: Promise.resolve({ id: new ObjectId().toString() }),
      });

      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.error).toBe('Transcript not found');
    });

    it('returns 400 when id is invalid', async () => {
      const res = await GET(new Request('http://localhost/api/transcripts/invalid'), {
        params: Promise.resolve({ id: 'invalid-id' }),
      });

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Invalid id');
    });

    it('returns 400 when id is missing', async () => {
      const res = await GET(new Request('http://localhost/api/transcripts'), {
        params: Promise.resolve({ id: '' }),
      });

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Missing id');
    });

    it('returns 500 on database error', async () => {
      (getDB as jest.Mock).mockRejectedValue(new Error('DB connection failed'));

      const res = await GET(new Request('http://localhost/api/transcripts/123'), {
        params: Promise.resolve({ id: new ObjectId().toString() }),
      });

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBe('Failed to fetch transcript');
    });
  });

  describe('PATCH', () => {
    it('updates transcript text successfully', async () => {
      const mockId = new ObjectId();
      const updatedDoc = {
        _id: mockId,
        text: 'updated text',
        actions: [],
        createdAt: new Date('2023-01-01'),
      };

      (getDB as jest.Mock).mockResolvedValue({
        collection: () => ({
          findOneAndUpdate: () => Promise.resolve(updatedDoc),
        }),
      });

      const requestBody = { text: 'updated text' };
      const request = new Request('http://localhost/api/transcripts/123', {
        method: 'PATCH',
        body: JSON.stringify(requestBody),
      });

      const res = await PATCH(request, {
        params: Promise.resolve({ id: mockId.toString() }),
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.text).toBe('updated text');
    });

    it('updates transcript actions successfully', async () => {
      const mockId = new ObjectId();
      const updatedDoc = {
        _id: mockId,
        text: 'hello',
        actions: [
          {
            task: 'do something',
            owner: 'john',
            dueDate: '2023-12-31',
            status: 'open',
            priority: 'high',
          },
        ],
        createdAt: new Date('2023-01-01'),
      };

      (getDB as jest.Mock).mockResolvedValue({
        collection: () => ({
          findOneAndUpdate: () => Promise.resolve(updatedDoc),
        }),
      });

      const requestBody = {
        actions: [
          {
            task: 'do something',
            owner: 'john',
            dueDate: '2023-12-31',
            status: 'open',
            priority: 'high',
          },
        ],
      };

      const request = new Request('http://localhost/api/transcripts/123', {
        method: 'PATCH',
        body: JSON.stringify(requestBody),
      });

      const res = await PATCH(request, {
        params: Promise.resolve({ id: mockId.toString() }),
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.actions.length).toBe(1);
      expect(body.actions[0].task).toBe('do something');
    });

    it('validates action priority', async () => {
      const mockId = new ObjectId();
      const updatedDoc = {
        _id: mockId,
        text: 'hello',
        actions: [
          {
            task: 'do something',
            owner: null,
            dueDate: null,
            status: 'open',
            priority: null, // Invalid priority should be null
          },
        ],
        createdAt: new Date('2023-01-01'),
      };

      (getDB as jest.Mock).mockResolvedValue({
        collection: () => ({
          findOneAndUpdate: () => Promise.resolve(updatedDoc),
        }),
      });

      const requestBody = {
        actions: [
          {
            task: 'do something',
            priority: 'invalid-priority',
          },
        ],
      };

      const request = new Request('http://localhost/api/transcripts/123', {
        method: 'PATCH',
        body: JSON.stringify(requestBody),
      });

      const res = await PATCH(request, {
        params: Promise.resolve({ id: mockId.toString() }),
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.actions[0].priority).toBe(null);
    });

    it('returns 400 when no updates provided', async () => {
      const mockId = new ObjectId();

      const request = new Request('http://localhost/api/transcripts/123', {
        method: 'PATCH',
        body: JSON.stringify({}),
      });

      const res = await PATCH(request, {
        params: Promise.resolve({ id: mockId.toString() }),
      });

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('No updates provided');
    });

    it('returns 404 when transcript not found for update', async () => {
      const mockId = new ObjectId();

      (getDB as jest.Mock).mockResolvedValue({
        collection: () => ({
          findOneAndUpdate: () => Promise.resolve(null),
        }),
      });

      const request = new Request('http://localhost/api/transcripts/123', {
        method: 'PATCH',
        body: JSON.stringify({ text: 'updated' }),
      });

      const res = await PATCH(request, {
        params: Promise.resolve({ id: mockId.toString() }),
      });

      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.error).toBe('Transcript not found');
    });

    it('returns 400 when id is invalid', async () => {
      const request = new Request('http://localhost/api/transcripts/invalid', {
        method: 'PATCH',
        body: JSON.stringify({ text: 'updated' }),
      });

      const res = await PATCH(request, {
        params: Promise.resolve({ id: 'invalid-id' }),
      });

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Invalid id');
    });

    it('returns 500 on database error', async () => {
      const mockId = new ObjectId();

      (getDB as jest.Mock).mockRejectedValue(new Error('DB connection failed'));

      const request = new Request('http://localhost/api/transcripts/123', {
        method: 'PATCH',
        body: JSON.stringify({ text: 'updated' }),
      });

      const res = await PATCH(request, {
        params: Promise.resolve({ id: mockId.toString() }),
      });

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBe('Failed to update transcript');
    });
  });
});