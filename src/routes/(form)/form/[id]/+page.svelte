<script>
	import Form from "$lib/components/Form.svelte";
	import { onMount } from "svelte";
	import init from "overfade";

	let { data } = $props();
	let formConfig = $derived(data?.form || {});

	onMount(() => {
		init(); // Init Overfade
	});

	// Color scheme mappings with light/dark mode variants
	const colorSchemes = {
		default: {
			light: { from: [254, 215, 170], to: [194, 65, 12] }, // orange-100 to orange-700
			dark: { from: [124, 45, 18], to: [67, 20, 7] }, // orange-800 to orange-950
		},
		black: {
			light: { from: [243, 244, 246], to: [17, 24, 39] }, // gray-100 to gray-900
			dark: { from: [55, 65, 81], to: [3, 7, 18] }, // gray-700 to gray-950
		},
		red: {
			light: { from: [254, 226, 226], to: [185, 28, 28] }, // red-100 to red-700
			dark: { from: [127, 29, 29], to: [69, 10, 10] }, // red-800 to red-950
		},
		blue: {
			light: { from: [219, 234, 254], to: [29, 78, 216] }, // blue-100 to blue-700
			dark: { from: [30, 58, 138], to: [23, 37, 84] }, // blue-800 to blue-950
		},
		green: {
			light: { from: [220, 252, 231], to: [21, 128, 61] }, // green-100 to green-700
			dark: { from: [22, 101, 52], to: [20, 83, 45] }, // green-800 to green-950
		},
		yellow: {
			light: { from: [254, 249, 195], to: [202, 138, 4] }, // yellow-100 to yellow-600
			dark: { from: [133, 77, 14], to: [113, 63, 18] }, // yellow-800 to yellow-900
		},
		orange: {
			light: { from: [254, 215, 170], to: [194, 65, 12] }, // orange-100 to orange-700
			dark: { from: [124, 45, 18], to: [67, 20, 7] }, // orange-800 to orange-950
		},
	};

	let currentScheme = $derived(colorSchemes[formConfig.colorScheme] || colorSchemes.default);

	// Create CSS variables for light and dark modes
	let gradientStyle = $derived.by(() => {
		const lightColors = currentScheme.light;
		const darkColors = currentScheme.dark;

		return `
            --gradient-from-light: rgb(${lightColors.from.join(" ")});
            --gradient-to-light: rgb(${lightColors.to.join(" ")});
            --gradient-from-dark: rgb(${darkColors.from.join(" ")});
            --gradient-to-dark: rgb(${darkColors.to.join(" ")});
        `;
	});

	// Calculate center color (works for both light and dark)
	let primaryColor = $derived.by(() => {
		const colors = currentScheme.light; // Use light mode colors for primary
		const center = [
			Math.round((colors.from[0] + colors.to[0]) / 2),
			Math.round((colors.from[1] + colors.to[1]) / 2),
			Math.round((colors.from[2] + colors.to[2]) / 2),
		];
		return `rgb(${center.join(" ")})`;
	});
</script>

<svelte:head>
	<title>Form</title>
	<!-- Turnstile Captcha -->
	<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" defer></script>
</svelte:head>

<!-- Gradient background -->
<div
	class="absolute inset-0 bg-gradient-to-br from-[var(--gradient-from-light)] to-[var(--gradient-to-light)] dark:from-[var(--gradient-from-dark)] dark:to-[var(--gradient-to-dark)] dark:brightness-75"
	style={gradientStyle}
></div>

<!-- Form box -->
<div class="absolute inset-0 flex items-center justify-center sm:p-8 overflow-hidden">
	<!-- Form container -->
	<div class="bg-background relative h-full sm:h-100 max-h-full w-2xl max-w-full sm:rounded-3xl shadow-xl">
		<div class="of-top of-bottom flex h-full w-full flex-col items-center justify-center-safe overflow-y-auto p-6">
			<Form {formConfig} {primaryColor} />
		</div>
	</div>
</div>
