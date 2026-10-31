<script lang="ts">
  import { LANGUAGES } from '@harmony/shared';
  import { settings } from '../stores.ts';
  import { t } from '../i18n/index.ts';
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
