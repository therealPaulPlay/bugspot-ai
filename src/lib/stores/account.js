import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';

// User
export const user = writable(null);

// Initialize from localStorage on load
if (browser) {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
        try {
            user.set(JSON.parse(storedUser));
        } catch (error) {
            console.error('Failed to parse stored user:', error);
            localStorage.removeItem('user');
            localStorage.removeItem('bearer');
        }
    }
}

// Auth helpers
export const authStore = {
    login: (loginData) => {
        user.set(loginData.user);
        if (browser) {
            localStorage.setItem('user', JSON.stringify(loginData.user));
            localStorage.setItem('bearer', loginData.token);
        }
    },

    logout: () => {
        user.set(null);
        if (browser) {
            localStorage.removeItem('user');
            localStorage.removeItem('bearer');
        }
    }
};

// Derived
export const isAuthenticated = derived(user, ($user) => !!$user);