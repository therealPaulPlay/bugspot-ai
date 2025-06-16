import { writable, readable } from 'svelte/store';
import { browser } from '$app/environment';

export const API_BASE_URL = readable(browser ? window.location.origin : 'http://localhost:3000');

// Turnstile captcha
export const TURNSTILE_SITE_KEY = readable('1x00000000000000000000AA');
export const BYPASS_TURNSTILE = readable(true); // For development

// Stripe
export const STRIPE_PUBLIC_KEY = readable('pk_test_...');