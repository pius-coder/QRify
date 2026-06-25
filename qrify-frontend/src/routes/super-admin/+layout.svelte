<script lang="ts">
	import RoleGuard from '$lib/components/role-guard.svelte';

	let { children } = $props();
</script>

<RoleGuard role="SUPER_ADMIN">
	{@render children()}
</RoleGuard>
