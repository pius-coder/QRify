<script lang="ts">
	import type { CompanyProfile, UpdateCompanyDTO } from '$lib/types/company.types';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Spinner } from '$lib/components/ui/spinner/index.js';

	let {
		profile,
		open = $bindable(false),
		isLoading = false,
		error = null,
		onSave
	}: {
		profile: CompanyProfile | null;
		open: boolean;
		isLoading?: boolean;
		error?: unknown;
		onSave: (dto: UpdateCompanyDTO) => Promise<boolean>;
	} = $props();

	let editName = $state('');
	let editTimezone = $state('');

	$effect(() => {
		if (open && profile) {
			editName = profile.name;
			editTimezone = profile.timezone;
		}
	});

	async function handleSubmit(e: Event) {
		e.preventDefault();
		await onSave({ name: editName, timezone: editTimezone });
	}
</script>

<Dialog.Dialog bind:open>
	<Dialog.DialogContent>
		<Dialog.DialogHeader>
			<Dialog.DialogTitle>{profile ? 'Edit company profile' : 'Company profile'}</Dialog.DialogTitle>
		</Dialog.DialogHeader>

		{#if error}
			<div class="text-destructive text-xs">
				{typeof error === 'string' ? error : 'An error occurred'}
			</div>
		{/if}

		<form onsubmit={handleSubmit}>
			<div class="mb-3">
				<Label for="name">Company name</Label>
				<Input id="name" type="text" bind:value={editName} required />
			</div>

			<div class="mb-4">
				<Label for="timezone">Timezone</Label>
				<Input id="timezone" type="text" bind:value={editTimezone} required placeholder="e.g. Europe/Paris" />
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
