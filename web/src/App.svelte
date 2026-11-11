<script lang="ts">
  import { route, href } from './router.ts';
  import { t } from './i18n/index.ts';
  import Home from './screens/Home.svelte';
  import LessonScreen from './screens/LessonScreen.svelte';
  import PracticeScreen from './screens/PracticeScreen.svelte';
  import SettingsScreen from './screens/SettingsScreen.svelte';
  import TrophiesScreen from './screens/TrophiesScreen.svelte';
  import FeedbackScreen from './screens/FeedbackScreen.svelte';
  import DailyScreen from './screens/DailyScreen.svelte';
  import FocusScreen from './screens/FocusScreen.svelte';
  import { settings } from './stores.ts';
  import { THEME_COLORS } from './settings.ts';
  import { isReminderDue, dayKey } from './reminder.ts';

  $effect(() => {
    const theme = $settings.theme;
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[theme]);
  });

  // Reminder: checked while the app is open; a static web app has no server push.
  $effect(() => {
    const reminder = $settings.reminder;
    if (!reminder.enabled) return;
    const check = async () => {
      if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
      const now = new Date();
      let last: string | undefined;
      try {
        last = localStorage.getItem('reminder-last') ?? undefined;
      } catch {
        // storage unavailable: worst case the reminder repeats
      }
      if (!isReminderDue(now, reminder, last)) return;
      try {
        localStorage.setItem('reminder-last', dayKey(now));
      } catch {
        // see above
      }
      const title = $t('reminder.notifyTitle');
      const options = { body: $t('reminder.notifyBody'), icon: 'icon-192.png', tag: 'practice-reminder' };
      const reg = await navigator.serviceWorker?.getRegistration();
      if (reg) await reg.showNotification(title, options);
      else new Notification(title, options);
    };
    void check();
    const id = setInterval(check, 30_000);
    document.addEventListener('visibilitychange', check);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', check);
    };
  });
</script>

<header>
  {#if $route.name === 'home'}
    <h1>{$t('app.title')}</h1>
  {:else}
    <a class="back" href={href({ name: 'home' })}>‹ {$t('nav.back')}</a>
  {/if}
  <nav>
    <a href={href({ name: 'trophies' })} aria-label={$t('nav.trophies')} title={$t('nav.trophies')}>🏆</a>
    <a href={href({ name: 'feedback' })} aria-label={$t('nav.feedback')} title={$t('nav.feedback')}>✉</a>
    <a href={href({ name: 'settings' })} aria-label={$t('nav.settings')} title={$t('nav.settings')}>⚙</a>
  </nav>
</header>

{#if $route.name === 'lesson'}
  {#key $route.id}<LessonScreen id={$route.id} />{/key}
{:else if $route.name === 'practice'}
  {#key $route.module}<PracticeScreen module={$route.module} />{/key}
{:else if $route.name === 'settings'}
  <SettingsScreen />
{:else if $route.name === 'trophies'}
  <TrophiesScreen />
{:else if $route.name === 'daily'}
  <DailyScreen />
{:else if $route.name === 'focus'}
  <FocusScreen />
{:else if $route.name === 'feedback'}
  <FeedbackScreen />
{:else}
  <Home />
{/if}

<style>
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 3rem;
  }
  h1 {
    font-size: 1.5rem;
  }
  nav {
    display: flex;
    gap: 0.5rem;
  }
  nav a,
  .back {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 3rem;
    min-height: 3rem;
    font-size: 1.1rem;
    color: var(--fg);
    text-decoration: none;
  }
  nav a {
    font-size: 1.5rem;
  }
</style>
