<script>
	import { onMount } from "svelte";
	import { page } from "$app/state";
	import { Button } from "$lib/components/ui/button";
	import { Card, CardContent } from "$lib/components/ui/card";
	import { slide } from "svelte/transition";

	const GA_ID = "G-WJWSRK3J7Z";

	let showBanner = $state(false);

	function gtag () {
		window.dataLayer = window.dataLayer || [];
		dataLayer.push(arguments);
	};

	onMount(() => {
		const consent = localStorage.getItem("cookiePreferences");
		if (consent) loadGA(consent === "true"); // If the saved string is "true", accept, otherwise reject
		else {
			showBanner = true;
			loadGA(false);
		}
	});

	function loadGA(hasConsent) {
		try {
			setConsent(hasConsent, false);
			gtag("js", new Date());
			gtag("config", GA_ID, {
				page_title: document.title,
				page_path: page.url.pathname,
				cookie_domain: window.location.hostname,
				cookie_flags: "SameSite=None; Secure",
			});
		} catch (error) {
			console.error("Error loading GA:", error);
		}
	}

	function setConsent(hasConsent, isUpdate = false) {
		const consentState = hasConsent ? "granted" : "denied";
		gtag("consent", isUpdate ? "update" : "default", {
			ad_storage: consentState,
			ad_personalization: consentState,
			ad_user_data: consentState,
			analytics_storage: consentState,
		});
	}

	function handleConsent(accepted) {
		localStorage.setItem("cookiePreferences", accepted.toString());
		if (accepted) setConsent(true, true);
		showBanner = false;
	}
</script>

<svelte:head>
	<script src="https://www.googletagmanager.com/gtag/js?id={GA_ID}" async></script>
</svelte:head>

{#if showBanner}
	<div class="fixed right-0 bottom-0 max-w-screen z-50 p-4" transition:slide={{ axis: "y" }}>
		<Card class="h-fit w-100 border py-4 shadow-lg max-w-full bg-background">
			<CardContent class="space-y-4 px-4">
				<p class="text-muted-foreground text-sm text-wrap">
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
