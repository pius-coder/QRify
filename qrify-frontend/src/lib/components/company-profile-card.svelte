<script lang="ts">
	import type { CompanyProfile } from '$lib/types/company.types';
	import { Card, CardContent } from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import StatusBadge from '$lib/components/status-badge.svelte';
	import { Copy, Pencil, Check } from 'phosphor-svelte';

	let {
		profile,
		onEdit
	}: {
		profile: CompanyProfile;
		onEdit: () => void;
	} = $props();

	let copied = $state(false);

	async function copyCode() {
		try {
			await navigator.clipboard.writeText(profile.companyCode);
			copied = true;
			setTimeout(() => (copied = false), 2000);
		} catch { }
	}

	function formatDate(iso: string): string {
		return new Date(iso).toLocaleDateString();
	}
</script>

<Card>
	<CardContent>
		<div class="mb-4">
			<span class="text-muted-foreground text-xs font-medium">Company name</span>
			<p class="text-lg">{profile.name}</p>
		</div>

		<div class="mb-4">
			<span class="text-muted-foreground text-xs font-medium">Company code</span>
			<div class="flex items-center gap-2">
				<code class="bg-muted rounded px-3 py-1 font-mono text-lg">{profile.companyCode}</code>
				<Tooltip.Tooltip>
					<Tooltip.TooltipTrigger>
						<Button variant="outline" size="xs" onclick={copyCode}>
							{#if copied}
								<Check class="size-3 text-success" />
							{:else}
								<Copy class="size-3" />
							{/if}
						</Button>
					</Tooltip.TooltipTrigger>
					<Tooltip.TooltipContent>
						{copied ? 'Copied!' : 'Copy to clipboard'}
					</Tooltip.TooltipContent>
				</Tooltip.Tooltip>
			</div>
		</div>

		<div class="mb-4">
			<span class="text-muted-foreground text-xs font-medium">Timezone</span>
			<p>{profile.timezone}</p>
		</div>

		<div class="mb-4">
			<span class="text-muted-foreground text-xs font-medium">Status</span>
			<div class="mt-1">
				<StatusBadge status={profile.status} />
			</div>
		</div>

		<Button onclick={onEdit} disabled={profile.status === 'SUSPENDED'}>
			<Pencil class="size-4" />
			Edit profile
		</Button>
	</CardContent>
</Card>

<div class="text-muted-foreground mt-4 text-sm">
	<p>
		Created: <time datetime={profile.createdAt}>{formatDate(profile.createdAt)}</time>
		<span class="mx-2">·</span>
		Updated: <time datetime={profile.updatedAt}>{formatDate(profile.updatedAt)}</time>
	</p>
</div>
