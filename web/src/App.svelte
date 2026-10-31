<script lang="ts">
  import { APP_NAME, generateNoteQuestion, recordAnswer, noteId } from '@harmony/shared';
  import Quiz from './components/Quiz.svelte';
  import { QuizController } from './quiz/controller.ts';
  import { Player } from './audio/player.ts';
  import { createSynth } from './audio/synth.ts';
  import { getAudioOut } from './audio/context.ts';
  import type { AppState } from './app-state.ts';

  let { app }: { app: AppState } = $props();

  const NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'H'];
  const PCS = [0, 7];
  let synth: ReturnType<typeof createSynth> | undefined;

  const player = new Player({
    instrument: async () => (synth ??= createSynth(getAudioOut())),
    now: () => getAudioOut().context.currentTime,
  });
  const quiz = new QuizController({
    nextQuestion: () => generateNoteQuestion({ pitchClasses: PCS }, Math.random),
    player,
    onResult: (r) =>
      app.progress.update((p) =>
        recordAnswer(p, { category: r.question.category, outcome: r.outcome, points: r.points }),
      ),
  });
  const label = (id: string) => NAMES[Number(id.split(':')[1])]!;
  const progress = $derived(app.progress);
</script>

<h1>{APP_NAME}</h1>
<Quiz {quiz} {label} total={$progress.totalPoints} categories={PCS.map(noteId)} stats={$progress.categories} />
