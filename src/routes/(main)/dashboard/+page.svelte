<script>
	import { onMount } from "svelte";
	import { Button } from "$lib/components/ui/button";
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "$lib/components/ui/card";
	import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "$lib/components/ui/dialog";
	import { Progress } from "$lib/components/ui/progress/index.js";
	import { Plus, Settings, ExternalLink, Copy, Trash2, Info, Layers2 } from "lucide-svelte";
	import { goto } from "$app/navigation";
	import { betterFetch } from "$lib/utils/betterFetch";
	import { toast } from "svelte-sonner";
	import { user } from "$lib/stores/account";
	import CreateFormDialog from "$lib/components/CreateFormDialog.svelte";
	import { page } from "$app/state";
	import { tiers } from "$lib/stores/tiers";
	import Badge from "$lib/components/ui/badge/badge.svelte";
	import Check from "@lucide/svelte/icons/check";
	import Prism from "prismjs";
	import "prism-themes/themes/prism-duotone-space.css";

	let forms = $state([]);
	let loading = $state(true);
	let showCreateDialog = $state(false);
	let showInfoDialog = $state(false);
	let showDeleteDialog = $state(false);
	let editingForm = $state(null);
	let currentFormId = $state(null);
	let formToDelete = $state(null);

	let iframeCodeCopied = $state(false);
	let linkCopied = $state(false);

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
			forms = (data.forms || []).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
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

	async function confirmDelete() {
		try {
			await betterFetch("/api/dashboard", {
				method: "DELETE",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${localStorage.getItem("bearer")}`,
				},
				body: JSON.stringify({
					userId: $user.id,
					formId: formToDelete.id,
				}),
			});

			toast.success("Form deleted successfully!");
			showDeleteDialog = false;
			await loadDashboard();
		} catch (error) {
			console.error("Delete form error:", error);
			toast.error("Failed to delete form: " + error);
		}
	}

	function generateFormURL(formId) {
		return page.url.origin + "/form/" + formId;
	}

	function generateIframeCode(formId) {
		return `<iframe src="${generateFormURL(formId)}" width="800" height="500" frameborder="0"></iframe>`;
	}

	function generateLinkTagCode(formId) {
		return `<a href="${generateFormURL(formId)}" referrerpolicy="origin">Report bug</a>`;
	}

	async function copyIframeCode() {
		try {
			const code = generateIframeCode(currentFormId);
			await navigator.clipboard.writeText(code);
			iframeCodeCopied = true;
			setTimeout(() => (iframeCodeCopied = false), 1000);
		} catch (error) {
			toast.error("Failed to copy iframe code: " + error);
		}
	}

	async function copyLinkCode() {
		try {
			const code = generateLinkTagCode(currentFormId);
			await navigator.clipboard.writeText(code);
			linkCopied = true;
			setTimeout(() => (linkCopied = false), 1000);
		} catch (error) {
			toast.error("Failed to copy link: " + error);
		}
	}
</script>

<svelte:head>
	<title>Dashboard</title>
</svelte:head>

<div class="mx-auto min-h-screen max-w-7xl px-4 py-8">
	{#if !$user}
		<div class="bg-background/20 absolute inset-0 z-30 flex items-center justify-center backdrop-blur-lg">
			<div>
				<h2>Please <a href="/login" class="underline">sign in</a> to use the dashboard.</h2>
			</div>
		</div>
	{/if}

	<!-- Header -->
	<div class="mb-6">
		<h1 class="text-3xl font-bold">Dashboard</h1>
		<p class="text-muted-foreground mt-1">Manage your bug report forms.</p>
	</div>

	<!-- Report Usage -->
	{#if !loading}
		<div class="mb-12 max-w-md">
			{#if isLimitReached}
				<div class="border-primary bg-muted/50 rounded-lg border p-4">
					<div class="flex items-center justify-between gap-4">
						<div>
							<p>Monthly limit reached!</p>
							<p class="text-muted-foreground text-sm">Upgrade to continue receiving reports.</p>
						</div>
						<Button onclick={() => goto("/pricing")} size="sm">Upgrade plan</Button>
					</div>
				</div>
			{:else}
				<div class="space-y-2">
					<div class="flex items-center justify-between text-sm">
						<span class="text-muted-foreground"><Badge>{$tiers[$user?.subscriptionTier || 0]?.name} tier</Badge></span>
						<span class="text-muted-foreground">{reportAmount} / {currentLimit} Monthly reports</span>
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
		<div class="bg-muted/50 rounded-3xl p-8 py-12 text-center">
			<Layers2 class="text-muted-foreground mx-auto mb-4 h-16 w-16" />
			<h3 class="mb-2 text-xl font-semibold">No forms yet.</h3>
			<p class="text-muted-foreground mb-6">Start collecting exceptional bug reports.</p>

			<Button size="lg" class="group/btn" onclick={openCreateDialog}>
				<Plus class="h-4 w-4 transition group-hover/btn:rotate-90" />
				Create a form
			</Button>
		</div>
	{:else}
		<!-- Forms grid -->
		<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
			{#each forms as form}
				<Card class="transition-shadow hover:shadow-lg">
					<CardHeader>
						<div class="relative flex items-center justify-between gap-4 overflow-hidden">
							<CardTitle class="max-w-2/3 truncate text-lg">{form.name}</CardTitle>
							<div class="flex space-x-2">
								<Button
									variant="outline"
									size="sm"
									onclick={() => {
										editingForm = form;
										showCreateDialog = true;
									}}
								>
									<Settings class="h-4 w-4" />
								</Button>
								<Button
									variant="outline"
									size="sm"
									onclick={() => {
										formToDelete = form;
										showDeleteDialog = true;
									}}
									class="text-destructive hover:text-destructive"
								>
									<Trash2 class="h-4 w-4" />
								</Button>
							</div>
						</div>
					</CardHeader>
					<CardContent class="h-full">
						<div class="flex h-full flex-col space-y-3">
							<div class="text-muted-foreground text-sm">
								{form.githubRepo ? `Connected to ${form.githubRepo}` : "No GitHub repo connected"}.
							</div>

							<div class="text-muted-foreground mt-auto text-sm">
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
									Open
								</Button>
								<Button
									size="sm"
									variant="outline"
									class="flex-1"
									onclick={() => {
										currentFormId = form.id;
										showInfoDialog = true;
									}}
								>
									<Info class="h-4 w-4" />
									How to use
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
<CreateFormDialog
	bind:open={showCreateDialog}
	{editingForm}
	onSuccess={(data, edited) => {
		loadDashboard();

		if (!edited) {
			setTimeout(() => {
				currentFormId = data.formId;
				showInfoDialog = true;
			}, 500);
		}
	}}
/>

<!-- Delete confirmation dialog -->
<Dialog bind:open={showDeleteDialog}>
	<DialogContent class="max-w-md">
		<DialogHeader>
			<DialogTitle>Delete {formToDelete?.name}?</DialogTitle>
			<DialogDescription>
				This action cannot be undone. The form and all its data (excluding created issues) will be permanently deleted.
			</DialogDescription>
		</DialogHeader>
		<div class="flex justify-end">
			<Button variant="destructive" onclick={confirmDelete}>Delete</Button>
		</div>
	</DialogContent>
</Dialog>

<!-- Info dialog -->
<Dialog bind:open={showInfoDialog}>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>Using your form</DialogTitle>
		</DialogHeader>
		<div class="space-y-6">
			<!-- Direct Link -->
			<div>
				<h3 class="mb-1 text-sm font-semibold">Link</h3>
				<p class="text-muted-foreground mb-2 text-sm">Put it anywhere users should be able to report a bug.</p>
				<div class="bg-muted text-muted-foreground relative rounded-md p-2 text-xs">
					<Button onclick={copyLinkCode} size="sm" variant="ghost" class="absolute top-0.5 right-0">
						{#if linkCopied}
							<Check class="h-2 w-2" />
						{:else}
							<Copy class="h-2 w-2" />
						{/if}
					</Button>
					<code>{@html Prism.highlight(generateLinkTagCode(currentFormId), Prism.languages.html, "html")}</code>
				</div>
				<p class="text-muted-foreground mt-2 text-xs opacity-75">
					When using &lta&gt tags, add referrerpolicy="origin" to avoid referrer issues.
				</p>
			</div>

			<!-- Iframe Embed -->
			<div>
				<h3 class="mb-1 text-sm font-semibold">Embed</h3>
				<p class="text-muted-foreground mb-2 text-sm">
					Embed the form directly into your site. We recommend embedding it into a popup.
				</p>
				<div class="bg-muted text-muted-foreground relative rounded-md p-2 text-xs">
					<Button onclick={copyIframeCode} size="sm" variant="ghost" class="absolute top-0.5 right-0">
						{#if iframeCodeCopied}
							<Check class="h-2 w-2" />
						{:else}
							<Copy class="h-2 w-2" />
						{/if}
					</Button>
					<code>{@html Prism.highlight(generateIframeCode(currentFormId), Prism.languages.html, "html")}</code>
				</div>
			</div>

			<!-- Custom Data -->
			<div>
				<h3 class="mb-1 text-sm font-semibold">Adding context</h3>
				<p class="text-muted-foreground mb-2 text-sm">
					Pass custom data via the <span class="text-foreground">?custom-data</span> URL query for better debugging. This
					data will be included in all reports.
				</p>
				<div class="bg-muted text-muted-foreground rounded-md p-2 font-mono text-xs">
					<code>
						'...?custom-data=' + {"encodeURIComponent({user: 5, logs: []})"}
					</code>
				</div>
				<p class="text-muted-foreground mt-2 text-xs opacity-75">Use encodeURIComponent() to encode your data.</p>
			</div>
		</div>
	</DialogContent>
</Dialog>
