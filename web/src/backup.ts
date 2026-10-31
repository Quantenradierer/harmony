import { emptyProgress, LANGUAGES, REGISTERS, type Progress } from '@harmony/shared';
import { defaultSettings, type Settings } from './settings.ts';

export const BACKUP_APP = 'harmony-trainer';
export const BACKUP_VERSION = 1;

/** The exported file: everything needed to restore a learner's state. */
export interface Backup {
  app: typeof BACKUP_APP;
  version: number;
  exportedAt: string;
  progress: Progress;
  settings: Settings;
}

export type ImportError = 'not-json' | 'foreign' | 'version' | 'invalid';

export function createBackup(progress: Progress, settings: Settings, now = new Date()): string {
  const backup: Backup = {
    app: BACKUP_APP,
    version: BACKUP_VERSION,
    exportedAt: now.toISOString(),
    progress,
    settings,
  };
  return JSON.stringify(backup, null, 2);
}

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
const isCount = (v: unknown) => typeof v === 'number' && Number.isInteger(v) && v >= 0;

function validProgress(p: unknown): p is Progress {
  return (
    isObject(p) &&
    typeof p.totalPoints === 'number' &&
    isObject(p.categories) &&
    Object.values(p.categories).every((c) => isObject(c) && isCount(c.attempts) && isCount(c.correct)) &&
    isObject(p.lessonHistory) &&
    Object.values(p.lessonHistory).every((h) => Array.isArray(h) && h.every((x) => typeof x === 'boolean')) &&
    Array.isArray(p.passed) &&
    p.passed.every((id) => typeof id === 'string')
  );
}

function validSettings(s: unknown): s is Partial<Settings> {
  if (!isObject(s)) return false;
  if (s.language !== undefined && !LANGUAGES.includes(s.language as Settings['language'])) return false;
  if (s.registers !== undefined) {
    if (!isObject(s.registers)) return false;
    if (!Object.values(s.registers).every((r) => REGISTERS.includes(r as Settings['registers']['notes']))) return false;
  }
  if (s.referencePitch !== undefined && typeof s.referencePitch !== 'boolean') return false;
  if (s.playback !== undefined && s.playback !== 'together' && s.playback !== 'sequence') return false;
  if (s.instrument !== undefined && typeof s.instrument !== 'string') return false;
  return true;
}

export function parseBackup(
  text: string,
): { ok: true; progress: Progress; settings: Settings } | { ok: false; error: ImportError } {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, error: 'not-json' };
  }
  if (!isObject(data) || data.app !== BACKUP_APP) return { ok: false, error: 'foreign' };
  if (data.version !== BACKUP_VERSION) return { ok: false, error: 'version' };
  if (!validProgress(data.progress) || !validSettings(data.settings)) return { ok: false, error: 'invalid' };
  const defaults = defaultSettings();
  return {
    ok: true,
    progress: { ...emptyProgress(), ...data.progress },
    settings: {
      ...defaults,
      ...data.settings,
      registers: { ...defaults.registers, ...data.settings.registers },
    },
  };
}

/** True if there is progress an import would overwrite. */
export function hasProgress(p: Progress): boolean {
  return p.totalPoints > 0 || p.passed.length > 0 || Object.keys(p.categories).length > 0;
}
