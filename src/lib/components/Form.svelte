<script>
	import { ArrowLeft, ArrowRight, Info, Plus, Minus, Upload, Loader2, XCircle, Send } from "lucide-svelte";
	import Button from "./ui/button/button.svelte";
	import { fade, fly, scale } from "svelte/transition";
	import { page } from "$app/state";
	import Input from "./ui/input/input.svelte";
	import Textarea from "./ui/textarea/textarea.svelte";
	import Badge from "./ui/badge/badge.svelte";
	import { onMount, tick } from "svelte";
	import { toast } from "svelte-sonner";
	import { betterFetch } from "$lib/utils/betterFetch.js";
	import { renderCaptcha } from "$lib/utils/renderCaptcha.js";

	let { formConfig = {}, primaryColor = "black" } = $props();

	const slides = [
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
	const postSlides = ["processing", "question", "closed", "submitted"];

	let currentSlideIndex = $state(0);
	let isPostSlide = $derived(currentSlideIndex >= slides.length);
	let slide = $derived(isPostSlide ? postSlides[currentSlideIndex - slides.length] : slides[currentSlideIndex]);

	// Domain verification
	let isDomainAllowed = $state(true);

	function checkDomainAccess() {
		const allowedDomains = formConfig.domains?.map((d) => d.domain) || [];
		const isInIframe = window !== window.top;
		const topHostname = isInIframe ? window.top?.location.hostname : null;
		const referrerHostname = document.referrer ? new URL(document.referrer).hostname : null;

		if (!topHostname && !referrerHostname) return false;

		const checkDomain = topHostname || referrerHostname;
		return checkDomain === page.url.hostname || allowedDomains.includes(checkDomain);
	}

	// Captcha
	let captchaVisible = $state(false);
	let captchaToken = $state(null);

	onMount(() => {
		isDomainAllowed = checkDomainAccess();

		window.onFormCaptchaCompleted = function (token) {
			captchaToken = token;
			captchaVisible = false;
			processSubmission(); // Continue with submission
		};
	});

	function nextSlide() {
		const maxIndex = slides.length + postSlides.length - 1;
		if (currentSlideIndex < maxIndex) {
			if (currentSlideIndex === slides.length - 1) processSubmission();
			currentSlideIndex++;
		}
	}

	// Custom data from URL
	onMount(() => {
		const customDataFromURL = page.url.searchParams.get("custom-data");
		try {
			if (customDataFromURL) customData = decodeURIComponent(customDataFromURL);
		} catch {
			console.warn("Failed to decode customData URI component.");
		}
	});

	// User inputs
	let titleInput = $state("");
	let descriptionInput = $state("");
	let expectedResultInput = $state("");
	let observedResultInput = $state("");
	let stepsInput = $state([""]);
	let screenshotFile = $state(null);
	let videoFile = $state(null);
	let emailInput = $state("");
	let questionAnswerInput = $state("");
	let questionAnswerHistory = $state(""); // Complete Q&A history

	// Attached data
	let customData = $state();

	// Post-processing states
	let aiResponse = $state(null);
	let processing = $state(false);
	let stepsScrollBox = $state();

	// Validation functions
	const isStepsValid = () => stepsInput.filter((s) => s.trim().length >= 10).length >= 1 || !formConfig.requireSteps;
	const isEmailValid = () => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput) || !formConfig.requireEmail;
	const isScreenshotValid = () => screenshotFile || !formConfig.requireScreenshot;
	const isVideoValid = () => videoFile || !formConfig.requireVideo;

	function validateFile(file, isImage) {
		const maxSize = isImage ? 3 * 1024 * 1024 : 25 * 1024 * 1024;
		if (file.size > maxSize) {
			toast.error(`File too large. ${isImage ? "Images" : "Videos"} must be under ${isImage ? "3MB" : "25MB"}.`);
			return false;
		}
		return true;
	}

	async function uploadFile(file) {
		const formData = new FormData();
		formData.append("file", file);
		const response = await betterFetch("/api/report/file-upload", { method: "POST", body: formData });
		return (await response.json()).url;
	}

	async function processSubmission() {
		// Check captcha first
		if (!captchaToken) return (captchaVisible = true);

		processing = true;
		currentSlideIndex = slides.length; // Go to processing slide

		try {
			// Only upload files on first submission
			let screenshotUrl = null;
			let videoUrl = null;

			if (!questionAnswerInput.trim()) {
				[screenshotUrl, videoUrl] = await Promise.all([
					screenshotFile ? uploadFile(screenshotFile) : null,
					videoFile ? uploadFile(videoFile) : null,
				]);
			}

			// Add current Q&A to history if this is a follow-up
			if (questionAnswerInput.trim()) {
				questionAnswerHistory += `YOU ASKED: ${aiResponse.message}\nUSER ANSWERED: ${questionAnswerInput.trim()}\n`;
				questionAnswerInput = ""; // Reset the question input!
			}

			const requestBody = {
				formId: formConfig.id,
				title: titleInput,
				description: descriptionInput,
				expectedResult: expectedResultInput,
				observedResult: observedResultInput,
				steps: stepsInput.filter((s) => s.trim()),
				email: emailInput,
				userAgent: navigator.userAgent,
				customData,
				screenshotUrl,
				videoUrl,
				questionAnswerHistory,
			};

			const response = await betterFetch("/api/report/ai", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"cf-turnstile-response": captchaToken,
				},
				body: JSON.stringify(requestBody),
			});

			aiResponse = await response.json();
			const actionIndex = { question: 1, closed: 2, submitted: 3 }[aiResponse.action] || 1;
			currentSlideIndex = slides.length + actionIndex;
			captchaToken = null; // Reset, as this token was used
		} catch (error) {
			console.error("Submission error:", error);
			toast.error(error.message || "Something went wrong. Please try again.");
			currentSlideIndex = slides.length - 1;
		} finally {
			processing = false;
		}
	}

	// Captcha effect
	$effect(() => {
		if (captchaVisible) renderCaptcha("#captchaContainer", window.onFormCaptchaCompleted);
	});
