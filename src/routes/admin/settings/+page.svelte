<script>
	import Save from '@lucide/svelte/icons/save';

	let { data } = $props();

	let siteTitle = $state('Autumns Grove');
	let siteDescription = $state('');
	let saving = $state(false);
	let saved = $state(false);

	async function saveSetting(key, value) {
		const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

		const res = await fetch('/api/settings', {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				'x-csrf-token': csrfToken || '',
			},
			body: JSON.stringify({ setting_key: key, setting_value: value }),
		});

		return res.ok;
	}

	async function saveAll() {
		saving = true;
		saved = false;

		const results = await Promise.all([
			saveSetting('site_title', siteTitle),
			saveSetting('site_description', siteDescription),
		]);

		if (results.every(Boolean)) {
			saved = true;
			setTimeout(() => saved = false, 2000);
		}

		saving = false;
	}
</script>

<svelte:head>
	<title>Settings - Admin</title>
</svelte:head>

<div style="padding: 2rem; max-width: 600px;">
	<h1>Settings</h1>

	{#if saved}
		<div class="success-msg">Settings saved!</div>
	{/if}

	<div class="admin-field" style="margin-bottom: 1rem;">
		<label class="admin-field-label" for="site-title">Site Title</label>
		<input class="admin-input" id="site-title" bind:value={siteTitle} />
	</div>

	<div class="admin-field" style="margin-bottom: 1.5rem;">
		<label class="admin-field-label" for="site-desc">Site Description</label>
		<textarea class="admin-input" id="site-desc" bind:value={siteDescription} rows="3"></textarea>
	</div>

	<button class="admin-btn-primary" onclick={saveAll} disabled={saving}>
		<Save size={16} />
		{saving ? 'Saving...' : 'Save Settings'}
	</button>
</div>

<style>
	h1 {
		margin-bottom: 1.5rem;
	}

	.success-msg {
		padding: 0.75rem 1rem;
		background: oklch(0.95 0.03 145);
		color: oklch(0.45 0.15 145);
		border-radius: var(--radius);
		font-size: 0.9rem;
		margin-bottom: 1rem;
	}
</style>
