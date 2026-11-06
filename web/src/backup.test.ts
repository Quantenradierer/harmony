import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { get, writable } from 'svelte/store';
import { emptyProgress, recordAnswer, recordLessonResult, type Progress } from '@harmony/shared';
import { createBackup, hasProgress, parseBackup } from './backup.ts';
import { defaultSettings, type Settings } from './settings.ts';
import { openIdbStore } from './storage/kv.ts';
import { bindPersisted } from './storage/persisted.ts';

const flush = () => new Promise((r) => setTimeout(r, 20));

function someProgress(): Progress {
  let p = recordAnswer(emptyProgress(), { category: 'note:0', outcome: 'first-try', points: 10, day: '2026-11-05' });
  for (let i = 0; i < 20; i++) p = recordLessonResult(p, 'notes-1', true);
  return { ...p, dailyDone: ['2026-11-05'] };
}

const someSettings: Settings = {
  ...defaultSettings(),
  language: 'en',
  instrument: 'harp',
  theme: 'night',
  referencePitch: true,
  registers: { notes: 'random', intervals: 'low', chords: 'high' },
};

describe('progress backup', () => {
  it('export then import on a clean profile restores identical state', async () => {
    // profile A
    const kvA = openIdbStore(`a-${Math.random()}`);
    const progressA = writable(emptyProgress());
    const settingsA = writable(defaultSettings());
    await bindPersisted(kvA, 'progress', progressA, emptyProgress());
    await bindPersisted(kvA, 'settings', settingsA, defaultSettings());
    progressA.set(someProgress());
    settingsA.set(someSettings);
    const file = createBackup(get(progressA), get(settingsA));

    // clean profile B
    const kvB = openIdbStore(`b-${Math.random()}`);
    const progressB = writable(emptyProgress());
    const settingsB = writable(defaultSettings());
    await bindPersisted(kvB, 'progress', progressB, emptyProgress());
    await bindPersisted(kvB, 'settings', settingsB, defaultSettings());
    const parsed = parseBackup(file);
    if (!parsed.ok) throw new Error(parsed.error);
    progressB.set(parsed.progress);
    settingsB.set(parsed.settings);
    await flush();

    expect(get(progressB)).toEqual(get(progressA));
    expect(get(settingsB)).toEqual(get(settingsA));
    // and it is persisted in B's database
    expect(await kvB.get('progress')).toEqual(get(progressA));
    expect(await kvB.get('settings')).toEqual(get(settingsA));
  });

  it('rejects files that are not JSON', () => {
    expect(parseBackup('hello')).toEqual({ ok: false, error: 'not-json' });
  });

  it('rejects JSON from other apps', () => {
    expect(parseBackup('{"foo": 1}')).toEqual({ ok: false, error: 'foreign' });
    expect(parseBackup('[1,2]')).toEqual({ ok: false, error: 'foreign' });
  });

  it('rejects unknown versions', () => {
    const file = JSON.parse(createBackup(someProgress(), someSettings));
    expect(parseBackup(JSON.stringify({ ...file, version: 99 }))).toEqual({ ok: false, error: 'version' });
  });

  it('rejects damaged content', () => {
    const file = JSON.parse(createBackup(someProgress(), someSettings));
    const broken = [
      { ...file, progress: { ...file.progress, totalPoints: 'many' } },
      { ...file, progress: { ...file.progress, passed: [1] } },
      { ...file, progress: { ...file.progress, categories: { 'note:0': { attempts: -1, correct: 0 } } } },
      { ...file, settings: { ...file.settings, language: 'fr' } },
      { ...file, progress: { ...file.progress, days: { yesterday: { answers: 1, correct: 0, points: 0 } } } },
      { ...file, progress: { ...file.progress, days: { '2026-11-05': { answers: 1.5, correct: 0, points: 0 } } } },
      { ...file, progress: { ...file.progress, dailyDone: ['soon'] } },
    ];
    for (const b of broken) expect(parseBackup(JSON.stringify(b))).toEqual({ ok: false, error: 'invalid' });
  });

  it('knows whether there is progress to overwrite', () => {
    expect(hasProgress(emptyProgress())).toBe(false);
    expect(hasProgress(someProgress())).toBe(true);
  });
});
