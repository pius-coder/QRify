<script lang="ts">
	import { onMount } from 'svelte';
	import { employees } from '$lib/stores/employee.store';
	import { Alert, AlertTitle, AlertDescription } from '$lib/components/ui/alert/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import { Empty, EmptyTitle, EmptyDescription, EmptyHeader } from '$lib/components/ui/empty/index.js';
	import EmployeeFilters from '$lib/components/employee-filters.svelte';
	import EmployeeTable from '$lib/components/employee-table.svelte';
	import { toast } from 'svelte-sonner';
	import { Users } from 'phosphor-svelte';

	let filterStatus = $state('all');
	let searchQuery = $state('');
	let errorTimeout: ReturnType<typeof setTimeout> | null = null;

	onMount(() => {
		employees.load();
	});

	let filtered = $derived.by(() => {
		let list = $employees.employees;
		if (filterStatus !== 'all') {
			list = list.filter((e) => e.status === filterStatus);
		}
		if (searchQuery.trim()) {
			const q = searchQuery.trim().toLowerCase();
			list = list.filter(
				(e) =>
					e.firstName.toLowerCase().includes(q) ||
					e.lastName.toLowerCase().includes(q) ||
					e.email.toLowerCase().includes(q)
			);
		}
		return list;
	});

	async function handleAction(id: string, targetStatus: 'ACTIVE' | 'SUSPENDED' | 'REJECTED') {
		if (errorTimeout) clearTimeout(errorTimeout);
		employees.clearSuccess();
		const ok = await employees.updateStatus(id, { status: targetStatus });
		if (ok) {
			toast.success('Employee status updated successfully.');
		} else {
			errorTimeout = setTimeout(() => {
				employees.clearError();
				errorTimeout = null;
			}, 5000);
		}
	}
</script>

<div class="mx-auto mt-10 max-w-4xl">
	<h1 class="mb-6 text-2xl font-bold">Employees</h1>

	{#if $employees.isLoading && $employees.employees.length === 0}
		<div class="space-y-3">
			<Skeleton class="h-8 w-48" />
			<Skeleton class="h-64 w-full" />
		</div>
	{/if}

	{#if $employees.error}
		<Alert variant="destructive" class="mb-4">
			<AlertTitle>Error</AlertTitle>
			<AlertDescription>
				{typeof $employees.error === 'string' ? $employees.error : JSON.stringify($employees.error)}
			</AlertDescription>
		</Alert>
	{/if}

	<EmployeeFilters bind:searchQuery bind:filterStatus isLoading={$employees.isLoading} />

	{#if $employees.employees.length > 0}
		{#if filtered.length > 0}
			<div class="overflow-x-auto rounded border border-border">
				<EmployeeTable employees={filtered} onAction={handleAction} />
			</div>
		{:else}
			<Empty>
				<EmptyTitle>No employees match your search</EmptyTitle>
				<EmptyDescription>Try a different search term or filter.</EmptyDescription>
			</Empty>
		{/if}
	{:else if !$employees.isLoading}
		<Empty>
			<EmptyHeader>
				<Users class="size-8 text-muted-foreground" />
			</EmptyHeader>
			<EmptyTitle>No employees found</EmptyTitle>
			<EmptyDescription>Employees will appear here once they register and are approved.</EmptyDescription>
		</Empty>
	{/if}
</div>
