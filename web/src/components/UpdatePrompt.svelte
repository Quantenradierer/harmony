<script lang="ts">
  import { useRegisterSW } from 'virtual:pwa-register/svelte';
  import { t } from '../i18n/index.ts';

  const HOUR = 60 * 60 * 1000;

  const { needRefresh, updateServiceWorker } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      // Installed apps may stay open for days: look for updates regularly.
      if (registration) setInterval(() => void registration.update(), HOUR);
    },
  });
</script>

{#if $needRefresh}
  <div class="toast" role="alert" data-testid="update-prompt">
    <span>{$t('update.available')}</span>
    <button class="primary" onclick={() => updateServiceWorker(true)}>{$t('update.reload')}</button>
    <button onclick={() => ($needRefresh = false)}>{$t('update.later')}</button>
  </div>
{/if}

<style>
  .toast {
    position: fixed;
    left: 1rem;
    right: 1rem;
    bottom: calc(1rem + env(safe-area-inset-bottom));
    max-width: 32rem;
    margin: 0 auto;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border-radius: 0.75rem;
    border: 1px solid var(--border);
    background: var(--surface);
    box-shadow: 0 4px 16px rgb(0 0 0 / 0.2);
  }
  span {
    flex: 1 1 12rem;
  }
</style>
