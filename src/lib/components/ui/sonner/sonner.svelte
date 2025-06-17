<script>
	import { Toaster as Sonner } from "svelte-sonner";
	import { mode } from "mode-watcher";

	let { ...restProps } = $props();
</script>

<Sonner
	theme={mode.current}
	class="toaster group"
	style="--normal-bg: var(--popover); --normal-text: var(--popover-foreground); --normal-border: var(--border);"
	{...restProps}
/>