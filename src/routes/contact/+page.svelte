<script>
	import { enhance } from '$app/forms';
	import Send from '@lucide/svelte/icons/send';

	let { form } = $props();
</script>

<svelte:head>
	<title>Contact - Autumns Grove</title>
	<meta name="description" content="Get in touch — I'd love to hear from you." />
</svelte:head>

<div class="contact container section">
	<header class="page-header animate-in">
		<p class="kicker">Reach out</p>
		<h1>Contact</h1>
		<p class="lead">Got a thought, a question, or just want to say hello? I'd love to hear from you.</p>
	</header>

	{#if form?.success}
		<div class="success animate-in">
			<p>Thanks for reaching out! I'll get back to you soon.</p>
		</div>
	{:else}
		<form method="POST" use:enhance class="contact-form animate-in animate-in-delay-1">
			{#if form?.error}
				<div class="form-error">{form.error}</div>
			{/if}

			<div class="field">
				<label for="name">Name</label>
				<input type="text" id="name" name="name" value={form?.name ?? ''} required />
			</div>

			<div class="field">
				<label for="email">Email</label>
				<input type="email" id="email" name="email" value={form?.email ?? ''} required />
			</div>

			<div class="field">
				<label for="message">Message</label>
				<textarea id="message" name="message" rows="6" required>{form?.message ?? ''}</textarea>
			</div>

			<button type="submit" class="submit-btn">
				<Send size={16} />
				Send message
			</button>
		</form>
	{/if}
</div>

<style>
	.contact {
		max-width: 600px;
	}

	.page-header {
		margin-bottom: 2.5rem;
	}

	.page-header h1 {
		margin: 0 0 0.5rem;
	}

	.lead {
		color: var(--color-muted);
		font-size: 1.05rem;
	}

	.contact-form {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	label {
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--color-ink);
	}

	input, textarea {
		font-family: var(--font-body);
		font-size: 0.95rem;
		padding: 0.65rem 0.85rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		background: var(--color-bg);
		color: var(--color-ink);
		transition: border-color var(--transition);
	}

	input:focus, textarea:focus {
		outline: none;
		border-color: var(--color-primary);
		box-shadow: 0 0 0 3px oklch(0.420 0.130 310 / 0.12);
	}

	textarea {
		resize: vertical;
		min-height: 120px;
	}

	.submit-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		align-self: flex-start;
		padding: 0.65rem 1.5rem;
		background: var(--color-primary);
		color: var(--color-bg);
		border: none;
		border-radius: 100px;
		font-family: var(--font-body);
		font-size: 0.9rem;
		font-weight: 600;
		cursor: pointer;
		transition: background var(--transition);
	}

	.submit-btn:hover {
		background: var(--color-primary-hover);
	}

	.form-error {
		padding: 0.75rem 1rem;
		background: oklch(0.95 0.03 25);
		color: oklch(0.45 0.15 25);
		border-radius: var(--radius);
		font-size: 0.9rem;
	}

	:global([data-theme='dark']) .form-error {
		background: oklch(0.2 0.03 25);
		color: oklch(0.75 0.12 25);
	}

	.success {
		padding: 1.5rem;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		text-align: center;
	}

	.success p {
		color: var(--color-primary);
		font-weight: 600;
		margin: 0;
	}
</style>
