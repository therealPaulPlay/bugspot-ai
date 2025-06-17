<script>
	import { page } from "$app/state";
	import { Button } from "$lib/components/ui/button";
	import { Home, RefreshCw } from "lucide-svelte";
	import { goto } from "$app/navigation";
</script>

<svelte:head>
	<title>Error {page.status}</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center px-4">
	<div class="text-center">
		<h1 class="text-muted-foreground mb-2 text-4xl font-bold">{page.status}</h1>
		<p class="text-muted-foreground mb-8 text-xl">Uh oh. Looks like we found another bug!</p>

		<div class="flex justify-center gap-4">
			<Button variant="outline" onclick={() => window.location.reload()}>
				<RefreshCw class="h-4 w-4" />
				Reload
			</Button>
			<Button onclick={() => goto("/")}>
				<Home class="h-4 w-4" />
				Go home
			</Button>
		</div>
	</div>
</div>
