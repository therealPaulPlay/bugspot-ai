import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';

// User
export const user = writable(null);

// Notifications
export const notifications = writable([]);

// Derived
export const isAuthenticated = derived(user, ($user) => !!$user);