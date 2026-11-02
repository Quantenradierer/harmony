<script lang="ts">
  import {
    LESSONS,
    accuracy,
    medalFor,
    pointsMedal,
    POINT_MILESTONES,
    practiceCategories,
    type Medal,
    type ModuleId,
  } from '@harmony/shared';
  import { progress, settings } from '../stores.ts';
  import { t, language, categoryLabel } from '../i18n/index.ts';

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
</script>

<h2>{$t('trophies.title')}</h2>

<label class="name">
  <span>{$t('trophies.name')}</span>
  <input
    type="text"
    maxlength="30"
    placeholder={$t('trophies.namePlaceholder')}
    bind:value={$settings.playerName}
    data-testid="player-name"
  />
</label>

<section class="card" data-testid="player-card">
  <h3>{$settings.playerName.trim() || $t('trophies.anonymous')} {overall ? ICON[overall] : ''}</h3>
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
  .name {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  input {
    min-height: 3rem;
    padding: 0 0.75rem;
    font: inherit;
  }
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
