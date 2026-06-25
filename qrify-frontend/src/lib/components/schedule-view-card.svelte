<script lang="ts">
	import type { ScheduleResponse } from '$lib/types/schedule.types';
	import { Card, CardContent } from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { WEEKDAY_LABELS } from '$lib/types/schedule.types';
	import { Pencil } from 'phosphor-svelte';

	let { schedule, onEdit }: { schedule: ScheduleResponse; onEdit: () => void } = $props();

	function formatDate(iso: string): string {
		return new Date(iso).toLocaleDateString();
	}
</script>

<Card>
	<CardContent>
		<div class="mb-4">
			<span class="text-muted-foreground text-xs font-medium">Working days</span>
			<p>{schedule.weekdays.map((d) => WEEKDAY_LABELS.find((w) => w.value === d)?.label ?? d).join(', ')}</p>
		</div>

		<div class="mb-4">
			<span class="text-muted-foreground text-xs font-medium">Start time</span>
			<p>{schedule.startTime}</p>
		</div>

		<div class="mb-4">
			<span class="text-muted-foreground text-xs font-medium">Break</span>
			<p>
				{schedule.breakStartTime && schedule.breakEndTime
					? `${schedule.breakStartTime} \u2013 ${schedule.breakEndTime}`
					: 'No break configured'}
			</p>
		</div>

		<div class="mb-4">
			<span class="text-muted-foreground text-xs font-medium">End time</span>
			<p>{schedule.endTime}</p>
		</div>

		<div class="mb-4">
			<span class="text-muted-foreground text-xs font-medium">Late tolerance</span>
			<p>{schedule.lateToleranceMinutes} minutes</p>
		</div>

		<Button onclick={onEdit}>
			<Pencil class="size-4" />
			Edit schedule
		</Button>
	</CardContent>
</Card>

<div class="text-muted-foreground mt-4 text-sm">
	<p>
		Last updated:
		<time datetime={schedule.updatedAt}>{formatDate(schedule.updatedAt)}</time>
	</p>
</div>
