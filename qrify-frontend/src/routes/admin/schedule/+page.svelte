<script lang="ts">
	import { onMount } from 'svelte';
	import { schedule } from '$lib/stores/schedule.store';
	import { WEEKDAY_LABELS } from '$lib/types/schedule.types';

	let isEditing = $state(false);
	let editStartTime = $state('09:00');
	let editBreakStartTime = $state('12:00');
	let editBreakEndTime = $state('13:00');
	let editEndTime = $state('18:00');
	let editLateToleranceMinutes = $state(0);
	let editWeekdays = $state<number[]>([]);
	let hasBreak = $state(true);

	onMount(() => {
		schedule.load();
	});

	function startEditing() {
		const s = $schedule.schedule;
		if (s) {
			editStartTime = s.startTime;
			editBreakStartTime = s.breakStartTime ?? '12:00';
			editBreakEndTime = s.breakEndTime ?? '13:00';
			editEndTime = s.endTime;
			editLateToleranceMinutes = s.lateToleranceMinutes;
			editWeekdays = [...s.weekdays];
			hasBreak = s.breakStartTime !== null && s.breakEndTime !== null;
		} else {
			editStartTime = '09:00';
			editBreakStartTime = '12:00';
			editBreakEndTime = '13:00';
			editEndTime = '18:00';
			editLateToleranceMinutes = 0;
			editWeekdays = [1, 2, 3, 4, 5];
			hasBreak = true;
		}
		isEditing = true;
		schedule.clearError();
		schedule.clearSuccess();
	}

	function cancelEditing() {
		isEditing = false;
		schedule.clearError();
		schedule.clearSuccess();
	}

	function toggleWeekday(value: number) {
		if (editWeekdays.includes(value)) {
			editWeekdays = editWeekdays.filter((d) => d !== value);
		} else {
			editWeekdays = [...editWeekdays, value].sort();
		}
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		const ok = await schedule.update({
			startTime: editStartTime,
			breakStartTime: hasBreak ? editBreakStartTime : null,
			breakEndTime: hasBreak ? editBreakEndTime : null,
			endTime: editEndTime,
			lateToleranceMinutes: editLateToleranceMinutes,
			weekdays: editWeekdays
		});
		if (ok) {
			isEditing = false;
		}
	}
</script>

