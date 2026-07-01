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
	import {
		Empty,
		EmptyTitle,
		EmptyDescription,
		EmptyHeader
	} from '$lib/components/ui/empty/index.js';
	import { CalendarBlank, ArrowLeft, ArrowRight } from 'phosphor-svelte';

	function getWeekNumber(date: Date): { year: number; week: number } {
		const d = new Date(date);
		d.setHours(0, 0, 0, 0);
		d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
		const week = Math.floor(
			(d.getTime() - new Date(d.getFullYear(), 0, 4).getTime()) / 86400000 / 7 + 1
		);
		return { year: d.getFullYear(), week: week > 52 && d.getMonth() === 0 ? 1 : week };
	}

	function getWeekRange(year: number, week: number): string {
		const first = new Date(year, 0, 1 + (week - 1) * 7);
		const day = first.getDay();
		const mon = new Date(first);
		mon.setDate(mon.getDate() - ((day + 6) % 7));
		const sun = new Date(mon);
		sun.setDate(sun.getDate() + 6);
		return `${mon.toLocaleDateString('fr-FR')} — ${sun.toLocaleDateString('fr-FR')}`;
	}

	const current = getWeekNumber(new Date());

	let currentYear = $state(current.year);
	let currentWeek = $state(current.week);
	let isLoading = $state(false);
	let error = $state<string | null>(null);
	let hasLoaded = $state(false);

	onMount(() => {
		loadReport();
	});

	async function loadReport() {
		isLoading = true;
		error = null;
		const ok = await statistics.loadWeeklyReport(currentYear, currentWeek);
		if (!ok) {
			const unsub = statistics.subscribe((s) => {
				error = typeof s.error === 'string' ? s.error : 'Failed to load report';
				unsub();
			});
		}
		hasLoaded = true;
		isLoading = false;
	}

	function prevWeek() {
		if (currentWeek <= 1) {
			currentYear--;
			currentWeek = 52;
		} else {
			currentWeek--;
		}
		loadReport();
	}

	function nextWeek() {
		if (currentWeek >= 52) {
			currentYear++;
			currentWeek = 1;
		} else {
			currentWeek++;
		}
		loadReport();
	}

	function thisWeek() {
		const now = getWeekNumber(new Date());
		currentYear = now.year;
		currentWeek = now.week;
		loadReport();
	}
</script>

<div class="mx-auto mt-10 max-w-5xl">
	<h1 class="mb-2 text-2xl font-bold">Rapport Hebdomadaire</h1>
	<p class="text-muted-foreground mb-6">Présences par employé, jour par jour</p>

	<Card class="mb-6">
		<CardContent class="pt-6">
			<div class="flex flex-wrap items-center justify-between gap-4">
				<div class="flex items-center gap-3">
					<button
						onclick={prevWeek}
						class="border-input hover:bg-muted inline-flex h-9 w-9 items-center justify-center rounded-md border"
					>
						<ArrowLeft class="size-4" />
					</button>

					<div class="text-center">
						<p class="text-sm font-medium">
							Semaine {currentWeek} — {currentYear}
						</p>
						<p class="text-muted-foreground text-xs">
							{getWeekRange(currentYear, currentWeek)}
						</p>
					</div>

					<button
						onclick={nextWeek}
						class="border-input hover:bg-muted inline-flex h-9 w-9 items-center justify-center rounded-md border"
					>
						<ArrowRight class="size-4" />
					</button>
				</div>

				<button
					onclick={thisWeek}
					class="border-input hover:bg-muted inline-flex h-9 items-center gap-2 rounded-md border px-4 text-sm font-medium"
				>
					<CalendarBlank class="size-4" />
					Cette semaine
				</button>
			</div>
		</CardContent>
	</Card>

	{#if isLoading}
		<div class="space-y-2">
			{#each [1, 2, 3, 4, 5] as _}
				<Skeleton class="h-12 w-full" />
			{/each}
		</div>
	{/if}

	{#if error}
		<Alert variant="destructive" class="mb-4">
			<AlertTitle>Erreur</AlertTitle>
			<AlertDescription>{error}</AlertDescription>
		</Alert>
	{/if}

	{#if $statistics.weeklyReport}
		{@const data = $statistics.weeklyReport}

		{#if data.entries.length > 0}
			<Card>
				<CardContent class="p-0">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Employé</TableHead>
								<TableHead class="text-center">Présences</TableHead>
								<TableHead class="text-center">Retards</TableHead>
								<TableHead class="text-center">Absences</TableHead>
								<TableHead class="text-right">Min. Retard</TableHead>
								<TableHead class="text-right">Min. Travaillées</TableHead>
								<TableHead class="text-right">Heures Sup.</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{#each data.entries as entry}
								<TableRow>
									<TableCell class="font-medium">
										{entry.firstName} {entry.lastName}
									</TableCell>
									<TableCell class="text-center">
										<span class="text-success font-medium">{entry.daysPresent}</span>
									</TableCell>
									<TableCell class="text-center">
										<span class="text-warning font-medium">{entry.daysLate}</span>
									</TableCell>
									<TableCell class="text-center">
										<span class="text-destructive font-medium">{entry.daysAbsent}</span>
									</TableCell>
									<TableCell class="text-right">{entry.lateMinutes}min</TableCell>
									<TableCell class="text-right">{entry.workedMinutes}min</TableCell>
									<TableCell class="text-right">{entry.overtimeMinutes}min</TableCell>
								</TableRow>
							{/each}
						</TableBody>
					</Table>
				</CardContent>
			</Card>
		{:else}
			<Empty>
				<EmptyHeader>
					<EmptyTitle>Aucune donnée</EmptyTitle>
					<EmptyDescription>
						Aucun rapport disponible pour la semaine sélectionnée
					</EmptyDescription>
				</EmptyHeader>
			</Empty>
		{/if}
	{/if}
</div>
