<script>
	import Footer from "$lib/components/Footer.svelte";
	import Navbar from "$lib/components/Navbar.svelte";
	import Analytics from "$lib/components/Analytics.svelte";
	let { children } = $props();
</script>

<!-- Navigation -->
<Navbar />

<!-- Main content -->
<main class="mt-18 min-h-screen">
	{@render children()}
</main>

<!-- Footer -->
<Footer />

<!-- Analytics -->
<Analytics />
