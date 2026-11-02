<script lang="ts">
  import { settings } from '../stores.ts';
  import { t } from '../i18n/index.ts';
  import { fetchLeaderboard } from '../leaderboard/client.ts';
  import { runResult } from '../leaderboard/submit.ts';

  /** A lesson id or `practice-<module>`; omit for the global board. */
  let { board, title }: { board?: string; title: string } = $props();

  const MEDALS = ['🥇', '🥈', '🥉'];
  // Reload when a score was just sent.
  const sent = $derived($runResult?.status === 'sent' ? $runResult : undefined);
  const entries = $derived.by(() => {
    void sent;
    return fetchLeaderboard(board);
  });
</script>

<section class="board" data-testid={board ? 'lesson-board' : 'global-board'}>
  <h3>{title}</h3>
  {#await entries}
    <p class="hint">…</p>
  {:then list}
    {#if !list}
      <p class="hint">{$t('leaderboard.error')}</p>
    {:else if list.length === 0}
      <p class="hint">{$t('leaderboard.empty')}</p>
    {:else}
      <ol>
        {#each list as e, i (i)}
          <li class:me={e.name === $settings.playerName.trim()}>
            <span class="place">{MEDALS[i] ?? `${i + 1}.`}</span>
            <span class="who">{e.name}</span>
            <strong class="pts">{e.score}</strong>
          </li>
        {/each}
      </ol>
    {/if}
  {/await}
</section>

<style>
  h3 {
    margin: 0 0 0.25rem;
  }
  .hint {
    margin: 0;
    color: var(--muted);
  }
  ol {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  li {
    display: flex;
    gap: 0.75rem;
    padding: 0.5rem 0;
    border-bottom: 1px solid var(--border);
  }
  .me {
    font-weight: 600;
  }
  .place {
    min-width: 2rem;
  }
  .who {
    flex: 1;
    overflow-wrap: anywhere;
  }
</style>
