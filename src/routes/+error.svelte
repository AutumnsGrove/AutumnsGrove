<script>
	import { page } from '$app/stores';
</script>

<svelte:head>
	<title>{$page.status} - AutumnsGrove</title>
</svelte:head>

<div class="error-page">
	<h1>{$page.status}</h1>
	<p>{$page.error?.message || 'Page not found'}</p>
	<a href="/">Go back home</a>
</div>
