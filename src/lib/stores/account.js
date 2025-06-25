import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';
import { isTokenExpired } from '$lib/utils/isJwtExpired';
import { betterFetch } from '$lib/utils/betterFetch';
import { toast } from 'svelte-sonner';
import { page } from '$app/state';
import { goto } from '$app/navigation';

// User
export const user = writable(null);

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
    },

    // Refresh user data from server
    refreshUser: async () => {
        if (!browser) return;

        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('bearer');
        if (!storedUser || !token) return;

        try {
            const userData = JSON.parse(storedUser);
            const response = await betterFetch(`/api/account?userId=${userData.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = await response.json();
            user.set(data.user);
            localStorage.setItem('user', JSON.stringify(data.user));
        } catch (error) {
            console.error('Failed to refresh user data:', error);
        }
    }
};

// Initialize from localStorage on load
if (browser) {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
        try {
            const token = localStorage.getItem("bearer");
            if (token && !isTokenExpired(token)) {
                user.set(JSON.parse(storedUser));
                authStore.refreshUser();
            } else {
                authStore.logout();
                toast.info("Your session has expired. Please sign in again.");
                if (page.url.pathname.startsWith("/dashboard")) goto("/login");
            }
        } catch (error) {
            console.error('Failed to parse stored user:', error);
            authStore.logout();
        }
    }
}

// Derived
export const isAuthenticated = derived(user, ($user) => !!$user);