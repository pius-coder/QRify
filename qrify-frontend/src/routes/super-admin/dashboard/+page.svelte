<script lang="ts">
	import { onMount } from 'svelte';
	import { getStatistics } from '$lib/api/super-admin.api';
	import type { SuperAdminStatistics } from '$lib/types/super-admin.types';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import { Alert, AlertTitle, AlertDescription } from '$lib/components/ui/alert/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import { Buildings, Users, QrCode, CalendarCheck } from 'phosphor-svelte';

	let stats = $state<SuperAdminStatistics | null>(null);
	let isLoading = $state(true);
	let error = $state<string | null>(null);

	onMount(async () => {
		try {
			const result = await getStatistics();
			stats = result.statistics;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load statistics';
		} finally {
			isLoading = false;
		}
	});
</script>

<div class="mx-auto mt-10 max-w-4xl">
	<h1 class="mb-6 text-2xl font-bold">Super Admin Dashboard</h1>

	{#if isLoading}
		<div class="grid grid-cols-2 gap-4 md:grid-cols-4">
			{#each [1, 2, 3, 4] as _}
				<Skeleton class="h-24 w-full" />
			{/each}
		</div>
	{/if}

	{#if error}
		<Alert variant="destructive" class="mb-4">
			<AlertTitle>Error</AlertTitle>
			<AlertDescription>{error}</AlertDescription>
		</Alert>
	{/if}

	{#if stats}
		<div class="grid grid-cols-2 gap-4 md:grid-cols-4">
			<Card>
				<CardHeader class="flex flex-row items-center justify-between pb-2">
					<CardTitle class="text-muted-foreground text-xs font-medium">Total Companies</CardTitle>
					<Buildings class="text-muted-foreground size-4" />
				</CardHeader>
				<CardContent>
					<p class="text-2xl font-bold">{stats.totalCompanies}</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader class="flex flex-row items-center justify-between pb-2">
					<CardTitle class="text-muted-foreground text-xs font-medium">Active / Suspended</CardTitle>
					<Buildings class="text-muted-foreground size-4" />
				</CardHeader>
				<CardContent class="space-y-1">
					<p class="text-success text-lg font-bold">{stats.activeCompanies}</p>
					<p class="text-destructive text-lg font-bold">{stats.suspendedCompanies}</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader class="flex flex-row items-center justify-between pb-2">
					<CardTitle class="text-muted-foreground text-xs font-medium">Total Employees</CardTitle>
					<Users class="text-muted-foreground size-4" />
				</CardHeader>
				<CardContent>
					<p class="text-2xl font-bold">{stats.totalEmployees}</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader class="flex flex-row items-center justify-between pb-2">
					<CardTitle class="text-muted-foreground text-xs font-medium">Today's Scans</CardTitle>
					<QrCode class="text-muted-foreground size-4" />
				</CardHeader>
				<CardContent>
					<p class="text-2xl font-bold">{stats.todayScans}</p>
				</CardContent>
			</Card>
		</div>

		<Card class="mt-6">
			<CardHeader class="flex flex-row items-center justify-between">
				<CardTitle>Period Attendance</CardTitle>
				<CalendarCheck class="text-muted-foreground size-4" />
			</CardHeader>
			<CardContent>
				<p class="text-3xl font-bold">{stats.periodAttendance}</p>
				<p class="text-muted-foreground mt-1 text-xs">Total attendance records in the current period</p>
			</CardContent>
		</Card>
	{/if}
</div>
