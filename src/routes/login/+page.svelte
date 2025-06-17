<script>
	import { onMount } from "svelte";
	import { page } from "$app/state";
	import { goto } from "$app/navigation";
	import { Button } from "$lib/components/ui/button";
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "$lib/components/ui/card";
	import { Github, Bug } from "lucide-svelte";
	import { betterFetch } from "$lib/utils/betterFetch";
	import { toast } from "svelte-sonner";
	import { env } from "$env/dynamic/public";

	let loading = $state(false);

	onMount(async () => {
		// Check for OAuth callback
		const code = page.url.searchParams.get("code");
		const state = page.url.searchParams.get("state");
		const errorParam = page.url.searchParams.get("error");

		if (errorParam) return toast.error("GitHub authentication was cancelled or failed.");
		if (code && state) await handleGitHubCallback(code, state);
	});

	async function handleGitHubLogin() {
		loading = true;

		try {
			// Generate state for CSRF protection
			const state = crypto.randomUUID();
			sessionStorage.setItem("oauth_state", state);

			// Redirect to GitHub OAuth
			const redirectUri = `${window.location.origin}/login`;
			const scope = "user:email";

			const githubUrl = `https://github.com/login/oauth/authorize?client_id=${env.PUBLIC_GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${state}`;

			window.location.href = githubUrl;
		} catch (err) {
			toast.error("Failed to initiate GitHub login.");
			loading = false;
		}
	}

	async function handleGitHubCallback(code, state) {
		loading = true;

		try {
			// Verify state
			const storedState = sessionStorage.getItem("oauth_state");
			if (state !== storedState) throw new Error("Invalid state parameter");

			// Exchange code for token
			const response = await betterFetch("/api/account", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ code, state }),
			});

			const data = await response.json();

			// Store user data
			localStorage.setItem("bearer", data.token);
			localStorage.setItem("user", JSON.stringify(data.user));

			toast.success("Successfully logged in!");

			// Clean up and redirect
			sessionStorage.removeItem("oauth_state");
			const redirectTo = page.url.searchParams.get("redirect") || "/dashboard";
			goto(redirectTo);

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
	<meta
		name="description"
		content="Sign in to Bugspot with your GitHub account to start creating AI-enhanced bug report forms."
	/>
</svelte:head>

<div class="flex min-h-screen items-center justify-center px-4">
	<div class="w-full max-w-sm space-y-8">
		<!-- Header -->
		<div class="text-center">
			<div class="mb-6 flex justify-center">
				<Bug class="text-primary h-12 w-12" />
			</div>
			<h2 class="text-3xl font-bold">Welcome to Bugspot</h2>
			<p class="text-muted-foreground mt-2">Please sign in or up.</p>
		</div>

		<!-- Login card -->
		<Card>
			<CardContent class="space-y-4">
				<!-- GitHub login button -->
				<Button class="w-full" onclick={handleGitHubLogin} disabled={loading}>
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
		<p class="text-muted-foreground text-center text-xs">
			By signing up, you agree to our
			<a href="/terms" class="hover:text-foreground underline">Terms of Use</a>
			and
			<a href="/privacy" class="hover:text-foreground underline">Privacy Policy</a>
		</p>
	</div>
</div>
