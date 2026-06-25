<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { getCompany, updateCompanyStatus } from '$lib/api/super-admin.api';
	import type { CompanyDetail } from '$lib/types/super-admin.types';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Alert, AlertTitle, AlertDescription } from '$lib/components/ui/alert/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import StatusBadge from '$lib/components/status-badge.svelte';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import { toast } from 'svelte-sonner';
	import { ArrowLeft } from 'phosphor-svelte';

	let companyDetail = $state<CompanyDetail | null>(null);
	let isLoading = $state(true);
	let error = $state<string | null>(null);
	let confirmStatus = $state<'ACTIVE' | 'SUSPENDED' | null>(null);

	onMount(async () => {
		const id = $page.params.id as string;
		try {
			const result = await getCompany(id);
			companyDetail = result.company;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load company';
		} finally {
			isLoading = false;
		}
	});

	async function handleStatusAction() {
		if (!confirmStatus || !companyDetail) return;
		try {
			await updateCompanyStatus(companyDetail.id, confirmStatus);
			companyDetail = { ...companyDetail, status: confirmStatus };
			toast.success(`Company ${confirmStatus === 'ACTIVE' ? 'reactivated' : 'suspended'} successfully.`);
			confirmStatus = null;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to update status';
		}
	}

	function formatDate(iso: string): string {
		return new Date(iso).toLocaleDateString();
	}
</script>

<div class="mx-auto mt-10 max-w-2xl">
	<Button variant="ghost" onclick={() => goto('/super-admin/companies')} class="mb-4">
		<ArrowLeft class="size-4" />
		Back to companies
	</Button>

	{#if isLoading}
		<div class="space-y-4">
			<Skeleton class="h-8 w-48" />
			<Skeleton class="h-48 w-full" />
		</div>
	{/if}

	{#if error}
		<Alert variant="destructive">
			<AlertTitle>Error</AlertTitle>
			<AlertDescription>{error}</AlertDescription>
		</Alert>
	{/if}

	{#if companyDetail}
		<Card>
			<CardHeader>
				<CardTitle>{companyDetail.name}</CardTitle>
			</CardHeader>
			<CardContent>
				<div class="mb-4">
					<span class="text-muted-foreground text-xs font-medium">Company code</span>
					<p><code class="bg-muted rounded px-2 py-0.5 font-mono">{companyDetail.companyCode}</code></p>
				</div>

				<div class="mb-4">
					<span class="text-muted-foreground text-xs font-medium">Status</span>
					<div class="mt-1">
						<StatusBadge status={companyDetail.status} />
					</div>
				</div>

				<div class="mb-4">
					<span class="text-muted-foreground text-xs font-medium">Timezone</span>
					<p>{companyDetail.timezone}</p>
				</div>

				<div class="mb-4">
					<span class="text-muted-foreground text-xs font-medium">Created</span>
					<p>{formatDate(companyDetail.createdAt)}</p>
				</div>

				<div class="mb-4">
					<span class="text-muted-foreground text-xs font-medium">Last updated</span>
					<p>{formatDate(companyDetail.updatedAt)}</p>
				</div>

				{#if companyDetail.status === 'ACTIVE'}
					<Button variant="destructive" onclick={() => (confirmStatus = 'SUSPENDED')}>
						Suspend company
					</Button>
				{:else}
					<Button variant="default" onclick={() => (confirmStatus = 'ACTIVE')}>
						Reactivate company
					</Button>
				{/if}
			</CardContent>
		</Card>
	{/if}
</div>

{#if confirmStatus && companyDetail}
	<AlertDialog.AlertDialog open={true}>
		<AlertDialog.AlertDialogContent>
			<AlertDialog.AlertDialogHeader>
				<AlertDialog.AlertDialogTitle>Confirm action</AlertDialog.AlertDialogTitle>
				<AlertDialog.AlertDialogDescription>
					Are you sure you want to <strong>{confirmStatus === 'SUSPENDED' ? 'suspend' : 'reactivate'}</strong> <strong>{companyDetail.name}</strong>?
				</AlertDialog.AlertDialogDescription>
			</AlertDialog.AlertDialogHeader>
			<AlertDialog.AlertDialogFooter>
				<AlertDialog.AlertDialogCancel onclick={() => (confirmStatus = null)}>Cancel</AlertDialog.AlertDialogCancel>
				<AlertDialog.AlertDialogAction onclick={handleStatusAction}>Confirm</AlertDialog.AlertDialogAction>
			</AlertDialog.AlertDialogFooter>
		</AlertDialog.AlertDialogContent>
	</AlertDialog.AlertDialog>
{/if}
