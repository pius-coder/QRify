<script lang="ts">
	import { resolve } from '$app/paths';
	import { auth } from '$lib/stores/auth.store';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let companyCode = $state('');

	onMount(() => auth.clearError());
	let firstName = $state('');
	let lastName = $state('');
	let email = $state('');
	let password = $state('');

	async function handleSubmit(e: Event) {
		e.preventDefault();
		const result = await auth.registerEmployee({
			companyCode,
			firstName,
			lastName,
			email,
			password
		});
		if (result) {
			await goto(resolve('/pending'));
		}
	}
</script>

<div class="mx-auto mt-20 max-w-md">
	<h1 class="mb-6 text-2xl font-bold">Join your company</h1>

	{#if $auth.error}
		<div class="mb-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">
			{typeof $auth.error === 'string' ? $auth.error : JSON.stringify($auth.error)}
		</div>
	{/if}

	<form onsubmit={handleSubmit}>
		<label class="mb-2 block">
			<span class="text-sm font-medium">Company code</span>
			<input
				type="text"
				bind:value={companyCode}
				required
				class="mt-1 w-full rounded border p-2 uppercase"
				placeholder="Enter the company code"
			/>
		</label>

		<label class="mb-2 block">
			<span class="text-sm font-medium">First name</span>
			<input type="text" bind:value={firstName} required class="mt-1 w-full rounded border p-2" />
		</label>

		<label class="mb-2 block">
			<span class="text-sm font-medium">Last name</span>
			<input type="text" bind:value={lastName} required class="mt-1 w-full rounded border p-2" />
		</label>

		<label class="mb-2 block">
			<span class="text-sm font-medium">Email</span>
			<input type="email" bind:value={email} required class="mt-1 w-full rounded border p-2" />
		</label>

		<label class="mb-4 block">
			<span class="text-sm font-medium">Password</span>
			<input
				type="password"
				bind:value={password}
				required
				minlength={8}
				class="mt-1 w-full rounded border p-2"
			/>
		</label>

		<button
			type="submit"
			class="w-full rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
			disabled={$auth.isLoading}
		>
			{$auth.isLoading ? 'Submitting...' : 'Request access'}
		</button>
	</form>

	<p class="mt-4 text-center text-sm text-gray-600">
		Already have an account? <a href={resolve('/login')} class="text-blue-600 hover:underline"
			>Sign in</a
		>
	</p>
</div>
