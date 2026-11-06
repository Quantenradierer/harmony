<script lang="ts">
  import {
    LESSONS,
    accuracy,
    medalFor,
    pointsMedal,
    POINT_MILESTONES,
    practiceCategories,
    DAILY_AWARDS,
    currentStreak,
    dailyMedal,
    dayKey,
    longestStreak,
    type Medal,
    type ModuleId,
  } from '@harmony/shared';
  import { progress, settings } from '../stores.ts';
  import { t, language, categoryLabel } from '../i18n/index.ts';
  import { href } from '../router.ts';
  import Leaderboard from '../components/Leaderboard.svelte';
  import ProgressChart from '../components/ProgressChart.svelte';

  const MODULES: ModuleId[] = ['notes', 'intervals', 'chords'];
  const ICON: Record<Medal, string> = { gold: '🥇', silver: '🥈', bronze: '🥉' };

  const rows = $derived(
    MODULES.flatMap((module) =>
      practiceCategories(module).map((id) => ({ module, id, stats: $progress.categories[id] })),
    ).filter((r) => r.stats),
  );
  const total = $derived($progress.totalPoints);
  const overall = $derived(pointsMedal(total));
  const lessonCount = $derived(Object.values(LESSONS).flat().length);
  const done = $derived($progress.dailyDone ?? []);
  const daily = $derived(dailyMedal(done));
</script>

<h2>{$t('trophies.title')}</h2>

<Leaderboard title={$t('leaderboard.title')} />
<p class="hint">{$t('leaderboard.hint')}</p>

<section class="card" data-testid="player-card">
  <h3>{$settings.playerName.trim() || $t('trophies.anonymous')} {overall ? ICON[overall] : ''}</h3>
  {#if !$settings.playerName.trim()}
    <p class="hint"><a href={href({ name: 'settings' })}>{$t('result.noName')}</a></p>
  {/if}
  <ul>
    <li>{$t('score.total')}: <strong>{total}</strong></li>
    <li>{$t('trophies.highscore')}: <strong data-testid="highscore">{$progress.bestSession ?? 0}</strong></li>
    <li>{$t('trophies.lessons')}: <strong>{$progress.passed.length} / {lessonCount}</strong></li>
  </ul>
  <p class="milestones">
    {#each POINT_MILESTONES as m (m.medal)}
      <span class:earned={total >= m.points}>{ICON[m.medal]} {m.points}</span>
    {/each}
  </p>
</section>

<ProgressChart />

<section>
  <h3>{$t('daily.title')} {daily ? ICON[daily] : ''}</h3>
  <p>
    {$t('daily.streak')}: <strong>{currentStreak(done, dayKey(new Date()))}</strong> · {$t('daily.best')}:
    <strong>{longestStreak(done)}</strong> · {$t('daily.total')}: <strong>{done.length}</strong>
  </p>
  <p class="milestones">
    {#each DAILY_AWARDS as a (a.medal)}
      <span class:earned={longestStreak(done) >= a.days}>{ICON[a.medal]} {$t('daily.days', { n: a.days })}</span>
    {/each}
  </p>
  <a href={href({ name: 'daily' })}>{$t('daily.go')}</a>
</section>

<section>
  <h3>{$t('trophies.medals')}</h3>
  <p class="hint">{$t('trophies.hint')}</p>
  {#if rows.length === 0}
    <p>{$t('trophies.empty')}</p>
  {:else}
    <ul class="list">
      {#each rows as r (r.id)}
        {@const medal = medalFor(r.stats)}
        {@const acc = accuracy(r.stats)}
        <li>
          <span>{$t(`module.${r.module}`)}: {categoryLabel($language, r.id)}</span>
          <span class="right">
            {Math.round((acc ?? 0) * 100)}% ({r.stats?.attempts})
            <span class="medal" data-medal={medal ?? 'none'}>{medal ? ICON[medal] : '·'}</span>
          </span>
        </li>
      {/each}
    </ul>
  {/if}
</section>

<style>
  .card {
    padding: 0.75rem 1rem;
    border: 1px solid var(--border);
    border-radius: 0.75rem;
    background: var(--surface);
  }
  ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  .list li {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.5rem 0;
    border-bottom: 1px solid var(--border);
  }
  .right {
    white-space: nowrap;
    color: var(--muted);
  }
  .medal {
    display: inline-block;
    min-width: 1.5rem;
    text-align: center;
  }
  .hint {
    color: var(--muted);
  }
  .milestones {
    display: flex;
    gap: 1rem;
  }
  .milestones span:not(.earned) {
    filter: grayscale(1);
    opacity: 0.45;
  }
</style>
