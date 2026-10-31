<script lang="ts">
  import type { CategoryStats } from '@harmony/shared';
  import type { QuizController } from '../quiz/controller.ts';
  import AnswerButtons from './AnswerButtons.svelte';
  import ScoreBar from './ScoreBar.svelte';
  import AccuracyList from './AccuracyList.svelte';

  let {
    quiz,
    label,
    total,
    categories,
    stats,
  }: {
    quiz: QuizController;
    label: (id: string) => string;
    total: number;
    categories: string[];
    stats: Record<string, CategoryStats>;
  } = $props();
  const quizState = $derived(quiz.state);
</script>

<ScoreBar session={$quizState.session.points} {total} gained={$quizState.gained} />
{#if $quizState.round}
  <section class="quiz">
    <button class="replay" onclick={() => quiz.replay()}>Nochmal hören</button>
    <AnswerButtons round={$quizState.round} {label} onpick={(id) => quiz.answer(id)} />
    {#if $quizState.round.done}
      <button class="primary next" onclick={() => quiz.next()}>Weiter</button>
    {/if}
  </section>
{:else}
  <button class="primary start" onclick={() => quiz.next()}>Start</button>
{/if}
<AccuracyList {categories} {stats} {label} />

<style>
  .quiz {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }
</style>
