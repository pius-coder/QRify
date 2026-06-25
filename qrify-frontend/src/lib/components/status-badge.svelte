<script lang="ts">
	import { Badge } from '$lib/components/ui/badge/index.js';

	let { status, class: className }: { status: string; class?: string } = $props();

	const variantMap: Record<string, 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost' | 'link'> = {
		ACTIVE: 'default',
		PENDING: 'outline',
		SUSPENDED: 'destructive',
		REJECTED: 'secondary'
	};
</script>

<Badge variant={variantMap[status] ?? 'outline'} class={className}>
	{status}
</Badge>
