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
	import { Trophy, ClockClockwise, XCircle, CalendarBlank } from 'phosphor-svelte';

	const RANKING_TYPES = [
		{ id: 'attendance', label: 'Assiduité', icon: Trophy, color: 'text-primary' },
		{ id: 'late', label: 'Retards', icon: ClockClockwise, color: 'text-warning' },
		{ id: 'absence', label: 'Absences', icon: XCircle, color: 'text-destructive' }
	] as const;

	const today = new Date();
	const thirtyDaysAgo = new Date(today);
	thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

	function toDateInput(d: Date): string {
		return d.toISOString().split('T')[0];
	}

	let selectedType = $state('attendance');
	let startDate = $state(toDateInput(thirtyDaysAgo));
	let endDate = $state(toDateInput(today));
	let isLoading = $state(false);
	let error = $state<string | null>(null);
	let hasLoaded = $state(false);

	onMount(() => {
		loadRankings();
	});

	async function loadRankings() {
		isLoading = true;
		error = null;
		const ok = await statistics.loadRankings(selectedType, startDate, endDate);
		if (!ok) {
			const unsub = statistics.subscribe((s) => {
				error = typeof s.error === 'string' ? s.error : 'Failed to load rankings';
				unsub();
			});
		}
		hasLoaded = true;
		isLoading = false;
	}

	function switchType(type: string) {
		selectedType = type;
		loadRankings();
	}
</script>

<div class="mx-auto mt-10 max-w-4xl">
	<h1 class="mb-2 text-2xl font-bold">Classements</h1>
	<p class="text-muted-foreground mb-6">Comparaison des performances des employés</p>

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
					onclick={loadRankings}
					disabled={isLoading}
					class="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-9 items-center gap-2 rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50"
				>
					<CalendarBlank class="size-4" />
					{isLoading ? 'Chargement...' : 'Actualiser'}
				</button>
			</div>
		</CardContent>
	</Card>

	<div class="mb-6 flex gap-2">
		{#each RANKING_TYPES as type}
			<button
				onclick={() => switchType(type.id)}
				class="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors"
				class:bg-primary={selectedType === type.id}
				class:text-primary-foreground={selectedType === type.id}
				class:bg-muted={selectedType !== type.id}
				class:text-muted-foreground={selectedType !== type.id}
			>
				<type.icon class="size-4" />
				{type.label}
			</button>
		{/each}
	</div>

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

	{#if $statistics.rankings}
		{@const data = $statistics.rankings}

		{#if data.rankings.length > 0}
			<Card>
				<CardHeader>
					<CardTitle>
						Classement — {RANKING_TYPES.find((t) => t.id === selectedType)?.label}
					</CardTitle>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead class="w-12">#</TableHead>
								<TableHead>Employé</TableHead>
								<TableHead class="text-right">Valeur</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{#each data.rankings as entry, i}
								<TableRow>
									<TableCell class="font-bold text-lg">
										{i + 1}
									</TableCell>
									<TableCell class="font-medium">
										{entry.firstName} {entry.lastName}
									</TableCell>
									<TableCell class="text-right font-medium">
										{selectedType === 'late' || selectedType === 'absence' ? entry.value : `${entry.value}%`}
									</TableCell>
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
						Aucun classement disponible pour la période sélectionnée
					</EmptyDescription>
				</EmptyHeader>
			</Empty>
		{/if}
	{/if}
</div>
