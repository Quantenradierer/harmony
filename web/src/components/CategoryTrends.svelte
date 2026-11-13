<script lang="ts">
  import { categoryTrend, practiceCategories, type ModuleId, type TrendPoint } from '@harmony/shared';
  import { progress } from '../stores.ts';
  import { t, label, language } from '../i18n/index.ts';

  const MODULES: ModuleId[] = ['notes', 'intervals', 'chords'];
  /** Practised days shown per category, newest last. */
  const LIMIT = 30;
  const W = 300;
  const H = 90;
  const LEFT = 26;
  const RIGHT = 6;
  const TOP = 8;
  const BOTTOM = 16;

  const groups = $derived(
    MODULES.map((module) => ({
      module,
      rows: practiceCategories(module)
        .map((id) => ({ id, points: categoryTrend($progress, id, LIMIT) }))
        .filter((r) => r.points.length > 0),
    })),
  );
  const anyData = $derived(groups.some((g) => g.rows.length > 0));

  const pct = (p: TrendPoint) => Math.round((p.correct / p.attempts) * 100);
  const date = (day: string) =>
    new Date(`${day}T12:00:00`).toLocaleDateString($language, { day: 'numeric', month: 'short' });
  const x = (i: number, n: number) => (n === 1 ? (LEFT + W - RIGHT) / 2 : LEFT + ((W - LEFT - RIGHT) * i) / (n - 1));
  const y = (percent: number) => TOP + ((H - TOP - BOTTOM) * (100 - percent)) / 100;
  const line = (points: TrendPoint[]) =>
    points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i, points.length).toFixed(1)},${y(pct(p)).toFixed(1)}`).join('');
  const describe = (id: string, points: TrendPoint[]) => {
    const first = points[0]!;
    const last = points.at(-1)!;
    return $t('trends.summary', {
      name: $label(id),
      days: points.length,
      from: `${pct(first)} %`,
      fromDate: date(first.day),
      to: `${pct(last)} %`,
      toDate: date(last.day),
    });
  };
</script>

<section data-testid="category-trends">
  <h3>{$t('trends.title')}</h3>
  {#if !anyData}
    <p class="hint">{$t('trends.empty')}</p>
  {:else}
    <p class="hint">{$t('trends.hint')}</p>
    {#each groups as g (g.module)}
      {#if g.rows.length > 0}
        <details class="group" data-testid="trend-group" data-module={g.module}>
          <summary>{$t(`module.${g.module}`)} <small>({g.rows.length})</small></summary>
          <ul>
            {#each g.rows as r (r.id)}
              {@const last = r.points.at(-1)!}
              <li data-testid="trend" data-category={r.id}>
                <div class="head">
                  <strong>{$label(r.id)}</strong>
                  <span class="muted">{pct(last)} % · {date(last.day)}</span>
                </div>
                <svg viewBox="0 0 {W} {H}" role="img" aria-label={describe(r.id, r.points)}>
                  {#each [100, 50, 0] as level (level)}
                    <line class="grid" x1={LEFT} x2={W - RIGHT} y1={y(level)} y2={y(level)} />
                    <text class="axis" x={LEFT - 4} y={y(level) + 3} text-anchor="end">{level}%</text>
                  {/each}
                  <path class="line" d={line(r.points)} />
                  {#each r.points as p, i (p.day)}
                    <circle class="dot" cx={x(i, r.points.length)} cy={y(pct(p))} r="3">
                      <title>{date(p.day)}: {pct(p)} % ({$t('trends.answers', { n: p.attempts })})</title>
                    </circle>
                  {/each}
                  <text class="axis" x={LEFT} y={H - 3}>{date(r.points[0]!.day)}</text>
                  {#if r.points.length > 1}
                    <text class="axis" x={W - RIGHT} y={H - 3} text-anchor="end">{date(last.day)}</text>
                  {/if}
                </svg>
              </li>
            {/each}
          </ul>
        </details>
      {/if}
    {/each}
  {/if}
</section>

<style>
  .hint,
  .muted {
    color: var(--muted);
  }
  .group {
    border: 1px solid var(--border);
    border-radius: 0.75rem;
    background: var(--surface);
    margin-bottom: 0.5rem;
  }
  summary {
    cursor: pointer;
    padding: 0.6rem 1rem;
    font-weight: 600;
  }
  summary small {
    color: var(--muted);
    font-weight: normal;
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0 1rem 0.5rem;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
    gap: 0.75rem 1.5rem;
  }
  .head {
    display: flex;
    justify-content: space-between;
    gap: 0.5rem;
  }
  svg {
    display: block;
    width: 100%;
    height: auto;
  }
  .grid {
    stroke: var(--border);
    stroke-dasharray: 2 3;
  }
  .axis {
    font-size: 9px;
    fill: var(--muted);
  }
  .line {
    fill: none;
    stroke: var(--accent);
    stroke-width: 2;
    stroke-linejoin: round;
    stroke-linecap: round;
  }
  .dot {
    fill: var(--accent);
  }
</style>
