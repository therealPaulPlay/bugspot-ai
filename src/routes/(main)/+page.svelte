<script>
	import { onMount } from "svelte";
	import { Button, buttonVariants } from "$lib/components/ui/button";
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "$lib/components/ui/card";
	import { Badge } from "$lib/components/ui/badge";
	import {
		ArrowRight,
		Bug,
		Zap,
		Shield,
		CloudCheck,
		ArrowDown,
		Video,
		MessageSquare,
		Dot,
		Palette,
		HelpCircle,
		XCircle,
		Link,
		CopyCheck,
	} from "lucide-svelte";
	import { goto } from "$app/navigation";
	import { user } from "$lib/stores/account";
	import * as Dialog from "$lib/components/ui/dialog";

	let scrollY = $state(0);
	let errorSection = $state(null);
	let demoIframeLoaded = $state(false);

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
			position: "top: 33%; right: 15%;",
		},
	];
</script>

<svelte:head>
	<title>Bugspot - Smart bug report forms powered by AI</title>
	<meta
		name="description"
		content="Help users create professional bug reports with AI and sync them with GitHub Issues. Reduce back-and-forth, avoid duplicates or spam & help developers debug efficiently."
	/>
</svelte:head>

<svelte:window bind:scrollY />

<!-- Hero section -->
<section class="relative overflow-hidden">
	<!-- Background gradient -->
	<div class="from-background/10 via-primary/5 to-primary/20 absolute inset-0 bg-gradient-to-b"></div>

	<div class="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
		<div class="text-center">
			<div class="mb-4 flex justify-center">
				<!-- Introduction video popup -->
				<Dialog.Root>
					<div class="text-center">
						<Dialog.Trigger
							class={buttonVariants({ variant: "ghost" }) + " bg-primary/10 text-foreground group rounded-full!"}
						>
							<Video class="text-primary h-4 w-4" />
							<span class="-mr-1 text-sm font-medium">Watch 2-minute introduction</span>
							<ArrowRight class="text-primary h-4 w-4 max-w-0 transition-all group-hover:max-w-4" />
						</Dialog.Trigger>
					</div>
					<Dialog.Content class="w-full max-w-3xl!">
						<Dialog.Header class="h-fit">
							<Dialog.Title>Introduction video</Dialog.Title>
						</Dialog.Header>
						<iframe
							class="h-100 w-full"
							src="https://www.youtube.com/embed/hm3npuRX3_s?si=PiTOWFyFO3bAUkJ2"
							title="YouTube video player"
							frameborder="0"
							allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
							referrerpolicy="strict-origin-when-cross-origin"
							allowfullscreen
						></iframe>
					</Dialog.Content>
				</Dialog.Root>
			</div>

			<h1 class="mb-6 text-4xl font-bold sm:text-6xl">
				<span class="text-primary">Super smart</span> bug report forms.
			</h1>

			<p class="text-muted-foreground mx-auto mb-8 max-w-xl text-lg">
				Our AI-powered forms guide users to create detailed & actionable bug reports. No more non-issues or endless
				back-and-forth.
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
		<div class="relative mx-auto mt-20 grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
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
							<p class="text-muted-foreground h-3/5 truncate text-sm">{report?.content}</p>
							<div class="mt-3 flex gap-2">
								<Badge variant="secondary" class="text-xs">no repro</Badge>
								<Badge variant="secondary" class="text-xs">missing info</Badge>
							</div>
						</CardContent>
					</Card>
				{/each}
			</div>

			<!-- After -->
			<Card
				class="bg-background dark:border-accent flex max-w-full flex-1 flex-col gap-4 overflow-hidden border-transparent shadow-xl"
			>
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

					<CardTitle class="text-primary mt-1 truncate text-base leading-tight"
						>Login button unresponsive on mobile Safari</CardTitle
					>

					<div class="text-muted-foreground mt-1 flex items-center text-xs">
						<span>@bugspot</span>
					</div>
				</CardHeader>
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
							<div class="text-nowrap">
								<span class="font-semibold">Expected:</span>
								<p class="text-muted-foreground truncate">Button remains clickable after validation errors.</p>
							</div>
							<div class="text-nowrap">
								<span class="font-semibold">Observed:</span>
								<p class="text-muted-foreground truncate">Button becomes unresponsive, requires page refresh.</p>
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

			<!-- Arrow indicator -->
			<div
				class="oveflow-hidden bg-background text-primary border-primary absolute top-[42%] left-1/2 z-20 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 transform items-center justify-center rounded-full border-2 shadow-xl lg:top-1/2"
			>
				<ArrowRight class="hidden h-8 w-8 lg:block" />
				<ArrowDown class="h-8 w-8 lg:hidden" />
			</div>
		</div>
	</div>
