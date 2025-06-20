import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';
import { isTokenExpired } from '$lib/utils/isJwtExpired';
import { toast } from 'svelte-sonner';
import { page } from '$app/state';
import { goto } from '$app/navigation';

// User
export const user = writable(null);

// Initialize from localStorage on load
if (browser) {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
        try {
            const token = localStorage.getItem("bearer");
            if (!isTokenExpired(token)) user.set(JSON.parse(storedUser));
            else {
                authStore.logout();
                toast.info("Your session has expired. Please sign in again.")
                if (page.url.pathname.startsWith("/dashboard")) goto("/login");
            }
        } catch (error) {
            console.error('Failed to parse stored user:', error);
            authStore.logout();
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