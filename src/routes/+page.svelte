<script>
	import { onMount } from "svelte";
	import { Button } from "$lib/components/ui/button";
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "$lib/components/ui/card";
	import { Badge } from "$lib/components/ui/badge";
	import { ArrowRight, Bug, Sparkles, Zap, Shield, CloudCheck, ArrowDown, AlertTriangle } from "lucide-svelte";
	import { goto } from "$app/navigation";
	import { user } from "$lib/stores/account";

	// Animation for bug report transformation
	const badReports = [
		{
			title: "button doesn't function",
			description: "weird error shows when I click it. I'm using Arch btw.",
			priority: "very high",
		},
		{
			title: "stuff broken",
			description: "it doesnt work when i click the button :(",
			priority: "idk",
		},
	];

	const goodReport = {
		title: "Login button unresponsive on mobile Safari",
		description: "The login button becomes unresponsive after form validation fails on mobile Safari browsers.",
		stepsToReproduce: "1. Navigate to login page on mobile Safari\n2. Click on login (without filling out form)",
		expectedResult: "Login button should remain clickable after validation errors.",
		observedResult: "Button becomes unresponsive and requires page refresh.",
		priority: "P1 - High",
		browserInfo: "Safari 17.2, iOS 17.1.1",
	};

	// Simple errors that will animate in
	const errors = [
		{
			title: "TooManyChaoticReportsError",
			description: "System overwhelmed by bug reports that just say 'it's broken'.",
			position: "top: 7%; left: 15%;",
			colorClass: "bg-red-50 dark:bg-red-950 border-red-300 dark:border-red-700",
		},
		{
			title: "DuplicateIssueException",
			description: "Same bug reported 47 times with different titles.",
			position: "top: 20%; right: 20%;",
			colorClass: "bg-yellow-50 dark:bg-yellow-950 border-yellow-300 dark:border-yellow-700",
		},
		{
			title: "MissingStepsError",
			description: "Cannot reproduce issue. Steps: 'just click stuff until it breaks'.",
			position: "top: 40%; left: 10%;",
			colorClass: "bg-blue-50 dark:bg-blue-950 border-blue-300 dark:border-blue-700",
		},
		{
			title: "VagueDescriptionWarning",
			description: "'Something is wrong' detected. Unable to parse actual problem.",
			position: "top: 10%; right: 10%;",
			colorClass: "bg-purple-50 dark:bg-purple-950 border-purple-300 dark:border-purple-700",
		},
		{
			title: "PriorityOverflowError",
			description: "Everything marked as 'URGENT!!!'. Priority system crashed.",
			position: "top: 55%; left: 25%;",
			colorClass: "bg-orange-50 dark:bg-orange-950 border-orange-300 dark:border-orange-700",
		},
		{
			title: "ScreenshotNotFoundException",
			description: "Visual evidence missing. Developers using telepathy.",
			position: "top: 50%; right: 15%;",
			colorClass: "bg-green-50 dark:bg-green-950 border-green-300 dark:border-green-700",
		},
	];
</script>

<svelte:head>
	<title>Bugspot - Help users create professional bug reports with AI</title>
	<meta
		name="description"
		content="Help users create professional bug reports with AI. Reduce back-and-forth communication & help developers debug effectively."
	/>
</svelte:head>

