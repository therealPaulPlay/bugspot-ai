<script>
	import { onMount } from "svelte";
	import { Button } from "$lib/components/ui/button";
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "$lib/components/ui/card";
	import { Badge } from "$lib/components/ui/badge";
	import { Check, CheckCircle, Crown, Mail, UserRoundCog } from "lucide-svelte";
	import { goto } from "$app/navigation";
	import { tiers } from "$lib/stores/tiers";
	import { isAuthenticated, user } from "$lib/stores/account";
	import { betterFetch } from "$lib/utils/betterFetch.js";
	import { toast } from "svelte-sonner";

	let loading = $state(null);

	// Add lookup keys to tiers
	const tiersWithLookup = [
		{ ...$tiers[0], lookupKey: null }, // Free / Base (no price needed)
		{ ...$tiers[1], lookupKey: "bugspot_monthly_pro" }, // Pro
		{ ...$tiers[2], lookupKey: "bugspot_monthly_enterprise" }, // Enterprise
	];

	function formatPrice(price) {
		return price === 0 ? "Free" : `$${price}`;
	}

	async function handleSubscription(tier) {
		if (!$isAuthenticated) {
			goto("/login");
			return;
		}
		
		loading = tier.id;

		try {
			const response = await betterFetch("/api/account/billing", {
				method: "POST",
				headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("bearer")}` },
				body: JSON.stringify({
					userId: $user.id,
					lookupKey: tier.lookupKey, // You'll need to add this to your tiers
				}),
			});

			const data = await response.json();

			if (data.url) window.location.href = data.url;
			else throw new Error(data.error || "Failed to create checkout session");
		} catch (error) {
			console.error("Subscription error:", error);
			toast.error(error.message || "Something went wrong. Please try again.");
		} finally {
			loading = null;
		}
	}

	async function openBillingPortal() {
		if (!$isAuthenticated) {
			goto("/login");
			return;
		}

		try {
			const response = await betterFetch("/api/account/billing", {
				method: "PUT",
				headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("bearer")}` },
				body: JSON.stringify({ userId: $user.id }),
			});

			const data = await response.json();

			if (data.url) window.location.href = data.url;
			else throw new Error(data.error || "Failed to open billing portal");
		} catch (error) {
			console.error("Billing portal error:", error);
			toast.error(error.message || "Something went wrong. Please try again.");
		}
	}
</script>

<svelte:head>
	<title>Pricing</title>
	<script id="stripe-js" src="https://js.stripe.com/v3/" async></script>
	<meta
		name="description"
		content="Simple, transparent pricing that scales with your bug volume. All features included in every plan."
	/>
</svelte:head>

<div class="mx-auto max-w-6xl px-8 py-24">
	<!-- Header -->
	<div class="mb-16 text-center">
		<h1 class="mb-4 text-4xl font-bold">Simple, transparent pricing.</h1>
		<p class="text-muted-foreground mx-auto max-w-2xl text-xl">All features included. Save valuable dev-time.</p>
	</div>

	<!-- Pricing cards -->
	<div class="mb-8 grid gap-8 lg:grid-cols-3">
		{#each tiersWithLookup as tier, index}
			<Card
				class="relative {index === 1
					? 'border-primary shadow-lg lg:scale-105'
					: 'shadow-none'} transition-all hover:shadow-lg"
			>
				{#if index === 1}
					<div class="absolute -top-3 left-1/2 -translate-x-1/2 transform">
						<Badge class="bg-primary text-primary-foreground px-3 py-1">
							<Crown class="mr-1 h-3 w-3" />
							Most popular
						</Badge>
					</div>
				{/if}

				<CardHeader class="pb-2 text-center">
					<CardTitle class="text-2xl">{tier.name}</CardTitle>
					<div class="mt-4">
						<span class="text-4xl font-bold">{formatPrice(tier.price)}</span>
						{#if tier.price > 0}
							<span class="text-muted-foreground">/month</span>
						{/if}
					</div>
					<CardDescription class="mt-2 text-lg font-medium">
						{tier.reportLimit} bug reports / month*
					</CardDescription>
				</CardHeader>

				<CardContent class="space-y-6">
					<!-- Features list -->
					<ul class="space-y-3">
						<li class="flex items-start space-x-3">
							<Check class="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
							<span class="text-sm">AI-powered bug report forms</span>
						</li>
						<li class="flex items-start space-x-3">
							<Check class="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
							<span class="text-sm">Automatic priority management</span>
						</li>
						<li class="flex items-start space-x-3">
							<Check class="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
							<span class="text-sm">Add custom instructions</span>
						</li>
						<li class="flex items-start space-x-3">
							<Check class="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
							<span class="text-sm">Duplicate prevention</span>
						</li>
						<li class="flex items-start space-x-3">
							<Check class="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
							<span class="text-sm">Integrate with multiple GitHub repos</span>
						</li>
					</ul>

					<!-- CTA Button -->
					<Button
						class="w-full {index === 1 ? '' : 'variant-outline'}"
						size="lg"
						variant={index === 1 ? "default" : "outline"}
						disabled={loading === tier.id || $user?.subscriptionTier == tier.id || $user?.subscriptionTier > tier.id}
						onclick={() => handleSubscription(tier)}
					>
						{#if loading === tier.id}
							<div class="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
							Processing...
						{:else if $user?.subscriptionTier == tier.id}
							Selected <CheckCircle />
						{:else if tier.price === 0}
							Get started
						{:else}
							Subscribe now
						{/if}
					</Button>
				</CardContent>
			</Card>
		{/each}
	</div>
	<p class="text-muted-foreground mx-auto mb-6 max-w-1/2 text-center text-xs">
		*Reports that the AI closed (e.g. spam, false positives, duplicates) are counted as bug reports. We keep abuse low
		with strict rate limits and captchas.
	</p>
	<div class="mb-26 flex w-full justify-center">
		<Button variant="outline" size="lg" onclick={openBillingPortal} disabled={!$isAuthenticated}>
			Manage subscription <UserRoundCog />
		</Button>
	</div>

	<!-- Contact section -->
	<div class="bg-muted/50 rounded-3xl p-12 text-center">
		<h2 class="mb-4 text-2xl font-bold">To infinity and beyond?</h2>
		<p class="text-muted-foreground mx-auto mb-8 max-w-2xl">
			Contact us for custom pricing and volume discounts. Let's figure this out together.
		</p>
		<Button href="mailto:paulplaystudio@gmail.com" size="lg">
			Contact us
			<Mail class="h-4 w-4" />
		</Button>
	</div>
</div>
