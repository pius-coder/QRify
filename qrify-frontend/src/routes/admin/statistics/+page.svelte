<script lang="ts">
	import { onMount } from 'svelte';
	import { statistics } from '$lib/stores/statistics.store';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import { Alert, AlertTitle, AlertDescription } from '$lib/components/ui/alert/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table/index.js';
	import { ChartBar, ClockClockwise, XCircle, Timer, CalendarBlank } from 'phosphor-svelte';

	const today = new Date();
	const thirtyDaysAgo = new Date(today);
	thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

	function toDateInput(d: Date): string {
		return d.toISOString().split('T')[0];
	}

	let startDate = $state(toDateInput(thirtyDaysAgo));
	let endDate = $state(toDateInput(today));
	let isLoading = $state(false);
	let error = $state<string | null>(null);
	let hasLoaded = $state(false);

	onMount(() => {
		loadStats();
	});

	async function loadStats() {
		isLoading = true;
		error = null;
		const ok = await statistics.loadPeriodStats(startDate, endDate);
		if (!ok) {
			const unsub = statistics.subscribe((s) => {
				error = typeof s.error === 'string' ? s.error : 'Failed to load statistics';
				unsub();
			});
		}
		hasLoaded = true;
		isLoading = false;
	}
</script>

<div class="mx-auto mt-10 max-w-4xl">
	<h1 class="mb-2 text-2xl font-bold">Statistiques</h1>
	<p class="text-muted-foreground mb-6">Analyse des présences sur une période</p>

	<Card class="mb-6">
		<CardContent class="pt-6">
			<div class="flex flex-wrap items-end gap-4">
				<div>
					<label for="startDate" class="mb-1 block text-sm font-medium">Date début</label>
					<input
						id="startDate"
						type="date"
						bind:value={startDate}
						class="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring h-9 rounded-md border px-3 py-1 text-sm focus-visible:ring-2 focus-visible:ring-offset-2"
					/>
				</div>
				<div>
					<label for="endDate" class="mb-1 block text-sm font-medium">Date fin</label>
					<input
						id="endDate"
						type="date"
						bind:value={endDate}
						class="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring h-9 rounded-md border px-3 py-1 text-sm focus-visible:ring-2 focus-visible:ring-offset-2"
					/>
				</div>
				<button
					onclick={loadStats}
					disabled={isLoading}
					class="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-9 items-center gap-2 rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50"
				>
					<CalendarBlank class="size-4" />
					{isLoading ? 'Chargement...' : 'Analyser'}
				</button>
			</div>
		</CardContent>
	</Card>

	{#if isLoading && !hasLoaded}
		<div class="grid grid-cols-2 gap-4 md:grid-cols-4">
			{#each [1, 2, 3, 4] as _}
				<Skeleton class="h-24 w-full" />
			{/each}
		</div>
		<div class="mt-6">
			<Skeleton class="h-48 w-full" />
		</div>
	{/if}

	{#if error}
		<Alert variant="destructive" class="mb-4">
			<AlertTitle>Erreur</AlertTitle>
			<AlertDescription>{error}</AlertDescription>
		</Alert>
	{/if}

	{#if $statistics.periodStats}
		{@const data = $statistics.periodStats}

		<div class="grid grid-cols-2 gap-4 md:grid-cols-4">
			<Card>
				<CardHeader class="flex flex-row items-center justify-between pb-2">
					<CardTitle class="text-muted-foreground text-xs font-medium">Taux de Présence</CardTitle>
					<ChartBar class="text-primary size-4" />
				</CardHeader>
				<CardContent>
					<p class="text-2xl font-bold">{data.attendanceRate}%</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader class="flex flex-row items-center justify-between pb-2">
					<CardTitle class="text-muted-foreground text-xs font-medium">Retards</CardTitle>
					<ClockClockwise class="text-warning size-4" />
				</CardHeader>
				<CardContent>
					<p class="text-warning text-2xl font-bold">{data.lateCount}</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader class="flex flex-row items-center justify-between pb-2">
					<CardTitle class="text-muted-foreground text-xs font-medium">Absences</CardTitle>
					<XCircle class="text-destructive size-4" />
				</CardHeader>
				<CardContent>
					<p class="text-destructive text-2xl font-bold">{data.absenceCount}</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader class="flex flex-row items-center justify-between pb-2">
					<CardTitle class="text-muted-foreground text-xs font-medium">Heures Sup.</CardTitle>
					<Timer class="text-muted-foreground size-4" />
				</CardHeader>
				<CardContent>
					<p class="text-2xl font-bold">{data.overtimeTotal}h</p>
				</CardContent>
			</Card>
		</div>

		{#if data.dailyChart.length > 0}
			<Card class="mt-6">
				<CardHeader>
					<CardTitle>Répartition Quotidienne</CardTitle>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Date</TableHead>
								<TableHead>Présents</TableHead>
								<TableHead>Retards</TableHead>
								<TableHead>Absents</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{#each data.dailyChart as day}
								<TableRow>
									<TableCell class="font-medium">{day.workDate}</TableCell>
									<TableCell>
										<span class="text-success font-medium">{day.present}</span>
									</TableCell>
									<TableCell>
										<span class="text-warning font-medium">{day.late}</span>
									</TableCell>
									<TableCell>
										<span class="text-destructive font-medium">{day.absent}</span>
									</TableCell>
								</TableRow>
							{/each}
						</TableBody>
					</Table>
				</CardContent>
			</Card>
		{/if}
	{:else if hasLoaded && !isLoading}
		<Card>
			<CardContent>
				<p class="text-muted-foreground py-8 text-center">
					Aucune donnée pour la période sélectionnée
				</p>
			</CardContent>
		</Card>
	{/if}
</div>
