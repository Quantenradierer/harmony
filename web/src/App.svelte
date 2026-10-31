<script lang="ts">
  import { route, href } from './router.ts';
  import { t } from './i18n/index.ts';
  import Home from './screens/Home.svelte';
  import LessonScreen from './screens/LessonScreen.svelte';
  import PracticeScreen from './screens/PracticeScreen.svelte';
  import SettingsScreen from './screens/SettingsScreen.svelte';
</script>

<header>
  {#if $route.name === 'home'}
    <h1>{$t('app.title')}</h1>
  {:else}
    <a class="back" href={href({ name: 'home' })}>‹ {$t('nav.back')}</a>
  {/if}
  <nav>
    <a href={href({ name: 'settings' })} aria-label={$t('nav.settings')} title={$t('nav.settings')}>⚙</a>
  </nav>
</header>

{#if $route.name === 'lesson'}
  {#key $route.id}<LessonScreen id={$route.id} />{/key}
{:else if $route.name === 'practice'}
  {#key $route.module}<PracticeScreen module={$route.module} />{/key}
{:else if $route.name === 'settings'}
  <SettingsScreen />
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