</section>

<!-- Features section -->
<section class="inset-shadow-xl py-24">
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<div class="mb-12 text-center">
			<h2 class="mb-4 text-3xl font-bold leading-12">
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
					<Link class="text-primary mb-2 h-8 w-8" />
					<CardTitle class="group-hover:text-primary transition">Set up in seconds</CardTitle>
					<CardDescription>
						Add our smart bug report form to your app with a simple iframe or direct link. No code required - just copy,
						paste, and you're ready.
					</CardDescription>
				</CardHeader>
			</Card>

			<Card class="group bg-accent/50 border-none shadow-none transition">
				<CardHeader>
					<CloudCheck class="text-primary mb-2 h-8 w-8" />
					<CardTitle class="group-hover:text-primary transition">Use with GitHub issues</CardTitle>
					<CardDescription
						>Bugspot automatically creates GitHub issues from AI-enhanced reports. It can also react & comment depending
						on the scenario.</CardDescription
					>
				</CardHeader>
			</Card>
		</div>
	</div>
</section>

<!-- Advanced features -->
<section class="pt-8 pb-24">
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<div class="space-y-20">
			<!-- Smart Follow-up Questions -->
			<div class="grid items-center gap-12 lg:grid-cols-2">
				<div>
					<h3 class="mb-4 text-2xl font-bold">Intelligent follow-up questions.</h3>
					<p class="text-muted-foreground text-lg leading-relaxed">
						When reports lack crucial details, AI automatically asks context-specific follow-up questions. Get the
						specific information you need to debug effectively.
					</p>
				</div>
				<div class="bg-muted/50 overflow-hidden rounded-2xl p-6">
					<!-- Question mockup -->
					<div class="bg-background -mb-13 rounded-xl p-4 pb-10 shadow-sm">
						<div class="mb-3 flex gap-2">
							<HelpCircle class="text-primary mt-0.5 h-4 w-4 flex-shrink-0" />
							<div class="text-sm">
								<p class="mb-2 font-medium">We need more information.</p>
								<div class="bg-muted/50 rounded-lg p-3 text-xs">
									<p>
										What browser are you using? Does this happen with other form fields or just the login field? Can you
										describe what happens when you try to click the button again?
									</p>
								</div>
							</div>
						</div>
						<textarea
							class="bg-muted/50 pointer-events-none w-full resize-none rounded-lg p-2 text-xs"
							rows="2"
							placeholder="Additional information..."
						></textarea>
					</div>
				</div>
			</div>

			<!-- Customization feature -->
			<div class="grid items-center gap-12 lg:grid-cols-2">
				<div>
					<h3 class="mb-4 text-2xl font-bold">Complete customization.</h3>
					<p class="text-muted-foreground text-lg leading-relaxed">
						Tailor forms to your exact needs. Set custom prompts for AI behavior, select which pieces of information you
						need and customize colors to match your brand.
					</p>
				</div>
				<div class="bg-muted/50 rounded-2xl p-6">
					<!-- Customization mockup -->
					<div class="bg-background rounded-xl p-4 shadow-sm">
						<div class="mb-4 flex items-center gap-2">
							<Palette class="text-primary h-4 w-4" />
							<span class="text-sm font-medium">Form config</span>
						</div>
						<div class="space-y-3">
							<div class="flex items-center justify-between">
								<span class="text-sm">Require video recording</span>
								<div class="bg-primary relative h-5 w-9 rounded-full">
									<div class="absolute top-0.5 right-0.5 h-4 w-4 rounded-full bg-white"></div>
								</div>
							</div>
							<div class="flex items-center justify-between">
								<span class="text-sm">Custom prompt</span>
								<Badge variant="secondary" class="text-xs">Active</Badge>
							</div>
							<div class="flex items-center justify-between">
								<span class="text-sm">Color scheme</span>
								<div class="flex gap-1">
									<div class="bg-primary h-4 w-4 rounded-full"></div>
									<div class="bg-primary/50 h-4 w-4 rounded-full"></div>
									<div class="bg-primary/25 h-4 w-4 rounded-full"></div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Automatic closing -->
			<div class="grid items-center gap-12 lg:grid-cols-2">
				<div>
					<h3 class="mb-4 text-2xl font-bold">Automatic filtering.</h3>
					<p class="text-muted-foreground text-lg leading-relaxed">
						AI identifies and automatically closes spam, feedback requests, and user environment issues. Only genuine
						bugs reach your issue tracker, saving hours of manual triage.
					</p>
				</div>
				<div class="bg-muted/50 flex items-center gap-3 overflow-hidden rounded-2xl p-6">
					<!-- Auto-close mockup -->
					<div class="bg-background flex items-center justify-center rounded-full p-2 shadow-sm">
						<XCircle strokeWidth={1.5} class="text-primary h-6 w-6" />
					</div>
					<div class="bg-background -mr-30 rounded-xl p-4 shadow-sm">
						<div class="flex gap-2">
							<p class="mb-2 text-sm font-medium">Report not submitted.</p>
						</div>
						<div class="bg-muted/50 w-full rounded-lg mask-r-from-30% p-3 text-xs">
							<p>
								This appears to be an issue related to your internet connection. Specifically, your VPN is likely
								causing the WebSocket instability. Please try testing without it and file another report if needed.
							</p>
						</div>
					</div>
				</div>
			</div>

			<!-- Duplicate management -->
			<div class="grid items-center gap-12 lg:grid-cols-2">
				<div>
					<h3 class="mb-4 text-2xl font-bold">Smart duplicate handling.</h3>
					<p class="text-muted-foreground text-lg leading-relaxed">
						Before creating new issues, users may see similar existing reports. If they confirm it's the same bug, their
						additional information gets added to the original issue.
					</p>
				</div>
				<div class="bg-muted/50 rounded-2xl p-6">
					<!-- Duplicate mockup -->
					<div class="bg-background rounded-xl p-4 shadow-sm">
						<div class="flex gap-2">
							<CopyCheck class="text-primary mt-0.5 h-4 w-4" />
							<p class="mb-2 text-sm font-medium">We found similar reports.</p>
						</div>
						<div class="bg-muted/50 rounded-lg p-3">
							<p class="mb-1 text-xs font-medium">Login button freezes on mobile</p>
							<p class="text-muted-foreground text-xs">Button becomes unresponsive after validation error...</p>
							<div class="mt-4 flex gap-2 flex-wrap">
								<Button variant="outline" class="pointer-events-none h-8 text-xs">This is my bug</Button>
								<Button variant="outline" class="text-muted-foreground pointer-events-none h-8 text-xs">No, skip</Button
								>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Integrations -->
			<div class="grid items-center gap-12 lg:grid-cols-2">
				<div>
					<h3 class="mb-4 text-2xl font-bold">Team integrations.</h3>
					<p class="text-muted-foreground text-lg leading-relaxed">
						Keep your team informed with Discord notifications for new bug reports. More integrations coming soon.
					</p>
				</div>
				<div class="bg-muted/50 overflow-hidden rounded-2xl p-6">
					<!-- Integration mockup -->
					<div class="bg-background -mt-15 space-y-4 rounded-xl p-4 shadow-sm">
						<div class="bg-muted/50 h-12 rounded-lg mask-t-from-0% p-3"></div>
						<div class="bg-muted/50 rounded-lg p-3">
							<div class="flex gap-2">
								<div class="bg-primary mt-2 h-2 w-2 rounded-full"></div>
								<div class="text-xs">
									<p class="font-medium">New bug report #47</p>
									<p class="text-muted-foreground">Login button unresponsive on mobile</p>
									<p class="text-muted-foreground mt-1">Priority: P1</p>
								</div>
							</div>
						</div>
						<div class="text-muted-foreground mt-3 flex items-center justify-end gap-2 text-xs">
							<span>#bug-reports</span>
							<span>•</span>
							<span>2 min ago</span>
						</div>
					</div>
				</div>
			</div>

			<!-- Priority assessment -->
			<div class="grid items-center gap-12 lg:grid-cols-2">
				<div>
					<h3 class="mb-4 text-2xl font-bold">Priority evaluation.</h3>
					<p class="text-muted-foreground text-lg leading-relaxed">
						Reports are instantly scored P1 to P4 based on the severity and impact. Focus on what's most important.
					</p>
				</div>
				<div class="bg-muted/50 flex justify-center overflow-hidden rounded-2xl p-6">
					<div
						class="bg-background bg-background -mb-12 flex h-fit w-fit items-center justify-center gap-4 overflow-hidden rounded-xl p-4 pb-10 shadow-sm"
					>
						<p class="text-muted-foreground text-sm">Priority:</p>
						<div class="flex h-15 items-center justify-center gap-2">
							<Badge variant="secondary" class="bg-muted">P1</Badge>
							<Badge variant="secondary" class="bg-muted">P2</Badge>
							<div class="relative">
								<div class="from-primary/50 to-bg absolute z-0 -mt-8.5 h-9 w-8.25 bg-gradient-to-b"></div>
								<Badge class="text-background">P3</Badge>
							</div>
							<Badge variant="secondary" class="bg-muted">P4</Badge>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- Fun errors demo section -->
