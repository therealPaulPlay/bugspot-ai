<script>
	import { ArrowLeft, ArrowRight, Info, Plus, Minus, Upload, Mail } from "lucide-svelte";
	import Button from "./ui/button/button.svelte";
	import { fade, fly } from "svelte/transition";
	import { page } from "$app/state";
	import Input from "./ui/input/input.svelte";
	import Textarea from "./ui/textarea/textarea.svelte";
	import Badge from "./ui/badge/badge.svelte";
	import { onMount, tick } from "svelte";
	import { replaceState } from "$app/navigation";
	import init from "overfade";

	let { formConfig = {}, primaryColor = "black" } = $props();

	let slides = [
		"start",
		"title",
		"description",
		"expected result",
		"observed result",
		"steps",
		"screenshot",
		"video",
		"email",
	];

	let currentSlideIndex = $state(0);
	let slide = $derived(slides[currentSlideIndex]);

	function nextSlide() {
		if (currentSlideIndex < slides.length - 1) currentSlideIndex++;
	}

	function prevSlide() {
		if (currentSlideIndex > 0) currentSlideIndex--;
	}

	// History URL management -----------------------------------------------------------
	onMount(() => {
		init(); // Overfade
		const slideIndex = page.url.searchParams.get("slide");
		if (slideIndex) currentSlideIndex = parseInt(slideIndex);
	});

	$effect(() => {
		const params = new URLSearchParams(window.location.search);
		if (currentSlideIndex) params.set("slide", currentSlideIndex);
		else params.delete("slide");
		const newUrl = params.toString() ? `${window.location.pathname}?${params}` : window.location.pathname;
		window.history.replaceState({}, "", newUrl);
	});

	// User inputs --------------------------------------------------------------------------
	let titleInput = $state("");
	let descriptionInput = $state("");
	let expectedResultInput = $state("");
	let observedResultInput = $state("");
	let stepsInput = $state([""]); // Array of steps
	let screenshotFile = $state(null);
	let videoFile = $state(null);
	let emailInput = $state("");

	// Validation functions
	const isStepsValid = () => stepsInput.filter((s) => s.trim().length >= 10).length >= 1 || !formConfig.requireSteps;
	const isEmailValid = () => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput) || !formConfig.requireEmail;
	const isScreenshotValid = () => screenshotFile || !formConfig.requireScreenshot;
	const isVideoValid = () => videoFile || !formConfig.requireVideo;

	// Elements -------------------------------------------------------------------------------
	let stepsScrollBox = $state();
</script>

