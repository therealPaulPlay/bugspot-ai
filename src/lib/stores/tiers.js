import { readable } from "svelte/store";

export const tiers = readable([{ id: 0, name: "Base", price: 0, reportLimit: 50 },
{ id: 1, name: "Pro", price: 14, reportLimit: 500 },
{ id: 2, name: "Enterprise", price: 49, reportLimit: 2500 }]);