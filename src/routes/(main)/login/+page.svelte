<script>
	import { onMount } from "svelte";
	import { page } from "$app/state";
	import { goto } from "$app/navigation";
	import { Button } from "$lib/components/ui/button";
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "$lib/components/ui/card";
	import { Github } from "lucide-svelte";
	import { betterFetch } from "$lib/utils/betterFetch";
	import { toast } from "svelte-sonner";
	import * as env from "$env/static/public";
	import { authStore } from "$lib/stores/account";

	let loading = $state(false);
	let videoLoaded = $state(false);
	let videoElement = $state();

	onMount(async () => {
		if (videoElement?.readyState >= 3) videoLoaded = true;

		// Check for OAuth callback
		const code = page.url.searchParams.get("code");
		const errorParam = page.url.searchParams.get("error");

		if (errorParam) {
			const error = decodeURIComponent(errorParam);
			return toast.error("GitHub callback failed: " + error);
		}

		if (code) await handleGitHubCallback(code);
	});

	async function handleGitHubLogin() {
		loading = true;

		try {
			const scope = "user:email";
			const githubUrl = `https://github.com/login/oauth/authorize?client_id=${env.PUBLIC_GITHUB_OAUTH_CLIENT_ID}&redirect_uri=${encodeURIComponent(window.location.origin + "/api/account/github-callback")}&scope=${scope}`;
			window.location.href = githubUrl;
		} catch (err) {
			toast.error("Failed to initiate GitHub login.");
			loading = false;
		}
	}

	async function handleGitHubCallback(code) {
		loading = true;
		try {
			// Exchange code for token
			const response = await betterFetch("/api/account", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ code }),
			});

			const data = await response.json();
			authStore.login(data); // Login and store user data in localstorage
			goto("/dashboard");
		} catch (err) {
			console.error("GitHub callback error:", err);
			toast.error(err.message);
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Sign in</title>
</svelte:head>

<div class="relative flex min-h-screen items-center border-t">
	<div class="bg-muted/50 inset-0 -z-1 h-screen overflow-hidden max-lg:absolute lg:w-1/2">
		<video
			bind:this={videoElement}
			class="h-full w-full object-cover opacity-75 brightness-75 dark:brightness-50 transition duration-500 max-lg:opacity-25 max-lg:blur-md grayscale"
			style:opacity={videoLoaded ? "" : "0"}
			autoplay
			muted
			loop
			playsinline
			onloadeddata={() => (videoLoaded = true)}
		>
			<source src="/video/site-login-showcase.mp4" type="video/mp4" />
		</video>
	</div>
	<div class="flex h-screen w-full items-center justify-center px-4 lg:w-1/2">
		<div class="flex w-sm flex-col items-center space-y-8">
			<!-- Header -->
			<div class="text-center space-y-4">
				<h2 class="text-3xl font-bold">One step away</h2>
				<p class="text-muted-foreground mt-2 max-w-80">
					Sign in or up to receive bug reports that are actually helpful to you.
				</p>
			</div>

			<!-- Login card -->
			<Card>
				<CardContent class="space-y-4 lg:w-sm">
					<!-- GitHub login button -->
					<Button class="w-full" size="lg" onclick={handleGitHubLogin} disabled={loading}>
						{#if loading}
							<div class="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
							Connecting...
						{:else}
							<Github class="h-4 w-4" />
							Continue with GitHub
						{/if}
					</Button>
				</CardContent>
			</Card>

			<!-- Terms -->
			<p class="text-muted-foreground max-w-75 text-center text-xs">
				By signing up, you agree to our
				<a href="/terms" class="hover:underline">Terms of Use</a>
				and
				<a href="/privacy" class="hover:underline">Privacy Policy</a>.
			</p>
		</div>
	</div>
</div>
