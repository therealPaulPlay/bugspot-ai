<script>
	import { Sun, Moon, Bug, User, Bell, Plus, Search } from "lucide-svelte";
	import Button from "./ui/button/button.svelte";
	import { page } from "$app/state";
	import { mode, setMode } from "mode-watcher";
	import { goto } from "$app/navigation";

	function toggleTheme() {
		mode.current === "dark" ? setMode("light") : setMode("dark");
	}

	const navigation = [
		{ name: "Home", href: "/" },
		{ name: "Pricing", href: "/pricing" },
	];
</script>

<nav class="border-b fixed top-0 z-99 left-0 right-0 backdrop-blur-xl bg-background/50">
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<div class="flex h-16 justify-between">
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
				<!-- Guest user -->
				<Button href="/login" variant="outline" size="sm">
					<User class="h-4 w-4" />
					Sign in
				</Button>

				<!-- Theme toggle -->
				<Button variant="ghost" size="sm" onclick={toggleTheme}>
					{#if mode === "dark"}
						<Sun class="h-4 w-4" />
					{:else}
						<Moon class="h-4 w-4" />
					{/if}
				</Button>
			</div>
		</div>
	</div>
</nav>
