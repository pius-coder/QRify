<script lang="ts">
	import { page } from '$app/stores';
	import {
		Breadcrumb,
		BreadcrumbList,
		BreadcrumbItem,
		BreadcrumbLink,
		BreadcrumbSeparator,
		BreadcrumbPage
	} from '$lib/components/ui/breadcrumb/index.js';
	import { House } from 'phosphor-svelte';

	const rolePrefix: Record<string, { label: string; href: string }> = {
		'admin': { label: 'Admin', href: '/admin/dashboard' },
		'employee': { label: 'Employee', href: '/employee/dashboard' },
		'super-admin': { label: 'Super Admin', href: '/super-admin/dashboard' }
	};

	let segments = $derived.by(() => {
		const path = $page.url.pathname;
		const parts = path.split('/').filter(Boolean);
		const crumbs: { label: string; href: string }[] = [];
		let acc = '';
		for (const part of parts) {
			acc += '/' + part;
			const label = rolePrefix[part]?.label ?? part.charAt(0).toUpperCase() + part.slice(1);
			crumbs.push({ label, href: acc });
		}
		return crumbs;
	});
</script>

<Breadcrumb>
	<BreadcrumbList>
		<BreadcrumbItem>
			<BreadcrumbLink href="/">
				<House class="size-4" />
				<span class="sr-only">Home</span>
			</BreadcrumbLink>
		</BreadcrumbItem>
		{#each segments as seg, i}
			<BreadcrumbSeparator />
			<BreadcrumbItem>
				{#if i === segments.length - 1}
					<BreadcrumbPage>{seg.label}</BreadcrumbPage>
				{:else}
					<BreadcrumbLink href={seg.href}>{seg.label}</BreadcrumbLink>
				{/if}
			</BreadcrumbItem>
		{/each}
	</BreadcrumbList>
</Breadcrumb>
