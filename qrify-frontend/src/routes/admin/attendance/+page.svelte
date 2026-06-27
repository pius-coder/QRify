<script lang="ts">
	import { onMount } from 'svelte';
	import { attendances } from '$lib/stores/attendance.store';
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
	import { CalendarBlank, MagnifyingGlass } from 'phosphor-svelte';

	const STATUS_OPTIONS = ['all', 'PRESENT', 'LATE', 'ABSENT', 'INCOMPLETE'];

	let filterDate = $state('');
	let filterStatus = $state('all');
	let searchQuery = $state('');
	let currentPage = $state(1);

	onMount(() => {
		loadData();
	});

	function loadData() {
		const params: Record<string, string | number> = { page: currentPage, limit: 20 };
		if (filterDate) params.date = filterDate;
		if (filterStatus !== 'all') params.status = filterStatus;
		if (searchQuery.trim()) params.search = searchQuery.trim();
		attendances.load(params);
	}

	function handleFilterChange() {
		currentPage = 1;
		loadData();
	}

	function goToPage(page: number) {
		currentPage = page;
		loadData();
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

	let totalPages = $derived(
		$attendances.pagination
			? Math.ceil($attendances.pagination.total / $attendances.pagination.limit)
			: 0
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

<div class="mx-auto mt-10 max-w-6xl">
	<h1 class="mb-6 text-2xl font-bold">Attendances</h1>

	<div class="mb-4 flex flex-wrap items-end gap-3">
		<div>
			<label for="date-filter" class="mb-1 block text-sm font-medium text-muted-foreground"
				>Date</label
			>
			<input
				id="date-filter"
				type="date"
				bind:value={filterDate}
				oninput={handleFilterChange}
				class="block rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
			/>
		</div>

		<div>
			<label for="status-filter" class="mb-1 block text-sm font-medium text-muted-foreground"
				>Status</label
			>
			<select
				id="status-filter"
				bind:value={filterStatus}
				onchange={handleFilterChange}
				class="block rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
			>
				{#each STATUS_OPTIONS as status}
					<option value={status}>
						{status === 'all' ? 'All Statuses' : ATTENDANCE_STATUS_LABELS[status]}
					</option>
				{/each}
			</select>
		</div>

		<div>
			<label for="search" class="mb-1 block text-sm font-medium text-muted-foreground">Search</label
			>
			<div class="relative">
				<MagnifyingGlass
					class="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
				/>
				<input
					id="search"
					type="text"
					placeholder="Name or email..."
					bind:value={searchQuery}
					oninput={handleFilterChange}
					class="block w-60 rounded-md border border-input bg-background py-2 pl-8 pr-3 text-sm shadow-xs focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
				/>
			</div>
		</div>
	</div>

	{#if $attendances.isLoading && $attendances.attendances.length === 0}
		<div class="space-y-3">
			<Skeleton class="h-8 w-48" />
			<Skeleton class="h-64 w-full" />
		</div>
	{/if}

	{#if $attendances.error}
		<Alert variant="destructive" class="mb-4">
			<AlertTitle>Error</AlertTitle>
			<AlertDescription>
				{typeof $attendances.error === 'string'
					? $attendances.error
					: JSON.stringify($attendances.error)}
			</AlertDescription>
		</Alert>
	{/if}

	{#if $attendances.attendances.length > 0}
		<div class="overflow-x-auto rounded border border-border">
			<table class="w-full">
				<thead class="bg-muted/50">
					<tr class="border-b border-border">
						<th
							class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground"
							>Employee</th
						>
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
					{#each $attendances.attendances as a (a.id)}
						<tr class="hover:bg-muted/30">
							<td class="px-4 py-3">
								<div class="font-medium">{a.firstName} {a.lastName}</div>
								<div class="text-xs text-muted-foreground">{a.email}</div>
							</td>
							<td class="px-4 py-3 text-sm">{a.workDate}</td>
							<td class="px-4 py-3">
								<Badge
									variant={(ATTENDANCE_STATUS_VARIANTS[a.status] || 'default') as BadgeVariant}
								>
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
	{:else if !$attendances.isLoading}
		<Empty>
			<EmptyHeader>
				<CalendarBlank class="size-8 text-muted-foreground" />
			</EmptyHeader>
			<EmptyTitle>No attendances found</EmptyTitle>
			<EmptyDescription>
				{#if filterDate || filterStatus !== 'all' || searchQuery.trim()}
					No records match your filters. Try a different date, status, or search term.
				{:else}
					Attendance records will appear here once employees start scanning QR codes.
				{/if}
			</EmptyDescription>
		</Empty>
	{/if}
</div>
