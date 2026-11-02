<script lang="ts">
  import { LESSONS, isUnlocked, type ModuleId } from '@harmony/shared';
  import { progress, settings } from '../stores.ts';
  import { t, language } from '../i18n/index.ts';
  import { lessonSummary } from '../lessons.ts';
  import { href } from '../router.ts';
  import type { MessageKey } from '../i18n/index.ts';

  const MODULES: ModuleId[] = ['notes', 'intervals', 'chords'];
</script>

{#each MODULES.filter((m) => LESSONS[m].length > 0) as module (module)}
  <section class="module">
    <h2>{$t(`module.${module}`)}</h2>
    <ol class="lessons">
      {#each LESSONS[module] as lesson, i (lesson.id)}
        {@const open = isUnlocked($progress, LESSONS[module], lesson.id, $settings.lessonGating)}
        {@const passed = $progress.passed.includes(lesson.id)}
        <li>
          {#if open}
            <a class="lesson" class:passed href={href({ name: 'lesson', id: lesson.id })} data-lesson={lesson.id}>
              <strong>{$t('lesson.title', { n: i + 1 })}</strong>
              <span>{lessonSummary(lesson, $language)}</span>
              <small>{$t(`lesson.desc.${lesson.id}` as MessageKey)}</small>
              {#if passed}<em>✓ {$t('home.passed')}</em>{/if}
            </a>
          {:else}
            <div class="lesson locked" data-lesson={lesson.id} aria-disabled="true">
              <strong>{$t('lesson.title', { n: i + 1 })}</strong>
              <em>🔒 {$t('home.locked')}</em>
            </div>
          {/if}
        </li>
      {/each}
    </ol>
    <a class="practice" href={href({ name: 'practice', module })}>{$t('home.practice')}</a>
  </section>
{/each}

<style>
  .module {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  .lessons {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .lesson,
  .practice {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0.25rem 0.75rem;
    min-height: 3.5rem;
    padding: 0.75rem 1rem;
    border: 1px solid var(--border);
    border-radius: 0.75rem;
    background: var(--surface);
    color: var(--fg);
    text-decoration: none;
  }
  .lesson span {
    color: var(--muted);
  }
  .lesson small {
    flex-basis: 100%;
    color: var(--muted);
  }
  .lesson em {
    margin-left: auto;
    font-style: normal;
    color: var(--muted);
  }
  .lesson.passed em {
    color: var(--green);
  }
  .locked {
    opacity: 0.55;
  }
  .practice {
    align-items: center;
    justify-content: center;
    font-weight: 600;
  }
</style>
