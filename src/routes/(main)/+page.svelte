<script>
	import { onMount } from "svelte";
	import { Button, buttonVariants } from "$lib/components/ui/button";
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "$lib/components/ui/card";
	import { Badge } from "$lib/components/ui/badge";
	import {
		ArrowRight,
		Video,
		Palette,
		HelpCircle,
		XCircle,
		Link,
		CopyCheck,
		NotebookPen,
		CornerLeftDown,
		Github,
	} from "lucide-svelte";
	import { goto } from "$app/navigation";
	import { user } from "$lib/stores/account";
	import * as Dialog from "$lib/components/ui/dialog";

	let scrollY = $state(0);
	let errorSection = $state(null);
	let demoIframeLoaded = $state(false);
	let videoDialogOpen = $state(false);

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
	<title>Bugspot - Bug report forms powered by AI</title>
	<meta
		name="description"
		content="Help your users submit clear, actionable bug reports with AI-powered forms. Integrate with GitHub Issues to reduce back-and-forth, avoid duplicates, and debug faster."
	/>
</svelte:head>

<svelte:window bind:scrollY />

<!-- Hero section -->
<section class="relative overflow-hidden">
	<!-- Background gradient -->
	<div class="from-background to-muted/50 absolute inset-0 bg-gradient-to-b"></div>

	<div class="relative mx-auto max-w-7xl px-4 py-26 sm:px-6 sm:py-32 lg:px-8">
		<div class="text-center">
			<h1 class="mb-8 text-4xl font-bold sm:text-6xl">
				<span class="text-primary">Intelligent</span> bug report forms
			</h1>

			<p class="text-muted-foreground mx-auto mb-8 max-w-xl text-lg">
				AI-powered forms figure out <span class="bg-primary/5 rounded-full px-1">can't repro</span> and
				<span class="bg-primary/5 rounded-full px-1.5">need info</span> for you, allowing you to focus on fixing issues instead.
			</p>

			<Button
				size="lg"
				onclick={() => ($user ? goto("/dashboard") : goto("/login"))}
				class="glint relative overflow-hidden"
			>
				{$user ? "Open your dashboard" : "Get started for free"}
				<ArrowRight class="h-4 w-4" />
			</Button>
		</div>

		<!-- Live demo -->
		<div class="mx-auto mt-20 mb-8 flex flex-col items-end justify-center gap-4">
			<p class="text-muted-foreground mr-8 inline-flex gap-2"><CornerLeftDown class="mt-2 h-4 w-4" />Try the demo</p>
			<div class="padding-4 relative w-full overflow-hidden rounded-3xl shadow-lg">
				{@render demo()}
			</div>
		</div>
	</div>
</section>

