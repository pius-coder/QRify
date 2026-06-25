<script lang="ts">
	import type { EmployeeResponse } from '$lib/types/employee.types';
	import * as Table from '$lib/components/ui/table/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import StatusBadge from '$lib/components/status-badge.svelte';
	import EmployeeConfirmDialog from '$lib/components/employee-confirm-dialog.svelte';

	let {
		employees,
		onAction
	}: {
		employees: EmployeeResponse[];
		onAction: (id: string, status: 'ACTIVE' | 'SUSPENDED' | 'REJECTED') => void;
	} = $props();

	function getActions(
		status: string
	): { label: string; targetStatus: 'ACTIVE' | 'SUSPENDED' | 'REJECTED'; variant: 'default' | 'destructive' | 'outline' }[] {
		switch (status) {
			case 'PENDING':
				return [
					{ label: 'Approve', targetStatus: 'ACTIVE', variant: 'default' },
					{ label: 'Reject', targetStatus: 'REJECTED', variant: 'destructive' }
				];
			case 'ACTIVE':
				return [{ label: 'Suspend', targetStatus: 'SUSPENDED', variant: 'destructive' }];
			case 'SUSPENDED':
				return [{ label: 'Reactivate', targetStatus: 'ACTIVE', variant: 'default' }];
			default:
				return [];
		}
	}

	function formatDate(iso: string): string {
		return new Date(iso).toLocaleDateString();
	}

	let selectedAction = $state<{ id: string; status: 'ACTIVE' | 'SUSPENDED' | 'REJECTED' } | null>(null);
</script>

<Table.Root>
	<Table.Header>
		<Table.Row>
			<Table.Head>Name</Table.Head>
			<Table.Head>Email</Table.Head>
			<Table.Head>Status</Table.Head>
			<Table.Head>Registered</Table.Head>
			<Table.Head>Actions</Table.Head>
		</Table.Row>
	</Table.Header>
	<Table.Body>
		{#each employees as emp (emp.id)}
			<Table.Row>
				<Table.Cell class="font-medium">{emp.firstName} {emp.lastName}</Table.Cell>
				<Table.Cell class="text-muted-foreground">{emp.email}</Table.Cell>
				<Table.Cell>
					<StatusBadge status={emp.status} />
				</Table.Cell>
				<Table.Cell class="text-muted-foreground">{formatDate(emp.createdAt)}</Table.Cell>
				<Table.Cell>
					<div class="flex gap-2">
						{#each getActions(emp.status) as action (action.targetStatus)}
							<Button
								variant={action.variant}
								size="xs"
								onclick={() => (selectedAction = { id: emp.id, status: action.targetStatus })}
							>
								{action.label}
							</Button>
						{/each}
					</div>
				</Table.Cell>
			</Table.Row>
		{/each}
	</Table.Body>
</Table.Root>

{#if selectedAction}
	<EmployeeConfirmDialog
		action={selectedAction}
		onConfirm={() => {
			onAction(selectedAction!.id, selectedAction!.status);
			selectedAction = null;
		}}
		onCancel={() => (selectedAction = null)}
	/>
{/if}
