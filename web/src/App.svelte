<script lang="ts">
  import { APP_NAME, generateNoteQuestion } from '@harmony/shared';
  import Quiz from './components/Quiz.svelte';
  import { QuizController } from './quiz/controller.ts';
  import { Player } from './audio/player.ts';
  import { createSynth } from './audio/synth.ts';
  import { getAudioOut } from './audio/context.ts';

  const NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'H'];
  let synth: ReturnType<typeof createSynth> | undefined;

  const player = new Player({
    instrument: async () => (synth ??= createSynth(getAudioOut())),
    now: () => getAudioOut().context.currentTime,
  });
  const quiz = new QuizController({
    nextQuestion: () => generateNoteQuestion({ pitchClasses: [0, 7] }, Math.random),
    player,
  });
  const label = (id: string) => NAMES[Number(id.split(':')[1])]!;
</script>

<h1>{APP_NAME}</h1>
<Quiz {quiz} {label} />
