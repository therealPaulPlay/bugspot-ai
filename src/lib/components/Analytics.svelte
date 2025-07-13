<script>
	import { onMount } from "svelte";
	import { page } from "$app/state";
	import { Button } from "$lib/components/ui/button";
	import { Card, CardContent } from "$lib/components/ui/card";
	import { slide } from "svelte/transition";

	let showBanner = $state(false);
	const GA_ID = "G-WJWSRK3J7Z";

	onMount(() => {
		const consent = localStorage.getItem("cookiePreferences");
		if (consent) {
			loadGA(consent === "true");
		} else {
			showBanner = true;
			loadGA(false);
		}
	});

	function loadGA(hasConsent) {
		try {
			window.dataLayer = window.dataLayer || [];
			function gtag() {
				dataLayer.push(arguments);
			}

			gtag("js", new Date());
			gtag("config", GA_ID, {
				page_title: document.title,
				page_path: page.url.pathname,
				cookie_domain: location.hostname,
				cookie_flags: "SameSite=None; Secure",
				ad_storage: hasConsent ? "granted" : "denied",
				ad_personalization: hasConsent ? "granted" : "denied",
				ad_user_data: hasConsent ? "granted" : "denied",
				analytics_storage: hasConsent ? "granted" : "denied",
			});
		} catch (error) {
			console.error("Error loading GA:", error);
		}
	}

	function handleConsent(accepted) {
		localStorage.setItem("cookiePreferences", accepted.toString());
		if (accepted) loadGA(true);
		showBanner = false;
	}
</script>

<svelte:head>
	<script src="https://www.googletagmanager.com/gtag/js?id={GA_ID}" async></script>
</svelte:head>

{#if showBanner}
	<div class="fixed right-0 bottom-0 z-50 p-4" transition:slide={{ axis: "y" }}>
		<Card class="h-fit w-100 max-w-screen border py-4 shadow-lg">
			<CardContent class="space-y-4 px-4">
				<p class="text-muted-foreground text-sm">
					This website uses cookies according to its
					<a href="/privacy" class="text-primary hover:underline"> privacy policy </a>.
				</p>
				<div class="flex gap-2">
					<Button size="sm" onclick={() => handleConsent(true)}>Accept</Button>
					<Button variant="outline" size="sm" onclick={() => handleConsent(false)}>Only essential</Button>
				</div>
			</CardContent>
		</Card>
	</div>
{/if}
