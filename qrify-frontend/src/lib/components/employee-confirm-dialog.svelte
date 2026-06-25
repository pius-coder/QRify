<script lang="ts">
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import { Button } from '$lib/components/ui/button/index.js';

	let {
		action,
		onConfirm,
		onCancel
	}: {
		action: { id: string; status: string };
		onConfirm: () => void;
		onCancel: () => void;
	} = $props();

	let open = $state(true);
</script>

<AlertDialog.AlertDialog bind:open>
	<AlertDialog.AlertDialogContent>
		<AlertDialog.AlertDialogHeader>
			<AlertDialog.AlertDialogTitle>Confirm action</AlertDialog.AlertDialogTitle>
			<AlertDialog.AlertDialogDescription>
				Are you sure you want to set this employee to <strong>{action.status.toLowerCase()}</strong>?
			</AlertDialog.AlertDialogDescription>
		</AlertDialog.AlertDialogHeader>
		<AlertDialog.AlertDialogFooter>
			<AlertDialog.AlertDialogCancel onclick={onCancel}>Cancel</AlertDialog.AlertDialogCancel>
			<AlertDialog.AlertDialogAction onclick={onConfirm}>Confirm</AlertDialog.AlertDialogAction>
		</AlertDialog.AlertDialogFooter>
	</AlertDialog.AlertDialogContent>
</AlertDialog.AlertDialog>