</script>

{#if isDomainAllowed}
	<!-- Back UI + slide index -->
	{#if slide != "start" && !isPostSlide}
		<div
			class="text-muted-foreground bg-background absolute top-6 left-6 flex items-center gap-4 rounded pr-2 text-xs"
			in:fade
		>
			<Button
				variant="link"
				class="h-fit !p-0"
				onclick={() => {
					if (currentSlideIndex > 0) currentSlideIndex--;
				}}><ArrowLeft /> Back</Button
			>
			<p>{currentSlideIndex} / {slides.length - 1}</p>
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
				This form is powered by <a href={page.url.origin} target="_blank" class="text-primary hover:underline"
					>Bugspot</a
				>. By clicking on "Start", you accept the
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
				if (f && f.type.startsWith(type + "/") && validateFile(f, type === "image")) setFile(f);
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
							if (f && f.type.startsWith(type + "/") && validateFile(f, type === "image")) setFile(f);
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
				<Input bind:value={emailInput} type="email" placeholder="your-name@example.com" maxlength={100} />
				<p class="text-muted-foreground mt-1 ml-2 max-w-60 text-xs">
					We might send you questions or updates regarding your report.
				</p>
			</div>
			{@render nextButton(isEmailValid())}
		</div>
	{/if}

	<!-- Post slides -->
	{#if slide == "processing"}
		<div class="flex flex-col items-center justify-center text-center" in:fade>
			<Loader2 class="mb-4 h-12 w-12 animate-spin" />
			<h2 class="mb-2 text-2xl font-semibold">Processing with AI...</h2>
			<p class="text-muted-foreground">Please stand by.</p>
		</div>
	{/if}

	{#if slide == "question"}
		<div in:fade class="max-w-100">
			<h2 class="mb-4 text-2xl font-semibold">We need more information.</h2>
			<div class="bg-muted/50 mb-4 rounded-xl p-4">
				<p class="of-top of-bottom no-scrollbar max-h-18 overflow-y-auto text-sm">
					{aiResponse?.message || "No AI response (Error)."}
				</p>
			</div>
			<div class="mb-4">
				<Textarea
					bind:value={questionAnswerInput}
					placeholder="Here is additional information regarding..."
					class="h-24 w-full resize-none"
					maxlength={500}
				/>
				<p class="text-muted-foreground mt-1 ml-2 text-xs">
					Provide an answer to help with this report. Min. 20 characters.
				</p>
			</div>
			<div class="flex gap-2">
				<Button
					onclick={() => {
						processSubmission();
					}}
					disabled={questionAnswerInput.length < 20}>Submit</Button
				>
			</div>
		</div>
	{/if}

	{#if slide == "closed"}
		<div in:fade class="max-w-100">
			<div class="mb-4 flex items-center gap-2">
				<XCircle class="h-6 w-6" />
				<h2 class="text-2xl font-semibold">Report not submitted.</h2>
			</div>
			<div class="bg-muted/50 max-h-48 overflow-y-auto rounded-xl">
				<div class="of-top of-bottom of-length-2 of-top of-bottom max-h-30 overflow-y-auto p-4">
					<p class="text-sm">{aiResponse?.message || "No AI response (Error)."}</p>
				</div>
			</div>
		</div>
	{/if}

	{#if slide == "submitted"}
		<div class="flex flex-col items-center justify-center text-center" in:fade>
			<Send class="mb-4 h-12 w-12" />
			<h2 class="mb-2 text-2xl font-semibold">Submitted!</h2>
			<p class="text-muted-foreground">Thank you for your report.</p>
			{#if aiResponse?.issueUrl}
				<Button onclick={() => window.open(aiResponse.issueUrl, "_blank")} variant="outline" class="mt-4">
					View on GitHub <ArrowRight class="h-4 w-4" />
				</Button>
			{/if}
		</div>
	{/if}
{:else}
	<!-- Domain not whitelisted overlay -->
	<div class="flex flex-col items-center justify-center text-center" in:fade>
		<XCircle class="mb-4 h-12 w-12" />
		<h2 class="mb-2 text-2xl font-semibold">Domain not whitelisted.</h2>
		<p class="text-muted-foreground max-w-md">
			The form requires a valid & whitelisted referrer or top frame domain. This can be configured via the dashboard. <br
			/><br /> Note that that links using target="_blank" do not provide a referrer by default. Consider using a direct link
			or embedding the form in an iframe instead.
		</p>
	</div>
{/if}

<!-- Captcha overlay -->
{#if captchaVisible}
	<div class="bg-background/75 absolute inset-0 z-50 flex items-center justify-center p-4" transition:fade>
		<div class="bg-background mx-4 max-h-full max-w-full overflow-x-auto rounded-lg p-6 shadow-lg" transition:scale>
			<h3 class="mb-4 text-lg font-semibold">Captcha.</h3>
			<div id="captchaContainer"></div>
		</div>
	</div>
{/if}

<style>
	.no-scrollbar {
		scrollbar-width: none;
	}
</style>
