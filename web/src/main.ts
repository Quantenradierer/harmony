import { mount } from 'svelte';
import App from './App.svelte';
import { initStores } from './stores.ts';
import './app.css';

await initStores();
mount(App, { target: document.getElementById('app')! });
