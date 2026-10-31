<script lang="ts">
  import { get } from 'svelte/store';
  import { progress, settings } from '../stores.ts';
  import { t } from '../i18n/index.ts';
  import { createBackup, hasProgress, parseBackup, type ImportError } from '../backup.ts';

  let error = $state<ImportError>();
  let done = $state(false);
  let pending = $state<{ progress: typeof $progress; settings: typeof $settings }>();
  let input: HTMLInputElement;

  function exportFile() {
    const blob = new Blob([createBackup(get(progress), get(settings))], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `harmony-trainer-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function chooseFile() {
    const file = input.files?.[0];
    input.value = '';
    error = undefined;
    done = false;
    if (!file) return;
    const result = parseBackup(await file.text());
    if (!result.ok) {
      error = result.error;
      return;
    }
    pending = { progress: result.progress, settings: result.settings };
    if (!hasProgress(get(progress))) apply();
  }

  function apply() {
    if (!pending) return;
    progress.set(pending.progress);
    settings.set(pending.settings);
    pending = undefined;
    done = true;
  }

  const errors = {
    'not-json': 'backup.errorNotJson',
    foreign: 'backup.errorForeign',
    version: 'backup.errorVersion',
    invalid: 'backup.errorInvalid',
  } as const;
</script>

<fieldset>
  <legend>{$t('backup.title')}</legend>
  <p class="hint">{$t('backup.hint')}</p>
  <div class="options">
    <button data-testid="export" onclick={exportFile}>{$t('backup.export')}</button>
    <button data-testid="import" onclick={() => input.click()}>{$t('backup.import')}</button>
  </div>
  <input
    bind:this={input}
    type="file"
    accept="application/json,.json"
    hidden
    data-testid="import-file"
    onchange={chooseFile}
  />

  {#if pending}
    <div class="confirm" role="alertdialog" data-testid="import-confirm">
      <p>{$t('backup.confirm')}</p>
      <div class="options">
        <button class="danger" onclick={apply}>{$t('backup.overwrite')}</button>
        <button onclick={() => (pending = undefined)}>{$t('backup.cancel')}</button>
      </div>
    </div>
  {/if}
  {#if error}<p class="error" role="alert" data-testid="import-error">{$t(errors[error])}</p>{/if}
  {#if done}<p class="ok" role="status" data-testid="import-done">{$t('backup.done')}</p>{/if}
</fieldset>

<style>
  .hint {
    margin: 0 0 0.5rem;
    color: var(--muted);
  }
  .confirm p {
    margin: 0.75rem 0 0.5rem;
    font-weight: 600;
  }
  .danger {
    background: var(--red);
    border-color: var(--red);
    color: #fff;
  }
  .error {
    color: var(--red);
    margin: 0.5rem 0 0;
  }
  .ok {
    color: var(--green);
    margin: 0.5rem 0 0;
  }
</style>
