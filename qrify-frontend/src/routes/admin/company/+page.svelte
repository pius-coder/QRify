<script lang="ts">
	import { onMount } from 'svelte';
	import { company } from '$lib/stores/company.store';
	import { Alert, AlertTitle, AlertDescription } from '$lib/components/ui/alert/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import CompanyProfileCard from '$lib/components/company-profile-card.svelte';
	import CompanyProfileDialog from '$lib/components/company-profile-dialog.svelte';
	import { toast } from 'svelte-sonner';

	let isEditing = $state(false);

	onMount(() => {
		company.load();
	});

	async function handleSave(data: { name: string; timezone: string }) {
		const ok = await company.update(data);
		if (ok) {
			isEditing = false;
			toast.success('Company profile updated successfully.');
		}
		return ok;
	}
</script>

<div class="mx-auto mt-10 max-w-2xl">
	<h1 class="mb-6 text-2xl font-bold">Company Profile</h1>

	{#if $company.isLoading && !$company.profile}
		<div class="space-y-4">
			<Skeleton class="h-48 w-full" />
		</div>
	{/if}

	{#if $company.error}
		<Alert variant="destructive" class="mb-4">
			<AlertTitle>Error</AlertTitle>
			<AlertDescription>
				{typeof $company.error === 'string' ? $company.error : JSON.stringify($company.error)}
			</AlertDescription>
		</Alert>
	{/if}

	{#if $company.profile}
		<CompanyProfileCard
			profile={$company.profile}
			onEdit={() => {
				company.clearError();
				company.clearSuccess();
				isEditing = true;
			}}
		/>

		<CompanyProfileDialog
			bind:open={isEditing}
			profile={$company.profile}
			isLoading={$company.isLoading}
			error={$company.error}
			onSave={handleSave}
		/>
	{/if}
</div>
