<script lang="ts">
  import { theoryCard } from '@harmony/shared';
  import { t, label, language } from '../i18n/index.ts';

  let { categories }: { categories: string[] } = $props();
  const cards = $derived(
    categories
      .map((c) => ({ id: c, text: theoryCard(c, $language) }))
      .filter((c): c is { id: string; text: string } => !!c.text),
  );
</script>

{#if cards.length > 0}
  <details class="theory" open>
    <summary>{$t('lesson.theory')}</summary>
    {#each cards as card (card.id)}
      <div class="card" data-theory={card.id}>
        <strong>{$label(card.id)}</strong>
        <p>{card.text}</p>
      </div>
    {/each}
  </details>
{/if}

<style>
  .theory {
    border: 1px solid var(--border);
    border-radius: 0.75rem;
    padding: 0.75rem 1rem;
    background: var(--surface);
  }
  summary {
    font-weight: 600;
    min-height: 2rem;
    cursor: pointer;
  }
  .card p {
    margin: 0.25rem 0 0.75rem;
  }
</style>
