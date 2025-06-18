<script>
	import "../app.css";
	import { onMount } from "svelte";
	import { Button } from "$lib/components/ui/button";
	import { ModeWatcher, mode } from "mode-watcher";
	import Footer from "$lib/components/Footer.svelte";
	import Navbar from "$lib/components/Navbar.svelte";
	import { Toaster } from "$lib/components/ui/sonner/index.js";

	let { children } = $props();

	onMount(() => {
		// Load user session if exists
		const storedUser = localStorage.getItem("bugspot_user");
		if (storedUser) user.set(JSON.parse(storedUser));
	});
</script>

<ModeWatcher />

<Toaster />

<div class="bg-background min-h-screen">
	<!-- Navigation -->
	<Navbar />

	<!-- Main content -->
	<main class="mt-16">
		{@render children()}
	</main>

	<!-- Footer -->
	<Footer />
</div>
