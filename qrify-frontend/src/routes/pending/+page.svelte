<script lang="ts">
	import { resolve } from '$app/paths';
</script>

<div class="mx-auto mt-20 max-w-md text-center">
	<h1 class="mb-4 text-2xl font-bold">Registration submitted</h1>
	<p class="mb-6 text-gray-600">
		Your account is pending approval. Please wait for an administrator to activate your account.
	</p>
	<a href={resolve('/login')} class="text-blue-600 hover:underline">Back to sign in</a>
</div>