<div class="mx-auto mt-10 max-w-2xl">
	<h1 class="mb-6 text-2xl font-bold">Work Schedule</h1>

	{#if $schedule.isLoading && !$schedule.schedule}
		<p class="text-gray-500">Loading...</p>
	{/if}

	{#if $schedule.error}
		<div class="mb-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">
			{typeof $schedule.error === 'string' ? $schedule.error : JSON.stringify($schedule.error)}
		</div>
	{/if}

	{#if $schedule.isSuccess && !isEditing}
		<div class="mb-4 rounded border border-green-300 bg-green-50 p-3 text-sm text-green-700">
			Schedule updated successfully.
		</div>
	{/if}

	{#if !$schedule.schedule && !$schedule.isLoading}
		<div class="rounded border p-6 text-center">
			<p class="mb-4 text-gray-600">No work schedule configured yet.</p>
			<button
				type="button"
				onclick={startEditing}
				class="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
			>
				Create schedule
			</button>
		</div>
	{/if}

	{#if $schedule.schedule && !isEditing}
		<div class="mb-6 rounded border p-6">
			<div class="mb-4">
				<span class="text-sm font-medium text-gray-500">Working days</span>
				<p>
					{$schedule.schedule.weekdays
						.map((d) => WEEKDAY_LABELS.find((w) => w.value === d)?.label ?? d)
						.join(', ')}
				</p>
			</div>

			<div class="mb-4">
				<span class="text-sm font-medium text-gray-500">Start time</span>
				<p>{$schedule.schedule.startTime}</p>
			</div>

			{#if $schedule.schedule.breakStartTime && $schedule.schedule.breakEndTime}
				<div class="mb-4">
					<span class="text-sm font-medium text-gray-500">Break</span>
					<p>{$schedule.schedule.breakStartTime} – {$schedule.schedule.breakEndTime}</p>
				</div>
			{:else}
				<div class="mb-4">
					<span class="text-sm font-medium text-gray-500">Break</span>
					<p class="text-gray-400">No break configured</p>
				</div>
			{/if}

			<div class="mb-4">
				<span class="text-sm font-medium text-gray-500">End time</span>
				<p>{$schedule.schedule.endTime}</p>
			</div>

			<div class="mb-4">
				<span class="text-sm font-medium text-gray-500">Late tolerance</span>
				<p>{$schedule.schedule.lateToleranceMinutes} minutes</p>
			</div>

			<button
				type="button"
				onclick={startEditing}
				class="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
			>
				Edit schedule
			</button>
		</div>

		<div class="rounded border p-4 text-sm text-gray-600">
			<p>
				Last updated:
				<time datetime={$schedule.schedule.updatedAt}
					>{new Date($schedule.schedule.updatedAt).toLocaleDateString()}</time
				>
			</p>
		</div>
	{/if}

	{#if isEditing}
		<div class="rounded border p-6">
			<h2 class="mb-4 text-lg font-semibold">
				{$schedule.schedule ? 'Edit schedule' : 'Create schedule'}
			</h2>
			<form onsubmit={handleSubmit}>
				<fieldset class="mb-4">
					<legend class="mb-2 text-sm font-medium">Working days</legend>
					<div class="flex flex-wrap gap-4">
						{#each WEEKDAY_LABELS as wd (wd.value)}
							<label class="flex items-center gap-1.5 text-sm">
								<input
									type="checkbox"
									checked={editWeekdays.includes(wd.value)}
									onchange={() => toggleWeekday(wd.value)}
								/>
								{wd.label}
							</label>
						{/each}
					</div>
				</fieldset>

				<div class="mb-4 grid grid-cols-2 gap-4">
					<label class="block">
						<span class="text-sm font-medium">Start time</span>
						<input
							type="time"
							bind:value={editStartTime}
							required
							class="mt-1 w-full rounded border p-2"
						/>
					</label>

					<label class="block">
						<span class="text-sm font-medium">End time</span>
						<input
							type="time"
							bind:value={editEndTime}
							required
							class="mt-1 w-full rounded border p-2"
						/>
					</label>
				</div>

				<label class="mb-4 flex items-center gap-2 text-sm">
					<input type="checkbox" bind:checked={hasBreak} />
					<span class="font-medium">Enable break</span>
				</label>

				{#if hasBreak}
					<div class="mb-4 grid grid-cols-2 gap-4">
						<label class="block">
							<span class="text-sm font-medium">Break start</span>
							<input
								type="time"
								bind:value={editBreakStartTime}
								required
								class="mt-1 w-full rounded border p-2"
							/>
						</label>

						<label class="block">
							<span class="text-sm font-medium">Break end</span>
							<input
								type="time"
								bind:value={editBreakEndTime}
								required
								class="mt-1 w-full rounded border p-2"
							/>
						</label>
					</div>
				{/if}

				<label class="mb-6 block">
					<span class="text-sm font-medium">Late tolerance (minutes)</span>
					<input
						type="number"
						bind:value={editLateToleranceMinutes}
						min="0"
						required
						class="mt-1 w-full rounded border p-2"
					/>
				</label>

				<div class="flex gap-3">
					<button
						type="submit"
						disabled={$schedule.isLoading}
						class="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
					>
						{$schedule.isLoading ? 'Saving...' : 'Save'}
					</button>
					<button
						type="button"
						onclick={cancelEditing}
						class="rounded border bg-white px-4 py-2 text-gray-700 hover:bg-gray-50"
					>
						Cancel
					</button>
				</div>
			</form>
		</div>
	{/if}
</div>
