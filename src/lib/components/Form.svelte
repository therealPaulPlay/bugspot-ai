<script>
	import { ArrowLeft, ArrowRight, Info } from "lucide-svelte";
	import Button from "./ui/button/button.svelte";
	import { fade, fly } from "svelte/transition";
	import { page } from "$app/state";
	import Input from "./ui/input/input.svelte";
	import Textarea from "./ui/textarea/textarea.svelte";
	import Badge from "./ui/badge/badge.svelte";
	import { onMount } from "svelte";
	import { replaceState } from "$app/navigation";

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
		const slideIndex = page.url.searchParams.get("slide");
		if (slideIndex) currentSlideIndex = slideIndex;
	});

	$effect(() => {
		const params = new URLSearchParams(page.url.search);
		if (currentSlideIndex) params.set("slide", currentSlideIndex);
		else params.delete("slide");
		const newUrl = params.toString().length > 0 ? `${page.url.pathname}?${params.toString()}` : page.url.pathname;
		replaceState("", newUrl);
	});

	// User inputs --------------------------------------------------------------------------
	let titleInput = $state("");
	let descriptionInput = $state("");
	let expectedResultInput = $state("");
	let observedResultInput = $state("");
</script>

<!-- General information -->
{#if slide != "start"}
	<div class="text-muted-foreground absolute top-6 left-6 flex items-center gap-4 text-xs" in:fade>
		<Button variant="link" class="h-fit !p-0" onclick={prevSlide}><ArrowLeft /> Back</Button>
		<p>{currentSlideIndex} / {slides.length}</p>
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
	<Badge class="mb-1 text-sm" variant="secondary"
		><Info size={15} strokeWidth={2.5} style="width: 15px; height: 15px;" />Optional</Badge
	>
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
		{@render optionalBadge(formConfig.reuireExpectedResult)}
		<h2 class="mb-4 text-2xl font-semibold">What should have happened?</h2>
		<Input bind:value={expectedResultInput} maxlength={200} placeholder="E.g. The profile should have..."></Input>
		<p class="text-muted-foreground mt-1 ml-2 text-xs">Min. 20 characters.</p>
		{@render nextButton(expectedResultInput.length >= 20 || formConfig.reuireExpectedResult)}
	</div>
{/if}

{#if slide == "observed result"}
	<div in:fade>
		{@render optionalBadge(formConfig.reuireExpectedResult)}
		<h2 class="mb-4 text-2xl font-semibold">What happened instead?</h2>
		<Input bind:value={observedResultInput} maxlength={200} placeholder="E.g. The profile appeared to..."></Input>
		<p class="text-muted-foreground mt-1 ml-2 text-xs">Min. 20 characters.</p>
		{@render nextButton(observedResultInput.length >= 20 || formConfig.reuireObservedResult)}
	</div>
{/if}
