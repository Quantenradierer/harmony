<script lang="ts">
  import { accuracy, type CategoryStats } from '@harmony/shared';

  let {
    categories,
    stats,
    label,
  }: { categories: string[]; stats: Record<string, CategoryStats>; label: (id: string) => string } =
    $props();

  const percent = (id: string) => {
    const a = accuracy(stats[id]);
    return a === undefined ? '–' : `${Math.round(a * 100)}%`;
  };
</script>

<ul class="accuracy">
  {#each categories as id (id)}
    <li><span>{label(id)}</span> <strong>{percent(id)}</strong></li>
  {/each}
</ul>

<style>
  .accuracy {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem 1rem;
    color: var(--muted);
  }
</style>
