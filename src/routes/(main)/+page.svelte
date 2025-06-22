<script>
	import { onMount } from "svelte";
	import { Button } from "$lib/components/ui/button";
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "$lib/components/ui/card";
	import { Badge } from "$lib/components/ui/badge";
	import { ArrowRight, Bug, Zap, Shield, CloudCheck, ArrowDown, Video, MessageSquare, Dot } from "lucide-svelte";
	import { goto } from "$app/navigation";
	import { user } from "$lib/stores/account";

	let scrollY = $state(0);
	let errorSection = $state(null);

	const messyReports = [
		{
			title: "help!!!",
			author: "user123",
			content: "it is broken when i click it doesnt work plz fix (I'm on arch btw)",
			timestamp: "2 min ago",
		},
		{},
		{},
		{},
	];

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
	<div class="from-background/10 via-primary/5 to-primary/20 absolute inset-0 bg-gradient-to-b"></div>

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
				<span class="text-primary">perfect bug reports.</span>
			</h1>

			<p class="text-muted-foreground mx-auto mb-8 max-w-3xl sm:text-lg">
				Our AI-powered forms guide users to create detailed, actionable bug reports that meet your guidelines. No more
				non-issues or endless back-and-forth.
			</p>

			<div class="flex flex-col justify-center gap-4 sm:flex-row">
				<Button
					size="lg"
					onclick={() => ($user ? goto("/dashboard") : goto("/login"))}
					class="glint relative overflow-hidden"
				>
					{$user ? "Open your dashboard" : "Get started for free"}
					<ArrowRight class="h-4 w-4" />
				</Button>
				<Button
					variant="outline"
					size="lg"
					onclick={() => {
						errorSection?.scrollIntoView({ block: "center", behavior: "smooth" });
					}}>View demo</Button
				>
			</div>
		</div>

		<!-- Bug report transformation -->
		<div class="relative mx-auto mt-20 max-w-6xl">
			<div class="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
				<!-- Before -->
				<div class="relative h-[340px]">
					{#each messyReports as report, index}
						<Card
							class="bg-background dark:border-accent absolute h-45 w-full gap-2 border-transparent shadow-lg"
							style="
									top: {index * 25}px;
									left: {index * 8}px;
									z-index: {messyReports.length - index};
									transform: rotate({(index - 1) * 1.5}deg);
									opacity: {100 - index * 20}%;
								"
						>
							<CardHeader class="pb-3">
								<div class="text-muted-foreground flex items-center justify-between text-xs">
									<span>@{report?.author}</span>
									<span>{report?.timestamp}</span>
								</div>
								<CardTitle class="text-base">{report?.title}</CardTitle>
							</CardHeader>
							<CardContent>
								<p class="text-muted-foreground h-3/5 text-sm">{report?.content}</p>
								<div class="mt-3 flex gap-2">
									<Badge variant="secondary" class="text-xs">no repro</Badge>
									<Badge variant="secondary" class="text-xs">missing info</Badge>
								</div>
							</CardContent>
						</Card>
					{/each}
				</div>

				<!-- After -->

				<Card class="bg-background dark:border-accent flex flex-1 flex-col gap-4 border-transparent shadow-xl">
					<CardHeader class="border-b">
						<div class="flex items-start justify-between">
							<div class="flex items-center gap-2">
								<div class="border-primary flex h-5 w-5 items-center justify-center rounded-full border-2">
									<Dot class="text-primary h-3 w-3 fill-current" />
								</div>
								<span class="text-primary text-sm font-medium">#16</span>
							</div>
							<Badge class="bg-primary text-xs text-white">Open</Badge>
						</div>

						<CardTitle class="text-primary mt-1 text-base leading-tight"
							>Login button unresponsive on mobile Safari</CardTitle
						>

						<div class="text-muted-foreground mt-1 flex items-center text-xs">
							<span>@bugspot</span>
						</div>
					</CardHeader>

					<!-- GitHub Issue Content -->
					<CardContent class="flex flex-1 flex-col">
						<div class="flex-1 space-y-3 text-sm">
							<div>
								<h4 class="mb-1 font-semibold">Steps to reproduce</h4>
								<div class="text-muted-foreground space-y-0.5 text-sm">
									<div>1. Visit the /login page</div>
									<div>2. Click login without filling form</div>
								</div>
							</div>

							<div>
								<div>
									<span class="font-semibold">Expected:</span>
									<span class="text-muted-foreground"> Button remains clickable after validation errors.</span>
								</div>
								<div>
									<span class="font-semibold">Observed:</span>
									<span class="text-muted-foreground"> Button becomes unresponsive, requires page refresh.</span>
								</div>
							</div>
						</div>

						<div class="text-muted-foreground mt-3 flex items-center justify-between gap-4 border-t pt-3 text-xs">
							<div class="flex gap-4">
								<span class="flex items-center gap-1">
									<MessageSquare class="h-3 w-3" /> 3
								</span>
								<Badge variant="secondary" class="text-xs">P1 - high</Badge>
							</div>
							<div>
								<p class="text-muted-foreground text-xs">Safari 17.1, iOS 17.1.1</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			<!-- Arrow indicator -->
			<div
				class="oveflow-hidden bg-background text-primary border-primary absolute top-3/7 left-1/2 z-20 flex justify-center items-center h-20 w-20 -translate-x-1/2 -translate-y-1/2 transform rounded-full border-2 shadow-xl lg:top-1/2"
			>
				<ArrowRight class="hidden h-8 w-8 lg:block" />
				<ArrowDown class="h-8 w-8 lg:hidden" />
			</div>
		</div>
	</div>
</section>

<!-- Features Section -->
<section class="inset-shadow-xl py-24">
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<div class="mb-12 text-center">
			<h2 class="mb-4 text-3xl font-bold">
				Say goodbye to <span class="mr-1 text-nowrap"
					><Badge variant="secondary" class="text-3xl font-bold">need info</Badge>,</span
				>
				<Badge variant="secondary" class="text-3xl font-bold">duplicate</Badge> and
				<span class="text-nowrap"><Badge variant="secondary" class="text-3xl font-bold">can't repro</Badge>.</span>
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
				>
					<Card class="bg-background shadow-lg">
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
			You debug faster. <span class="opacity-80">We clear the clutter.</span>
		</h2>
		<p class="mx-auto mb-8 max-w-xl text-xl opacity-90">
			Join a growing community of developers streamlining their bug report management.
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
	:global(.glint::before) {
		animation: 4s fade-glint 2s infinite;
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

	@keyframes fade-glint {
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
