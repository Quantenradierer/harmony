<script lang="ts">
  import {
    INTERVAL_DIRECTIONS,
    practiceCategories,
    practiceSpec,
    type IntervalDirection,
    type ModuleId,
  } from '@harmony/shared';
  import { progress, settings } from '../stores.ts';
  import { t, label } from '../i18n/index.ts';
  import { createSession } from '../quiz/session.ts';
  import { submitRun } from '../leaderboard/submit.ts';
  import { player } from '../audio/setup.ts';
  import Quiz from '../components/Quiz.svelte';
  import type { QuizController } from '../quiz/controller.ts';

  import { untrack } from 'svelte';

  let props: { module: ModuleId } = $props();
  // The screen is re-created per module ({#key} in App), so capture once.
  const module = untrack(() => props.module);

  const all = practiceCategories(module);
  let selected = $state<string[]>([...all]);
  let quiz = $state<QuizController>();
  let chosen = $state<string[]>([]);
  let direction = $state<IntervalDirection>('ascending');

  function toggle(id: string) {
    selected = selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id];
  }

  function start() {
    chosen = all.filter((c) => selected.includes(c));
    quiz = createSession({ spec: practiceSpec(module, chosen, { direction }), progress, player, settings, onFinish: submitRun });
  }
</script>

<h2>{$t('practice.title', { module: $t(`module.${module}`) })}</h2>

{#if quiz}
  <Quiz {quiz} categories={chosen} stats={$progress.categories} label={$label} />
  <button onclick={() => (quiz = undefined)}>{$t('practice.change')}</button>
{:else}
  <p>{$t('practice.pick')}</p>
  <div class="chips">
    {#each all as id (id)}
      <button class="chip" class:on={selected.includes(id)} aria-pressed={selected.includes(id)} onclick={() => toggle(id)}>
        {$label(id)}
      </button>
    {/each}
  </div>
  {#if module === 'intervals'}
    <fieldset>
      <legend>{$t('practice.direction')}</legend>
      <div class="options">
        {#each INTERVAL_DIRECTIONS as d (d)}
          <button class:on={direction === d} aria-pressed={direction === d} onclick={() => (direction = d)}
            >{$t(`direction.${d}`)}</button
          >
        {/each}
      </div>
    </fieldset>
  {/if}
  {#if selected.length < 2}<p class="hint">{$t('practice.empty')}</p>{/if}
  <button class="primary" disabled={selected.length < 2} onclick={start}>{$t('practice.start')}</button>
{/if}

<style>
  .chips {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(6.5rem, 1fr));
    gap: 0.5rem;
  }
  .chip.on {
    border-color: var(--accent);
    outline: 2px solid var(--accent);
  }
  .hint {
    color: var(--muted);
    margin: 0;
  }
</style>
