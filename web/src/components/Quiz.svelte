<script lang="ts">
  import type { CategoryStats } from '@harmony/shared';
  import type { QuizController } from '../quiz/controller.ts';
  import { progress, settings } from '../stores.ts';
  import { t } from '../i18n/index.ts';
  import AnswerButtons from './AnswerButtons.svelte';
  import ScoreBar from './ScoreBar.svelte';
  import AccuracyList from './AccuracyList.svelte';

  let {
    quiz,
    label,
    categories,
    stats,
  }: {
    quiz: QuizController;
    label: (id: string) => string;
    categories: string[];
    stats: Record<string, CategoryStats>;
  } = $props();
  const quizState = $derived(quiz.state);
  const round = $derived($quizState.round);
</script>

<ScoreBar session={$quizState.session.points} total={$progress.totalPoints} gained={$quizState.gained} />
{#if round}
  <section class="quiz">
    <div class="replays">
      <button class="replay" onclick={() => quiz.replay()}>🔊 {$t('quiz.replay')}</button>
      {#if $settings.referencePitch}
        <button class="reference" onclick={() => quiz.replayReference()}>{$t('quiz.reference')}</button>
      {/if}
    </div>
    <AnswerButtons {round} {label} onpick={(id) => quiz.answer(id)} />
    <p class="feedback" aria-live="polite">
      {#if round.done && round.outcome !== 'wrong'}
        {$t('quiz.correct')}
      {:else if round.done}
        {$t('quiz.wrong', { answer: label(round.question.answer) })}
      {:else if round.picks.length > 0}
        {$t('quiz.tryAgain')}
      {/if}
    </p>
    {#if round.done}
      <button class="primary next" onclick={() => quiz.next()}>{$t('quiz.next')}</button>
    {/if}
  </section>
{:else}
  <button class="primary start" onclick={() => quiz.next()}>{$t('quiz.start')}</button>
{/if}
<AccuracyList {categories} {stats} {label} />

<style>
  .quiz {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .replays {
    display: flex;
    gap: 0.5rem;
  }
  .replays button {
    flex: 1;
  }
  .feedback {
    min-height: 1.5em;
    margin: 0;
    text-align: center;
  }
</style>
