<script>
	import { onMount } from "svelte";
	import { Button } from "$lib/components/ui/button";
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "$lib/components/ui/card";
	import { Badge } from "$lib/components/ui/badge";
	import { Check, Crown, Mail, UserRoundCog } from "lucide-svelte";
	import { goto } from "$app/navigation";

	let loading = null;

	const tiers = [
		{ id: 0, name: "Base", price: 0, reportLimit: 25 },
		{ id: 1, name: "Pro", price: 25, reportLimit: 300 },
		{ id: 2, name: "Enterprise", price: 75, reportLimit: 1000 },
	];

	function formatPrice(price) {
		return price === 0 ? "Free" : `$${price}`;
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

<div class="mx-auto max-w-6xl px-4 py-24 sm:px-6 lg:px-8">
	<!-- Header -->
	<div class="mb-16 text-center">
		<h1 class="mb-4 text-4xl font-bold">Simple, transparent pricing.</h1>
		<p class="text-muted-foreground mx-auto max-w-2xl text-xl">
			All features included. Pay only for the volume you need.
		</p>
	</div>

	<!-- Pricing cards -->
	<div class="mb-8 grid gap-8 lg:grid-cols-3">
		{#each tiers as tier, index}
			<Card class="relative {index === 1 ? 'border-primary scale-105 shadow-lg' : ''} transition-all hover:shadow-lg">
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
						{tier.reportLimit} bug reports per month
					</CardDescription>
				</CardHeader>

				<CardContent class="space-y-6">
					<!-- Features list -->
					<ul class="space-y-3">
						<li class="flex items-start space-x-3">
							<Check class="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
							<span class="text-sm">AI-powered bug analysis</span>
						</li>
						<li class="flex items-start space-x-3">
							<Check class="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
							<span class="text-sm">Use for multiple products</span>
						</li>
						<li class="flex items-start space-x-3">
							<Check class="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
							<span class="text-sm">Team collaboration</span>
						</li>
						<li class="flex items-start space-x-3">
							<Check class="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
							<span class="text-sm">Priority & tag management</span>
						</li>
						<li class="flex items-start space-x-3">
							<Check class="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
							<span class="text-sm">Guest reporting</span>
						</li>
						<li class="flex items-start space-x-3">
							<Check class="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
							<span class="text-sm">Duplicate detection</span>
						</li>
					</ul>

					<!-- CTA Button -->
					<Button
						class="w-full {index === 1 ? '' : 'variant-outline'}"
						variant={index === 1 ? "default" : "outline"}
						disabled={loading === tier.id}
					>
						{#if loading === tier.id}
							<div class="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
							Processing...
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
	<div class="mb-16 flex w-full justify-center">
		<Button variant="outline">Manage subscription <UserRoundCog /></Button>
	</div>

	<!-- Contact section -->
	<div class="bg-muted/50 rounded-2xl p-12 text-center">
		<h2 class="mb-4 text-2xl font-bold">To infinity and beyond?</h2>
		<p class="text-muted-foreground mx-auto mb-8 max-w-2xl">
			Contact us for custom pricing that fits your team's needs.
		</p>
		<Button href="mailto:paulplaystudio@gmail.com">
			Contact us
			<Mail class="h-4 w-4" />
		</Button>
	</div>
</div>
