import { writable, readable } from "svelte/store";

export const TURNSTILE_SITE_KEY = readable("unset");
export const BYPASS_TURNSTILE = readable(true);