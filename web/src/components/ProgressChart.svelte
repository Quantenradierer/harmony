<script lang="ts">
  import { dayKey, recentDays } from '@harmony/shared';
  import { progress } from '../stores.ts';
  import { t, language } from '../i18n/index.ts';

  /** Days shown, ending today. */
  const DAYS = 14;
  const W = 300;
  const H = 140;
  const TOP = 16;
  const BOTTOM = 20;
  const SLOT = W / DAYS;
  const BAR = SLOT - 6;

  const today = dayKey(new Date());
  const days = $derived(recentDays($progress, today, DAYS));
  const max = $derived(Math.max(1, ...days.map((d) => d.points)));
  const totalAnswers = $derived(days.reduce((a, d) => a + d.answers, 0));
  let selected = $state<number>();
  const shown = $derived(days[selected ?? DAYS - 1]!);

  const date = (day: string, opts: Intl.DateTimeFormatOptions) =>
    new Date(`${day}T12:00:00`).toLocaleDateString($language, opts);
  const percent = (d: { answers: number; correct: number }) =>
    d.answers ? `${Math.round((d.correct / d.answers) * 100)} %` : '–';
  const describe = (d: (typeof days)[number]) =>
    $t('chart.day', { date: date(d.day, { weekday: 'short', day: 'numeric', month: 'short' }), points: d.points, answers: d.answers, accuracy: percent(d) });

  /** Bar with 4px rounded top, square at the baseline. */
  function bar(i: number, points: number): string {
    const h = points === 0 ? 0 : Math.max(2, ((H - TOP - BOTTOM) * points) / max);
    const x = i * SLOT + (SLOT - BAR) / 2;
    const y = H - BOTTOM - h;
    const r = Math.min(4, h, BAR / 2);
    return `M${x},${H - BOTTOM}V${y + r}Q${x},${y} ${x + r},${y}H${x + BAR - r}Q${x + BAR},${y} ${x + BAR},${y + r}V${H - BOTTOM}Z`;
  }
</script>

<section class="chart" data-testid="progress-chart">
  <h3>{$t('chart.title', { n: DAYS })}</h3>
  {#if totalAnswers === 0}
    <p class="hint">{$t('chart.empty')}</p>
  {:else}
    <svg viewBox="0 0 {W} {H}" role="img" aria-label={$t('chart.title', { n: DAYS })}>
      <line class="grid" x1="0" x2={W} y1={TOP} y2={TOP} />
      <text class="axis" x="0" y={TOP - 4}>{max}</text>
      <line class="base" x1="0" x2={W} y1={H - BOTTOM} y2={H - BOTTOM} />
      {#each days as d, i (d.day)}
        <g
          class="slot"
          class:active={i === (selected ?? DAYS - 1)}
          role="button"
          tabindex="0"
          aria-label={describe(d)}
          onpointerenter={() => (selected = i)}
          onfocus={() => (selected = i)}
          onclick={() => (selected = i)}
          onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && (selected = i)}
        >
          <rect class="hit" x={i * SLOT} y="0" width={SLOT} height={H} />
          <path class="bar" d={bar(i, d.points)} />
          <text class="axis" x={i * SLOT + SLOT / 2} y={H - 6} text-anchor="middle">{date(d.day, { day: 'numeric' })}</text>
        </g>
      {/each}
    </svg>
    <p class="readout" aria-live="polite" data-testid="chart-readout">{describe(shown)}</p>
    <details>
      <summary>{$t('chart.table')}</summary>
      <table>
        <thead>
          <tr><th>{$t('chart.date')}</th><th>{$t('chart.points')}</th><th>{$t('chart.answers')}</th><th>{$t('chart.accuracy')}</th></tr>
        </thead>
        <tbody>
          {#each [...days].reverse() as d (d.day)}
            <tr>
              <td>{date(d.day, { weekday: 'short', day: 'numeric', month: 'short' })}</td>
              <td>{d.points}</td>
              <td>{d.answers}</td>
              <td>{percent(d)}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </details>
  {/if}
</section>

<style>
  svg {
    display: block;
    width: 100%;
    height: auto;
    touch-action: pan-y;
  }
  .grid {
    stroke: var(--border);
    stroke-dasharray: 2 3;
  }
  .base {
    stroke: var(--border);
  }
  .axis {
    font-size: 9px;
    fill: var(--muted);
  }
  .hit {
    fill: transparent;
  }
  .bar {
    fill: var(--accent);
    opacity: 0.55;
  }
  .slot.active .bar {
    opacity: 1;
  }
  .slot:focus-visible {
    outline: none;
  }
  .slot:focus-visible .hit {
    stroke: var(--accent);
  }
  .readout {
    margin: 0.25rem 0;
  }
  .hint {
    color: var(--muted);
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-variant-numeric: tabular-nums;
  }
  th,
  td {
    text-align: right;
    padding: 0.25rem 0.5rem;
    border-bottom: 1px solid var(--border);
  }
  th:first-child,
  td:first-child {
    text-align: left;
  }
</style>
