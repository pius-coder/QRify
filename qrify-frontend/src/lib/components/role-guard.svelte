<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { auth } from '$lib/stores/auth.store';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import AppSidebar from '$lib/components/app-sidebar.svelte';
	import Navbar from '$lib/components/navbar.svelte';

	let { role, children }: { role: string; children: import('svelte').Snippet } = $props();

	const roleDashboards: Record<string, string> = {
		COMPANY_ADMIN: '/admin/dashboard',
		EMPLOYEE: '/employee/dashboard',
		SUPER_ADMIN: '/super-admin/dashboard'
	};

	onMount(() => {
		if (!$auth.isLoading && !$auth.user) {
			goto('/login');
		} else if (!$auth.isLoading && $auth.user && $auth.user.role !== role) {
			const dest = roleDashboards[$auth.user.role ?? ''] ?? '/login';
			goto(dest);
		}
	});
</script>

{#if $auth.isLoading}
	<div class="flex h-screen items-center justify-center">
		<p class="text-muted-foreground">Loading...</p>
	</div>
{:else if $auth.user?.role === role}
	<Sidebar.SidebarProvider>
		<AppSidebar />
		<main class="flex min-h-screen flex-1 flex-col">
			<Navbar />
			<div class="flex-1 p-6">
				{@render children()}
			</div>
		</main>
	</Sidebar.SidebarProvider>
{/if}
