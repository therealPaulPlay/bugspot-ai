<script>
	import { onMount } from "svelte";
	import { Button } from "$lib/components/ui/button";
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "$lib/components/ui/card";
	import { Badge } from "$lib/components/ui/badge";
	import { ArrowRight, Bug, Sparkles, Zap, Shield, CloudCheck, ArrowDown, Video } from "lucide-svelte";
	import { goto } from "$app/navigation";
	import { user } from "$lib/stores/account";

	let scrollY = $state(0);
	let errorSection = $state(null);

	// Animation for bug report transformation
	const badReports = [
		{
			title: "button doesn't function",
			description: "weird error shows when I click it. I'm using Arch btw.",
			priority: "my priority",
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
			position: "top: 2%; left: 15%;",
		},
		{
			title: "DuplicateIssueException",
			description: "Same bug reported 47 times with different titles.",
			position: "top: 15%; right: 20%;",
		},
		{
			title: "MissingStepsError",
			description: "Cannot reproduce issue. Steps: 'just click stuff until it breaks'.",
			position: "top: 37%; left: 10%;",
		},
		{
			title: "VagueDescriptionWarning",
			description: "'Something is wrong' detected. Unable to parse actual problem.",
			position: "top: 5%; right: 10%;",
		},
		{
			title: "PriorityOverflowError",
			description: "Everything marked as 'URGENT!!!'. Priority system crashed.",
			position: "top: 40%; left: 25%;",
		},
		{
			title: "ScreenshotNotFoundException",
			description: "Visual evidence missing. Developers using telepathy.",
			position: "top: 30%; right: 15%;",
		},
	];
</script>

<svelte:head>
	<title>Bugspot - AI-assisted bug report forms</title>
	<meta
		name="description"
		content="Help users create professional bug reports with AI and sync them directly with Github. Reduce back-and-forth communication, avoid duplicates & help developers debug effectively."
	/>
</svelte:head>

<svelte:window bind:scrollY />

