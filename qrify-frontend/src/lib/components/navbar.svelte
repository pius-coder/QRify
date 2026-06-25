<script lang="ts">
	import { SidebarTrigger } from '$lib/components/ui/sidebar/index.js';
	import BreadcrumbNav from '$lib/components/breadcrumb-nav.svelte';
	import UserMenu from '$lib/components/user-menu.svelte';
</script>

<header class="flex h-14 items-center gap-3 border-b border-border px-4">
	<SidebarTrigger></SidebarTrigger>
	<BreadcrumbNav></BreadcrumbNav>
	<div class="ml-auto"></div>
	<UserMenu></UserMenu>
</header>
