import { describe, expect, it } from 'vitest';
import { get } from 'svelte/store';
import { FeedbackQueue } from './queue.ts';
import { MemoryStore } from '../storage/kv.ts';
import type { SendResult } from './client.ts';

function fakeServer() {
  const server = { online: true, received: [] as string[] };
  const send = async (text: string): Promise<SendResult> => {
    if (!server.online) return 'network';
    server.received.push(text);
    return 'sent';
  };
  return { server, send };
}

describe('feedback queue', () => {
  it('sends directly when online', async () => {
    const { server, send } = fakeServer();
    const q = new FeedbackQueue(new MemoryStore(), send);
    expect(await q.submit('hi')).toBe('sent');
    expect(server.received).toEqual(['hi']);
  });

  it('queues while offline and delivers in order after reconnecting', async () => {
    const { server, send } = fakeServer();
    const kv = new MemoryStore();
    server.online = false;
    const q = new FeedbackQueue(kv, send);
    expect(await q.submit('one')).toBe('queued');
    expect(await q.submit('two')).toBe('queued');
    expect(get(q.pending)).toBe(2);

    server.online = true;
    // e.g. after a reload: a new queue on the same storage
    const q2 = new FeedbackQueue(kv, send);
    await q2.flush();
    expect(server.received).toEqual(['one', 'two']);
    expect(get(q2.pending)).toBe(0);
  });

  it('keeps order: new feedback waits behind queued feedback', async () => {
    const { server, send } = fakeServer();
    const q = new FeedbackQueue(new MemoryStore(), send);
    server.online = false;
    await q.submit('old');
    server.online = true;
    expect(await q.submit('new')).toBe('sent');
    expect(server.received).toEqual(['old', 'new']);
  });

  it('drops entries the server rejects', async () => {
    const kv = new MemoryStore();
    await kv.set('feedbackQueue', ['bad', 'good']);
    const received: string[] = [];
    const q = new FeedbackQueue(kv, async (text) => {
      if (text === 'bad') return 'rejected';
      received.push(text);
      return 'sent';
    });
    await q.flush();
    expect(received).toEqual(['good']);
    expect(get(q.pending)).toBe(0);
  });
});
