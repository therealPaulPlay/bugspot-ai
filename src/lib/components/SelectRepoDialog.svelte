<script>
	import { Button } from "$lib/components/ui/button";
	import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "$lib/components/ui/dialog";
	import * as Select from "$lib/components/ui/select/index.js";
	import { Alert, AlertDescription } from "$lib/components/ui/alert";
	import { Github, ExternalLink } from "lucide-svelte";
	import { betterFetch } from "$lib/utils/betterFetch";
	import { toast } from "svelte-sonner";
	import { page } from "$app/state";
	import { env } from "$env/dynamic/public";
	import { onMount } from "svelte";

	let { open = $bindable(false), onRepoSelected, onClosed } = $props();

	let repos = $state([]);
	let loading = $state(false);
	let token = $state("");
	let selected = $state("");

	onMount(() => {
		const urlToken = page.url.searchParams.get("github_token");
		if (urlToken) {
			token = urlToken;
			const url = new URL(window.location);
			url.searchParams.delete("github_token");
			window.history.replaceState({}, "", url);
			loadRepos();
		}
	});

	async function loadRepos() {
		if (!token) return;
		loading = true;
		try {
			const response = await betterFetch(`/api/github/repos?token=${token}&per_page=100`);
			const data = await response.json();
			repos = data.repos || [];
		} catch {
			toast.error("Failed to load repositories");
		} finally {
			loading = false;
		}
	}

	function connect() {
		const state = crypto.randomUUID();
		const stateData = JSON.stringify({
			state,
			type: "repo_access",
			returnUrl: window.location.href,
		});
		const url = `https://github.com/login/oauth/authorize?client_id=${env.PUBLIC_GITHUB_APP_CLIENT_ID}&state=${encodeURIComponent(stateData)}&redirect_uri=${encodeURIComponent(window.location.origin + "/api/account/github-callback")}`;
		window.location.href = url;
	}

	function continueWithRepo() {
		if (!selected) {
			toast.error("Please select a repository");
			return;
		}
		const repo = repos.find((r) => r.fullName === selected);
		if (onRepoSelected) onRepoSelected(repo);
		open = false;
		selected = "";
	}
</script>

<Dialog bind:open onOpenChange={(open) => {
	if (!open && onClosed) onClosed();
}}>
	<DialogContent class="max-w-md">
		<DialogHeader>
			<DialogTitle>Connect GitHub repository</DialogTitle>
			<DialogDescription>Choose which repository to connect for creating issues from bug reports.</DialogDescription>
		</DialogHeader>

		{#if !token}
			<Alert>
				<Github class="h-4 w-4" />
				<AlertDescription>
					<Button variant="link" class="h-auto !p-0" onclick={connect}>
						<ExternalLink class="h-3 w-3" />
						Authorize with GitHub
					</Button>
				</AlertDescription>
			</Alert>
		{:else if loading}
			<div class="flex items-center justify-center py-8">
				<div class="border-primary h-6 w-6 animate-spin rounded-full border-b-2"></div>
				<span class="ml-2">Loading repositories...</span>
			</div>
		{:else if repos.length > 0}
			<div class="space-y-4">
				<Select.Root type="single" bind:value={selected}>
					<Select.Trigger>
						<span class="max-w-50 truncate">{selected || "Select a repository"}</span>
					</Select.Trigger>
					<Select.Content class="max-h-[300px]">
						{#each repos as repo}
							<Select.Item value={repo.fullName} label={repo.fullName}>
								<div>
									<div class="font-medium">{repo.fullName}</div>
									{#if repo.description}
										<div class="text-muted-foreground text-xs">{repo.description}</div>
									{/if}
								</div>
							</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>

				<div class="flex justify-end space-x-2">
					<Button variant="outline" onclick={() => (open = false)}>Cancel</Button>
					<Button onclick={continueWithRepo} disabled={!selected}>Continue</Button>
				</div>
			</div>
		{:else}
			<Alert>
				<Github class="h-4 w-4" />
				<AlertDescription>No repositories found. Make sure you have repositories on GitHub.</AlertDescription>
			</Alert>
		{/if}
	</DialogContent>
</Dialog>
