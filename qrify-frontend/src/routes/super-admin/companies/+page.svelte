<script lang="ts">
	import { companies } from '$lib/stores/super-admin.store';
	import * as Table from '$lib/components/ui/table/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { NativeSelect } from '$lib/components/ui/native-select/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Alert, AlertTitle, AlertDescription } from '$lib/components/ui/alert/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import { Empty, EmptyTitle, EmptyDescription, EmptyHeader } from '$lib/components/ui/empty/index.js';
	import StatusBadge from '$lib/components/status-badge.svelte';
	import {
		Pagination,
		PaginationContent,
		PaginationItem,
		PaginationLink,
		PaginationPrevButton,
		PaginationNextButton
	} from '$lib/components/ui/pagination/index.js';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import { toast } from 'svelte-sonner';
	import { Buildings } from 'phosphor-svelte';

	let searchQuery = $state('');
	let filterStatus = $state('all');
	let currentPage = $state(1);
	let pendingAction = $state<{ id: string; status: 'ACTIVE' | 'SUSPENDED'; name: string } | null>(null);
	const PAGE_SIZE = 10;

	$effect(() => {
		searchQuery;
		filterStatus;
		currentPage;
		loadPage();
	});

	async function loadPage() {
		await companies.load({
			search: searchQuery || undefined,
			status: filterStatus !== 'all' ? filterStatus : undefined,
			page: currentPage,
			limit: PAGE_SIZE
		});
	}

	async function handleStatusAction() {
		if (!pendingAction) return;
		const { id, status } = pendingAction;
		const ok = await companies.updateStatus(id, status);
		if (ok) {
			pendingAction = null;
			toast.success(`Company ${status === 'ACTIVE' ? 'reactivated' : 'suspended'} successfully.`);
		}
	}

	function formatDate(iso: string): string {
		return new Date(iso).toLocaleDateString();
	}
</script>

<div class="mx-auto mt-10 max-w-5xl">
	<h1 class="mb-6 text-2xl font-bold">Companies</h1>

	{#if $companies.error}
		<Alert variant="destructive" class="mb-4">
			<AlertTitle>Error</AlertTitle>
			<AlertDescription>
				{typeof $companies.error === 'string' ? $companies.error : JSON.stringify($companies.error)}
			</AlertDescription>
		</Alert>
	{/if}

	<div class="mb-4 flex items-center gap-4">
		<div class="relative flex-1">
			<Input
				type="search"
				placeholder="Search by name or code..."
				bind:value={searchQuery}
			/>
		</div>
		<NativeSelect bind:value={filterStatus}>
			<option value="all">All statuses</option>
			<option value="ACTIVE">Active</option>
			<option value="SUSPENDED">Suspended</option>
		</NativeSelect>
	</div>

	{#if $companies.isLoading && $companies.companies.length === 0}
		<div class="space-y-3">
			<Skeleton class="h-64 w-full" />
		</div>
	{/if}

	{#if $companies.companies.length > 0}
		<div class="overflow-x-auto rounded border border-border">
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head>Name</Table.Head>
						<Table.Head>Code</Table.Head>
						<Table.Head>Status</Table.Head>
						<Table.Head>Created</Table.Head>
						<Table.Head>Actions</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each $companies.companies as comp (comp.id)}
						<Table.Row>
							<Table.Cell class="font-medium">{comp.name}</Table.Cell>
							<Table.Cell>
								<code class="bg-muted rounded px-1.5 py-0.5 font-mono text-xs">{comp.companyCode}</code>
							</Table.Cell>
							<Table.Cell>
								<StatusBadge status={comp.status} />
							</Table.Cell>
							<Table.Cell class="text-muted-foreground text-xs">{formatDate(comp.createdAt)}</Table.Cell>
							<Table.Cell>
								{#if comp.status === 'ACTIVE'}
									<Button
										variant="destructive"
										size="xs"
										onclick={() => (pendingAction = { id: comp.id, status: 'SUSPENDED', name: comp.name })}
									>
										Suspend
									</Button>
								{:else if comp.status === 'SUSPENDED'}
									<Button
										variant="default"
										size="xs"
										onclick={() => (pendingAction = { id: comp.id, status: 'ACTIVE', name: comp.name })}
									>
										Reactivate
									</Button>
								{/if}
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</div>

		{#if $companies.pagination && $companies.pagination.totalPages > 1}
			<div class="mt-4">
				<Pagination
					count={$companies.pagination.total}
					perPage={PAGE_SIZE}
					bind:page={currentPage}
				>
					<PaginationContent>
						<PaginationItem>
							<PaginationPrevButton disabled={currentPage <= 1} />
						</PaginationItem>
						{#each Array.from({ length: $companies.pagination.totalPages }, (_, i) => i + 1) as pageNum}
							<PaginationItem>
								<PaginationLink page={{ value: pageNum, type: 'page' } as any} isActive={pageNum === currentPage} />
							</PaginationItem>
						{/each}
						<PaginationItem>
							<PaginationNextButton disabled={currentPage >= ($companies.pagination.totalPages)} />
						</PaginationItem>
					</PaginationContent>
				</Pagination>
			</div>
		{/if}
	{:else if !$companies.isLoading}
		<Empty>
			<EmptyHeader>
				<Buildings class="size-8 text-muted-foreground" />
			</EmptyHeader>
			<EmptyTitle>No companies found</EmptyTitle>
			<EmptyDescription>
				{searchQuery || filterStatus !== 'all' ? 'Try different search or filter.' : 'No companies have been registered yet.'}
			</EmptyDescription>
		</Empty>
	{/if}
</div>

{#if pendingAction}
	<AlertDialog.AlertDialog open={true}>
		<AlertDialog.AlertDialogContent>
			<AlertDialog.AlertDialogHeader>
				<AlertDialog.AlertDialogTitle>Confirm action</AlertDialog.AlertDialogTitle>
				<AlertDialog.AlertDialogDescription>
					Are you sure you want to <strong>{pendingAction.status === 'SUSPENDED' ? 'suspend' : 'reactivate'}</strong> <strong>{pendingAction.name}</strong>?
				</AlertDialog.AlertDialogDescription>
			</AlertDialog.AlertDialogHeader>
			<AlertDialog.AlertDialogFooter>
				<AlertDialog.AlertDialogCancel onclick={() => (pendingAction = null)}>Cancel</AlertDialog.AlertDialogCancel>
				<AlertDialog.AlertDialogAction onclick={handleStatusAction}>Confirm</AlertDialog.AlertDialogAction>
			</AlertDialog.AlertDialogFooter>
		</AlertDialog.AlertDialogContent>
	</AlertDialog.AlertDialog>
{/if}
