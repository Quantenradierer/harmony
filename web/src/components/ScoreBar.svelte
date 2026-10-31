<script lang="ts">
  let { session, total, gained }: { session: number; total: number; gained?: number } = $props();
</script>

<div class="score">
  <span>Sitzung: <strong data-testid="session-score">{session}</strong></span>
  {#if gained}<span class="gained">+{gained}</span>{/if}
  <span>Gesamt: <strong data-testid="total-score">{total}</strong></span>
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
