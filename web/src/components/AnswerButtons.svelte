<script lang="ts">
  import type { Round } from '@harmony/shared';

  let {
    round,
    label,
    onpick,
  }: { round: Round; label: (id: string) => string; onpick: (id: string) => void } = $props();

  function stateOf(id: string): string {
    const picked = round.picks.includes(id);
    const isAnswer = id === round.question.answer;
    if (picked && isAnswer) return 'correct';
    if (picked) return 'wrong';
    if (round.done && isAnswer) return 'reveal';
    return '';
  }
</script>

<div class="answers">
  {#each round.question.choices as id (id)}
    <button
      class="answer {stateOf(id)}"
      data-choice={id}
      disabled={round.done || round.picks.includes(id)}
      onclick={() => onpick(id)}
    >
      {label(id)}
    </button>
  {/each}
</div>

<style>
  .answers {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(6.5rem, 1fr));
    gap: 0.75rem;
  }
  .answer {
    min-height: 3.75rem;
    font-size: 1.15rem;
  }
  .answer:disabled {
    opacity: 1;
  }
  .correct {
    background: var(--green);
    border-color: var(--green);
    color: #fff;
  }
  .wrong {
    background: var(--red);
    border-color: var(--red);
    color: #fff;
  }
  .reveal {
    outline: 3px solid var(--green);
    outline-offset: 2px;
  }
</style>
