<script>
	import { Button } from "$lib/components/ui/button";
	import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "$lib/components/ui/dialog";
	import { Input } from "$lib/components/ui/input";
	import { Label } from "$lib/components/ui/label";
	import { Textarea } from "$lib/components/ui/textarea";
	import { Checkbox } from "$lib/components/ui/checkbox";
	import * as Select from "$lib/components/ui/select/index.js";
	import { Alert, AlertDescription } from "$lib/components/ui/alert";
	import { Github, ExternalLink, AlertCircle, CheckCircle } from "lucide-svelte";
	import { betterFetch } from "$lib/utils/betterFetch";
	import { toast } from "svelte-sonner";
	import { user } from "$lib/stores/account";

	let { open = $bindable(false), editingForm = null, onSuccess = () => {} } = $props();

	let loading = $state(false);
	let loadingRepos = $state(false);
	let repos = $state([]);
	let githubToken = $state("");
	let needsGithubAuth = $state(false);
	let reposPagination = $state({ currentPage: 1, hasNextPage: false, hasPrevPage: false });

	// Form data
	let formData = $state({
		name: "",
		description: "",
		githubRepo: "",
		customPrompt: "",
		domains: "",
		requireEmail: true,
		requireSteps: true,
		requireVideo: false,
		requireScreenshot: true,
		requireExpectedResult: true,
		requireObservedResult: true,
	});

	// Reset form when dialog opens/closes
	$effect(() => {
		if (open) {
			if (editingForm) {
				// Populate form for editing
				formData = {
					name: editingForm.name || "",
					description: editingForm.description || "",
					githubRepo: editingForm.githubRepo || "",
					customPrompt: editingForm.customPrompt || "",
					domains: editingForm.domains?.map((d) => d.domain).join("\n") || "",
					requireEmail: editingForm.requireEmail ?? true,
					requireSteps: editingForm.requireSteps ?? true,
					requireVideo: editingForm.requireVideo ?? false,
					requireScreenshot: editingForm.requireScreenshot ?? true,
					requireExpectedResult: editingForm.requireExpectedResult ?? true,
					requireObservedResult: editingForm.requireObservedResult ?? true,
				};
				loadGithubRepos();
			} else {
				// Reset for new form
				formData = {
					name: "",
					description: "",
					githubRepo: "",
					customPrompt: "",
					domains: "",
					requireEmail: true,
					requireSteps: true,
					requireVideo: false,
					requireScreenshot: true,
					requireExpectedResult: true,
					requireObservedResult: true,
				};
				repos = [];
				needsGithubAuth = false;
			}
		}
	});

	async function loadGithubRepos(page = 1) {
		if (!githubToken) {
			needsGithubAuth = true;
			return;
		}

		loadingRepos = true;
		try {
			const response = await betterFetch(`/api/github/repos?token=${githubToken}&page=${page}&per_page=50`, {
				headers: {
					Authorization: `Bearer ${localStorage.getItem("bearer")}`,
				},
			});

			const data = await response.json();

			if (data.needsAuth) {
				needsGithubAuth = true;
				repos = [];
				reposPagination = { currentPage: 1, hasNextPage: false, hasPrevPage: false };
			} else {
				if (page === 1) {
					repos = data.repos || [];
				} else {
					repos = [...repos, ...(data.repos || [])];
				}
				reposPagination = data.pagination || { currentPage: page, hasNextPage: false, hasPrevPage: false };
				needsGithubAuth = false;
			}
		} catch (error) {
			console.error("Failed to load repos:", error);
			toast.error("Failed to load GitHub repositories!");
			needsGithubAuth = true;
		} finally {
			loadingRepos = false;
		}
	}

	async function loadMoreRepos() {
		if (reposPagination.hasNextPage && !loadingRepos) {
			await loadGithubRepos(reposPagination.currentPage + 1);
		}
	}

	async function requestGithubAccess() {
		try {
			const response = await betterFetch("/api/github/repos", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${localStorage.getItem("bearer")}`,
				},
				body: JSON.stringify({
					returnUrl: `${window.location.origin}/dashboard`,
				}),
			});

			const data = await response.json();

			// Store state and redirect to GitHub
			sessionStorage.setItem("github_oauth_state", data.state);
			window.location.href = data.authUrl;
		} catch (error) {
			console.error("GitHub auth error:", error);
			toast.error("Failed to request GitHub access!");
		}
	}

	async function saveForm() {
		if (!formData.name.trim()) {
			toast.error("Form name is required");
			return;
		}

		loading = true;
		try {
			const domains = formData.domains
				.split(",")
				.map((d) => d.trim())
				.filter((d) => d);

			const payload = {
				userId: $user.id,
				...formData,
				domains,
				githubToken: githubToken || null,
			};

			let response;
			if (editingForm) {
				// Update existing form
				response = await betterFetch("/api/dashboard", {
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${localStorage.getItem("bearer")}`,
					},
					body: JSON.stringify({
						formId: editingForm.id,
						...payload,
					}),
				});
			} else {
				// Create new form
				response = await betterFetch("/api/dashboard", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${localStorage.getItem("bearer")}`,
					},
					body: JSON.stringify(payload),
				});
			}

			const data = await response.json();

			toast.success(editingForm ? "Form updated successfully!" : "Form created successfully!");
			open = false;
			onSuccess(data);
		} catch (error) {
			console.error("Save form error:", error);
			toast.error(error.message || "Failed to save form");
		} finally {
			loading = false;
		}
	}
</script>

<Dialog bind:open>
	<DialogContent class="max-h-[90vh] max-w-2xl overflow-y-auto">
		<DialogHeader>
			<DialogTitle>{editingForm ? "Edit Form" : "Create Bug Report Form"}</DialogTitle>
			<DialogDescription>Customize what information users need to provide in their bug reports</DialogDescription>
		</DialogHeader>

		<div class="space-y-6">
			<!-- Basic info -->
			<div class="space-y-4">
				<div class="space-y-2">
					<Label for="name">Form name</Label>
					<Input id="name" bind:value={formData.name} placeholder="My App Bug Reports" required />
				</div>

				<div class="space-y-2">
					<Label for="description">Description (optional)</Label>
					<Input id="description" bind:value={formData.description} placeholder="Report bugs for our mobile app" />
				</div>
			</div>

			<!-- GitHub Repository -->
			<div class="space-y-2">
				<Label class="text-base font-medium">GitHub repository</Label>

				{#if needsGithubAuth}
					<Alert>
						<Github class="h-4 w-4" />
						<AlertDescription>
							Connect your GitHub account to create issues directly from bug reports.
							<Button variant="link" class="h-auto !p-0" onclick={requestGithubAccess}>
								<ExternalLink class="h-3 w-3" />
								Connect GitHub
							</Button>
						</AlertDescription>
					</Alert>
				{:else if loadingRepos}
					<div class="text-muted-foreground flex items-center space-x-2 text-sm">
						<div class="border-primary h-4 w-4 animate-spin rounded-full border-b-2"></div>
						Loading repositories...
					</div>
				{:else if repos.length > 0}
					<div class="space-y-3">
						<Select.Root bind:value={formData.githubRepo}>
							<Select.Trigger>
								{repos.find((r) => r.fullName === formData.githubRepo)?.fullName ?? "Select a repository"}
							</Select.Trigger>
							<Select.Content class="max-h-[200px]">
								<Select.Group>
									{#each repos as repo}
										<Select.Item value={repo.fullName} label={repo.fullName}>
											<div class="flex flex-col">
												<span>{repo.fullName}</span>
												{#if repo.description}
													<span class="text-muted-foreground text-xs">{repo.description}</span>
												{/if}
											</div>
										</Select.Item>
									{/each}
								</Select.Group>
							</Select.Content>
						</Select.Root>

						{#if reposPagination.hasNextPage}
							<Button variant="outline" size="sm" onclick={loadMoreRepos} disabled={loadingRepos} class="w-full">
								{#if loadingRepos}
									<div class="border-primary mr-2 h-4 w-4 animate-spin rounded-full border-b-2"></div>
									Loading more...
								{:else}
									Load more repositories ({repos.length} loaded)
								{/if}
							</Button>
						{:else if repos.length >= 50}
							<p class="text-muted-foreground text-center text-xs">
								All repositories loaded ({repos.length} total)
							</p>
						{/if}
					</div>
				{:else}
					<Button variant="outline" onclick={loadGithubRepos} disabled={loadingRepos}>
						<Github class="h-4 w-4" />
						Load repositories
					</Button>
				{/if}
			</div>

			<!-- Allowed domains -->
			<div class="space-y-2">
				<Label for="domains">Allowed domains (comma-separated)</Label>
				<Textarea
					id="domains"
					bind:value={formData.domains}
					placeholder="myapp.com, www.myapp.com, staging.myapp.com"
					rows={3}
				/>
			</div>

			<!-- Required fields -->
			<div class="space-y-3">
				<Label class="text-base font-medium">Required information</Label>

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
						<Checkbox id="requireExpected" bind:checked={formData.requireExpectedResult} />
						<Label for="requireExpected" class="text-sm">Expected result</Label>
					</div>

					<div class="flex items-center space-x-2">
						<Checkbox id="requireObserved" bind:checked={formData.requireObservedResult} />
						<Label for="requireObserved" class="text-sm">Observed result</Label>
					</div>
				</div>
			</div>

			<!-- Custom prompt -->
			<div class="space-y-2">
				<Label for="customPrompt">Custom prompt addition (optional)</Label>
				<Textarea
					id="customPrompt"
					bind:value={formData.customPrompt}
					placeholder="Do not allow reports for issue xyz because..."
					rows={3}
				/>
			</div>

			<!-- Actions -->
			<div class="flex justify-end space-x-3">
				<Button variant="outline" onclick={() => (open = false)}>Cancel</Button>
				<Button onclick={saveForm} disabled={loading || !formData.name.trim()}>
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
