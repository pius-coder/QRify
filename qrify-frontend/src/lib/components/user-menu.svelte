<script lang="ts">
	import { goto } from '$app/navigation';
	import { auth } from '$lib/stores/auth.store';
	import { Avatar, AvatarFallback } from '$lib/components/ui/avatar/index.js';
	import {
		DropdownMenu,
		DropdownMenuTrigger,
		DropdownMenuContent,
		DropdownMenuLabel,
		DropdownMenuSeparator,
		DropdownMenuItem
	} from '$lib/components/ui/dropdown-menu/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { UserCircle, SignOut } from 'phosphor-svelte';

	let initials = $derived(
		($auth.user?.email?.slice(0, 2).toUpperCase() ?? '??')
	);

	function handleLogout() {
		auth.logout();
		goto('/login');
	}
</script>

<DropdownMenu>
	<DropdownMenuTrigger>
		<Button variant="ghost" size="icon" class="rounded-full">
			<Avatar size="sm">
				<AvatarFallback>{initials}</AvatarFallback>
			</Avatar>
		</Button>
	</DropdownMenuTrigger>
	<DropdownMenuContent align="end" class="w-56">
		<DropdownMenuLabel class="font-normal">
			<div class="flex flex-col gap-1">
				<p class="text-sm font-medium leading-none">{$auth.user?.email ?? ''}</p>
				<p class="text-muted-foreground text-xs leading-none">{$auth.user?.role ?? ''}</p>
			</div>
		</DropdownMenuLabel>
		<DropdownMenuSeparator />
		<DropdownMenuItem onclick={handleLogout}>
			<SignOut class="size-4" />
			<span>Sign out</span>
		</DropdownMenuItem>
	</DropdownMenuContent>
</DropdownMenu>