<section class="bg-muted/50 py-24" bind:this={errorSection}>
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<div class="mb-8 text-center">
			<h2 class="mb-4 text-3xl font-bold">
				When things go wrong, <span class="text-muted-foreground">let's make it right.</span>
			</h2>
			<p class="text-muted-foreground text-lg">See how Bugspot helps your users create beautiful bug reports.</p>
		</div>

		<!-- Overlapping error showcase -->
		<div
			class="relative mx-auto mb-12 h-[300px] max-w-5xl overflow-hidden mask-y-from-95% mask-y-to-100% mask-x-from-80% mask-x-to-100% sm:h-[375px]"
		>
			{#each errors as error, index}
				{@const sectionTop = errorSection?.offsetTop || 0}
				{@const relativeScroll = Math.min(750, Math.max(0, scrollY - sectionTop + 1000))}
				<div
					class="absolute w-60 sm:w-80"
					style="{error.position} z-index: {10 + index}; transform: translateY({relativeScroll *
						(0.01 + (index + 1) * 0.01)}px);"
				>
					<Card class="bg-background shadow-lg max-sm:max-h-35">
						<CardHeader class="pb-1">
							<div class="mb-1 flex items-center justify-between">
								<div class="flex items-center space-x-2">
									<div class="h-3 w-3 rounded-full bg-red-500"></div>
									<div class="h-3 w-3 rounded-full bg-yellow-500"></div>
									<div class="h-3 w-3 rounded-full bg-green-500"></div>
								</div>
							</div>
							<CardTitle class="font-mono text-xs sm:text-sm">{error.title}</CardTitle>
						</CardHeader>
						<CardContent class="pt-0">
							<p class="text-muted-foreground mb-2 text-xs">{error.description}</p>
						</CardContent>
					</Card>
				</div>
			{/each}
		</div>

		<!-- Simple report button -->
		<Dialog.Root onOpenChange={() => (demoIframeLoaded = false)}>
			<div class="text-center">
				<Dialog.Trigger class={buttonVariants({ size: "lg" })}>Try the demo</Dialog.Trigger>
			</div>
			<Dialog.Content class="max-w-5xl!">
				<Dialog.Header>
					<Dialog.Title>Demo</Dialog.Title>
				</Dialog.Header>
				<div class="relative">
					{#if !demoIframeLoaded}
						<div class="bg-muted absolute inset-0 flex animate-pulse items-center justify-center rounded"></div>
					{/if}
					<iframe
						class="bg-muted/50 h-[50dvh] min-h-120 w-full rounded transition duration-300"
						style:opacity={!demoIframeLoaded ? "0" : "1"}
						src="/form/demo"
						title="Demo iframe"
						onload={() => (demoIframeLoaded = true)}
					>
					</iframe>
				</div>
			</Dialog.Content>
		</Dialog.Root>
	</div>
</section>

<!-- CTA Section -->
<section class="mx-8 my-16">
	<div class="bg-primary text-primary-foreground mx-auto max-w-7xl rounded-3xl px-8 py-12 text-center shadow-xl">
		<Bug class="mx-auto mb-8 h-16 w-16 opacity-80" />
		<h2 class="mb-4 text-3xl font-bold">
			You debug faster. <span class="opacity-80">We clear the clutter.</span>
		</h2>
		<p class="mx-auto mb-8 max-w-xl text-lg opacity-90">
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
		margin-left: -100px;
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
