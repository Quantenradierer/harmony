import { readable } from 'svelte/store';
import type { ModuleId } from '@harmony/shared';

export type Route =
  | { name: 'home' }
  | { name: 'lesson'; id: string }
  | { name: 'practice'; module: ModuleId }
  | { name: 'settings' }
  | { name: 'feedback' };

const MODULES: ModuleId[] = ['notes', 'intervals', 'chords'];

export function parseRoute(hash: string): Route {
  const [name, arg] = hash.replace(/^#\/?/, '').split('/');
  if (name === 'lesson' && arg) return { name: 'lesson', id: arg };
  if (name === 'practice' && MODULES.includes(arg as ModuleId)) {
    return { name: 'practice', module: arg as ModuleId };
  }
  if (name === 'settings' || name === 'feedback') return { name };
  return { name: 'home' };
}

export function href(route: Route): string {
  switch (route.name) {
    case 'home':
      return '#/';
    case 'lesson':
      return `#/lesson/${route.id}`;
    case 'practice':
      return `#/practice/${route.module}`;
    default:
      return `#/${route.name}`;
  }
}

export const route = readable<Route>(parseRoute(location.hash), (set) => {
  const onChange = () => set(parseRoute(location.hash));
  addEventListener('hashchange', onChange);
  return () => removeEventListener('hashchange', onChange);
});
