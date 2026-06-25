<script lang="ts">
	import { onMount } from 'svelte';
	import { schedule } from '$lib/stores/schedule.store';
	import { Alert, AlertTitle, AlertDescription } from '$lib/components/ui/alert/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import { Empty, EmptyTitle, EmptyDescription, EmptyHeader, EmptyContent } from '$lib/components/ui/empty/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import ScheduleViewCard from '$lib/components/schedule-view-card.svelte';
	import ScheduleDialog from '$lib/components/schedule-dialog.svelte';
	import { toast } from 'svelte-sonner';
	import { CalendarPlus } from 'phosphor-svelte';

	let isEditing = $state(false);

	onMount(() => {
		schedule.load();
	});

	async function handleSave(data: Parameters<typeof schedule.update>[0]) {
		const ok = await schedule.update(data);
		if (ok) {
			isEditing = false;
			toast.success('Schedule updated successfully.');
		}
		return ok;
	}
</script>

<div class="mx-auto mt-10 max-w-2xl">
	<h1 class="mb-6 text-2xl font-bold">Work Schedule</h1>

	{#if $schedule.isLoading && !$schedule.schedule}
		<div class="space-y-4">
			<Skeleton class="h-8 w-48" />
			<Skeleton class="h-64 w-full" />
		</div>
	{/if}

	{#if $schedule.error}
		<Alert variant="destructive" class="mb-4">
			<AlertTitle>Error</AlertTitle>
			<AlertDescription>
				{typeof $schedule.error === 'string' ? $schedule.error : JSON.stringify($schedule.error)}
			</AlertDescription>
		</Alert>
	{/if}

	{#if !$schedule.schedule && !$schedule.isLoading}
		<Empty>
			<EmptyHeader>
				<CalendarPlus class="size-8 text-muted-foreground" />
			</EmptyHeader>
			<EmptyTitle>No work schedule yet</EmptyTitle>
			<EmptyDescription>Create a schedule to define working days and hours for your company.</EmptyDescription>
			<EmptyContent>
				<Button onclick={() => (isEditing = true)}>Create schedule</Button>
			</EmptyContent>
		</Empty>
	{/if}

	{#if $schedule.schedule}
		<ScheduleViewCard
			schedule={$schedule.schedule}
			onEdit={() => {
				schedule.clearError();
				schedule.clearSuccess();
				isEditing = true;
			}}
		/>
	{/if}

	<ScheduleDialog
		bind:open={isEditing}
		schedule={$schedule.schedule}
		isLoading={$schedule.isLoading}
		error={$schedule.error}
		onSave={handleSave}
	/>
</div>
