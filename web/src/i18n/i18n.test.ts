import { describe, expect, it } from 'vitest';
import { get } from 'svelte/store';
import { catalogs, categoryLabel, t, translate, yesNoQuestion } from './index.ts';
import { settings } from '../stores.ts';
import { ACHIEVEMENTS, LESSONS } from '@harmony/shared';

describe('i18n', () => {
  it('has the same keys in every language, none empty', () => {
    const keys = Object.keys(catalogs.en).sort();
    expect(Object.keys(catalogs.de).sort()).toEqual(keys);
    for (const cat of Object.values(catalogs)) {
      for (const v of Object.values(cat)) expect(v.trim()).not.toBe('');
    }
  });

  it('describes every lesson', () => {
    for (const l of Object.values(LESSONS).flat()) {
      expect(Object.keys(catalogs.en)).toContain(`lesson.desc.${l.id}`);
    }
  });

  it('names and describes every achievement', () => {
    for (const a of ACHIEVEMENTS) {
      expect(Object.keys(catalogs.en)).toContain(`achievement.${a.id}.name`);
      expect(Object.keys(catalogs.en)).toContain(`achievement.${a.id}.desc`);
    }
  });

  it('fills in parameters', () => {
    expect(translate('en', 'lesson.title', { n: 3 })).toBe('Lesson 3');
    expect(translate('de', 'lesson.title', { n: 3 })).toBe('Lektion 3');
  });

  it('defaults to German and follows the language setting', () => {
    expect(get(t)('quiz.replay')).toBe('Nochmal hören');
    settings.update((s) => ({ ...s, language: 'en' }));
    expect(get(t)('quiz.replay')).toBe('Play again');
    settings.update((s) => ({ ...s, language: 'de' }));
  });

  it('labels note categories in the current language', () => {
    expect(categoryLabel('de', 'note:11')).toBe('H');
    expect(categoryLabel('en', 'note:11')).toBe('B');
  });

  it('localizes music terms', () => {
    expect(categoryLabel('de', 'interval:P4')).toBe('Quarte');
    expect(categoryLabel('en', 'interval:P4')).toBe('Perfect 4th');
    expect(categoryLabel('de', 'chord:min')).toBe('Moll');
    expect(categoryLabel('de', 'yes')).toBe('Ja');
    expect(yesNoQuestion('en', 'chord:min')).toBe('Is this a minor chord?');
    expect(yesNoQuestion('de', 'chord:min')).toBe('Ist das ein Mollakkord?');
  });
});
