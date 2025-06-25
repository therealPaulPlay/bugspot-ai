<script>
	import { onMount } from "svelte";
	import { Button } from "$lib/components/ui/button";
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "$lib/components/ui/card";
	import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "$lib/components/ui/dialog";
	import { Progress } from "$lib/components/ui/progress/index.js";
	import { Plus, Settings, ExternalLink, Copy, CheckCircle, Trash2, Info } from "lucide-svelte";
	import { goto } from "$app/navigation";
	import { betterFetch } from "$lib/utils/betterFetch";
	import { toast } from "svelte-sonner";
	import { user } from "$lib/stores/account";
	import CreateFormDialog from "$lib/components/CreateFormDialog.svelte";
	import { page } from "$app/state";
	import { tiers } from "$lib/stores/tiers";

	let forms = $state([]);
	let loading = $state(true);
	let showCreateDialog = $state(false);
	let showIframeDialog = $state(false);
	let showInfoDialog = $state(false);
	let editingForm = $state(null);
	let currentFormId = $state(null);
	let copied = $state(false);
	let reportAmount = $derived($user?.reportAmount || 0);
	let subscriptionTier = $derived($user?.subscriptionTier || 0);

	let currentLimit = $derived($tiers.find((e) => e.id == subscriptionTier)?.reportLimit);
	let progressValue = $derived(Math.max(1, Math.round((reportAmount / currentLimit) * 100)));
	let isLimitReached = $derived(reportAmount >= currentLimit);

	$effect(async () => {
		if ($user) await loadDashboard();
	});

	async function loadDashboard() {
		try {
			const token = localStorage.getItem("bearer");

			const response = await betterFetch(`/api/dashboard?userId=${$user.id}`, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			const data = await response.json();
			forms = data.forms || [];
		} catch (error) {
			console.error("Failed to load dashboard:", error);
			toast.error("Failed to load dashboard: " + error.message);
		} finally {
			loading = false;
		}
	}

	function openCreateDialog() {
		editingForm = null;
		showCreateDialog = true;
	}

	async function deleteForm(formId, formName) {
		if (!confirm(`Are you sure you want to delete "${formName}"? This cannot be undone.`)) {
			return;
		}

		try {
			await betterFetch("/api/dashboard", {
				method: "DELETE",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${localStorage.getItem("bearer")}`,
				},
				body: JSON.stringify({
					userId: $user.id,
					formId,
				}),
			});

			toast.success("Form deleted successfully");
			await loadDashboard();
		} catch (error) {
			console.error("Delete form error:", error);
			toast.error("Failed to delete form");
		}
	}

	function generateFormURL(formId) {
		return page.url.origin + "/form/" + formId;
	}

	function generateIframeCode(formId) {
		return `<iframe src="${generateFormURL(formId)}" width="800" height="500" frameborder="0"></iframe>`;
	}

	async function copyIframeCode() {
		try {
			const code = generateIframeCode(currentFormId);
			await navigator.clipboard.writeText(code);
			copied = true;
			setTimeout(() => (copied = false), 2000);
		} catch (error) {
			toast.error("Failed to copy iframe code: " + error);
		}
	}
</script>

<svelte:head>
	<title>Dashboard</title>
</svelte:head>

{#if !$user}
	<div class="bg-background/20 fixed inset-0 z-99 flex items-center justify-center backdrop-blur-lg">
		<div>
			<h2>Please <a href="/login" class="underline">sign in</a> to use the dashboard.</h2>
		</div>
	</div>
{/if}

<div class="mx-auto min-h-screen max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
	<!-- Header -->
	<div class="mb-6">
		<h1 class="text-3xl font-bold">Dashboard</h1>
		<p class="text-muted-foreground mt-1">Manage your bug report forms.</p>
	</div>

	<!-- Report Usage -->
	{#if !loading}
		<div class="mb-12 max-w-md">
			{#if isLimitReached}
				<div class="rounded-lg border border-orange-200 bg-orange-50 p-4">
					<div class="flex items-center justify-between">
						<div>
							<p class="font-medium text-orange-800">Monthly report limit reached!</p>
							<p class="text-sm">Upgrade to continue receiving reports.</p>
						</div>
						<Button onclick={() => goto("/pricing")} size="sm">Upgrade plan</Button>
					</div>
				</div>
			{:else}
				<div class="space-y-2">
					<div class="flex items-center justify-between text-sm">
						<span class="text-muted-foreground">Monthly reports</span>
						<span class="text-muted-foreground">{reportAmount} / {currentLimit}</span>
					</div>
					<Progress value={progressValue} max={100} class="h-2" />
				</div>
			{/if}
		</div>
	{/if}

	{#if loading}
		<!-- Loading state -->
		<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
			{#each Array(3) as _}
				<Card class="animate-pulse">
					<CardHeader>
						<div class="bg-muted h-5 w-3/4 rounded"></div>
						<div class="bg-muted h-4 w-1/2 rounded"></div>
					</CardHeader>
					<CardContent>
						<div class="bg-muted mb-2 h-4 w-full rounded"></div>
						<div class="bg-muted h-4 w-2/3 rounded"></div>
					</CardContent>
				</Card>
			{/each}
		</div>
	{:else if forms.length === 0}
		<!-- Empty state -->
		<div class="py-12 text-center">
			<Plus class="text-muted-foreground mx-auto mb-4 h-16 w-16" />
			<h3 class="mb-2 text-xl font-semibold">No forms yet.</h3>
			<p class="text-muted-foreground mb-6">Create a form to start collecting exceptional bug reports.</p>

			<Button size="lg" onclick={openCreateDialog}>
				<Plus class="h-4 w-4" />
				Create your first form
			</Button>
		</div>
	{:else}
		<!-- Forms grid -->
		<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
			{#each forms as form}
				<Card class="transition-shadow hover:shadow-lg">
					<CardHeader>
						<div class="relative flex items-center justify-between overflow-hidden">
							<CardTitle class="max-w-2/3 truncate text-lg">{form.name}</CardTitle>
							<div class="flex space-x-1">
								<Button
									variant="ghost"
									size="sm"
									onclick={() => {
										editingForm = form;
										showCreateDialog = true;
									}}
								>
									<Settings class="h-4 w-4" />
								</Button>
								<Button
									variant="ghost"
									size="sm"
									onclick={() => deleteForm(form.id, form.name)}
									class="text-destructive hover:text-destructive"
								>
									<Trash2 class="h-4 w-4" />
								</Button>
							</div>
						</div>
					</CardHeader>
					<CardContent>
						<div class="space-y-3">
							<div class="text-muted-foreground text-sm">
								{form.githubRepo ? `Connected to ${form.githubRepo}` : "No GitHub repo connected"}.
							</div>

							<div class="text-muted-foreground text-sm">
								{form.domains?.length || 0} allowed domain(s).
							</div>

							<div class="flex space-x-2">
								<Button
									variant="outline"
									size="sm"
									class="flex-1"
									onclick={() => {
										window.open(generateFormURL(form.id), "_blank");
									}}
								>
									<ExternalLink class="h-4 w-4" />
									Link
								</Button>
								<Button
									size="sm"
									class="flex-1"
									onclick={() => {
										currentFormId = form.id;
										showIframeDialog = true;
									}}
								>
									<Copy class="h-4 w-4" />
									Embed
								</Button>
								<Button
									variant="outline"
									size="sm"
									onclick={() => {
										currentFormId = form.id;
										showInfoDialog = true;
									}}
								>
									<Info />
								</Button>
							</div>
						</div>
					</CardContent>
				</Card>
			{/each}

			<!-- Add new form card -->
			<Card
				class="hover:border-primary/50 hover:bg-muted/50 cursor-pointer border-2 border-dashed transition-colors"
				onclick={openCreateDialog}
			>
				<CardContent class="flex h-full flex-col items-center justify-center py-12">
					<Plus class="text-muted-foreground h-12 w-12" />
				</CardContent>
			</Card>
		</div>
	{/if}
</div>

<!-- Create/Edit Form Dialog -->
<CreateFormDialog bind:open={showCreateDialog} {editingForm} onSuccess={loadDashboard} />

<!-- Iframe code dialog -->
<Dialog bind:open={showIframeDialog}>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>Embed your form</DialogTitle>
			<DialogDescription>
				Copy this code and paste it into your website where you want the form to appear. We recommend embedding it into
				a popup.
			</DialogDescription>
		</DialogHeader>

		<div class="space-y-4">
			<div class="bg-muted rounded-lg p-4">
				<code class="font-mono text-sm text-xs break-all">
					{generateIframeCode(currentFormId)}
				</code>
			</div>

			<Button onclick={copyIframeCode} class="w-full">
				{#if copied}
					<CheckCircle class="h-4 w-4" />
					Copied!
				{:else}
					<Copy class="h-4 w-4" />
					Copy iframe code
				{/if}
			</Button>
		</div>
	</DialogContent>
</Dialog>

<!-- Info dialog -->
<Dialog bind:open={showInfoDialog}>
	<DialogContent class="max-w-lg">
		<DialogHeader>
			<DialogTitle>Using your form</DialogTitle>
		</DialogHeader>

		<div class="space-y-4">
			<!-- Direct Link -->
			<div>
				<h3 class="mb-1 text-sm font-semibold">Direct link</h3>
				<p class="text-muted-foreground text-sm">
					Put it in your footer, docs, or anywhere users should be able to report a bug.
				</p>
			</div>
			<div>
				<h3 class="mb-1 text-sm font-semibold">Embedded iframe</h3>
				<p class="text-muted-foreground text-sm">
					Embed directly, e.g. in a popup component. Users never leave your site and it's intuitive.
				</p>
			</div>
			<div>
				<h3 class="mb-1 text-sm font-semibold">Adding context</h3>
				<p class="text-muted-foreground mb-2 text-sm">Pass custom data (e.g. session info) for better debugging:</p>
				<div class="bg-muted rounded p-2 font-mono text-xs">
					?custom-data=${'{encodeURIComponent("User ID: 123, Plan: Pro")}'}
				</div>
				<p class="text-muted-foreground mt-1 text-xs">
					Use <code>encodeURIComponent()</code> to safely encode your data.
				</p>
			</div>
		</div>
	</DialogContent>
</Dialog>
