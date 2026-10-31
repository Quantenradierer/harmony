<script lang="ts">
  import type { QuizController } from '../quiz/controller.ts';

  import AnswerButtons from './AnswerButtons.svelte';

  let { quiz, label }: { quiz: QuizController; label: (id: string) => string } = $props();
  const quizState = $derived(quiz.state);
</script>

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

<style>
  .quiz {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }
</style>
