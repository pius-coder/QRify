<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { submitScan } from '$lib/api/scan.api';
	import { extractApiError } from '$lib/utils/api-errors';
	import { Alert, AlertTitle, AlertDescription } from '$lib/components/ui/alert/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Card, CardHeader, CardTitle, CardContent } from '$lib/components/ui/card/index.js';
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import { QrCode, Scan } from 'phosphor-svelte';
	import { EVENT_TYPE_LABELS, SCAN_RESULT_LABELS } from '$lib/types/scan.types';
	import type { ScanResponse } from '$lib/types/scan.types';
	import jsQR from 'jsqr';

	let cameraState = $state<'requesting' | 'active' | 'denied' | 'unavailable'>('requesting');
	let scanMode = $state<'camera' | 'manual'>('camera');
	let scanState = $state<'idle' | 'scanning' | 'decoded' | 'success' | 'error'>('idle');
	let isSubmitting = $state(false);
	let manualToken = $state('');
	let decodedToken = $state('');
	let scanResult = $state<ScanResponse | null>(null);
	let errorMessage = $state('');

	let videoEl: HTMLVideoElement | undefined = $state();
	let canvasEl: HTMLCanvasElement | undefined = $state();
	let mediaStream: MediaStream | null = null;
	let animFrameId = 0;
	let frameCount = 0;

	onMount(() => {
		startCamera();
	});

	onDestroy(() => {
		stopCamera();
	});

	async function startCamera() {
		cameraState = 'requesting';
		scanState = 'scanning';
		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
			});
			mediaStream = stream;
			if (videoEl) {
				videoEl.srcObject = stream;
			}
			cameraState = 'active';
			scanLoop();
		} catch (err) {
			if (
				err instanceof DOMException &&
				(err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError')
			) {
				cameraState = 'denied';
			} else if (err instanceof DOMException && err.name === 'NotFoundError') {
				cameraState = 'unavailable';
			} else {
				cameraState = 'unavailable';
			}
			scanMode = 'manual';
		}
	}

	function stopCamera() {
		if (animFrameId) {
			cancelAnimationFrame(animFrameId);
			animFrameId = 0;
		}
		if (mediaStream) {
			mediaStream.getTracks().forEach((t) => t.stop());
			mediaStream = null;
		}
	}

	function scanLoop() {
		if (!videoEl || !canvasEl || scanState !== 'scanning') return;
		if (videoEl.readyState < 2) {
			animFrameId = requestAnimationFrame(scanLoop);
			return;
		}
		frameCount++;
		if (frameCount % 3 === 0) {
			const ctx = canvasEl.getContext('2d');
			if (!ctx) {
				animFrameId = requestAnimationFrame(scanLoop);
				return;
			}
			canvasEl.width = videoEl.videoWidth;
			canvasEl.height = videoEl.videoHeight;
			ctx.drawImage(videoEl, 0, 0);
			const imageData = ctx.getImageData(0, 0, canvasEl.width, canvasEl.height);
			const code = jsQR(imageData.data, imageData.width, imageData.height);
			if (code && code.data.length === 64) {
				decodedToken = code.data;
				scanState = 'decoded';
				stopCamera();
				return;
			}
		}
		animFrameId = requestAnimationFrame(scanLoop);
	}

	async function submitDecodedToken() {
		isSubmitting = true;
		try {
			const data = await submitScan(decodedToken);
			scanResult = data.scan;
			scanState = 'success';
		} catch (err) {
			const apiErr = extractApiError(err);
			if (apiErr.fields) {
				errorMessage = Object.values(apiErr.fields).join(', ');
			} else {
				errorMessage = apiErr.message;
			}
			scanState = 'error';
		} finally {
			isSubmitting = false;
		}
	}

	async function handleManualSubmit() {
		if (!manualToken.trim()) {
			errorMessage = 'Please enter a token.';
			scanState = 'error';
			return;
		}
		decodedToken = manualToken.trim();
		await submitDecodedToken();
	}

	function handleDecodedSubmit() {
		submitDecodedToken();
	}

	function resetScanner() {
		scanState = 'idle';
		scanResult = null;
		errorMessage = '';
		decodedToken = '';
		manualToken = '';
		frameCount = 0;
		if (cameraState === 'active' || scanMode === 'camera') {
			scanMode = 'camera';
			cameraState = 'requesting';
			startCamera();
		}
	}

	function switchToManual() {
		stopCamera();
		cameraState = 'unavailable';
		scanMode = 'manual';
		scanState = 'idle';
	}

	function switchToCamera() {
		scanMode = 'camera';
		startCamera();
	}
</script>

