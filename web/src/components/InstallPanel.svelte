<script lang="ts">
  import { t } from '../i18n/index.ts';

  interface InstallPrompt extends Event {
    prompt(): Promise<void>;
  }

  let deferred = $state<InstallPrompt>();
  let installed = $state(matchMedia('(display-mode: standalone)').matches);

  $effect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      deferred = e as InstallPrompt;
    };
    const onInstalled = () => {
      installed = true;
      deferred = undefined;
    };
    addEventListener('beforeinstallprompt', onPrompt);
    addEventListener('appinstalled', onInstalled);
    return () => {
      removeEventListener('beforeinstallprompt', onPrompt);
      removeEventListener('appinstalled', onInstalled);
    };
  });

  async function install() {
    const prompt = deferred;
    deferred = undefined;
    await prompt?.prompt();
  }
</script>

{#if !installed}
  <fieldset>
    <legend>{$t('install.title')}</legend>
    <p class="hint">{$t('install.hint')}</p>
    {#if deferred}
      <div class="options">
        <button data-testid="install" onclick={install}>{$t('install.button')}</button>
      </div>
    {:else}
      <p class="hint">{$t('install.manual')}</p>
    {/if}
  </fieldset>
{/if}
