<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { employeeSelf } from '$lib/stores/employee-self.store';
	import { Alert, AlertTitle, AlertDescription } from '$lib/components/ui/alert/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import {
		Pagination,
		PaginationContent,
		PaginationItem,
		PaginationLink,
		PaginationPrevButton,
		PaginationNextButton
	} from '$lib/components/ui/pagination/index.js';
	import {
		Empty,
		EmptyTitle,
		EmptyDescription,
		EmptyHeader
	} from '$lib/components/ui/empty/index.js';
	import {
		ATTENDANCE_STATUS_LABELS,
		ATTENDANCE_STATUS_VARIANTS
	} from '$lib/types/attendance.types';
	import type { BadgeVariant } from '$lib/components/ui/badge/badge.svelte';
	import { CalendarBlank } from 'phosphor-svelte';

	const PAGE_SIZE = 20;

	let startDate = $state('');
	let endDate = $state('');
	let currentPage = $state(1);

	onMount(() => {
		loadData();
	});

	function loadData() {
		employeeSelf.loadHistory(startDate || undefined, endDate || undefined);
	}

	function handleFilterChange() {
		currentPage = 1;
		loadData();
	}

	function goToPage(page: number) {
		currentPage = page;
	}

	function viewDay(date: string) {
		goto(`/employee/history/${date}`);
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

	function getStatusVariant(status: string): BadgeVariant {
		return (ATTENDANCE_STATUS_VARIANTS[status] || 'outline') as BadgeVariant;
	}

	let totalPages = $derived(Math.max(1, Math.ceil($employeeSelf.history.total / PAGE_SIZE)));
	let paginated = $derived(
		$employeeSelf.history.attendances.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
	);
	let pageNumbers = $derived.by(() => {
		const pages: number[] = [];
		const maxVisible = 5;
		const total = totalPages;
		if (total <= maxVisible) {
			for (let i = 1; i <= total; i++) pages.push(i);
		} else {
			let start = Math.max(1, currentPage - 2);
			let end = Math.min(total, start + maxVisible - 1);
			if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
			for (let i = start; i <= end; i++) pages.push(i);
		}
		return pages;
	});
</script>

<div class="mx-auto mt-10 max-w-4xl">
	<h1 class="mb-6 text-2xl font-bold">Attendance History</h1>

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

	<!-- Loading -->
	{#if $employeeSelf.history.isLoading && $employeeSelf.history.attendances.length === 0}
		<div class="space-y-3">
			<Skeleton class="h-8 w-48" />
			<Skeleton class="h-64 w-full" />
		</div>
	{/if}

	<!-- Error -->
	{#if $employeeSelf.history.error}
		<Alert variant="destructive" class="mb-4">
			<AlertTitle>Error</AlertTitle>
			<AlertDescription
				>{typeof $employeeSelf.history.error === 'string'
					? $employeeSelf.history.error
					: JSON.stringify($employeeSelf.history.error)}</AlertDescription
			>
		</Alert>
	{/if}

	<!-- Data -->
	{#if paginated.length > 0}
		<div class="overflow-x-auto rounded border border-border">
			<table class="w-full">
				<thead class="bg-muted/50">
					<tr class="border-b border-border">
						<th
							class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground"
							>Date</th
						>
						<th
							class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground"
							>Status</th
						>
						<th
							class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground"
							>Arrival</th
						>
						<th
							class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground"
							>Departure</th
						>
						<th
							class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground"
							>Worked</th
						>
					</tr>
				</thead>
				<tbody class="divide-y divide-border">
					{#each paginated as a (a.id)}
						<tr class="cursor-pointer hover:bg-muted/30" onclick={() => viewDay(a.workDate)}>
							<td class="px-4 py-3 text-sm font-medium">{a.workDate}</td>
							<td class="px-4 py-3">
								<Badge variant={getStatusVariant(a.status)}>
									{ATTENDANCE_STATUS_LABELS[a.status] || a.status}
								</Badge>
							</td>
							<td class="px-4 py-3 text-sm">{formatTime(a.arrivalAt)}</td>
							<td class="px-4 py-3 text-sm">{formatTime(a.departureAt)}</td>
							<td class="px-4 py-3 text-sm">{formatMinutes(a.workedMinutes)}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<!-- Pagination -->
		{#if totalPages > 1}
			<div class="mt-4">
				<Pagination count={totalPages} perPage={1} bind:page={currentPage}>
					<PaginationContent>
						<PaginationItem>
							<PaginationPrevButton
								disabled={currentPage <= 1}
								onclick={() => goToPage(currentPage - 1)}
							/>
						</PaginationItem>
						{#each pageNumbers as p}
							<PaginationItem>
								<PaginationLink
									page={{ value: p, type: 'page' }}
									isActive={p === currentPage}
									onclick={() => goToPage(p)}
								>
									{p}
								</PaginationLink>
							</PaginationItem>
						{/each}
						<PaginationItem>
							<PaginationNextButton
								disabled={currentPage >= totalPages}
								onclick={() => goToPage(currentPage + 1)}
							/>
						</PaginationItem>
					</PaginationContent>
				</Pagination>
			</div>
		{/if}
	{:else if !$employeeSelf.history.isLoading}
		<Empty>
			<EmptyHeader><CalendarBlank class="size-8 text-muted-foreground" /></EmptyHeader>
			<EmptyTitle>No attendance records found</EmptyTitle>
			<EmptyDescription>
				{#if startDate || endDate}
					No records match your date range. Try a different range.
				{:else}
					Attendance records will appear here once you start scanning QR codes.
				{/if}
			</EmptyDescription>
		</Empty>
	{/if}
</div>
