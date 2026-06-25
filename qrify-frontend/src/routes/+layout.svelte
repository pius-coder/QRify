<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { auth } from '$lib/stores/auth.store';
	import { Toaster } from '$lib/components/ui/sonner/index.js';
	import { onMount } from 'svelte';

	let { children } = $props();

	onMount(() => {
		auth.init();
	});
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
<Toaster />
{#if $auth.isLoading}
	<div class="flex h-screen items-center justify-center">
		<p class="text-muted-foreground">Loading...</p>
	</div>
{:else}
	{@render children()}
{/if}
