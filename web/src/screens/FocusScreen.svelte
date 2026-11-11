<script lang="ts">
  import { accuracy, focusPlan, pickFocus, topConfusions, weakestCategories } from '@harmony/shared';
  import { untrack } from 'svelte';
  import { progress, settings } from '../stores.ts';
  import { t, label } from '../i18n/index.ts';
  import { createSession } from '../quiz/session.ts';
  import { player } from '../audio/setup.ts';
  import Quiz from '../components/Quiz.svelte';

  // The answer choices are fixed when the screen opens; which one is asked adapts as you answer.
  const plan = focusPlan(untrack(() => $progress));
  const categories = plan.flatMap((part) => part.categories);
  const quiz = createSession({
    choose: (p, rng) => pickFocus(plan, p, rng),
    progress,
    player,
    settings,
  });

  const confusions = $derived(topConfusions($progress));
  const weakest = $derived(weakestCategories($progress).filter((w) => (accuracy(w.stats) ?? 1) < 1));
  const percent = (x: number) => `${Math.round(x * 100)} %`;
</script>

<h2>{$t('focus.title')}</h2>
<p class="desc">{$t('focus.desc')}</p>

<section class="card" data-testid="confusions">
  <h3>{$t('focus.confusions')}</h3>
  {#if confusions.length === 0}
    <p class="muted">{$t('focus.noConfusions')}</p>
  {:else}
    <ul>
      {#each confusions as c (c.played + c.heardAs)}
        <li data-testid="confusion">
          <span>{$t('focus.heardAs', { played: $label(c.played), heardAs: $label(c.heardAs) })}</span>
          <strong>{percent(c.rate)}</strong>
          <small>{$t('focus.times', { count: c.count, attempts: c.attempts })}</small>
          <span class="bar" style:--w="{Math.round(c.rate * 100)}%" aria-hidden="true"></span>
        </li>
      {/each}
    </ul>
  {/if}
</section>

{#if weakest.length > 0}
  <section class="card" data-testid="weakest">
    <h3>{$t('focus.weakest')}</h3>
    <ul>
      {#each weakest as w (w.category)}
        <li>
          <span>{$label(w.category)}</span>
          <strong>{percent(accuracy(w.stats) ?? 0)}</strong>
          <small>{$t('focus.firstTry', { attempts: w.stats.attempts })}</small>
        </li>
      {/each}
    </ul>
  </section>
{/if}

<Quiz {quiz} {categories} stats={$progress.categories} label={$label} ranked={false} finishedText={$t('focus.finished')} />

<style>
  .desc,
  .muted {
    margin: 0;
    color: var(--muted);
  }
  .card {
    padding: 0.75rem 1rem;
    border: 1px solid var(--border);
    border-radius: 0.75rem;
    background: var(--surface);
  }
  h3 {
    margin: 0 0 0.5rem;
    font-size: 1rem;
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }
  li {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0.1rem 0.75rem;
  }
  li span:first-child {
    flex: 1 1 12rem;
  }
  li small {
    flex-basis: 100%;
    color: var(--muted);
  }
  .bar {
    flex-basis: 100%;
    height: 0.3rem;
    border-radius: 0.15rem;
    background: linear-gradient(to right, var(--red) var(--w), var(--border) var(--w));
  }
</style>
