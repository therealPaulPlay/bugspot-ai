<script>
	import { onMount } from "svelte";
	import {
		Sun,
		Moon,
		Bug,
		User,
		Bell,
		Plus,
		Search,
		LogOut,
		Trash2,
		CreditCard,
		ChevronDown,
		Github,
	} from "lucide-svelte";
	import Button from "./ui/button/button.svelte";
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuSeparator,
		DropdownMenuTrigger,
	} from "./ui/dropdown-menu";
	import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
	import { Input } from "./ui/input";
	import { Label } from "./ui/label";
	import { page } from "$app/state";
	import { mode, setMode } from "mode-watcher";
	import { goto } from "$app/navigation";
	import { betterFetch } from "$lib/utils/betterFetch";
	import { toast } from "svelte-sonner";
	import { authStore, user } from "$lib/stores/account";

	let showDeleteDialog = $state(false);
	let deleteConfirmText = $state("");
	let deletingAccount = $state(false);

	const navigation = [
		{ name: "Home", href: "/" },
		{ name: "Pricing", href: "/pricing" },
	];

	async function deleteAccount() {
		deletingAccount = true;
		try {
			await betterFetch("/api/account", {
				method: "DELETE",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${localStorage.getItem("bearer")}`,
				},
				body: JSON.stringify({ userId: $user.id }),
			});

			authStore.logout();
			showDeleteDialog = false;
			toast.success("Account deleted successfully");
			goto("/");
		} catch (error) {
			console.error("Delete account error:", error);
			toast.error("Failed to delete account: " + error);
		} finally {
			deletingAccount = false;
		}
	}

	let pageScrollY = $state(0);
</script>

<svelte:window bind:scrollY={pageScrollY} />

<nav class="fixed top-0 right-0 left-0 z-50">
	<div class="flex w-full justify-center transition-all duration-300 {pageScrollY > 10 ? 'p-4' : 'bg-background'}">
		<div
			class="bg-background flex h-18 w-full max-w-7xl justify-between rounded-xl border p-4 duration-300 {pageScrollY >
			10
				? 'shadow-xl'
				: 'border-transparent'}"
		>
			<div class="flex items-center">
				<!-- Logo -->
				<a href="/" class="flex items-center space-x-2">
					<Bug class="text-primary h-8 w-8" />
					<span class="text-xl font-bold">Bugspot</span>
				</a>

				<!-- Navigation links -->
				<div class="hidden md:ml-8 md:flex md:space-x-2">
					{#each navigation as item}
						<a
							href={item.href}
							class="text-muted-foreground hover:text-foreground px-2 py-2 text-sm font-medium transition-colors"
							class:text-foreground={page.url.pathname === item.href}
						>
							{item.name}
						</a>
					{/each}
				</div>
			</div>

			<!-- Right side -->
			<div class="flex items-center space-x-4">
				{#if $user}
					<!-- Authenticated user -->
					<div class="flex items-center space-x-2">
						<!-- User dropdown -->
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="ghost" class="flex items-center space-x-2 px-2">
									<img src={$user.avatar} alt={$user.username} class="h-6 w-6 rounded-full" />
									<span class="hidden max-w-40 truncate text-sm md:inline">{$user.username}</span>
									<ChevronDown class="h-3 w-3" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" class="w-48">
								<div class="px-2 py-2">
									<p class="text-muted-foreground truncate text-xs">{$user.email}</p>
								</div>
								<DropdownMenuSeparator />
								<DropdownMenuItem onclick={() => goto("/pricing")}>
									<CreditCard class="h-4 w-4" />
									Manage subscription
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem
									onclick={() => {
										authStore.logout();
										toast.info("Signed out.");
										goto("/");
									}}
								>
									<LogOut class="h-4 w-4" />
									Sign out
								</DropdownMenuItem>
								<DropdownMenuItem
									onclick={() => {
										showDeleteDialog = true;
										deleteConfirmText = "";
									}}
									class="text-destructive focus:text-destructive"
								>
									<Trash2 class="h-4 w-4" />
									Delete account
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				{:else}
					<!-- Guest user - use anchor instead of Button with href -->
					<Button href="/login" variant="outline">
						<User class="h-4 w-4" />
						<span class="max-sm:hidden">Sign in</span>
					</Button>
				{/if}

				<!-- Github -->
				<Button variant="outline" size="sm" target="_blank" href="https://github.com/therealPaulPlay/bugspot-ai">
					<Github />
				</Button>

				<!-- Theme toggle -->
				<Button variant="ghost" size="sm" onclick={() => setMode(mode.current === "dark" ? "light" : "dark")}>
					{#if mode.current === "dark"}
						<Moon class="h-4 w-4" />
					{:else}
						<Sun class="h-4 w-4" />
					{/if}
				</Button>
			</div>
		</div>
	</div>
</nav>

<!-- Delete Account Dialog -->
<Dialog bind:open={showDeleteDialog}>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>Delete account</DialogTitle>
			<DialogDescription>
				This action cannot be undone. This will permanently delete your account and all associated data.
			</DialogDescription>
		</DialogHeader>

		<div class="space-y-4">
			<div class="space-y-2">
				<Label for="deleteConfirm">Type "Delete account" to confirm:</Label>
				<Input id="deleteConfirm" bind:value={deleteConfirmText} placeholder="Delete account" class="mt-1" />
			</div>

			<div class="flex justify-end space-x-2">
				<Button variant="outline" onclick={() => (showDeleteDialog = false)}>Cancel</Button>
				<Button
					variant="destructive"
					onclick={deleteAccount}
					disabled={deleteConfirmText !== "Delete account" || deletingAccount}
				>
					{#if deletingAccount}
						<div class="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
						Deleting...
					{:else}
						Delete
					{/if}
				</Button>
			</div>
		</div>
	</DialogContent>
</Dialog>
