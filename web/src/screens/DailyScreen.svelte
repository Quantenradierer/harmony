<script lang="ts">
  import {
    DAILY_AWARDS,
    completeDaily,
    currentStreak,
    dailySpecs,
    dayKey,
    longestStreak,
    specCategories,
    type Medal,
  } from '@harmony/shared';
  import { untrack } from 'svelte';
  import { progress, settings } from '../stores.ts';
  import { t, label } from '../i18n/index.ts';
  import { createSession } from '../quiz/session.ts';
  import { player } from '../audio/setup.ts';
  import Quiz from '../components/Quiz.svelte';

  const ICON: Record<Medal, string> = { gold: '🥇', silver: '🥈', bronze: '🥉' };

  // The challenge is fixed when the screen opens: today's day and what has been learned so far.
  const today = dayKey(new Date());
  const specs = dailySpecs(untrack(() => $progress));
  const categories = [...new Set(specs.flatMap(specCategories))];
  const quiz = createSession({
    spec: specs,
    progress,
    player,
    settings,
    onFinish: () => progress.update((p) => completeDaily(p, today)),
  });

  const done = $derived($progress.dailyDone ?? []);
  const doneToday = $derived(done.includes(today));
  const streak = $derived(currentStreak(done, today));
  const best = $derived(longestStreak(done));
</script>

<h2>{$t('daily.title')}</h2>
<p class="desc">{$t('daily.desc')}</p>

<section class="card">
  <p data-testid="daily-status">
    {#if doneToday}<strong class="done">✓ {$t('daily.doneToday')}</strong>{:else}{$t('daily.open')}{/if}
  </p>
  <p>
    {$t('daily.streak')}: <strong data-testid="daily-streak">{streak}</strong> · {$t('daily.best')}: <strong>{best}</strong>
  </p>
  <p class="awards">
    {#each DAILY_AWARDS as a (a.medal)}
      <span class:earned={best >= a.days} data-award={a.medal}>{ICON[a.medal]} {$t('daily.days', { n: a.days })}</span>
    {/each}
  </p>
</section>

<Quiz {quiz} {categories} stats={$progress.categories} label={$label} ranked={false} />

<style>
  .desc {
    margin: 0;
    color: var(--muted);
  }
  .card {
    padding: 0.75rem 1rem;
    border: 1px solid var(--border);
    border-radius: 0.75rem;
    background: var(--surface);
  }
  .card p {
    margin: 0.25rem 0;
  }
  .done {
    color: var(--green);
  }
  .awards {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem 1rem;
  }
  .awards span:not(.earned) {
    filter: grayscale(1);
    opacity: 0.45;
  }
</style>
