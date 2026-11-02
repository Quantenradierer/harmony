<script lang="ts">
  import type { CategoryStats } from '@harmony/shared';
  import type { QuizController } from '../quiz/controller.ts';
  import { progress, settings } from '../stores.ts';
  import { t, language, yesNoQuestion } from '../i18n/index.ts';
  import { instrumentStatus } from '../audio/setup.ts';
  import AnswerButtons from './AnswerButtons.svelte';
  import ScoreBar from './ScoreBar.svelte';
  import AccuracyList from './AccuracyList.svelte';
  import { runResult } from '../leaderboard/submit.ts';
  import { href } from '../router.ts';

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

{#if $instrumentStatus === 'loading'}
  <p class="status" role="status">{$t('quiz.loading')}</p>
{:else if $instrumentStatus === 'error'}
  <p class="status error" role="alert">{$t('quiz.loadError')}</p>
{/if}
<ScoreBar session={$quizState.session.points} total={$progress.totalPoints} gained={$quizState.gained} />
{#if round}
  <section class="quiz">
    <div class="replays">
      <button class="replay" onclick={() => quiz.replay().catch(() => {})}>🔊 {$t('quiz.replay')}</button>
      {#if $settings.referencePitch}
        <button class="reference" onclick={() => quiz.replayReference().catch(() => {})}>{$t('quiz.reference')}</button>
      {/if}
    </div>
    {#if round.question.prompt.kind === 'yesno'}
      <p class="prompt" data-testid="prompt">{yesNoQuestion($language, round.question.prompt.category)}</p>
    {/if}
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
    {#if round.done && $quizState.finished}
      <div class="result" data-testid="run-result">
        <h3>{$t('result.title', { n: $quizState.answered })}</h3>
        <p class="points">{$t('result.score')}: <strong data-testid="run-score">{$quizState.session.points}</strong></p>
        <p data-testid="run-status">
          {#if $runResult?.status === 'sent'}
            {$t('result.rank', { rank: $runResult.rank })}
            {$t('result.total', { total: $runResult.total, totalRank: $runResult.totalRank })}
          {:else if $runResult?.status === 'queued'}
            {$t('result.queued')}
          {:else if $runResult?.status === 'failed'}
            {$t('result.failed')}
          {:else if $runResult?.status === 'no-name'}
            {$t('result.noName')} <a href={href({ name: 'settings' })}>{$t('nav.settings')}</a>
          {:else}
            {$t('result.sending')}
          {/if}
        </p>
        <button class="primary again" onclick={() => quiz.restart().catch(() => {})}>{$t('result.again')}</button>
        <a href={href({ name: 'trophies' })}>{$t('result.board')}</a>
      </div>
    {:else if round.done}
      <button class="primary next" onclick={() => quiz.next().catch(() => {})}>{$t('quiz.next')}</button>
    {/if}
  </section>
{:else}
  <button class="primary start" onclick={() => quiz.next().catch(() => {})}>{$t('quiz.start')}</button>
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
  .result {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border: 1px solid var(--border);
    border-radius: 0.75rem;
    background: var(--surface);
  }
  .result h3,
  .result p {
    margin: 0;
  }
  .points {
    font-size: 1.2rem;
  }
  .status {
    margin: 0;
    color: var(--muted);
  }
  .status.error {
    color: var(--red);
  }
  .prompt {
    margin: 0;
    font-size: 1.2rem;
    font-weight: 600;
    text-align: center;
  }
  .feedback {
    min-height: 1.5em;
    margin: 0;
    text-align: center;
  }
</style>
