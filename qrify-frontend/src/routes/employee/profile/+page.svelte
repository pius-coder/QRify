<script lang="ts">
	import { auth } from '$lib/stores/auth.store';
	import { employeeSelf } from '$lib/stores/employee-self.store';
	import { Alert, AlertTitle, AlertDescription } from '$lib/components/ui/alert/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Card, CardHeader, CardTitle, CardContent } from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import { UserCircle } from 'phosphor-svelte';
	import { toast } from 'svelte-sonner';

	let firstName = $state($auth.user?.firstName ?? '');
	let lastName = $state($auth.user?.lastName ?? '');

	let loading = $derived($employeeSelf.profile.isLoading);
	let err = $derived($employeeSelf.profile.error);
	let success = $derived($employeeSelf.profile.success);

	async function handleSubmit(e: Event) {
		e.preventDefault();

		if (!firstName.trim() || !lastName.trim()) {
			toast.error('First name and last name are required.');
			return;
		}

		const ok = await employeeSelf.updateProfile({
			firstName: firstName.trim(),
			lastName: lastName.trim()
		});

		if (ok) {
			toast.success('Profile updated successfully.');
			await auth.init();
		}
	}

	function clearProfileError() {
		if (err) employeeSelf.clearProfileError();
	}
</script>

<div class="mx-auto mt-10 max-w-lg">
	<h1 class="mb-6 text-2xl font-bold">My Profile</h1>

	<Card>
		<CardHeader>
			<div class="flex items-center gap-3">
				<UserCircle class="size-10 text-muted-foreground" />
				<div>
					<CardTitle>{$auth.user?.firstName ?? ''} {$auth.user?.lastName ?? ''}</CardTitle>
					<p class="text-sm text-muted-foreground">{$auth.user?.email ?? ''}</p>
				</div>
			</div>
		</CardHeader>
		<CardContent>
			{#if err}
				<Alert variant="destructive" class="mb-4" onclick={clearProfileError}>
					<AlertTitle>Error</AlertTitle>
					<AlertDescription>{typeof err === 'string' ? err : JSON.stringify(err)}</AlertDescription>
				</Alert>
			{/if}

			<form onsubmit={handleSubmit}>
				<div class="space-y-4">
					<div>
						<label for="firstName" class="mb-1 block text-sm font-medium text-muted-foreground"
							>First Name</label
						>
						<Input
							id="firstName"
							type="text"
							bind:value={firstName}
							required
							disabled={loading}
							placeholder="Your first name"
						/>
					</div>
					<div>
						<label for="lastName" class="mb-1 block text-sm font-medium text-muted-foreground"
							>Last Name</label
						>
						<Input
							id="lastName"
							type="text"
							bind:value={lastName}
							required
							disabled={loading}
							placeholder="Your last name"
						/>
					</div>

					<Button type="submit" disabled={loading} class="w-full">
						{#if loading}
							<Spinner class="mr-2 size-4" />
							Saving...
						{:else}
							Save Changes
						{/if}
					</Button>
				</div>
			</form>
		</CardContent>
	</Card>
</div>
