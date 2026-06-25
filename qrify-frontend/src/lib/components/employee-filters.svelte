<script lang="ts">
	import { Input } from '$lib/components/ui/input/index.js';
	import { NativeSelect } from '$lib/components/ui/native-select/index.js';
	import { Spinner } from '$lib/components/ui/spinner/index.js';

	let {
		searchQuery = $bindable(''),
		filterStatus = $bindable('all'),
		isLoading = false
	}: {
		searchQuery?: string;
		filterStatus?: string;
		isLoading?: boolean;
	} = $props();

	const STATUS_OPTIONS = [
		{ value: 'all', label: 'All statuses' },
		{ value: 'PENDING', label: 'Pending' },
		{ value: 'ACTIVE', label: 'Active' },
		{ value: 'SUSPENDED', label: 'Suspended' },
		{ value: 'REJECTED', label: 'Rejected' }
	] as const;
</script>

<div class="mb-4 flex items-center gap-4">
	<div class="flex-1">
		<Input
			type="search"
			placeholder="Search by name or email..."
			bind:value={searchQuery}
		/>
	</div>
	<NativeSelect bind:value={filterStatus}>
		{#each STATUS_OPTIONS as opt (opt.value)}
			<option value={opt.value}>{opt.label}</option>
		{/each}
	</NativeSelect>
	{#if isLoading}
		<Spinner class="text-muted-foreground size-4" />
	{/if}
</div>
