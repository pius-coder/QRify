<script lang="ts">
	import RoleGuard from '$lib/components/role-guard.svelte';

	let { children } = $props();
</script>

<RoleGuard role="COMPANY_ADMIN">
	{@render children()}
</RoleGuard>
