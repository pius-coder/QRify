<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { auth } from '$lib/stores/auth.store';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import {
		HouseSimple,
		Buildings,
		ChartBar,
		Users,
		ClockAfternoon,
		CalendarCheck,
		QrCode,
		SignOut,
		UserCircle
	} from 'phosphor-svelte';

	interface NavItem {
		label: string;
		icon: typeof HouseSimple;
		href: string;
	}

	const roleNavMap: Record<string, NavItem[]> = {
		COMPANY_ADMIN: [
			{ label: 'Dashboard', icon: HouseSimple, href: '/admin/dashboard' },
			{ label: 'My Company', icon: Buildings, href: '/admin/company' },
			{ label: 'Employees', icon: Users, href: '/admin/employees' },
			{ label: 'Work Schedule', icon: ClockAfternoon, href: '/admin/schedule' },
			{ label: 'Attendances', icon: CalendarCheck, href: '/admin/attendance' }
		],
		EMPLOYEE: [
			{ label: 'Dashboard', icon: HouseSimple, href: '/employee/dashboard' },
			{ label: 'History', icon: ClockAfternoon, href: '/employee/history' },
			{ label: 'Stats', icon: ChartBar, href: '/employee/stats' },
			{ label: 'Profile', icon: UserCircle, href: '/employee/profile' },
			{ label: 'Scanner', icon: QrCode, href: '/employee/scan' }
		],
		SUPER_ADMIN: [
			{ label: 'Dashboard', icon: HouseSimple, href: '/super-admin/dashboard' },
			{ label: 'Companies', icon: Buildings, href: '/super-admin/companies' }
		]
	};

	let navItems = $derived(roleNavMap[$auth.user?.role ?? ''] ?? []);

	function handleLogout() {
		auth.logout();
		goto('/login');
	}
</script>

<Sidebar.Sidebar collapsible="icon">
	<Sidebar.SidebarHeader>
		<div class="flex items-center gap-2 px-2 py-1">
			<QrCode class="size-5 shrink-0" />
			<span class="truncate text-sm font-semibold group-data-[collapsible=icon]:hidden">QRify</span>
		</div>
	</Sidebar.SidebarHeader>

	<Sidebar.SidebarSeparator />

	<Sidebar.SidebarContent>
		<Sidebar.SidebarGroup>
			<Sidebar.SidebarGroupLabel class="group-data-[collapsible=icon]:hidden"
				>Navigation</Sidebar.SidebarGroupLabel
			>
			<Sidebar.SidebarMenu>
				{#each navItems as item (item.href)}
					<Sidebar.SidebarMenuItem>
						<Sidebar.SidebarMenuButton
							isActive={$page.url.pathname === item.href ||
								$page.url.pathname.startsWith(item.href + '/')}
							onclick={() => goto(item.href)}
							tooltipContent={item.label}
						>
							<item.icon class="size-4 shrink-0" />
							<span>{item.label}</span>
						</Sidebar.SidebarMenuButton>
					</Sidebar.SidebarMenuItem>
				{/each}
			</Sidebar.SidebarMenu>
		</Sidebar.SidebarGroup>
	</Sidebar.SidebarContent>

	<Sidebar.SidebarFooter>
		<Sidebar.SidebarMenu>
			<Sidebar.SidebarMenuItem>
				<div
					class="group-data-[collapsible=icon]:hidden flex items-center gap-2 px-2 py-1 text-xs text-muted-foreground"
				>
					<UserCircle class="size-4 shrink-0" />
					<span class="truncate">{$auth.user?.email ?? ''}</span>
				</div>
			</Sidebar.SidebarMenuItem>
			<Sidebar.SidebarMenuItem>
				<Sidebar.SidebarMenuButton onclick={handleLogout} tooltipContent="Sign out">
					<SignOut class="size-4 shrink-0" />
					<span>Sign out</span>
				</Sidebar.SidebarMenuButton>
			</Sidebar.SidebarMenuItem>
		</Sidebar.SidebarMenu>
	</Sidebar.SidebarFooter>
</Sidebar.Sidebar>
