<script lang="ts">
  import { LANGUAGES, REGISTERS, type ModuleId } from '@harmony/shared';
  import { settings } from '../stores.ts';
  import { t, language } from '../i18n/index.ts';
  import { INSTRUMENTS } from '../audio/registry.ts';
  import { THEMES } from '../settings.ts';
  import BackupPanel from '../components/BackupPanel.svelte';

  const MODULES: ModuleId[] = ['notes', 'intervals', 'chords'];
</script>

<h2>{$t('settings.title')}</h2>

<fieldset>
  <legend>{$t('settings.language')}</legend>
  <div class="options">
    {#each LANGUAGES as lang (lang)}
      <button
        class:on={$settings.language === lang}
        aria-pressed={$settings.language === lang}
        data-language={lang}
        onclick={() => ($settings.language = lang)}>{$t(`language.${lang}`)}</button
      >
    {/each}
  </div>
</fieldset>

<fieldset>
  <legend>{$t('settings.theme')}</legend>
  <div class="options">
    {#each THEMES as theme (theme)}
      <button
        class:on={$settings.theme === theme}
        aria-pressed={$settings.theme === theme}
        data-theme-option={theme}
        onclick={() => ($settings.theme = theme)}>{$t(`theme.${theme}`)}</button
      >
    {/each}
  </div>
</fieldset>

<fieldset>
  <legend>{$t('settings.instrument')}</legend>
  <div class="options">
    {#each INSTRUMENTS as instrument (instrument.id)}
      <button
        class:on={$settings.instrument === instrument.id}
        aria-pressed={$settings.instrument === instrument.id}
        data-instrument={instrument.id}
        onclick={() => ($settings.instrument = instrument.id)}>{instrument.name[$language]}</button
      >
    {/each}
  </div>
</fieldset>

<fieldset>
  <legend>{$t('settings.reference')}</legend>
  <p class="hint">{$t('settings.referenceHint')}</p>
  <div class="options">
    {#each [true, false] as on (on)}
      <button
        class:on={$settings.referencePitch === on}
        aria-pressed={$settings.referencePitch === on}
        data-reference={on}
        onclick={() => ($settings.referencePitch = on)}>{$t(on ? 'settings.on' : 'settings.off')}</button
      >
    {/each}
  </div>
</fieldset>

<fieldset>
  <legend>{$t('settings.gating')}</legend>
  <p class="hint">{$t('settings.gatingHint')}</p>
  <div class="options">
    {#each [true, false] as on (on)}
      <button
        class:on={$settings.lessonGating === on}
        aria-pressed={$settings.lessonGating === on}
        data-gating={on}
        onclick={() => ($settings.lessonGating = on)}>{$t(on ? 'settings.on' : 'settings.off')}</button
      >
    {/each}
  </div>
</fieldset>

<fieldset>
  <legend>{$t('settings.playback')}</legend>
  <div class="options">
    {#each ['together', 'sequence'] as const as playback (playback)}
      <button
        class:on={$settings.playback === playback}
        aria-pressed={$settings.playback === playback}
        data-playback={playback}
        onclick={() => ($settings.playback = playback)}>{$t(`playback.${playback}`)}</button
      >
    {/each}
  </div>
</fieldset>

{#each MODULES as module (module)}
  <fieldset>
    <legend>{$t('settings.register', { module: $t(`module.${module}`) })}</legend>
    <div class="options">
      {#each REGISTERS as register (register)}
        <button
          class:on={$settings.registers[module] === register}
          aria-pressed={$settings.registers[module] === register}
          data-register="{module}-{register}"
          onclick={() => ($settings.registers = { ...$settings.registers, [module]: register })}
          >{$t(`register.${register}`)}</button
        >
      {/each}
    </div>
  </fieldset>
{/each}

<BackupPanel />

<style>
  .hint {
    margin: 0 0 0.5rem;
    color: var(--muted);
  }
</style>
