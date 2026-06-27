<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { getTodayAttendance } from '$lib/api/attendance.api';
	import { extractApiError } from '$lib/utils/api-errors';
	import { Card, CardHeader, CardTitle, CardContent } from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Alert, AlertTitle, AlertDescription } from '$lib/components/ui/alert/index.js';
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import { EVENT_TYPE_LABELS } from '$lib/types/scan.types';
	import {
		ATTENDANCE_STATUS_LABELS,
		ATTENDANCE_STATUS_VARIANTS
	} from '$lib/types/attendance.types';
	import type { BadgeVariant } from '$lib/components/ui/badge/badge.svelte';
	import type { TodayAttendanceResponse } from '$lib/types/attendance.types';
	import { CalendarBlank, QrCode, ArrowRight } from 'phosphor-svelte';

	let isLoading = $state(true);
	let error = $state<string | null>(null);
	let data = $state<TodayAttendanceResponse | null>(null);

	onMount(() => {
		loadData();
	});

	async function loadData() {
		isLoading = true;
		error = null;
		try {
			data = await getTodayAttendance();
		} catch (err) {
			const apiErr = extractApiError(err);
			error = apiErr.message;
		} finally {
			isLoading = false;
		}
	}

	function formatTime(iso: string | null): string {
		if (!iso) return '--:--';
		const d = new Date(iso);
		return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	}

	function formatMinutes(mins: number): string {
		if (mins <= 0) return '--';
		const h = Math.floor(mins / 60);
		const m = mins % 60;
		if (h > 0) return `${h}h ${m}m`;
		return `${m}m`;
	}

	let statusVariant = $derived(
		(data?.attendance
			? ATTENDANCE_STATUS_VARIANTS[data.attendance.status]
			: 'outline') as BadgeVariant
	);

	let statusLabel = $derived(
		data?.attendance
			? ATTENDANCE_STATUS_LABELS[data.attendance.status] || data.attendance.status
			: 'No Record'
	);
</script>

<div class="mx-auto mt-10 max-w-lg">
	<h1 class="mb-6 text-2xl font-bold">Today's Attendance</h1>

	{#if isLoading}
		<div
			class="flex flex-col items-center justify-center gap-3 rounded-lg border border-border p-12"
		>
			<Spinner class="size-8" />
			<p class="text-muted-foreground">Loading today's attendance...</p>
		</div>
	{:else if error}
		<Alert variant="destructive" class="mb-4">
			<AlertTitle>Error</AlertTitle>
			<AlertDescription>{error}</AlertDescription>
		</Alert>
		<Button class="mt-2" onclick={loadData}>Retry</Button>
	{:else if data && !data.attendance}
		<Card>
			<CardContent class="flex flex-col items-center gap-4 py-12">
				<CalendarBlank class="size-12 text-muted-foreground" />
				<p class="text-lg text-muted-foreground">No scan yet today</p>
				<p class="text-sm text-muted-foreground">
					Scan the QR code at your workplace to start your day.
				</p>
				<Button onclick={() => goto('/employee/scan')}>
					<QrCode class="mr-2 size-4" />
					Go to Scanner
				</Button>
			</CardContent>
		</Card>
	{:else if data && data.attendance}
		<div class="space-y-4">
			<Card>
				<CardHeader>
					<div class="flex items-center justify-between">
						<CardTitle class="text-lg">Attendance Record</CardTitle>
						<Badge variant={statusVariant}>{statusLabel}</Badge>
					</div>
				</CardHeader>
				<CardContent>
					<div class="space-y-4">
						<div class="space-y-2">
							<div class="flex justify-between text-sm">
								<span class="text-muted-foreground">Date</span>
								<span class="font-medium">{data.attendance.workDate}</span>
							</div>
							<div class="flex justify-between text-sm">
								<span class="text-muted-foreground">Arrival</span>
								<span class="font-medium">{formatTime(data.attendance.arrivalAt)}</span>
							</div>
							<div class="flex justify-between text-sm">
								<span class="text-muted-foreground">Break Start</span>
								<span class="font-medium">{formatTime(data.attendance.breakStartAt)}</span>
							</div>
							<div class="flex justify-between text-sm">
								<span class="text-muted-foreground">Break End</span>
								<span class="font-medium">{formatTime(data.attendance.breakEndAt)}</span>
							</div>
							<div class="flex justify-between text-sm">
								<span class="text-muted-foreground">Departure</span>
								<span class="font-medium">{formatTime(data.attendance.departureAt)}</span>
							</div>
						</div>

						<hr class="border-border" />

						<div class="space-y-2">
							<div class="flex justify-between text-sm">
								<span class="text-muted-foreground">Late Minutes</span>
								<span class="font-medium">{formatMinutes(data.attendance.lateMinutes)}</span>
							</div>
							<div class="flex justify-between text-sm">
								<span class="text-muted-foreground">Break Minutes</span>
								<span class="font-medium">{formatMinutes(data.attendance.breakMinutes)}</span>
							</div>
							<div class="flex justify-between text-sm">
								<span class="text-muted-foreground">Worked Minutes</span>
								<span class="font-medium">{formatMinutes(data.attendance.workedMinutes)}</span>
							</div>
							<div class="flex justify-between text-sm">
								<span class="text-muted-foreground">Overtime Minutes</span>
								<span class="font-medium">{formatMinutes(data.attendance.overtimeMinutes)}</span>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{#if data.nextExpectedEvent}
				<Card>
					<CardContent class="flex flex-col items-center gap-3 py-6">
						<p class="text-sm text-muted-foreground">Next expected event</p>
						<p class="text-xl font-bold">
							{EVENT_TYPE_LABELS[data.nextExpectedEvent] ?? data.nextExpectedEvent}
						</p>
						<Button onclick={() => goto('/employee/scan')}>
							<QrCode class="mr-2 size-4" />
							Go to Scanner
						</Button>
					</CardContent>
				</Card>
			{/if}

			<Button variant="outline" class="w-full" onclick={() => goto('/employee/scan')}>
				<ArrowRight class="mr-2 size-4" />
				Go to Scanner
			</Button>
		</div>
	{/if}
</div>
