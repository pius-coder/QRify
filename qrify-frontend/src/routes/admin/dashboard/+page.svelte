<script lang="ts">
	import { onMount } from 'svelte';
	import { statistics } from '$lib/stores/statistics.store';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import { Alert, AlertTitle, AlertDescription } from '$lib/components/ui/alert/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table/index.js';
	import { EVENT_TYPE_LABELS } from '$lib/types/scan.types';
	import {
		Users,
		UserCheck,
		ClockClockwise,
		XCircle,
		WarningCircle,
		QrCode,
		ChartBar,
		Trophy,
		CalendarCheck,
		ArrowRight
	} from 'phosphor-svelte';
	import { page } from '$app/stores';

	let isLoading = $state(true);
	let error = $state<string | null>(null);

	onMount(async () => {
		const ok = await statistics.loadDashboard();
		if (ok) {
			error = null;
		} else {
			const unsub = statistics.subscribe((s) => {
				error = typeof s.error === 'string' ? s.error : 'Failed to load dashboard';
				unsub();
			});
		}
		isLoading = false;
	});

	function getEventLabel(type: string): string {
		return EVENT_TYPE_LABELS[type] ?? type;
	}

	function formatTime(iso: string): string {
		const d = new Date(iso);
		return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
	}
</script>

<div class="mx-auto mt-10 max-w-5xl">
	<h1 class="mb-2 text-2xl font-bold">Tableau de Bord</h1>
	<p class="text-muted-foreground mb-6">Vue d'ensemble de votre entreprise aujourd'hui</p>

	{#if isLoading}
		<div class="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
			{#each [1, 2, 3, 4, 5, 6] as _}
				<Skeleton class="h-28 w-full" />
			{/each}
		</div>
		<div class="mt-6">
			<Skeleton class="h-64 w-full" />
		</div>
	{/if}

	{#if error}
		<Alert variant="destructive" class="mb-4">
			<AlertTitle>Erreur</AlertTitle>
			<AlertDescription>{error}</AlertDescription>
		</Alert>
	{/if}

	{#if $statistics.dashboard}
		{@const data = $statistics.dashboard}

		<div class="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
			<Card>
				<CardHeader class="flex flex-row items-center justify-between pb-2">
					<CardTitle class="text-muted-foreground text-xs font-medium">Employés Actifs</CardTitle>
					<Users class="text-muted-foreground size-4" />
				</CardHeader>
				<CardContent>
					<p class="text-2xl font-bold">{data.activeEmployees}</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader class="flex flex-row items-center justify-between pb-2">
					<CardTitle class="text-muted-foreground text-xs font-medium">Présents</CardTitle>
					<UserCheck class="text-success size-4" />
				</CardHeader>
				<CardContent>
					<p class="text-success text-2xl font-bold">{data.presentToday}</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader class="flex flex-row items-center justify-between pb-2">
					<CardTitle class="text-muted-foreground text-xs font-medium">Retards</CardTitle>
					<ClockClockwise class="text-warning size-4" />
				</CardHeader>
				<CardContent>
					<p class="text-warning text-2xl font-bold">{data.lateToday}</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader class="flex flex-row items-center justify-between pb-2">
					<CardTitle class="text-muted-foreground text-xs font-medium">Absents</CardTitle>
					<XCircle class="text-destructive size-4" />
				</CardHeader>
				<CardContent>
					<p class="text-destructive text-2xl font-bold">{data.absentToday}</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader class="flex flex-row items-center justify-between pb-2">
					<CardTitle class="text-muted-foreground text-xs font-medium">Incomplets</CardTitle>
					<WarningCircle class="text-muted-foreground size-4" />
				</CardHeader>
				<CardContent>
					<p class="text-2xl font-bold">{data.incompletePresences}</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader class="flex flex-row items-center justify-between pb-2">
					<CardTitle class="text-muted-foreground text-xs font-medium">QR Actif</CardTitle>
					<QrCode class="text-muted-foreground size-4" />
				</CardHeader>
				<CardContent>
					{#if data.activeQr}
						<span class="text-success inline-flex items-center gap-1 text-lg font-bold">
							<span class="bg-success inline-block size-2 rounded-full"></span>Actif
						</span>
					{:else}
						<span class="text-muted-foreground inline-flex items-center gap-1 text-lg font-bold">
							<span class="bg-muted-foreground inline-block size-2 rounded-full"></span>Inactif
						</span>
					{/if}
				</CardContent>
			</Card>
		</div>

		{#if data.lastScans.length > 0}
			<Card class="mt-6">
				<CardHeader>
					<CardTitle>Derniers Scans Acceptés</CardTitle>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Employé</TableHead>
								<TableHead>Type</TableHead>
								<TableHead>Heure</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{#each data.lastScans as scan}
								<TableRow>
									<TableCell class="font-medium">
										{scan.firstName} {scan.lastName}
									</TableCell>
									<TableCell>
										<Badge variant="outline">{getEventLabel(scan.eventType)}</Badge>
									</TableCell>
									<TableCell class="text-muted-foreground">
										{formatTime(scan.scannedAt)}
									</TableCell>
								</TableRow>
							{/each}
						</TableBody>
					</Table>
				</CardContent>
			</Card>
		{:else if !isLoading}
			<Card class="mt-6">
				<CardHeader>
					<CardTitle>Derniers Scans Acceptés</CardTitle>
				</CardHeader>
				<CardContent>
					<p class="text-muted-foreground py-4 text-center">Aucun scan aujourd'hui</p>
				</CardContent>
			</Card>
		{/if}

		<div class="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
			<a
				href="/admin/statistics"
				class="border-border hover:bg-muted/50 flex items-center justify-between rounded-lg border p-4 transition-colors"
			>
				<div class="flex items-center gap-3">
					<ChartBar class="text-primary size-5" />
					<div>
						<p class="font-medium">Statistiques</p>
						<p class="text-muted-foreground text-xs">Analyses sur période</p>
					</div>
				</div>
				<ArrowRight class="text-muted-foreground size-4" />
			</a>

			<a
				href="/admin/rankings"
				class="border-border hover:bg-muted/50 flex items-center justify-between rounded-lg border p-4 transition-colors"
			>
				<div class="flex items-center gap-3">
					<Trophy class="text-primary size-5" />
					<div>
						<p class="font-medium">Classements</p>
						<p class="text-muted-foreground text-xs">Assiduité, retards, absences</p>
					</div>
				</div>
				<ArrowRight class="text-muted-foreground size-4" />
			</a>

			<a
				href="/admin/reports/weekly"
				class="border-border hover:bg-muted/50 flex items-center justify-between rounded-lg border p-4 transition-colors"
			>
				<div class="flex items-center gap-3">
					<CalendarCheck class="text-primary size-5" />
					<div>
						<p class="font-medium">Rapport Hebdo</p>
						<p class="text-muted-foreground text-xs">Par employé et par jour</p>
					</div>
				</div>
				<ArrowRight class="text-muted-foreground size-4" />
			</a>
		</div>
	{/if}
</div>