<div class="mx-auto mt-10 max-w-lg">
	<h1 class="mb-6 text-2xl font-bold">QR Scanner</h1>

	{#if scanState === 'success' && scanResult}
		<Card>
			<CardHeader>
				<CardTitle class="flex items-center gap-2">
					<QrCode class="size-5 text-green-600" />
					Scan Successful
				</CardTitle>
			</CardHeader>
			<CardContent class="space-y-2">
				<div class="flex justify-between">
					<span class="text-muted-foreground">Event</span>
					<span class="font-medium"
						>{EVENT_TYPE_LABELS[scanResult.eventType] ?? scanResult.eventType}</span
					>
				</div>
				<div class="flex justify-between">
					<span class="text-muted-foreground">Result</span>
					<span class="font-medium text-green-600"
						>{SCAN_RESULT_LABELS[scanResult.result] ?? scanResult.result}</span
					>
				</div>
				<div class="flex justify-between">
					<span class="text-muted-foreground">Time</span>
					<span class="font-medium">{new Date(scanResult.scannedAt).toLocaleTimeString()}</span>
				</div>
				<Button class="mt-4 w-full" onclick={resetScanner}>Scan Another Code</Button>
			</CardContent>
		</Card>
	{:else if scanState === 'error'}
		<Alert variant="destructive" class="mb-4">
			<AlertTitle>Scan Error</AlertTitle>
			<AlertDescription>{errorMessage}</AlertDescription>
		</Alert>
		<div class="flex gap-2">
			<Button class="flex-1" onclick={resetScanner}>Try Again</Button>
			{#if scanMode === 'manual'}
				<Button
					variant="outline"
					onclick={() => {
						scanState = 'idle';
					}}>Edit Token</Button
				>
			{/if}
		</div>
	{:else if scanState === 'decoded' && decodedToken}
		<Card class="mb-4">
			<CardHeader>
				<CardTitle class="flex items-center gap-2">
					<QrCode class="size-5" />
					QR Code Detected
				</CardTitle>
			</CardHeader>
			<CardContent class="space-y-4">
				<p class="break-all font-mono text-sm text-muted-foreground">{decodedToken}</p>
				<Button class="w-full" onclick={handleDecodedSubmit} disabled={isSubmitting}>
					{#if isSubmitting}
						<Spinner class="mr-2 size-4" />
						Submitting...
					{:else}
						Submit Scan
					{/if}
				</Button>
				<Button variant="outline" class="w-full" onclick={resetScanner}>Scan Again</Button>
			</CardContent>
		</Card>
	{:else}
		<!-- Camera Scanner -->
		{#if scanMode === 'camera'}
			{#if cameraState === 'requesting'}
				<div
					class="flex flex-col items-center justify-center gap-3 rounded-lg border border-border p-12"
				>
					<Spinner class="size-8" />
					<p class="text-muted-foreground">Requesting camera access...</p>
				</div>
			{:else if cameraState === 'active'}
				<div class="relative mb-4 overflow-hidden rounded-lg bg-black">
					<video bind:this={videoEl} autoplay playsinline muted class="w-full"></video>
					<div class="absolute inset-0 flex items-center justify-center">
						<div class="rounded-full border-2 border-white/50 p-3">
							<Scan class="size-8 text-white/70" />
						</div>
					</div>
					<div class="absolute bottom-3 left-0 right-0 text-center">
						<span class="rounded-full bg-black/50 px-3 py-1 text-xs text-white/80">
							Point camera at QR code
						</span>
					</div>
				</div>
			{/if}

			{#if cameraState === 'denied'}
				<Alert variant="destructive" class="mb-4">
					<AlertTitle>Camera Permission Denied</AlertTitle>
					<AlertDescription>
						Please allow camera access in your browser settings, or use manual token input below.
					</AlertDescription>
				</Alert>
			{/if}

			{#if cameraState === 'unavailable'}
				<Alert class="mb-4">
					<AlertTitle>Camera Not Available</AlertTitle>
					<AlertDescription>
						No camera was found on this device. Use the manual input below.
					</AlertDescription>
				</Alert>
			{/if}

			{#if cameraState !== 'requesting'}
				<div class="mb-4 text-center">
					<Button variant="ghost" onclick={switchToManual}>Use Manual Input Instead</Button>
				</div>
			{/if}
		{/if}

		<!-- Manual Input -->
		{#if scanMode === 'manual'}
			<div class="space-y-4">
				<div>
					<label for="token-input" class="mb-1 block text-sm font-medium text-muted-foreground">
						Manual Token Entry
					</label>
					<Input
						id="token-input"
						bind:value={manualToken}
						placeholder="Paste the 64-character token here..."
						disabled={isSubmitting}
					/>
				</div>
				<Button
					class="w-full"
					onclick={handleManualSubmit}
					disabled={isSubmitting || !manualToken.trim()}
				>
					{#if isSubmitting}
						<Spinner class="mr-2 size-4" />
						Processing...
					{:else}
						Submit Token
					{/if}
				</Button>
				{#if cameraState === 'denied' || cameraState === 'unavailable'}
					<div class="text-center text-sm text-muted-foreground">
						<p>Camera unavailable. Enter the token shown on the QR display.</p>
					</div>
				{:else}
					<div class="text-center">
						<Button variant="ghost" onclick={switchToCamera}>Use Camera Instead</Button>
					</div>
				{/if}
			</div>
		{/if}
	{/if}

	<canvas bind:this={canvasEl} class="hidden"></canvas>
</div>
