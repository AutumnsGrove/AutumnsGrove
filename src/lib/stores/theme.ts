import { writable } from 'svelte/store';
import { browser } from '$app/environment';

type Theme = 'light' | 'dark';

const stored = browser ? (localStorage.getItem('theme') as Theme) : null;
const system = browser
	? window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
	: 'light';

export const theme = writable<Theme>(stored ?? system);

if (browser) {
	theme.subscribe((value) => {
		localStorage.setItem('theme', value);
		document.documentElement.setAttribute('data-theme', value);
	});
}

export function toggleTheme() {
	theme.update((t) => (t === 'light' ? 'dark' : 'light'));
}
