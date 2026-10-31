<script lang="ts">
  import { t } from '../i18n/index.ts';

  let { session, total, gained }: { session: number; total: number; gained?: number } = $props();
</script>

<div class="score">
  <span>{$t('score.session')}: <strong data-testid="session-score">{session}</strong></span>
  {#if gained}<span class="gained">+{gained}</span>{/if}
  <span>{$t('score.total')}: <strong data-testid="total-score">{total}</strong></span>
</div>

<style>
  .score {
    display: flex;
    justify-content: space-between;
    color: var(--muted);
  }
  .gained {
    color: var(--green);
    font-weight: 600;
  }
</style>
