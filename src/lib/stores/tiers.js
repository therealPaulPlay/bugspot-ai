import { readable } from "svelte/store";

export const tiers = readable([{ id: 0, name: "Base", price: 0, reportLimit: 35 },
{ id: 1, name: "Pro", price: 19, reportLimit: 500 },
{ id: 2, name: "Enterprise", price: 75, reportLimit: 2500 }]);