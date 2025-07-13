<script>
	import { onMount } from "svelte";
	import { Button } from "$lib/components/ui/button";
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "$lib/components/ui/card";
	import { Badge } from "$lib/components/ui/badge";
	import { Check, CheckCircle, Crown, Mail, UserRoundCog, Bug, Zap, Rocket, PlaneTakeoff } from "lucide-svelte";
	import { goto } from "$app/navigation";
	import { tiers } from "$lib/stores/tiers";
	import { isAuthenticated, user } from "$lib/stores/account";
	import { betterFetch } from "$lib/utils/betterFetch.js";
	import { toast } from "svelte-sonner";

	let loading = $state(null);

	// Add lookup keys to tiers
	const tiersWithLookup = [
		{ ...$tiers[0], lookupKey: null }, // Free / Base
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
					lookupKey: tier.lookupKey,
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
</svelte:head>

<div class="mx-auto max-w-6xl px-4 pt-24 pb-8">
	<!-- Header -->
	<div class="mb-12 text-center">
		<div class="mb-4 flex justify-center">
			<Bug class="text-primary h-12 w-12" />
		</div>
		<h1 class="mb-4 text-4xl font-bold">Clear, flexible pricing.</h1>
	</div>

	<!-- Fun testimonial quote -->
	<div class="mb-20 flex flex-col items-center justify-center text-center">
		<blockquote class="text-muted-foreground mb-2 max-w-xl text-lg italic">
			"The duplicate merging is a game changer. We went from 'which report has the screenshot?' to having everything in
			one place."
		</blockquote>
		<cite class="text-muted-foreground text-sm not-italic"> — A Bugspot user </cite>
	</div>

	<!-- Pricing cards -->
	<div class="mb-8 grid gap-8 lg:grid-cols-3">
		{#each tiersWithLookup as tier, index}
			<Card
				class="group relative {index === 1
					? 'border-primary shadow-lg lg:scale-105'
					: 'shadow-none'} transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
			>
				{#if index === 1}
					<div class="absolute -top-3 left-1/2 -translate-x-1/2 transform">
						<Badge class="bg-primary text-primary-foreground px-3 py-1">
							<Crown class="mr-1 h-3 w-3" />
							Developer favorite
						</Badge>
					</div>
				{/if}

				<CardHeader class="pb-2 text-center">
					<CardTitle class="text-2xl">{tier.name}</CardTitle>
					<div class="mt-4">
						<span class="text-primary text-4xl font-bold">
							{formatPrice(tier.price)}
						</span>
						{#if tier.price > 0}
							<span class="text-muted-foreground">/month</span>
						{/if}
					</div>
					<CardDescription class="mt-2 text-lg font-medium">
						{tier.reportLimit} reports per month
					</CardDescription>
				</CardHeader>

				<CardContent class="flex flex-col items-center gap-6">
					<!-- Features list -->
					<ul class="space-y-3">
						<li class="flex items-start space-x-3">
							<div class="bg-primary/10 mt-0.5 rounded-full p-1">
								<Check class="text-primary h-3 w-3" />
							</div>
							<span class="text-sm">AI-powered bug report forms</span>
						</li>
						<li class="flex items-start space-x-3">
							<div class="bg-primary/10 mt-0.5 rounded-full p-1">
								<Check class="text-primary h-3 w-3" />
							</div>
							<span class="text-sm">Automatic priority evaluation</span>
						</li>
						<li class="flex items-start space-x-3">
							<div class="bg-primary/10 mt-0.5 rounded-full p-1">
								<Check class="text-primary h-3 w-3" />
							</div>
							<span class="text-sm">Add custom instructions</span>
						</li>
						<li class="flex items-start space-x-3">
							<div class="bg-primary/10 mt-0.5 rounded-full p-1">
								<Check class="text-primary h-3 w-3" />
							</div>
							<span class="text-sm">Smart duplicate handling</span>
						</li>
						<li class="flex items-start space-x-3">
							<div class="bg-primary/10 mt-0.5 rounded-full p-1">
								<Check class="text-primary h-3 w-3" />
							</div>
							<span class="text-sm">Multiple GitHub repos</span>
						</li>
					</ul>

					<!-- CTA Button -->
					<Button
						class="group/btn mt-2 w-full transition-all duration-300"
						size="lg"
						variant={index === 1 ? "default" : "outline"}
						disabled={loading === tier.id || $user?.subscriptionTier == tier.id || $user?.subscriptionTier > tier.id}
						onclick={() => handleSubscription(tier)}
					>
						{#if loading === tier.id}
							<div class="border-foreground h-4 w-4 animate-spin rounded-full border-b-2"></div>
							Processing...
						{:else if $user?.subscriptionTier == tier.id}
							<CheckCircle class="h-4 w-4" />
							Current plan
						{:else if tier.id === 0}
							<Zap class="h-4 w-4 transition-transform group-hover/btn:-rotate-12" />
							Get started
						{:else if tier.id === 1}
							<PlaneTakeoff class="h-4 w-4 transition-transform group-hover/btn:-rotate-12" />
							Upgrade
						{:else}
							<Rocket class="h-4 w-4 transition-transform group-hover/btn:-rotate-12" />
							Upgrade
						{/if}
					</Button>
				</CardContent>
			</Card>
		{/each}
	</div>
	<p class="text-muted-foreground mx-auto mb-6 text-center text-xs max-sm:max-w-80">
		*AI-closed reports count towards the limit. Abuse is prevented with captchas and rate limits.
	</p>
	<div class="mb-26 flex w-full justify-center">
		<Button variant="outline" size="lg" onclick={openBillingPortal} disabled={!$isAuthenticated}>
			Manage subscription <UserRoundCog />
		</Button>
	</div>

	<!-- Contact section -->
	<div class="bg-muted/50 mb-12 rounded-3xl p-12 text-center">
		<h2 class="mb-4 text-2xl font-bold">To infinity and beyond?</h2>
		<p class="text-muted-foreground mx-auto mb-8 max-w-md">
			Contact us for custom pricing and volume discounts. Let's figure this out together.
		</p>
		<Button href="mailto:paulplaystudio@gmail.com" size="lg">
			Contact us
			<Mail class="h-4 w-4" />
		</Button>
	</div>
</div>
