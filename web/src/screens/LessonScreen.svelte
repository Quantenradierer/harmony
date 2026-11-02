<script lang="ts">
  import { GATE, LESSONS, findLesson, isUnlocked, lessonScore, specCategories } from '@harmony/shared';
  import { progress, settings } from '../stores.ts';
  import { t, label, language } from '../i18n/index.ts';
  import { href } from '../router.ts';
  import { createSession } from '../quiz/session.ts';
  import { submitRun } from '../leaderboard/submit.ts';
  import { player } from '../audio/setup.ts';
  import Quiz from '../components/Quiz.svelte';
  import TheoryCards from '../components/TheoryCards.svelte';
  import { lessonSummary } from '../lessons.ts';

  import { untrack } from 'svelte';

  let props: { id: string } = $props();
  // The screen is re-created per lesson ({#key} in App), so capture once.
  const id = untrack(() => props.id);

  const lesson = findLesson(id);
  const path = lesson ? LESSONS[lesson.spec.module] : [];
  const index = path.findIndex((l) => l.id === id);
  const nextLesson = path[index + 1];
  const quiz = lesson ? createSession({ spec: lesson.spec, lessonId: id, progress, player, settings, onFinish: submitRun }) : undefined;
  const passedBefore = $progress.passed.includes(id);

  const score = $derived(lessonScore($progress.lessonHistory[id] ?? []));
  const justUnlocked = $derived(!passedBefore && $progress.passed.includes(id) && nextLesson);
</script>

{#if lesson && quiz && isUnlocked($progress, path, id, $settings.lessonGating)}
  <h2>{$t(`module.${lesson.spec.module}`)} · {$t('lesson.title', { n: index + 1 })}</h2>
  <p class="summary">{lessonSummary(lesson, $language)}</p>
  <TheoryCards categories={lesson.introduces ?? []} />
  <p class="goal">
    <span data-testid="lesson-progress"
      >{$t('lesson.progress', { correct: score.correct, answered: score.answered, window: GATE.window })}</span
    >
    · {$t('lesson.goal', { percent: Math.round(GATE.threshold * 100), window: GATE.window })}
  </p>
  {#if justUnlocked && nextLesson}
    <a class="unlocked" href={href({ name: 'lesson', id: nextLesson.id })} data-testid="unlocked">
      {$t('lesson.unlocked')} {$t('lesson.next')} ›
    </a>
  {/if}
  <Quiz {quiz} categories={specCategories(lesson.spec)} stats={$progress.categories} label={$label} />
{:else}
  <p>{$t('home.locked')}</p>
{/if}

<style>
  .summary {
    margin: 0;
  }
  .goal {
    margin: 0;
    color: var(--muted);
  }
  .unlocked {
    display: block;
    padding: 0.75rem 1rem;
    border-radius: 0.75rem;
    background: var(--green);
    color: #fff;
    font-weight: 600;
    text-decoration: none;
  }
</style>
