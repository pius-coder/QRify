<script lang="ts">
	import { onMount } from 'svelte';
	import { company } from '$lib/stores/company.store';

	let isEditing = $state(false);
	let editName = $state('');
	let editTimezone = $state('');
	let copied = $state(false);

	onMount(() => {
		company.load();
	});

	function startEditing() {
		if (!$company.profile) return;
		editName = $company.profile.name;
		editTimezone = $company.profile.timezone;
		isEditing = true;
		company.clearError();
		company.clearSuccess();
	}

	function cancelEditing() {
		isEditing = false;
		company.clearError();
		company.clearSuccess();
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		const ok = await company.update({ name: editName, timezone: editTimezone });
		if (ok) {
			isEditing = false;
		}
	}

	async function copyCode() {
		if (!$company.profile) return;
		try {
			await navigator.clipboard.writeText($company.profile.companyCode);
			copied = true;
			setTimeout(() => (copied = false), 2000);
		} catch {
			// clipboard not available
		}
	}
</script>

<div class="mx-auto mt-10 max-w-2xl">
	<h1 class="mb-6 text-2xl font-bold">Company Profile</h1>

	{#if $company.isLoading && !$company.profile}
		<p class="text-gray-500">Loading...</p>
	{/if}

	{#if $company.error}
		<div class="mb-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">
			{typeof $company.error === 'string' ? $company.error : JSON.stringify($company.error)}
		</div>
	{/if}

	{#if $company.isSuccess && !isEditing}
		<div class="mb-4 rounded border border-green-300 bg-green-50 p-3 text-sm text-green-700">
			Company profile updated successfully.
		</div>
	{/if}

	{#if $company.profile}
		<div class="mb-6 rounded border p-6">
			{#if isEditing}
				<form onsubmit={handleSubmit}>
					<label class="mb-3 block">
						<span class="text-sm font-medium">Company name</span>
						<input
							type="text"
							bind:value={editName}
							required
							class="mt-1 w-full rounded border p-2"
						/>
					</label>

					<label class="mb-4 block">
						<span class="text-sm font-medium">Timezone</span>
						<input
							type="text"
							bind:value={editTimezone}
							required
							class="mt-1 w-full rounded border p-2"
							placeholder="e.g. Europe/Paris"
						/>
					</label>

					<div class="flex gap-3">
						<button
							type="submit"
							disabled={$company.isLoading}
							class="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
						>
							{$company.isLoading ? 'Saving...' : 'Save'}
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
			{:else}
				<div class="mb-4">
					<span class="text-sm font-medium text-gray-500">Company name</span>
					<p class="text-lg">{$company.profile.name}</p>
				</div>

				<div class="mb-4">
					<span class="text-sm font-medium text-gray-500">Company code</span>
					<div class="flex items-center gap-2">
						<code class="rounded bg-gray-100 px-3 py-1 text-lg font-mono"
							>{$company.profile.companyCode}</code
						>
						<button
							type="button"
							onclick={copyCode}
							class="rounded border bg-white px-3 py-1 text-sm hover:bg-gray-50"
						>
							{copied ? 'Copied!' : 'Copy'}
						</button>
					</div>
				</div>

				<div class="mb-4">
					<span class="text-sm font-medium text-gray-500">Timezone</span>
					<p>{$company.profile.timezone}</p>
				</div>

				<div class="mb-4">
					<span class="text-sm font-medium text-gray-500">Status</span>
					<p>
						{#if $company.profile.status === 'ACTIVE'}
							<span
								class="inline-block rounded bg-green-100 px-2 py-0.5 text-sm font-medium text-green-800"
								>ACTIVE</span
							>
						{:else if $company.profile.status === 'SUSPENDED'}
							<span
								class="inline-block rounded bg-red-100 px-2 py-0.5 text-sm font-medium text-red-800"
								>SUSPENDED</span
							>
						{:else}
							{$company.profile.status}
						{/if}
					</p>
				</div>

				<button
					type="button"
					onclick={startEditing}
					disabled={$company.profile.status === 'SUSPENDED'}
					class="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
				>
					Edit profile
				</button>
			{/if}
		</div>

		<div class="rounded border p-4 text-sm text-gray-600">
			<p>
				Created: <time datetime={$company.profile.createdAt}
					>{new Date($company.profile.createdAt).toLocaleDateString()}</time
				>
				<span class="mx-2">·</span>
				Updated:
				<time datetime={$company.profile.updatedAt}
					>{new Date($company.profile.updatedAt).toLocaleDateString()}</time
				>
			</p>
		</div>
	{/if}
</div>
