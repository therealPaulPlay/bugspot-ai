<script>
	import { Button } from "$lib/components/ui/button";
	import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "$lib/components/ui/dialog";
	import { Input } from "$lib/components/ui/input";
	import { Label } from "$lib/components/ui/label";
	import { Textarea } from "$lib/components/ui/textarea";
	import { Checkbox } from "$lib/components/ui/checkbox";
	import * as Select from "$lib/components/ui/select/index.js";
	import * as Alert from "$lib/components/ui/alert/index.js";
	import { CheckCircle2, Github } from "lucide-svelte";
	import { betterFetch } from "$lib/utils/betterFetch";
	import { toast } from "svelte-sonner";
	import { user } from "$lib/stores/account";
	import { page } from "$app/state";
	import SelectRepoDialog from "./SelectRepoDialog.svelte";
	import { onMount } from "svelte";

	let { open = $bindable(false), editingForm = null, onSuccess = () => {} } = $props();

	let loading = $state(false);
	let selectedRepo = $state(null);

	let formData = $state();
	let repoSelectDialogOpen = $derived(open && !selectedRepo);

	// Reset and setup when dialog opens
	$effect(() => {
		if (open) {
			formData = {
				name: editingForm?.name || "",
				domains: editingForm?.domains?.map((d) => d.domain).join(", ") || "",
				customPrompt: editingForm?.customPrompt || "",
				colorScheme: editingForm?.colorScheme || "default",
				requireEmail: editingForm?.requireEmail ?? true,
				requireSteps: editingForm?.requireSteps ?? true,
				requireVideo: editingForm?.requireVideo ?? false,
				requireScreenshot: editingForm?.requireScreenshot ?? true,
				requireExpectedResult: editingForm?.requireExpectedResult ?? true,
				requireObservedResult: editingForm?.requireObservedResult ?? true,
			};
			selectedRepo = editingForm?.githubRepo ? { fullName: editingForm?.githubRepo } : null;
		}
	});

	// User came back from GitHub auth - reopen the repo selector
	onMount(() => {
		const urlToken = page.url.searchParams.get("github_token");
		if (urlToken && !editingForm && !open) open = true;
	});

	async function saveForm() {
		if (!formData.name.trim()) return toast.error("Form name is required!");

		const domains = formData.domains
			.split(",")
			.map((d) => d.toLowerCase().trim().replace("https://", "").replace("http://", "").split("/")[0])
			.filter((d) => d);

		if (domains.length == 0) return toast.error("At least one domain is required!");

		loading = true;
		try {
			const payload = {
				userId: $user.id,
				...formData,
				domains,
				githubRepo: selectedRepo?.fullName || "",
			};

			const response = editingForm
				? await betterFetch("/api/dashboard", {
						method: "PUT",
						headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("bearer")}` },
						body: JSON.stringify({ formId: editingForm.id, ...payload }),
					})
				: await betterFetch("/api/dashboard", {
						method: "POST",
						headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("bearer")}` },
						body: JSON.stringify(payload),
					});

			const data = await response.json();
			toast.success(editingForm ? "Form updated!" : "Form created!");
			open = false;
			onSuccess(data);
		} catch (error) {
			toast.error(error.message || "Failed to save form");
		} finally {
			loading = false;
		}
	}
</script>

