<script>
	import { Button } from "$lib/components/ui/button";
	import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "$lib/components/ui/dialog";
	import * as Select from "$lib/components/ui/select/index.js";
	import { Alert, AlertDescription } from "$lib/components/ui/alert";
	import { Github, ExternalLink, Plus } from "lucide-svelte";
	import { betterFetch } from "$lib/utils/betterFetch";
	import { toast } from "svelte-sonner";
	import * as env from "$env/static/public";
	import { onMount } from "svelte";
	import { user } from "$lib/stores/account";
	import { fade } from "svelte/transition";

	let { open = $bindable(false), onRepoSelected, onClosed } = $props();

	let repos = $state([]);
	let loading = $state(false);
	let selected = $state("");

	$effect(() => {
		if (open) loadRepos();
	});

	async function loadRepos() {
		loading = true;
		try {
			const response = await betterFetch(`/api/github/repos?user-id=${$user.id}`, {
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${localStorage.getItem("bearer")}`,
				},
			});
			const data = await response.json();
			repos = data.repos || [];
		} catch (error) {
			console.error("Failed to load repositories:", error);
			toast.error("Failed to load repositories: " + error);
		} finally {
			loading = false;
		}
	}

	function installOrManageApp() {
		const installUrl = `https://github.com/apps/${env.PUBLIC_GITHUB_APP_NAME?.toLowerCase()?.replaceAll(" ", "-")}/installations/new`;
		const newWindow = window.open(installUrl, "_blank");

		// Listen for when user returns to this tab
		function handleFocus() {
			window.removeEventListener("focus", handleFocus);
			loadRepos();
		}
		window.addEventListener("focus", handleFocus);
	}

	async function continueWithRepo() {
		const repo = repos.find((r) => r.fullName === selected);
		if (!repo) return;

		onRepoSelected?.(repo);
		open = false;
		selected = "";
	}
</script>

<Dialog
	bind:open
	onOpenChange={(open) => {
		if (!open && onClosed) onClosed();
	}}
>
	<DialogContent class="max-w-md">
		<DialogHeader>
			<DialogTitle>Select GitHub repository</DialogTitle>
			<DialogDescription>Choose which repository to use for the new form.</DialogDescription>
		</DialogHeader>

		{#if loading}
			<div class="flex items-center justify-center gap-4 py-8">
				<div class="border-primary h-6 w-6 animate-spin rounded-full border-b-2"></div>
				<span class="ml-2">Loading repositories...</span>
			</div>
		{:else if repos.length > 0}
			<div class="space-y-4" in:fade={{ duration: 300 }}>
				<Select.Root type="single" bind:value={selected}>
					<div class="flex flex-wrap items-center gap-2">
						<Select.Trigger>
							<span class="max-w-50 truncate">{selected || "Select a repository"}</span>
						</Select.Trigger>
						<Button variant="outline" onclick={installOrManageApp}>
							<Github class="h-4 w-4" />
							Manage access
						</Button>
					</div>
					<Select.Content class="max-h-[300px] w-100 max-w-screen">
						{#each repos as repo}
							<Select.Item value={repo.fullName} label={repo.fullName}>
								<div class="flex w-full items-center justify-between">
									<div>
										<div class="font-medium">{repo.fullName}</div>
										{#if repo.description}
											<div class="text-muted-foreground text-xs">{repo.description}</div>
										{/if}
									</div>
								</div>
							</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
				<div class="flex justify-end">
					<Button onclick={continueWithRepo} disabled={!selected}>Continue</Button>
				</div>
			</div>
		{:else}
			<div in:fade={{ duration: 300 }}>
				<Alert>
					<AlertDescription>
						<Github class="h-4 w-4" />Please install the GitHub app on the repositories that you want to use with
						Bugspot. You can also install it globally.
						<Button onclick={installOrManageApp} class="mt-2">
							<ExternalLink class="h-4 w-4" />
							Install GitHub app
						</Button>
					</AlertDescription>
				</Alert>
			</div>
		{/if}
	</DialogContent>
</Dialog>
