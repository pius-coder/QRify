<script lang="ts">
	import { resolve } from '$app/paths';
	import { auth } from '$lib/stores/auth.store';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let companyName = $state('');

	onMount(() => auth.clearError());
	let companyCode = $state('');
	let adminFirstName = $state('');
	let adminLastName = $state('');
	let adminEmail = $state('');
	let adminPassword = $state('');

	async function handleSubmit(e: Event) {
		e.preventDefault();
		const result = await auth.registerCompany({
			companyName,
			companyCode,
			adminFirstName,
			adminLastName,
			adminEmail,
			adminPassword
		});
		if (result) {
			await goto(resolve('/login'));
		}
	}
</script>

<div class="mx-auto mt-20 max-w-md">
	<h1 class="mb-6 text-2xl font-bold">Register your company</h1>

	{#if $auth.error}
		<div class="mb-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">
			{typeof $auth.error === 'string' ? $auth.error : JSON.stringify($auth.error)}
		</div>
	{/if}

	<form onsubmit={handleSubmit}>
		<label class="mb-2 block">
			<span class="text-sm font-medium">Company name</span>
			<input type="text" bind:value={companyName} required class="mt-1 w-full rounded border p-2" />
		</label>

		<label class="mb-2 block">
			<span class="text-sm font-medium">Company code</span>
			<input
				type="text"
				bind:value={companyCode}
				required
				class="mt-1 w-full rounded border p-2 uppercase"
				placeholder="e.g. ABC7X91Q"
			/>
		</label>

		<hr class="my-4" />

		<label class="mb-2 block">
			<span class="text-sm font-medium">First name</span>
			<input
				type="text"
				bind:value={adminFirstName}
				required
				class="mt-1 w-full rounded border p-2"
			/>
		</label>

		<label class="mb-2 block">
			<span class="text-sm font-medium">Last name</span>
			<input
				type="text"
				bind:value={adminLastName}
				required
				class="mt-1 w-full rounded border p-2"
			/>
		</label>

		<label class="mb-2 block">
			<span class="text-sm font-medium">Email</span>
			<input type="email" bind:value={adminEmail} required class="mt-1 w-full rounded border p-2" />
		</label>

		<label class="mb-4 block">
			<span class="text-sm font-medium">Password</span>
			<input
				type="password"
				bind:value={adminPassword}
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
			{$auth.isLoading ? 'Registering...' : 'Register company'}
		</button>
	</form>

	<p class="mt-4 text-center text-sm text-gray-600">
		Already have an account? <a href={resolve('/login')} class="text-blue-600 hover:underline"
			>Sign in</a
		>
	</p>
</div>
