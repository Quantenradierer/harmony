<script lang="ts">
  import { settings } from '../stores.ts';
  import { t } from '../i18n/index.ts';

  const ORDER = [1, 2, 3, 4, 5, 6, 0] as const;
  let blocked = $state(false);

  async function setEnabled(enabled: boolean) {
    blocked = false;
    if (enabled && typeof Notification !== 'undefined' && Notification.permission !== 'granted') {
      blocked = (await Notification.requestPermission()) !== 'granted';
    }
    $settings.reminder = { ...$settings.reminder, enabled };
  }

  function toggleDay(day: number) {
    const days = $settings.reminder.days.includes(day)
      ? $settings.reminder.days.filter((d) => d !== day)
      : [...$settings.reminder.days, day];
    $settings.reminder = { ...$settings.reminder, days };
  }
</script>

<fieldset>
  <legend>{$t('reminder.title')}</legend>
  <p class="hint">{$t('reminder.hint')}</p>
  <div class="options">
    {#each [true, false] as on (on)}
      <button
        class:on={$settings.reminder.enabled === on}
        aria-pressed={$settings.reminder.enabled === on}
        data-reminder={on}
        onclick={() => setEnabled(on)}>{$t(on ? 'settings.on' : 'settings.off')}</button
      >
    {/each}
  </div>
  {#if blocked}<p class="hint">{$t('reminder.blocked')}</p>{/if}
  {#if $settings.reminder.enabled}
    <label class="hint">
      {$t('reminder.time')}
      <input
        type="time"
        data-testid="reminder-time"
        value={$settings.reminder.time}
        onchange={(e) => {
          if (e.currentTarget.value) $settings.reminder = { ...$settings.reminder, time: e.currentTarget.value };
        }}
      />
    </label>
    <div class="options">
      {#each ORDER as day (day)}
        <button
          class:on={$settings.reminder.days.includes(day)}
          aria-pressed={$settings.reminder.days.includes(day)}
          data-reminder-day={day}
          onclick={() => toggleDay(day)}>{$t(`reminder.day${day}`)}</button
        >
      {/each}
    </div>
  {/if}
</fieldset>

<style>
  .hint {
    margin: 0 0 0.5rem;
    color: var(--muted);
  }
  label {
    display: block;
    margin: 0.5rem 0;
  }
</style>
