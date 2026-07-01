<script lang="ts">
	import { onMount } from 'svelte';
	import { employeeSelf } from '$lib/stores/employee-self.store';
	import { Alert, AlertTitle, AlertDescription } from '$lib/components/ui/alert/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import {
		Card,
		CardHeader,
		CardTitle,
		CardContent,
		CardDescription
	} from '$lib/components/ui/card/index.js';
	import {
		Empty,
		EmptyTitle,
		EmptyDescription,
		EmptyHeader
	} from '$lib/components/ui/empty/index.js';
	import { ChartBar } from 'phosphor-svelte';

	let startDate = $state('');
	let endDate = $state('');

	onMount(() => {
		loadData();
	});

	function loadData() {
		employeeSelf.loadSummary(startDate || undefined, endDate || undefined);
	}

	function handleFilterChange() {
		loadData();
	}

	function formatMinutes(mins: number): string {
		if (mins <= 0) return '0m';
		const h = Math.floor(mins / 60);
		const m = mins % 60;
		if (h > 0) return `${h}h ${m}m`;
		return `${m}m`;
	}

	let summary = $derived($employeeSelf.summary.summary);
	let loading = $derived($employeeSelf.summary.isLoading);
	let err = $derived($employeeSelf.summary.error);
</script>

<div class="mx-auto mt-10 max-w-3xl">
	<h1 class="mb-6 text-2xl font-bold">Attendance Statistics</h1>

	<!-- Filters -->
	<div class="mb-4 flex flex-wrap items-end gap-3">
		<div>
			<label for="start-date" class="mb-1 block text-sm font-medium text-muted-foreground"
				>From</label
			>
			<input
				id="start-date"
				type="date"
				bind:value={startDate}
				oninput={handleFilterChange}
				class="block rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
			/>
		</div>
		<div>
			<label for="end-date" class="mb-1 block text-sm font-medium text-muted-foreground">To</label>
			<input
				id="end-date"
				type="date"
				bind:value={endDate}
				oninput={handleFilterChange}
				class="block rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
			/>
		</div>
	</div>

	{#if loading}
		<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
			<Skeleton class="h-32 w-full" />
			<Skeleton class="h-32 w-full" />
			<Skeleton class="h-32 w-full" />
			<Skeleton class="h-32 w-full" />
			<Skeleton class="h-32 w-full" />
			<Skeleton class="h-32 w-full" />
		</div>
	{/if}

	{#if err}
		<Alert variant="destructive" class="mb-4">
			<AlertTitle>Error</AlertTitle>
			<AlertDescription>{typeof err === 'string' ? err : JSON.stringify(err)}</AlertDescription>
		</Alert>
	{/if}

	{#if summary && summary.totalDays === 0 && !loading}
		<Empty>
			<EmptyHeader><ChartBar class="size-8 text-muted-foreground" /></EmptyHeader>
			<EmptyTitle>No statistics yet</EmptyTitle>
			<EmptyDescription>
				Statistics will appear once you have attendance records in the selected date range.
			</EmptyDescription>
		</Empty>
	{:else if summary && !loading}
		<!-- Day counts -->
		<div class="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
			<Card>
				<CardHeader class="pb-2">
					<CardDescription>Total Days</CardDescription>
					<CardTitle class="text-3xl">{summary.totalDays}</CardTitle>
				</CardHeader>
			</Card>
			<Card>
				<CardHeader class="pb-2">
					<CardDescription>Present</CardDescription>
					<CardTitle class="text-3xl text-green-600">{summary.presentDays}</CardTitle>
				</CardHeader>
			</Card>
			<Card>
				<CardHeader class="pb-2">
					<CardDescription>Late</CardDescription>
					<CardTitle class="text-3xl text-amber-600">{summary.lateDays}</CardTitle>
				</CardHeader>
			</Card>
			<Card>
				<CardHeader class="pb-2">
					<CardDescription>Absent</CardDescription>
					<CardTitle class="text-3xl text-red-600">{summary.absentDays}</CardTitle>
				</CardHeader>
			</Card>
		</div>

		<!-- Minutes totals -->
		<Card>
			<CardHeader><CardTitle>Time Totals</CardTitle></CardHeader>
			<CardContent>
				<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
					<div class="rounded-lg border border-border p-4 text-center">
						<p class="text-sm text-muted-foreground">Late Minutes</p>
						<p class="mt-1 text-2xl font-bold text-amber-600">
							{formatMinutes(summary.totalLateMinutes)}
						</p>
					</div>
					<div class="rounded-lg border border-border p-4 text-center">
						<p class="text-sm text-muted-foreground">Worked Minutes</p>
						<p class="mt-1 text-2xl font-bold">{formatMinutes(summary.totalWorkedMinutes)}</p>
					</div>
					<div class="rounded-lg border border-border p-4 text-center">
						<p class="text-sm text-muted-foreground">Overtime Minutes</p>
						<p class="mt-1 text-2xl font-bold text-green-600">
							{formatMinutes(summary.totalOvertimeMinutes)}
						</p>
					</div>
				</div>
			</CardContent>
		</Card>
	{/if}
</div>
