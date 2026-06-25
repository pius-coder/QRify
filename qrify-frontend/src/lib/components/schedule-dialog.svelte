<script lang="ts">
	import type { ScheduleResponse, UpdateScheduleDTO } from '$lib/types/schedule.types';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import { WEEKDAY_LABELS } from '$lib/types/schedule.types';

	let {
		schedule,
		open = $bindable(false),
		isLoading = false,
		error = null,
		onSave
	}: {
		schedule: ScheduleResponse | null;
		open: boolean;
		isLoading?: boolean;
		error?: unknown;
		onSave: (dto: UpdateScheduleDTO) => Promise<boolean>;
	} = $props();

	let editStartTime = $state('09:00');
	let editEndTime = $state('18:00');
	let editBreakStartTime = $state('12:00');
	let editBreakEndTime = $state('13:00');
	let editLateToleranceMinutes = $state(0);
	let editWeekdays = $state<number[]>([1, 2, 3, 4, 5]);
	let hasBreak = $state(true);

	$effect(() => {
		if (open) {
			if (schedule) {
				editStartTime = schedule.startTime;
				editEndTime = schedule.endTime;
				editBreakStartTime = schedule.breakStartTime ?? '12:00';
				editBreakEndTime = schedule.breakEndTime ?? '13:00';
				editLateToleranceMinutes = schedule.lateToleranceMinutes;
				editWeekdays = [...schedule.weekdays];
				hasBreak = schedule.breakStartTime !== null && schedule.breakEndTime !== null;
			} else {
				editStartTime = '09:00';
				editEndTime = '18:00';
				editBreakStartTime = '12:00';
				editBreakEndTime = '13:00';
				editLateToleranceMinutes = 0;
				editWeekdays = [1, 2, 3, 4, 5];
				hasBreak = true;
			}
		}
	});

	function toggleWeekday(value: number) {
		if (editWeekdays.includes(value)) {
			editWeekdays = editWeekdays.filter((d) => d !== value);
		} else {
			editWeekdays = [...editWeekdays, value].sort();
		}
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		await onSave({
			startTime: editStartTime,
			breakStartTime: hasBreak ? editBreakStartTime : null,
			breakEndTime: hasBreak ? editBreakEndTime : null,
			endTime: editEndTime,
			lateToleranceMinutes: editLateToleranceMinutes,
			weekdays: editWeekdays
		});
	}
</script>

<Dialog.Dialog bind:open>
	<Dialog.DialogContent>
		<Dialog.DialogHeader>
			<Dialog.DialogTitle>{schedule ? 'Edit schedule' : 'Create schedule'}</Dialog.DialogTitle>
		</Dialog.DialogHeader>

		{#if error}
			<div class="text-destructive text-xs">
				{typeof error === 'string' ? error : 'An error occurred'}
			</div>
		{/if}

		<form onsubmit={handleSubmit}>
			<Label class="mb-2 block text-xs font-medium">Working days</Label>
			<div class="mb-4 flex flex-wrap gap-4">
				{#each WEEKDAY_LABELS as wd (wd.value)}
					<Label class="flex items-center gap-1.5 text-xs">
						<Checkbox checked={editWeekdays.includes(wd.value)} onclick={() => toggleWeekday(wd.value)} />
						{wd.label}
					</Label>
				{/each}
			</div>

			<div class="mb-4 grid grid-cols-2 gap-4">
				<div>
					<Label for="startTime">Start time</Label>
					<Input id="startTime" type="time" bind:value={editStartTime} required />
				</div>
				<div>
					<Label for="endTime">End time</Label>
					<Input id="endTime" type="time" bind:value={editEndTime} required />
				</div>
			</div>

			<div class="mb-4 flex items-center gap-2">
				<Switch id="hasBreak" bind:checked={hasBreak} />
				<Label for="hasBreak">Enable break</Label>
			</div>

			{#if hasBreak}
				<div class="mb-4 grid grid-cols-2 gap-4">
					<div>
						<Label for="breakStart">Break start</Label>
						<Input id="breakStart" type="time" bind:value={editBreakStartTime} required />
					</div>
					<div>
						<Label for="breakEnd">Break end</Label>
						<Input id="breakEnd" type="time" bind:value={editBreakEndTime} required />
					</div>
				</div>
			{/if}

			<div class="mb-6">
				<Label for="lateTolerance">Late tolerance (minutes)</Label>
				<Input id="lateTolerance" type="number" bind:value={editLateToleranceMinutes} min="0" required />
			</div>

			<Dialog.DialogFooter>
				<Dialog.DialogClose>
					{#snippet child({ props })}
						<Button variant="outline" {...props}>Cancel</Button>
					{/snippet}
				</Dialog.DialogClose>
				<Button type="submit" disabled={isLoading}>
					{#if isLoading}
						<Spinner class="size-4" />
					{/if}
					{isLoading ? 'Saving...' : 'Save'}
				</Button>
			</Dialog.DialogFooter>
		</form>
	</Dialog.DialogContent>
</Dialog.Dialog>
