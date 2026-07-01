<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { employeeSelf } from '$lib/stores/employee-self.store';
	import { Alert, AlertTitle, AlertDescription } from '$lib/components/ui/alert/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Card, CardHeader, CardTitle, CardContent } from '$lib/components/ui/card/index.js';
	import {
		ATTENDANCE_STATUS_LABELS,
		ATTENDANCE_STATUS_VARIANTS
	} from '$lib/types/attendance.types';
	import { EVENT_TYPE_LABELS, SCAN_RESULT_LABELS } from '$lib/types/scan.types';
	import type { BadgeVariant } from '$lib/components/ui/badge/badge.svelte';
	import { ArrowLeft, CalendarBlank } from 'phosphor-svelte';

	onMount(() => {
		const date = $page.params.date;
		if (date) employeeSelf.loadDetail(date);
	});

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

	let att = $derived($employeeSelf.detail.attendance);
	let events = $derived($employeeSelf.detail.scanEvents);
	let loading = $derived($employeeSelf.detail.isLoading);
	let err = $derived($employeeSelf.detail.error);

	let statusVariant = $derived(
		(att ? ATTENDANCE_STATUS_VARIANTS[att.status] : 'outline') as BadgeVariant
	);
	let statusLabel = $derived(att ? ATTENDANCE_STATUS_LABELS[att.status] || att.status : '');
</script>

<div class="mx-auto mt-10 max-w-4xl">
	<div class="mb-6">
		<Button variant="ghost" class="gap-2" onclick={() => goto('/employee/history')}>
			<ArrowLeft class="size-4" />Back to History
		</Button>
	</div>

	{#if loading}
		<div class="space-y-3">
			<Skeleton class="h-8 w-64" /><Skeleton class="h-48 w-full" /><Skeleton class="h-32 w-full" />
		</div>
	{/if}

	{#if err}
		<Alert variant="destructive" class="mb-4">
			<AlertTitle>Error</AlertTitle>
			<AlertDescription>{typeof err === 'string' ? err : JSON.stringify(err)}</AlertDescription>
		</Alert>
	{/if}

	{#if att && !loading}
		<div class="mb-6">
			<div class="flex items-center gap-3">
				<h1 class="text-2xl font-bold">{att.workDate}</h1>
				<Badge variant={statusVariant}>{statusLabel}</Badge>
			</div>
		</div>

		<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
			<Card>
				<CardHeader><CardTitle>Event Timestamps</CardTitle></CardHeader>
				<CardContent>
					<div class="space-y-3">
						<div class="flex justify-between">
							<span class="text-sm text-muted-foreground">Arrival</span>
							<span class="text-sm font-medium">{formatTime(att.arrivalAt)}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-sm text-muted-foreground">Break Start</span>
							<span class="text-sm font-medium">{formatTime(att.breakStartAt)}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-sm text-muted-foreground">Break End</span>
							<span class="text-sm font-medium">{formatTime(att.breakEndAt)}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-sm text-muted-foreground">Departure</span>
							<span class="text-sm font-medium">{formatTime(att.departureAt)}</span>
						</div>
					</div>
				</CardContent>
			</Card>
			<Card>
				<CardHeader><CardTitle>Calculated Values</CardTitle></CardHeader>
				<CardContent>
					<div class="space-y-3">
						<div class="flex justify-between">
							<span class="text-sm text-muted-foreground">Late Minutes</span>
							<span class="text-sm font-medium">{formatMinutes(att.lateMinutes)}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-sm text-muted-foreground">Break Minutes</span>
							<span class="text-sm font-medium">{formatMinutes(att.breakMinutes)}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-sm text-muted-foreground">Worked Minutes</span>
							<span class="text-sm font-medium">{formatMinutes(att.workedMinutes)}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-sm text-muted-foreground">Overtime Minutes</span>
							<span class="text-sm font-medium">{formatMinutes(att.overtimeMinutes)}</span>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>

		<!-- Scan Events -->
		<div class="mt-6">
			<Card>
				<CardHeader><CardTitle>Scan Events</CardTitle></CardHeader>
				<CardContent>
					{#if events.length > 0}
						<div class="overflow-x-auto rounded border border-border">
							<table class="w-full">
								<thead class="bg-muted/50">
									<tr class="border-b border-border">
										<th
											class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground"
											>Type</th
										>
										<th
											class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground"
											>Result</th
										>
										<th
											class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground"
											>Scanned At</th
										>
									</tr>
								</thead>
								<tbody class="divide-y divide-border">
									{#each events as event (event.id)}
										<tr class="hover:bg-muted/30">
											<td class="px-4 py-3 text-sm"
												>{EVENT_TYPE_LABELS[event.eventType] || event.eventType}</td
											>
											<td class="px-4 py-3 text-sm"
												>{SCAN_RESULT_LABELS[event.result] || event.result}</td
											>
											<td class="px-4 py-3 text-sm">{formatTime(event.scannedAt)}</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					{:else}
						<div class="flex flex-col items-center gap-2 py-6 text-muted-foreground">
							<CalendarBlank class="size-8" />
							<p class="text-sm">No scan events recorded for this day.</p>
						</div>
					{/if}
				</CardContent>
			</Card>
		</div>
	{:else if !loading && !err}
		<div class="flex flex-col items-center gap-4 py-16 text-muted-foreground">
			<CalendarBlank class="size-12" />
			<h2 class="text-xl font-semibold">Attendance not found</h2>
			<p class="text-sm">The attendance record for this date was not found.</p>
			<Button variant="outline" onclick={() => goto('/employee/history')}>Back to History</Button>
		</div>
	{/if}
</div>