{#snippet demo(inPopup = false)}
	<div class="relative">
		{#if !demoIframeLoaded}
			<div class="bg-background absolute inset-0 flex animate-pulse items-center justify-center"></div>
		{/if}
		<iframe
			class="bg-muted/50 h-85 min-h-120 w-full transition duration-300 md:h-145 lg:h-165"
			style:opacity={!demoIframeLoaded ? "0" : "1"}
			class:h-[50dvh]={inPopup}
			src="/form/demo"
			title="Demo iframe"
			onload={() => (demoIframeLoaded = true)}
		>
		</iframe>
	</div>
{/snippet}

<!-- Features section -->
<section class="py-24">
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<div class="grid gap-8 md:grid-cols-3">
			<Card class="bg-accent/50 border-none shadow-none transition hover:brightness-95">
				<CardHeader>
					<NotebookPen class="text-primary mb-2 h-8 w-8" strokeWidth={1.75} />
					<CardTitle>Custom prompts</CardTitle>
					<CardDescription>
						Custom prompts allow you to modify how the AI guides the user through the submission process.
					</CardDescription>
				</CardHeader>
			</Card>

			<Card class="bg-accent/50 border-none shadow-none transition hover:brightness-95">
				<CardHeader>
					<Link class="text-primary mb-2 h-8 w-8" strokeWidth={1.75} />
					<CardTitle>Easy no-code setup</CardTitle>
					<CardDescription>
						Add the bug report form to your app with a simple iframe or direct link. No code required.
					</CardDescription>
				</CardHeader>
			</Card>

			<Card class="bg-accent/50 border-none shadow-none transition hover:brightness-95">
				<CardHeader>
					<Github class="text-primary mb-2 h-8 w-8" strokeWidth={1.75} />
					<CardTitle>Use with GitHub issues</CardTitle>
					<CardDescription>Bugspot automatically creates GitHub issues, reactions and comments.</CardDescription>
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
					<h3 class="mb-4 text-2xl font-bold">Intelligent follow-up questions</h3>
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

			<!-- Duplicate management -->
			<div class="grid items-center gap-12 lg:grid-cols-2">
				<div>
					<h3 class="mb-4 text-2xl font-bold">Smart duplicate handling</h3>
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
							<div class="mt-4 flex flex-wrap gap-2">
								<Button variant="outline" class="pointer-events-none h-8 text-xs">This is my bug</Button>
								<Button variant="outline" class="text-muted-foreground pointer-events-none h-8 text-xs">No, skip</Button
								>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Automatic closing -->
			<div class="grid items-center gap-12 lg:grid-cols-2">
				<div>
					<h3 class="mb-4 text-2xl font-bold">Automatic filtering</h3>
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

			<!-- Customization feature -->
			<div class="grid items-center gap-12 lg:grid-cols-2">
				<div>
					<h3 class="mb-4 text-2xl font-bold">Complete customization</h3>
					<p class="text-muted-foreground text-lg leading-relaxed">
						Tailor forms to your exact needs. Select which pieces of information you need and customize colors to match
						your brand.
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

			<!-- Integrations -->
			<div class="grid items-center gap-12 lg:grid-cols-2">
				<div>
					<h3 class="mb-4 text-2xl font-bold">Team integrations</h3>
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
					<h3 class="mb-4 text-2xl font-bold">Priority evaluation</h3>
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
			<h2 class="mb-4 text-3xl font-bold">See the difference our forms make</h2>
			<p class="text-muted-foreground text-lg">Watch how Bugspot simplifies creating beautiful bug reports.</p>
		</div>

		<!-- Overlapping error showcase -->
		<div
			class="relative mx-auto mb-12 h-[250px] max-w-5xl overflow-hidden mask-y-from-95% mask-y-to-100% mask-x-from-80% mask-x-to-100% sm:h-[375px]"
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
						<CardHeader class="pb-1">
							<div class="mb-1 flex items-center justify-between">
								<div class="flex items-center space-x-2">
									<div class="h-3 w-3 rounded-full bg-gray-800 dark:invert"></div>
									<div class="h-3 w-3 rounded-full bg-gray-500 dark:invert"></div>
									<div class="h-3 w-3 rounded-full bg-gray-300 dark:invert"></div>
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

		<!-- Demo dialog -->
		<Dialog.Root>
			<div class="text-center">
				<Dialog.Trigger class={buttonVariants({ size: "lg" })}>Try the demo</Dialog.Trigger>
			</div>
			<Dialog.Content class="max-w-5xl!">
				<Dialog.Header>
					<Dialog.Title>Demo</Dialog.Title>
				</Dialog.Header>
				{@render demo(true)}
			</Dialog.Content>
		</Dialog.Root>
	</div>
</section>

<!-- CTA Section -->
<section class="mx-8 my-16">
	<div class="bg-primary text-primary-foreground mx-auto max-w-7xl rounded-3xl px-8 py-12 text-center shadow-xl">
		<img src="/images/bugspot-icon.png" alt="icon" class="mx-auto mb-4 h-24 w-24 not-dark:invert" />
		<h2 class="mb-4 text-3xl font-bold">
			You debug faster, <span class="opacity-80">we clear the clutter</span>
		</h2>
		<p class="mx-auto mb-8 max-w-lg text-lg opacity-90">
			Join a growing community of developers building with exceptional bug reports.
		</p>
		<div class="flex flex-col justify-center gap-4 sm:flex-row">
			<Button variant="secondary" size="lg" onclick={() => goto("/login")}>
				Start now
				<ArrowRight class="h-4 w-4" />
			</Button>
			<Button variant="secondary" class="bg-muted/50" size="lg" onclick={() => (videoDialogOpen = true)}
				><Video />Introduction</Button
			>
		</div>
	</div>
</section>

<!-- Intro video popup -->
<Dialog.Root bind:open={videoDialogOpen}>
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

<style>
	:global(.glint::before) {
		animation: 4s fade-glint 2s infinite;
		background: var(--background);
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
