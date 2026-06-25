<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/stores';
	import { qrDisplay } from '$lib/stores/qr.store';
	import { EVENT_TYPE_LABELS } from '$lib/types/qr.types';
	import { toDataURL } from 'qrcode';

	let qrDataUrl = $state<string | null>(null);
	let secondsRemaining = $state(0);
	let refreshInterval: ReturnType<typeof setInterval> | undefined;
	let countdownInterval: ReturnType<typeof setInterval> | undefined;

	onMount(() => {
		const companyCode = $page.params.companyCode as string;
		loadQr(companyCode);

		refreshInterval = setInterval(() => loadQr(companyCode), 30_000);
		countdownInterval = setInterval(updateCountdown, 1_000);
	});

	onDestroy(() => {
		if (refreshInterval) clearInterval(refreshInterval);
		if (countdownInterval) clearInterval(countdownInterval);
		qrDisplay.clearState();
	});

	async function loadQr(companyCode: string) {
		await qrDisplay.load(companyCode);
		if ($qrDisplay.activeQr) {
			qrDataUrl = null;
			try {
				qrDataUrl = await toDataURL($qrDisplay.activeQr.token, {
					width: 400,
					margin: 2,
					color: { dark: '#000000ff', light: '#ffffffff' }
				});
			} catch {
				// QR generation failed
			}
			updateCountdown();
		} else {
			qrDataUrl = null;
		}
	}

	function updateCountdown() {
		if (!$qrDisplay.activeQr) {
			secondsRemaining = 0;
			return;
		}
		const now = Date.now();
		const until = new Date($qrDisplay.activeQr.validUntil).getTime();
		secondsRemaining = Math.max(0, Math.round((until - now) / 1000));
	}

	function formatCountdown(seconds: number): string {
		const m = Math.floor(seconds / 60);
		const s = seconds % 60;
		if (m > 0) return `${m}m ${s}s`;
		return `${s}s`;
	}

	function formatTime(iso: string): string {
		return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	}
</script>

<div class="flex min-h-screen flex-col items-center justify-center bg-black p-8 text-white">
	{#if $qrDisplay.isLoading}
		<p class="text-xl text-gray-400">Loading...</p>
	{:else if $qrDisplay.companyNotFound}
		<div class="text-center">
			<h1 class="mb-2 text-3xl font-bold">Company not found</h1>
			<p class="text-gray-400">Check the company code and try again.</p>
		</div>
	{:else if $qrDisplay.isSuspended}
		<div class="text-center">
			<h1 class="mb-2 text-3xl font-bold">QRify</h1>
			<p class="text-xl text-gray-400">This company account is suspended.</p>
		</div>
	{:else if $qrDisplay.isNoQr}
		<div class="text-center">
			<h1 class="mb-2 text-3xl font-bold">QRify</h1>
			<p class="text-xl text-gray-400">No active QR code at this time.</p>
		</div>
	{:else if $qrDisplay.error}
		<div class="text-center">
			<h1 class="mb-2 text-3xl font-bold">Error</h1>
			<p class="text-xl text-gray-400">
				{typeof $qrDisplay.error === 'string' ? $qrDisplay.error : JSON.stringify($qrDisplay.error)}
			</p>
		</div>
	{:else if $qrDisplay.activeQr}
		<div class="flex flex-col items-center gap-6">
			<h1 class="text-2xl font-bold tracking-widest text-gray-500">QRIFY</h1>

			<p class="text-xl text-gray-300">{$qrDisplay.activeQr.companyName}</p>

			<p class="text-5xl font-bold text-white">
				{EVENT_TYPE_LABELS[$qrDisplay.activeQr.eventType] ?? $qrDisplay.activeQr.eventType}
			</p>

			{#if qrDataUrl}
				<img src={qrDataUrl} alt="QR Code" class="h-80 w-80 rounded-lg bg-white p-4" />
			{:else}
				<div
					class="flex h-80 w-80 items-center justify-center rounded-lg bg-gray-800 text-gray-500"
				>
					Generating QR...
				</div>
			{/if}

			<div class="text-center">
				<p class="text-lg text-gray-400">
					Valid until {formatTime($qrDisplay.activeQr.validUntil)}
				</p>
				{#if secondsRemaining > 0}
					<p class="mt-1 text-3xl font-mono font-bold text-blue-400">
						{formatCountdown(secondsRemaining)}
					</p>
				{:else}
					<p class="mt-1 text-3xl font-mono font-bold text-red-400">Expired</p>
				{/if}
			</div>
		</div>
	{/if}
</div>
