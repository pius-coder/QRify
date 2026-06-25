<script lang="ts">
	import { resolve } from '$app/paths';
	import { auth } from '$lib/stores/auth.store';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let email = $state('');
	let password = $state('');

	onMount(() => auth.clearError());

	async function handleSubmit(e: Event) {
		e.preventDefault();
		const user = await auth.login({ email, password });
		if (user) {
			if (user.role === 'COMPANY_ADMIN') await goto(resolve('/admin/dashboard'));
			else if (user.role === 'EMPLOYEE') await goto(resolve('/employee/dashboard'));
			else if (user.role === 'SUPER_ADMIN') await goto(resolve('/super-admin/dashboard'));
		}
	}
</script>

<div class="mx-auto mt-20 max-w-md">
	<h1 class="mb-6 text-2xl font-bold">Sign in to QRify</h1>

	{#if $auth.error}
		<div class="mb-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">
			{typeof $auth.error === 'string' ? $auth.error : JSON.stringify($auth.error)}
		</div>
	{/if}

	<form onsubmit={handleSubmit}>
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
				class="mt-1 w-full rounded border p-2"
			/>
		</label>

		<button
			type="submit"
			class="w-full rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
			disabled={$auth.isLoading}
		>
			{$auth.isLoading ? 'Signing in...' : 'Sign in'}
		</button>
	</form>

	<p class="mt-4 text-center text-sm text-gray-600">
		No account?
		<a href={resolve('/register/company')} class="text-blue-600 hover:underline"
			>Register as company</a
		>
		<span class="mx-2">or</span>
		<a href={resolve('/register/employee')} class="text-blue-600 hover:underline"
			>Register as employee</a
		>
	</p>
</div>