<!-- Main form dialog - only show after repo is selected AND not showing repo selector -->
{#if open && selectedRepo}
	<Dialog bind:open>
		<DialogContent class="max-h-[90vh] max-w-2xl overflow-y-auto">
			<DialogHeader>
				<DialogTitle>{editingForm ? "Edit form" : "Create form"}</DialogTitle>
			</DialogHeader>

			<div class="space-y-6">
				<!-- GitHub Repository -->
				<Alert.Root>
					<CheckCircle2 />
					<Alert.Title>Connected to {selectedRepo?.fullName}.</Alert.Title>
				</Alert.Root>

				<!-- Basic Info -->
				<div class="space-y-4">
					<div class="space-y-2">
						<Label for="name">Form name</Label>
						<Input id="name" bind:value={formData.name} placeholder="My app bug reports" required />
					</div>

					<div class="space-y-2">
						<Label for="colorScheme">Color scheme</Label>
						<Select.Root bind:value={formData.colorScheme} type="single">
							<Select.Trigger>
								{(formData.colorScheme == "default" ? "default (orange)" : formData.colorScheme) || "Select the color"}
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="default">default</Select.Item>
								<Select.Item value="black">black</Select.Item>
								<Select.Item value="red">red</Select.Item>
								<Select.Item value="blue">blue</Select.Item>
								<Select.Item value="green">green</Select.Item>
								<Select.Item value="yellow">yellow</Select.Item>
								<Select.Item value="orange">orange</Select.Item>
							</Select.Content>
						</Select.Root>
					</div>
				</div>

				<!-- Domains -->
				<div class="space-y-2">
					<Label for="domains">Whitelisted iframe domains (comma-separated)</Label>
					<Input id="domains" bind:value={formData.domains} placeholder="your-site.com, www.your-site.com" rows={2} />
				</div>

				<!-- Required Fields -->
				<div class="space-y-3">
					<div class="space-y-0">
						<Label class="text-base font-medium">Required information</Label>
						<p class="text-muted-foreground text-sm">Selected means required, unselected fields are optional.</p>
					</div>
					<div class="grid grid-cols-2 gap-3">
						<div class="flex items-center space-x-2">
							<Checkbox id="requireEmail" bind:checked={formData.requireEmail} />
							<Label for="requireEmail" class="text-sm">User email</Label>
						</div>
						<div class="flex items-center space-x-2">
							<Checkbox id="requireSteps" bind:checked={formData.requireSteps} />
							<Label for="requireSteps" class="text-sm">Steps to reproduce</Label>
						</div>
						<div class="flex items-center space-x-2">
							<Checkbox id="requireScreenshot" bind:checked={formData.requireScreenshot} />
							<Label for="requireScreenshot" class="text-sm">Screenshot</Label>
						</div>
						<div class="flex items-center space-x-2">
							<Checkbox id="requireVideo" bind:checked={formData.requireVideo} />
							<Label for="requireVideo" class="text-sm">Video recording</Label>
						</div>
						<div class="flex items-center space-x-2">
							<Checkbox id="requireExpectedResult" bind:checked={formData.requireExpectedResult} />
							<Label for="requireExpectedResult" class="text-sm">Expected result</Label>
						</div>
						<div class="flex items-center space-x-2">
							<Checkbox id="requireObservedResult" bind:checked={formData.requireObservedResult} />
							<Label for="requireObservedResult" class="text-sm">Observed result</Label>
						</div>
					</div>
				</div>

				<!-- Custom Prompt -->
				<div class="space-y-2">
					<Label for="customPrompt">Custom prompt addition (optional)</Label>
					<Textarea
						id="customPrompt"
						bind:value={formData.customPrompt}
						placeholder="Do not allow bug reports about..."
						rows={2}
					/>
				</div>

				<!-- Actions -->
				<div class="flex justify-end space-x-3">
					<Button variant="outline" onclick={() => (open = false)}>Cancel</Button>
					<Button onclick={saveForm} disabled={loading || !formData.name.trim() || !formData.domains.trim()}>
						{#if loading}
							<div class="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
							{editingForm ? "Updating..." : "Creating..."}
						{:else}
							{editingForm ? "Update form" : "Create form"}
						{/if}
					</Button>
				</div>
			</div>
		</DialogContent>
	</Dialog>
{/if}

<!-- Repo selector as first step - renders last so it appears on top -->
<SelectRepoDialog
	bind:open={repoSelectDialogOpen}
	onRepoSelected={(repo) => {
		selectedRepo = repo;
	}}
	onClosed={() => {
		if (!selectedRepo) open = false;
	}}
/>
