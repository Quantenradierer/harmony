import { mount } from 'svelte';
import App from './App.svelte';
import { feedbackQueue, initStores } from './stores.ts';
import './app.css';

await initStores();
// Deliver feedback written while offline.
void feedbackQueue.flush();
addEventListener('online', () => void feedbackQueue.flush());
mount(App, { target: document.getElementById('app')! });
