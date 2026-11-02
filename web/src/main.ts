import { mount } from 'svelte';
import { registerSW } from 'virtual:pwa-register';
import App from './App.svelte';
import { feedbackQueue, initStores, scoreQueue } from './stores.ts';
import './app.css';

await initStores();
// Deliver feedback and scores collected while offline.
const flushQueues = () => void Promise.all([feedbackQueue.flush(), scoreQueue.flush()]);
flushQueues();
addEventListener('online', flushQueues);
mount(App, { target: document.getElementById('app')! });

// autoUpdate: a new version activates and reloads the app on its own.
// Installed apps may stay open for days, so look for updates every hour.
registerSW({
  immediate: true,
  onRegisteredSW(_url, registration) {
    if (registration) setInterval(() => void registration.update(), 60 * 60 * 1000);
  },
});