<!-- General information -->
{#if slide != "start"}
	<div class="text-muted-foreground absolute top-6 left-6 flex items-center gap-4 text-xs" in:fade>
		<Button variant="link" class="h-fit !p-0" onclick={prevSlide}><ArrowLeft /> Back</Button>
		<p>{currentSlideIndex + 1} / {slides.length}</p>
	</div>
{/if}

<!-- Start card -->
{#if slide == "start"}
	<h1
		class="absolute top-2/5 right-10 left-10 max-w-full -translate-y-1/2 transform truncate py-1 text-center text-5xl font-semibold text-wrap"
		out:fly={{ x: -300, duration: 300 }}
	>
		Report a bug.
	</h1>
	<div class="absolute right-6 bottom-6 left-6 flex flex-col items-center gap-6">
		<div out:fly={{ x: 300, duration: 300 }}>
			<Button onclick={nextSlide} size="lg">
				Start <ArrowRight />
			</Button>
		</div>

		<p class="text-muted-foreground text-center text-xs" out:fly={{ y: 50, duration: 300 }}>
			This form is powered by <a href={page.url.origin} target="_blank" class="hover:underline">Bugspot</a>. By clicking
			on "Start", you accept the
			<a href="/terms" target="_blank" class="hover:underline">Terms of Use</a>
			and <a href="/privacy" target="_blank" class="hover:underline">Privacy Policy</a>.
		</p>
	</div>
{/if}

<!-- Next button snippet -->
{#snippet nextButton(enabled = true)}
	<div class="absolute right-6 bottom-6 text-center">
		<Button onclick={nextSlide} size="lg" disabled={!enabled}>
			Next <ArrowRight />
		</Button>
	</div>
{/snippet}

<!-- Optional badge snippet -->
{#snippet optionalBadge(show = false)}
	{#if show}
		<Badge class="mb-1 text-sm" variant="secondary">
			<Info size={15} strokeWidth={2.5} style="width: 15px; height: 15px;" />Optional
		</Badge>
	{/if}
{/snippet}

<!-- Upload zone snippet -->
{#snippet uploadZone(type, file, setFile)}
	<div
		class="border-border rounded-lg border-2 border-dashed p-4 px-8 text-center"
		role="region"
		ondrop={(e) => {
			e.preventDefault();
			const f = e.dataTransfer.files?.[0];
			if (f && f.type.startsWith(type + "/")) setFile(f);
		}}
		ondragover={(e) => e.preventDefault()}
	>
		{#if file}
			<div class="flex flex-col items-center justify-center gap-3">
				<div class="bg-accent inline-flex max-w-40 items-center gap-2 rounded-md px-3 py-2 text-sm">
					<p class="truncate">{file.name}</p>
				</div>
				<Button variant="outline" onclick={() => setFile(null)}>Remove</Button>
			</div>
		{:else}
			<div class="space-y-4">
				<Upload class="mx-auto h-8 w-8" />
				<div class="space-y-2">
					<label for="{type}-upload" class="p-4">
						<Button variant="outline" class="pointer-events-none">Choose {type}</Button>
					</label>
					<p class="text-muted-foreground mt-2 text-sm">...or drag & drop a file.</p>
				</div>
				<input
					id="{type}-upload"
					type="file"
					accept="{type}/*"
					onchange={(e) => {
						const f = e.target.files?.[0];
						if (f && f.type.startsWith(type + "/")) setFile(f);
					}}
					class="hidden"
				/>
			</div>
		{/if}
	</div>
{/snippet}

{#if slide == "title"}
	<div in:fade>
		<h2 class="mb-4 text-2xl font-semibold">Give your report a title.</h2>
		<Input bind:value={titleInput} type="text" placeholder="E.g. Profile fails to load" maxlength={100} />
		<p class="text-muted-foreground mt-1 ml-2 text-xs">Min. 10 characters.</p>
		{@render nextButton(titleInput.length >= 10)}
	</div>
{/if}

{#if slide == "description"}
	<div in:fade>
		<h2 class="mb-4 text-2xl font-semibold">Write a brief description.</h2>
		<Textarea
			bind:value={descriptionInput}
			maxlength={300}
			placeholder="E.g. On the profile page, after changing my name..."
			class="h-32 w-full resize-none"
		></Textarea>
		<p class="text-muted-foreground mt-1 ml-2 text-xs">Min. 50 characters.</p>
		{@render nextButton(descriptionInput.length >= 50)}
	</div>
{/if}

{#if slide == "expected result"}
	<div in:fade>
		{@render optionalBadge(!formConfig.requireExpectedResult)}
		<h2 class="mb-4 text-2xl font-semibold">What should have happened?</h2>
		<Input bind:value={expectedResultInput} maxlength={200} placeholder="E.g. The profile should have..."></Input>
		<p class="text-muted-foreground mt-1 ml-2 text-xs">Min. 20 characters.</p>
		{@render nextButton(expectedResultInput.length >= 20 || !formConfig.requireExpectedResult)}
	</div>
{/if}

{#if slide == "observed result"}
	<div in:fade>
		{@render optionalBadge(!formConfig.requireObservedResult)}
		<h2 class="mb-4 text-2xl font-semibold">What happened instead?</h2>
		<Input bind:value={observedResultInput} maxlength={200} placeholder="E.g. The profile appeared to..."></Input>
		<p class="text-muted-foreground mt-1 ml-2 text-xs">Min. 20 characters.</p>
		{@render nextButton(observedResultInput.length >= 20 || !formConfig.requireObservedResult)}
	</div>
{/if}

{#if slide == "steps"}
	<div in:fade>
		{@render optionalBadge(!formConfig.requireSteps)}
		<h2 class="mb-4 text-2xl font-semibold">How can this be reproduced?</h2>
		<div class="bg-muted/50 rounded-xl">
			<div
				class="no-scrollbar of-top of-bottom of-length-2 h-30 space-y-2 overflow-y-auto p-2"
				bind:this={stepsScrollBox}
			>
				{#each stepsInput as step, index}
					<div class="flex items-center gap-2">
						<div class="text-muted-foreground flex w-5 pl-1 text-sm">
							{index + 1}.
						</div>
						<Input
							value={step}
							oninput={(e) => (stepsInput[index] = e.target.value)}
							placeholder="E.g. Click on 'open profile'"
							maxlength={150}
							class="flex-1"
						/>
						{#if stepsInput.length > 1}
							<Button
								variant="outline"
								size="sm"
								onclick={() => (stepsInput = stepsInput.filter((_, i) => i !== index))}
								class="h-8 w-8 flex-shrink-0 p-0"
							>
								<Minus class="h-4 w-4" />
							</Button>
						{/if}
					</div>
				{/each}
			</div>
		</div>
		<Button
			variant="outline"
			onclick={async () => {
				stepsInput = [...stepsInput, ""];
				await tick();
				stepsScrollBox.scrollTo({ top: stepsScrollBox.scrollHeight, behavior: "smooth" });
			}}
			class="mt-2 w-full"
			disabled={stepsInput.length >= 10}
		>
			<Plus class="mr-2 h-4 w-4" />
			Add step
		</Button>
		<p class="text-muted-foreground mt-3 ml-2 text-xs">Min. 1 step with min. 10 characters.</p>
		{@render nextButton(isStepsValid())}
	</div>
{/if}

{#if slide == "screenshot"}
	<div in:fade>
		{@render optionalBadge(!formConfig.requireScreenshot)}
		<h2 class="mb-4 text-2xl font-semibold">Add a screenshot.</h2>
		{@render uploadZone("image", screenshotFile, (f) => (screenshotFile = f))}
		{@render nextButton(isScreenshotValid())}
	</div>
{/if}

{#if slide == "video"}
	<div in:fade>
		{@render optionalBadge(!formConfig.requireVideo)}
		<h2 class="mb-4 text-2xl font-semibold">Add a video.</h2>
		{@render uploadZone("video", videoFile, (f) => (videoFile = f))}
		{@render nextButton(isVideoValid())}
	</div>
{/if}

{#if slide == "email"}
	<div in:fade>
		{@render optionalBadge(!formConfig.requireEmail)}
		<h2 class="mb-4 text-2xl font-semibold">Provide an email address.</h2>
		<div class="max-w-sm">
			<Input bind:value={emailInput} type="email" placeholder="you@example.com" maxlength={100} />
			<p class="text-muted-foreground mt-1 ml-2 max-w-60 text-xs">
				We might send you questions or updates regarding your report.
			</p>
		</div>
		{@render nextButton(isEmailValid())}
	</div>
{/if}

<style>
	.no-scrollbar {
		scrollbar-width: none;
	}
</style>
