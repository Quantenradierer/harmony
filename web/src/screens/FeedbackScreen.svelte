<script lang="ts">
  import { FEEDBACK_MAX_LENGTH } from '@harmony/shared';
  import { t } from '../i18n/index.ts';
  import { postFeedback, type SendResult } from '../feedback/client.ts';

  let text = $state('');
  let sending = $state(false);
  let result = $state<SendResult>();
  const length = $derived([...text.trim()].length);
  const tooLong = $derived(length > FEEDBACK_MAX_LENGTH);

  async function send(event: SubmitEvent) {
    event.preventDefault();
    if (length === 0 || tooLong) return;
    sending = true;
    result = await postFeedback(text.trim());
    sending = false;
    if (result === 'sent') text = '';
  }

  const messages = {
    sent: 'feedback.sent',
    rejected: 'feedback.rejected',
    'rate-limited': 'feedback.rateLimited',
    network: 'feedback.network',
  } as const;
</script>

<h2>{$t('feedback.title')}</h2>
<p>{$t('feedback.intro')}</p>

<form onsubmit={send}>
  <textarea
    bind:value={text}
    rows="8"
    placeholder={$t('feedback.placeholder')}
    aria-label={$t('feedback.title')}
    oninput={() => (result = undefined)}
  ></textarea>
  <div class="meta" class:over={tooLong}>
    {#if tooLong}{$t('feedback.tooLong', { max: FEEDBACK_MAX_LENGTH })}{/if}
    <span>{$t('feedback.count', { n: length, max: FEEDBACK_MAX_LENGTH })}</span>
  </div>
  <button class="primary" type="submit" disabled={sending || length === 0 || tooLong}>
    {sending ? $t('feedback.sending') : $t('feedback.send')}
  </button>
</form>

{#if result}
  <p class="result" class:ok={result === 'sent'} role="status" data-testid="feedback-result">
    {$t(messages[result])}
  </p>
{/if}

<style>
  form {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  textarea {
    font: inherit;
    padding: 0.75rem;
    border-radius: 0.75rem;
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--fg);
    resize: vertical;
  }
  .meta {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    color: var(--muted);
    font-size: 0.9rem;
  }
  .meta span {
    margin-left: auto;
  }
  .meta.over {
    color: var(--red);
  }
  .result {
    margin: 0;
    color: var(--red);
  }
  .result.ok {
    color: var(--green);
  }
</style>