<!-- Hero Section -->
<section class="relative overflow-hidden">
	<!-- Background gradient -->
	<div class="from-background/10 via-primary/10 to-primary/30 absolute inset-0 bg-gradient-to-b"></div>

	<div class="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
		<div class="text-center">
			<div class="mb-4 flex justify-center">
				<Button variant="ghost" class="bg-primary/10 text-foreground group rounded-full">
					<Video class="text-primary h-4 w-4" />
					<span class="-mr-1 text-sm font-medium">Watch 1-minute introduction</span>
					<ArrowRight class="text-primary h-4 w-4 max-w-0 transition-all group-hover:max-w-4" />
				</Button>
			</div>

			<h1 class="mb-6 text-4xl font-bold sm:text-6xl">
				Help users create
				<span class="text-primary">pefect bug reports.</span>
			</h1>

			<p class="text-muted-foreground mx-auto mb-8 max-w-3xl text-lg sm:text-xl">
				Our AI-powered bug report forms ensure that all reports are useful to developers and meet your guidelines. No
				more non-issues or endless back-and-forth.
			</p>

			<div class="flex flex-col justify-center gap-4 sm:flex-row">
				<Button
					size="lg"
					onclick={() => ($user ? goto("/dashboard") : goto("/login"))}
					class="action-button relative overflow-hidden"
				>
					{$user ? "Open your dashboard" : "Get started for free"}
					<ArrowRight class="h-4 w-4" />
				</Button>
				<Button
					variant="outline"
					size="lg"
					onclick={() => {
						errorSection.scrollIntoView({ block: "center", behavior: "smooth" });
					}}>View demo</Button
				>
			</div>
		</div>

		<!-- Bug report transformation -->
		<div class="mx-auto mt-20 grid max-w-5xl gap-8 md:grid-cols-9">
			<!-- Before -->
			<div class="flex flex-col items-center space-y-4 md:col-span-4">
				{#each badReports as badReport}
					<Card class="w-full grow rounded-3xl border-none shadow-lg bg-background">
						<CardHeader>
							<CardTitle class="text-base">{badReport.title}</CardTitle>
						</CardHeader>
						<CardContent>
							<p class="text-muted-foreground mb-2 text-sm">{badReport.description}</p>
							<Badge class="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100">
								{badReport.priority}
							</Badge>
						</CardContent>
					</Card>
				{/each}
			</div>

			<!-- Arrow -->
			<div class="flex items-center justify-center md:col-span-1">
				<div
					class="bg-background relative flex h-16 w-16 items-center justify-center rounded-full border border-none shadow-lg backdrop-blur-sm md:h-20 md:w-20"
				>
					<!-- Mobile: Down arrow, Desktop: Right arrow -->
					<ArrowDown class="text-primary md:hidden" size={24} strokeWidth={2} />
					<ArrowRight class="text-primary hidden md:block" size={32} strokeWidth={2} />
				</div>
			</div>

			<!-- After -->
			<div class="flex flex-col space-y-4 md:col-span-4">
				<Card class="relative grow overflow-hidden rounded-3xl border-none shadow-lg bg-background">
					<CardHeader>
						<CardTitle class="text-base">{goodReport.title}</CardTitle>
					</CardHeader>
					<CardContent class="flex h-full flex-col gap-3">
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
						<div class="mt-auto flex items-center justify-between">
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
<section class="inset-shadow-xl py-24">
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<div class="mb-12 text-center">
			<h2 class="mb-4 text-3xl font-bold">
				Say goodbye to <Badge variant="secondary" class="text-3xl font-bold">need info</Badge>, <Badge
					variant="secondary"
					class="text-3xl font-bold">duplicate</Badge
				> and <Badge variant="secondary" class="text-3xl font-bold">can't repro</Badge>.
			</h2>
		</div>

		<div class="grid gap-8 md:grid-cols-3">
			<Card class="group bg-accent/50 border-none shadow-none transition">
				<CardHeader>
					<Zap class="text-primary mb-2 h-8 w-8" />
					<CardTitle class="group-hover:text-primary transition">Customizable AI-assistance</CardTitle>
					<CardDescription>
						AI guides the user through the submission process and ensures the information you need was provided. Custom
						prompts are supported.
					</CardDescription>
				</CardHeader>
			</Card>

			<Card class="group bg-accent/50 border-none shadow-none transition">
				<CardHeader>
					<Shield class="text-primary mb-2 h-8 w-8" />
					<CardTitle class="group-hover:text-primary transition">Prevent duplicates</CardTitle>
					<CardDescription>
						Smart duplicate detection suggests similar issues before the user submits, reducing noise and keeping your
						bug tracker clean.
					</CardDescription>
				</CardHeader>
			</Card>

			<Card class="group bg-accent/50 border-none shadow-none transition">
				<CardHeader>
					<CloudCheck class="text-primary mb-2 h-8 w-8" />
					<CardTitle class="group-hover:text-primary transition">Add to GitHub issues</CardTitle>
					<CardDescription>
						Seamlessly integrate with your existing workflow. Bugspot creates GitHub issues directly from AI-enhanced
						report forms.
					</CardDescription>
				</CardHeader>
			</Card>
		</div>
	</div>
</section>

<!-- Fun Errors Demo Section -->
<section class="bg-muted/50 py-24" bind:this={errorSection}>
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<div class="mb-8 text-center">
			<h2 class="text-3xl font-bold">
				When things go wrong... <span class="text-muted-foreground">let's make it right.</span>
			</h2>
			<p class="text-muted-foreground text-lg">See how Bugspot helps your customers create beautiful reports.</p>
		</div>

		<!-- Windows-style overlapping error showcase -->
		<div
			class="relative mx-auto mb-12 h-[400px] max-w-5xl overflow-hidden mask-y-from-95% mask-y-to-100% mask-x-from-80% mask-x-to-100%"
		>
			{#each errors as error, index}
				{@const sectionTop = errorSection?.offsetTop || 0}
				{@const relativeScroll = Math.min(750, Math.max(0, scrollY - sectionTop + 1000))}
				<div
					class="absolute w-80"
					style="{error.position} z-index: {10 + index}; transform: translateY({relativeScroll *
						(0.01 + (index + 1) * 0.01)}px);"
					transition:blur={{ delay: index * 300, duration: 800 }}
				>
					<Card class="shadow-lg bg-background">
						<CardHeader class="pb-2">
							<div class="flex items-center justify-between">
								<div class="flex items-center space-x-2">
									<div class="h-3 w-3 rounded-full bg-red-500"></div>
									<div class="h-3 w-3 rounded-full bg-yellow-500"></div>
									<div class="h-3 w-3 rounded-full bg-green-500"></div>
								</div>
								<div class="flex h-4 w-4 items-center justify-center rounded border border-gray-400 px-1 text-xs">
									×
								</div>
							</div>
							<CardTitle class="font-mono text-sm">{error.title}</CardTitle>
						</CardHeader>
						<CardContent class="pt-0">
							<p class="text-muted-foreground mb-2 text-xs">{error.description}</p>
						</CardContent>
					</Card>
				</div>
			{/each}
		</div>

		<!-- Simple report button -->
		<div class="text-center">
			<Button size="lg" onclick={() => goto("/demo")}>Try the demo</Button>
		</div>
	</div>
</section>

<!-- CTA Section -->
<section class="mx-8 my-16">
	<div class="bg-primary text-primary-foreground mx-auto max-w-7xl rounded-3xl px-8 py-12 text-center shadow-xl">
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

<style>
	:global(.action-button::before) {
		animation: 4s card-glint 2s infinite;
		background: white;
		filter: blur(30px);
		content: "";
		position: absolute;
		width: 30px;
		z-index: 1;
		height: 200%;
		top: -20px;
		left: 0;
		transform: rotate(30deg);
		pointer-events: none;
		margin-left: -50px;
	}

	@keyframes card-glint {
		0% {
			margin-left: -100px;
			visibility: visible;
		}

		60% {
			margin-left: calc(100% + 50px);
		}

		100% {
			margin-left: calc(100% + 50px);
		}
	}
</style>
