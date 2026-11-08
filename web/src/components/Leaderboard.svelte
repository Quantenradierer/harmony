<script lang="ts">
  import { ACHIEVEMENTS } from '@harmony/shared';
  import { settings } from '../stores.ts';
  import { t, type MessageKey } from '../i18n/index.ts';
  import { fetchLeaderboard } from '../leaderboard/client.ts';
  import { runResult } from '../leaderboard/submit.ts';

  /** A lesson id or `practice-<module>`; omit for the global board. */
  let { board, title }: { board?: string; title: string } = $props();

  /** Earned achievements in display order; unknown ids (newer server) are skipped. */
  const badges = (ids: string[]) => ACHIEVEMENTS.filter((a) => ids.includes(a.id));

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
            <span class="who">
              {e.name}
              {#if e.achievements?.length}
                <span class="badges" data-testid="board-badges">
                  {#each badges(e.achievements) as a (a.id)}
                    <span class="badge" title={$t(`achievement.${a.id}.name` as MessageKey)}>{a.icon}</span>
                  {/each}
                </span>
              {/if}
            </span>
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
  .badges {
    display: block;
    font-size: 0.8rem;
    line-height: 1.3;
    font-weight: normal;
  }
  .who {
    flex: 1;
    overflow-wrap: anywhere;
  }
</style>
