<script lang="ts">
	import { onMount } from 'svelte';
	import { employees } from '$lib/stores/employee.store';
	import type { EmployeeResponse } from '$lib/types/employee.types';

	let filterStatus = $state<string>('all');
	let searchQuery = $state('');
	let confirmAction = $state<{ id: string; status: string } | null>(null);
	let errorTimeout: ReturnType<typeof setTimeout> | null = null;

	onMount(() => {
		employees.load();
	});

	const STATUS_OPTIONS = [
		{ value: 'all', label: 'All statuses' },
		{ value: 'PENDING', label: 'Pending' },
		{ value: 'ACTIVE', label: 'Active' },
		{ value: 'SUSPENDED', label: 'Suspended' },
		{ value: 'REJECTED', label: 'Rejected' }
	] as const;

	const STATUS_STYLES: Record<string, string> = {
		PENDING: 'text-yellow-700 bg-yellow-50 border-yellow-300',
		ACTIVE: 'text-green-700 bg-green-50 border-green-300',
		SUSPENDED: 'text-red-700 bg-red-50 border-red-300',
		REJECTED: 'text-gray-700 bg-gray-50 border-gray-300'
	};

	function getFilteredEmployees(): EmployeeResponse[] {
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
	}

	function getStatusActions(
		status: string
	): { label: string; targetStatus: 'ACTIVE' | 'SUSPENDED' | 'REJECTED'; style: string }[] {
		switch (status) {
			case 'PENDING':
				return [
					{
						label: 'Approve',
						targetStatus: 'ACTIVE',
						style: 'text-green-600 hover:text-green-800'
					},
					{ label: 'Reject', targetStatus: 'REJECTED', style: 'text-red-600 hover:text-red-800' }
				];
			case 'ACTIVE':
				return [
					{
						label: 'Suspend',
						targetStatus: 'SUSPENDED',
						style: 'text-orange-600 hover:text-orange-800'
					}
				];
			case 'SUSPENDED':
				return [
					{
						label: 'Reactivate',
						targetStatus: 'ACTIVE',
						style: 'text-green-600 hover:text-green-800'
					}
				];
			default:
				return [];
		}
	}

	async function handleStatusAction(id: string, targetStatus: 'ACTIVE' | 'SUSPENDED' | 'REJECTED') {
		if (errorTimeout) clearTimeout(errorTimeout);
		confirmAction = null;
		employees.clearSuccess();
		const ok = await employees.updateStatus(id, { status: targetStatus });
		if (!ok) {
			errorTimeout = setTimeout(() => {
				employees.clearError();
				errorTimeout = null;
			}, 5000);
		}
	}

	function formatDate(iso: string): string {
		return new Date(iso).toLocaleDateString();
	}
</script>

<div class="mx-auto mt-10 max-w-4xl">
	<h1 class="mb-6 text-2xl font-bold">Employees</h1>

	{#if $employees.isLoading && $employees.employees.length === 0}
		<p class="text-gray-500">Loading...</p>
	{/if}

	{#if $employees.error}
		<div class="mb-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">
			{typeof $employees.error === 'string' ? $employees.error : JSON.stringify($employees.error)}
		</div>
	{/if}

	{#if $employees.isSuccess}
		<div
			class="mb-4 flex items-center justify-between rounded border border-green-300 bg-green-50 p-3 text-sm text-green-700"
		>
			<span>Employee status updated successfully.</span>
			<button
				type="button"
				onclick={() => employees.clearSuccess()}
				class="font-medium text-green-700 hover:text-green-900">&times;</button
			>
		</div>
	{/if}

	<div class="mb-4 flex items-center gap-4">
		<div class="flex-1">
			<input
				type="search"
				placeholder="Search by name or email..."
				bind:value={searchQuery}
				class="w-full rounded border p-2 text-sm"
			/>
		</div>
		<select bind:value={filterStatus} class="rounded border p-2 text-sm">
			{#each STATUS_OPTIONS as opt (opt.value)}
				<option value={opt.value}>{opt.label}</option>
			{/each}
		</select>
		{#if $employees.isLoading && $employees.employees.length > 0}
			<span class="text-sm text-gray-400">Updating...</span>
		{/if}
	</div>

	{#if $employees.employees.length > 0}
		{@const filtered = getFilteredEmployees()}
		{#if filtered.length > 0}
			<div class="overflow-x-auto rounded border">
				<table class="w-full text-left text-sm">
					<thead>
						<tr class="border-b bg-gray-50">
							<th class="p-3 font-medium text-gray-600">Name</th>
							<th class="p-3 font-medium text-gray-600">Email</th>
							<th class="p-3 font-medium text-gray-600">Status</th>
							<th class="p-3 font-medium text-gray-600">Registered</th>
							<th class="p-3 font-medium text-gray-600">Actions</th>
						</tr>
					</thead>
					<tbody>
						{#each filtered as emp (emp.id)}
							<tr class="border-b last:border-0 hover:bg-gray-50">
								<td class="p-3">{emp.firstName} {emp.lastName}</td>
								<td class="p-3 text-gray-600">{emp.email}</td>
								<td class="p-3">
									<span
										class="inline-block rounded border px-2 py-0.5 text-xs font-medium {STATUS_STYLES[
											emp.status
										] || ''}"
									>
										{emp.status}
									</span>
								</td>
								<td class="p-3 text-gray-500">{formatDate(emp.createdAt)}</td>
								<td class="p-3">
									{#if confirmAction && confirmAction.id === emp.id}
										<div class="flex items-center gap-2 text-xs">
											<span class="text-gray-600">Set to {confirmAction.status}?</span>
											<button
												type="button"
												onclick={() =>
													handleStatusAction(
														emp.id,
														confirmAction!.status as 'ACTIVE' | 'SUSPENDED' | 'REJECTED'
													)}
												class="font-medium text-blue-600 hover:text-blue-800"
											>
												Confirm
											</button>
											<button
												type="button"
												onclick={() => (confirmAction = null)}
												class="font-medium text-gray-500 hover:text-gray-700"
											>
												Cancel
											</button>
										</div>
									{:else}
										<div class="flex gap-2">
											{#each getStatusActions(emp.status) as action (action.targetStatus)}
												<button
													type="button"
													onclick={() =>
														(confirmAction = { id: emp.id, status: action.targetStatus })}
													class="text-sm font-medium {action.style}"
												>
													{action.label}
												</button>
											{/each}
										</div>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{:else}
			<div class="rounded border p-6 text-center">
				<p class="text-gray-600">No employees match your search criteria.</p>
			</div>
		{/if}
	{:else if !$employees.isLoading}
		<div class="rounded border p-6 text-center">
			<p class="text-gray-600">No employees found.</p>
		</div>
	{/if}
</div>