<!-- Hero Section -->
<section class="relative overflow-hidden">
	<!-- Background gradient -->
	<div class="from-primary/10 via-background to-secondary/10 absolute inset-0 bg-gradient-to-br"></div>

	<div class="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
		<div class="text-center">
			<div class="mb-4 flex justify-center">
				<div class="bg-primary/10 flex items-center space-x-2 rounded-full px-4 py-2">
					<Sparkles class="text-primary h-4 w-4" />
					<span class="text-sm font-medium">AI-powered bug reporting</span>
				</div>
			</div>

			<h1 class="mb-6 text-4xl font-bold sm:text-6xl">
				Help users create
				<span class="text-primary">professional bug reports.</span>
			</h1>

			<p class="text-muted-foreground mx-auto mb-8 max-w-3xl text-lg sm:text-xl">
				Utilize AI to ensure that all bug reports are useful to developers and meet your guidelines. No more non-issues
				or endless back-and-forth.
			</p>

			<div class="flex flex-col justify-center gap-4 sm:flex-row">
				<Button size="lg" onclick={() => ($user ? goto("/dashboard") : goto("/login"))}>
					{$user ? "Open your dashboard" : "Get started for free"}
					<ArrowRight class="h-4 w-4" />
				</Button>
				<Button variant="outline" size="lg" href="/pricing">View pricing</Button>
			</div>
		</div>

		<!-- Bug report transformation demo -->
		<div class="mx-auto mt-20 grid max-w-5xl gap-8 rounded-3xl border p-6 shadow-xl md:grid-cols-9">
			<!-- Before -->
			<div class="flex flex-col items-center space-y-4 md:col-span-4">
				<span class="text-muted-foreground mr-auto px-2 text-sm font-medium">Before: Useless reports</span>
				{#each badReports as badReport}
					<Card class="w-full grow border-red-200 dark:border-red-800">
						<CardHeader>
							<CardTitle class="text-base">{badReport.title}</CardTitle>
						</CardHeader>
						<CardContent>
							<p class="text-muted-foreground mb-2 text-sm">{badReport.description}</p>
							<Badge class="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">
								Priority: {badReport.priority}
							</Badge>
						</CardContent>
					</Card>
				{/each}
			</div>

			<!-- Arrow -->
			<div class="flex items-center justify-center md:col-span-1">
				<div class="relative">
					<!-- Outer glow ring -->
					<div
						class="bg-primary/10 absolute inset-0 animate-ping rounded-full"
						style="animation-duration: 2.5s; animation-iteration-count: infinite;"
					></div>
					<!-- Arrow container -->
					<div
						class="bg-primary/10 border-primary/20 relative flex h-16 w-16 items-center justify-center rounded-full border backdrop-blur-sm md:h-20 md:w-20"
					>
						<!-- Mobile: Down arrow, Desktop: Right arrow -->
						<ArrowDown class="text-primary md:hidden" size={24} strokeWidth={2} />
						<ArrowRight class="text-primary hidden md:block" size={32} strokeWidth={2} />
					</div>
					<!-- Sparkle effects -->
					<div class="bg-primary/60 absolute -top-1 -right-1 h-2 w-2 animate-pulse rounded-full delay-300"></div>
					<div class="bg-primary/60 absolute -top-2 right-4 h-1 w-1 animate-pulse rounded-full delay-300"></div>
					<div class="bg-primary/40 absolute -bottom-1 -left-1 h-1 w-1 animate-pulse rounded-full delay-700"></div>
				</div>
			</div>

			<!-- After -->
			<div class="flex flex-col space-y-4 md:col-span-4">
				<span class="text-muted-foreground px-2 text-sm font-medium">After: Useful & concise reports</span>
				<Card class="grow border-green-200 dark:border-green-800">
					<CardHeader>
						<CardTitle class="text-base">{goodReport.title}</CardTitle>
					</CardHeader>
					<CardContent class="space-y-3">
						<p class="text-sm">{goodReport.description}</p>
						<div class="space-y-2 text-xs">
							<div>
								<span class="font-medium">Steps to reproduce:</span>
								<pre class="text-muted-foreground mt-1 whitespace-pre-wrap">{goodReport.stepsToReproduce}</pre>
							</div>
							<div>
								<span class="font-medium">Expected:</span>
								<span class="text-muted-foreground"> {goodReport.expectedResult}</span>
							</div>
							<div>
								<span class="font-medium">Observed:</span>
								<span class="text-muted-foreground"> {goodReport.observedResult}</span>
							</div>
						</div>
						<div class="flex items-center justify-between">
							<Badge class="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100">
								{goodReport.priority}
							</Badge>
							<span class="text-muted-foreground text-xs">{goodReport.browserInfo}</span>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	</div>
</section>

<!-- Features Section -->
<section class="bg-muted/50 py-24">
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<div class="mb-12 text-center">
			<h2 class="mb-4 text-3xl font-bold">
				Say goodbye to <Badge class="bg-foreground text-background text-2xl font-bold">need info</Badge>, <Badge
					class="bg-foreground text-background text-2xl font-bold">duplicate</Badge
				> and <Badge class="bg-foreground text-background text-2xl font-bold">can't repro</Badge>
			</h2>
		</div>

		<div class="grid gap-8 md:grid-cols-3">
			<Card class="group transition hover:shadow-lg">
				<CardHeader>
					<Zap class="text-primary mb-2 h-8 w-8" />
					<CardTitle class="group-hover:text-primary transition">AI-powered analysis</CardTitle>
					<CardDescription>
						Our AI automatically finds missing critical information and ensures reports follow best practices.
					</CardDescription>
				</CardHeader>
			</Card>

			<Card class="group transition hover:shadow-lg">
				<CardHeader>
					<Shield class="text-primary mb-2 h-8 w-8" />
					<CardTitle class="group-hover:text-primary transition">Prevent duplicates</CardTitle>
					<CardDescription>
						Smart duplicate detection shows similar issues before you submit, reducing noise and keeping your bug
						tracker clean.
					</CardDescription>
				</CardHeader>
			</Card>

			<Card class="group transition hover:shadow-lg">
				<CardHeader>
					<CloudCheck class="text-primary mb-2 h-8 w-8" />
					<CardTitle class="group-hover:text-primary transition">Sync with GitHub</CardTitle>
					<CardDescription>
						Seamlessly integrate with your existing workflow. Bugspot creates GitHub issues directly from enhanced bug
						reports.
					</CardDescription>
				</CardHeader>
			</Card>
		</div>
	</div>
</section>

<!-- Fun Errors Demo Section -->
<section class="py-24">
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<div class="mb-16 text-center">
			<h2 class="mb-4 text-3xl font-bold">
				When things go wrong... <span class="text-muted-foreground">let's make it right.</span>
			</h2>
			<p class="text-muted-foreground text-lg">
				See how Bugspot helps your customers create beautiful reports.
			</p>
		</div>

		<!-- Windows-style overlapping error showcase -->
		<div class="relative mx-auto mb-8 h-[500px] max-w-5xl">
			{#each errors as error, index}
				<div
					class="absolute w-80"
					style="{error.position} z-index: {10 + index};"
					transition:blur={{ delay: index * 300, duration: 800 }}
				>
					<Card class="border-2 shadow-lg {error.colorClass}">
						<CardHeader class="pb-2">
							<div class="flex items-center justify-between">
								<div class="flex items-center space-x-2">
									<div class="h-3 w-3 rounded-full bg-red-500"></div>
									<div class="h-3 w-3 rounded-full bg-yellow-500"></div>
									<div class="h-3 w-3 rounded-full bg-green-500"></div>
								</div>
								<div class="flex h-4 w-4 items-center justify-center border border-gray-400 text-xs">×</div>
							</div>
							<CardTitle class="font-mono text-sm">{error.title}</CardTitle>
						</CardHeader>
						<CardContent class="pt-0">
							<p class="text-muted-foreground mb-2 text-xs">{error.description}</p>
							<AlertTriangle class="text-muted-foreground h-3 w-3" />
						</CardContent>
					</Card>
				</div>
			{/each}
		</div>

		<!-- Simple report button -->
		<div class="text-center">
			<Button class="px-8 py-6" onclick={() => goto("/demo")}>Try the demo</Button>
		</div>
	</div>
</section>

<!-- CTA Section -->
<section class="bg-primary text-primary-foreground py-24">
	<div class="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
		<Bug class="mx-auto mb-8 h-16 w-16 opacity-80" />
		<h2 class="mb-4 text-3xl font-bold">
			You fix important bugs. <span class="opacity-80">We take care of the rest.</span>
		</h2>
		<p class="mx-auto mb-8 max-w-2xl text-xl opacity-90">
			Join a growing community of developers streamlining their bug management.
		</p>
		<div class="flex flex-col justify-center gap-4 sm:flex-row">
			<Button variant="secondary" size="lg" onclick={() => goto("/login")}>
				Start now
				<ArrowRight class="h-4 w-4" />
			</Button>
		</div>
	</div>
</section>
