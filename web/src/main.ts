import { mount } from 'svelte';
import App from './App.svelte';
import { initAppState } from './app-state.ts';
import './app.css';

const app = await initAppState();
mount(App, { target: document.getElementById('app')!, props: { app } });
