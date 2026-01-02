<script lang="ts">
	import {
		Button,
		Card,
		Badge,
		Input,
		Select,
		Tabs,
		Dialog,
		Accordion,
		Sheet,
		Toast,
		Skeleton,
		Table,
		toast,
		TableHeader,
		TableBody,
		TableRow,
		TableCell,
		TableHead
	} from '@autumnsgrove/groveengine/ui';
	import { Glass } from '$lib/components';

	// State for interactive examples
	let sampleInput = $state('');
	let sampleSelect = $state('');
	let dialogOpen = $state(false);
	let sheetOpen = $state(false);

	// Sample data for components
	const tabsData = [
		{ value: 'tab1', label: 'Overview' },
		{ value: 'tab2', label: 'Features' },
		{ value: 'tab3', label: 'Settings' }
	];

	const accordionData = [
		{
			value: 'item-1',
			title: 'What is AutumnsGrove?',
			content: 'A personal website built with SvelteKit showcasing projects and blog posts.'
		},
		{
			value: 'item-2',
			title: 'What tech stack does it use?',
			content: 'SvelteKit, shadcn-svelte, Cloudflare Workers, and Tailwind CSS.'
		},
		{
			value: 'item-3',
			title: 'How do I use these components?',
			content: 'Import them from $lib/components/ui and use them in your Svelte files.'
		}
	];

	const tableData = [
		{ component: 'Button', status: 'Complete', variants: '5' },
		{ component: 'Card', status: 'Complete', variants: '3' },
		{ component: 'Badge', status: 'Complete', variants: '2' }
	];
</script>

<svelte:head>
	<title>Component Showcase - AutumnsGrove</title>
</svelte:head>

<Toast />

<div class="showcase-container">
	<header class="showcase-header">
		<h1>Component Showcase</h1>
		<p class="subtitle">All 12 wrapper components in action</p>
		<Badge variant="tag">Terminal Grove Aesthetic</Badge>
	</header>

	<!-- 1. Button -->
	<Glass variant="card" as="section" intensity="light" border class="component-section">
		<h2>1. Button</h2>
		<p class="description">Interactive button component with multiple variants and sizes</p>
		<div class="examples">
			<Button variant="primary">Primary</Button>
			<Button variant="secondary">Secondary</Button>
			<Button variant="danger">Danger</Button>
			<Button variant="ghost">Ghost</Button>
			<Button variant="link">Link</Button>
		</div>
		<div class="examples">
			<Button size="sm">Small</Button>
			<Button size="default">Default</Button>
			<Button size="lg">Large</Button>
		</div>
		<Glass variant="dark" intensity="medium" class="code-block">
			<pre><code>&lt;Button variant="primary"&gt;Click me&lt;/Button&gt;
&lt;Button variant="danger" size="lg"&gt;Delete&lt;/Button&gt;</code></pre>
		</Glass>
	</Glass>

	<!-- 2. Card -->
	<Glass variant="card" as="section" intensity="light" border class="component-section">
		<h2>2. Card</h2>
		<p class="description">Container for content with optional title and description</p>
		<div class="examples card-grid">
			<Card title="Basic Card" description="A simple card with title and description">
				This is the main content area of the card. You can put anything here.
			</Card>
			<Card title="Features" description="Key highlights">
				<ul class="feature-list">
					<li>Flexible content area</li>
					<li>Optional header/footer</li>
					<li>Hover effects</li>
				</ul>
			</Card>
			<Card hoverable title="Hoverable Card">
				Hover over this card to see the effect.
			</Card>
		</div>
		<Glass variant="dark" intensity="medium" class="code-block">
			<pre><code>&lt;Card title="My Card" description="Subtitle"&gt;
  Content goes here
&lt;/Card&gt;</code></pre>
		</Glass>
	</Glass>

	<!-- 3. Badge -->
	<Glass variant="card" as="section" intensity="light" border class="component-section">
		<h2>3. Badge</h2>
		<p class="description">Small labels for tags and status indicators</p>
		<div class="examples">
			<Badge>Default</Badge>
			<Badge variant="tag">Tag Style</Badge>
			<Badge variant="tag">SvelteKit</Badge>
			<Badge variant="tag">TypeScript</Badge>
			<Badge variant="tag">Cloudflare</Badge>
		</div>
		<Glass variant="dark" intensity="medium" class="code-block">
			<pre><code>&lt;Badge&gt;Status&lt;/Badge&gt;
&lt;Badge variant="tag"&gt;Category&lt;/Badge&gt;</code></pre>
		</Glass>
	</Glass>

	<!-- 4. Input -->
	<Glass variant="card" as="section" intensity="light" border class="component-section">
		<h2>4. Input</h2>
		<p class="description">Text input fields with labels and validation</p>
		<div class="input-grid">
			<Input
				bind:value={sampleInput}
				label="Basic Input"
				placeholder="Enter some text..."
			/>
			<Input
				type="email"
				label="Email Address"
				placeholder="you@example.com"
			/>
			<Input
				label="With Error"
				placeholder="Invalid input"
				error="This field is required"
			/>
		</div>
		<Glass variant="dark" intensity="medium" class="code-block">
			<pre><code>&lt;Input
  bind:value={sampleInput}
  label="Username"
  placeholder="Enter username"
/&gt;</code></pre>
		</Glass>
	</Glass>

	<!-- 5. Select -->
	<Glass variant="card" as="section" intensity="light" border class="component-section">
		<h2>5. Select</h2>
		<p class="description">Dropdown selection component</p>
		<div class="select-demo">
			<Select
				bind:value={sampleSelect}
				label="Choose an option"
				options={[
					{ value: 'svelte', label: 'Svelte' },
					{ value: 'react', label: 'React' },
					{ value: 'vue', label: 'Vue' }
				]}
				placeholder="Select a framework"
			/>
			{#if sampleSelect}
				<p class="selected-value">Selected: <Badge variant="tag">{sampleSelect}</Badge></p>
			{/if}
		</div>
		<Glass variant="dark" intensity="medium" class="code-block">
			<pre><code>&lt;Select
  bind:value={sampleSelect}
  label="Framework"
  options={[
    { value: 'svelte', label: 'Svelte' },
    { value: 'react', label: 'React' }
  ]}
/&gt;</code></pre>
		</Glass>
	</Glass>

	<!-- 6. Tabs -->
	<Glass variant="card" as="section" intensity="light" border class="component-section">
		<h2>6. Tabs</h2>
		<p class="description">Tabbed interface for organizing content</p>
		<Tabs tabs={tabsData}>
			{#snippet content(tab)}
				{#if tab.value === 'tab1'}
					<p>Overview content - This showcase demonstrates all wrapper components.</p>
				{:else if tab.value === 'tab2'}
					<p>Features content - 12 components with terminal-grove aesthetic.</p>
				{:else}
					<p>Settings content - Configure your preferences here.</p>
				{/if}
			{/snippet}
		</Tabs>
		<Glass variant="dark" intensity="medium" class="code-block">
			<pre><code>&lt;Tabs tabs={tabsData}&gt;
  {#snippet content(tab)}
    Content for {tab.value}
  {/snippet}
&lt;/Tabs&gt;</code></pre>
		</Glass>
	</Glass>

	<!-- 7. Dialog -->
	<Glass variant="card" as="section" intensity="light" border class="component-section">
		<h2>7. Dialog</h2>
		<p class="description">Modal dialog for important interactions</p>
		<Button variant="primary" onclick={() => (dialogOpen = true)}>Open Dialog</Button>
		<Dialog bind:open={dialogOpen} title="Example Dialog" description="This is a modal dialog">
			<p>Dialog content goes here. You can put forms, confirmations, or any content.</p>
			{#snippet footer()}
				<Button variant="secondary" onclick={() => (dialogOpen = false)}>Cancel</Button>
				<Button variant="primary" onclick={() => (dialogOpen = false)}>Confirm</Button>
			{/snippet}
		</Dialog>
		<Glass variant="dark" intensity="medium" class="code-block">
			<pre><code>&lt;Dialog bind:open={dialogOpen} title="Confirm Action"&gt;
  Are you sure?
  {#snippet footer()}
    &lt;Button&gt;Confirm&lt;/Button&gt;
  {/snippet}
&lt;/Dialog&gt;</code></pre>
		</Glass>
	</Glass>

	<!-- 8. Accordion -->
	<Glass variant="card" as="section" intensity="light" border class="component-section">
		<h2>8. Accordion</h2>
		<p class="description">Collapsible sections for FAQ and content organization</p>
		<Accordion items={accordionData} type="single" collapsible />
		<Glass variant="dark" intensity="medium" class="code-block">
			<pre><code>&lt;Accordion items={accordionData} type="single" collapsible /&gt;</code></pre>
		</Glass>
	</Glass>

	<!-- 9. Sheet -->
	<Glass variant="card" as="section" intensity="light" border class="component-section">
		<h2>9. Sheet</h2>
		<p class="description">Side panel for navigation or additional content</p>
		<Button variant="primary" onclick={() => (sheetOpen = true)}>Open Sheet</Button>
		<Sheet
			bind:open={sheetOpen}
			side="right"
			title="Settings Panel"
			description="Adjust your preferences"
		>
			<div class="sheet-content">
				<Input label="Display Name" placeholder="Your name" />
				<Input label="Email" type="email" placeholder="your@email.com" />
				<Select
					label="Theme"
					options={[
						{ value: 'light', label: 'Light' },
						{ value: 'dark', label: 'Dark' },
						{ value: 'auto', label: 'Auto' }
					]}
				/>
			</div>
			{#snippet footer()}
				<Button variant="secondary" onclick={() => (sheetOpen = false)}>Cancel</Button>
				<Button variant="primary" onclick={() => (sheetOpen = false)}>Save</Button>
			{/snippet}
		</Sheet>
		<Glass variant="dark" intensity="medium" class="code-block">
			<pre><code>&lt;Sheet
  bind:open={sheetOpen}
  side="right"
  title="Panel"
&gt;
  Content here
&lt;/Sheet&gt;</code></pre>
		</Glass>
	</Glass>

	<!-- 10. Toast -->
	<Glass variant="card" as="section" intensity="light" border class="component-section">
		<h2>10. Toast</h2>
		<p class="description">Notification system for feedback messages</p>
		<div class="examples">
			<Button variant="primary" onclick={() => toast.success('Success toast!')}>
				Show Success
			</Button>
			<Button variant="danger" onclick={() => toast.error('Error toast!')}>Show Error</Button>
			<Button variant="secondary" onclick={() => toast.info('Info toast!')}>Show Info</Button>
			<Button variant="ghost" onclick={() => toast.warning('Warning toast!')}>
				Show Warning
			</Button>
		</div>
		<Glass variant="dark" intensity="medium" class="code-block">
			<pre><code>&lt;Toast /&gt;

import { toast } from '$lib/components/ui';
toast.success('Operation successful!');
toast.error('Something went wrong');</code></pre>
		</Glass>
	</Glass>

	<!-- 11. Skeleton -->
	<Glass variant="card" as="section" intensity="light" border class="component-section">
		<h2>11. Skeleton</h2>
		<p class="description">Loading placeholder for content</p>
		<div class="skeleton-demo">
			<Card title="Loading Card">
				<Skeleton class="h-4 w-full mb-2" />
				<Skeleton class="h-4 w-3/4 mb-2" />
				<Skeleton class="h-4 w-1/2" />
			</Card>
		</div>
		<Glass variant="dark" intensity="medium" class="code-block">
			<pre><code>&lt;Skeleton class="h-4 w-full" /&gt;
&lt;Skeleton class="h-20 w-20 rounded-full" /&gt;</code></pre>
		</Glass>
	</Glass>

	<!-- 12. Table -->
	<Glass variant="card" as="section" intensity="light" border class="component-section">
		<h2>12. Table</h2>
		<p class="description">Data table component for structured information</p>
		<Table class="showcase-table">
			<TableHeader>
				<TableRow>
					<TableHead>Component</TableHead>
					<TableHead>Status</TableHead>
					<TableHead>Variants</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{#each tableData as row}
					<TableRow>
						<TableCell>{row.component}</TableCell>
						<TableCell><Badge variant="tag">{row.status}</Badge></TableCell>
						<TableCell>{row.variants}</TableCell>
					</TableRow>
				{/each}
			</TableBody>
		</Table>
		<Glass variant="dark" intensity="medium" class="code-block">
			<pre><code>&lt;Table&gt;
  &lt;TableHeader&gt;
    &lt;TableRow&gt;
      &lt;TableHead&gt;Name&lt;/TableHead&gt;
    &lt;/TableRow&gt;
  &lt;/TableHeader&gt;
  &lt;TableBody&gt;
    {#each data as row}
      &lt;TableRow&gt;
        &lt;TableCell&gt;{row.name}&lt;/TableCell&gt;
      &lt;/TableRow&gt;
    {/each}
  &lt;/TableBody&gt;
&lt;/Table&gt;</code></pre>
		</Glass>
	</Glass>

	<!-- Footer -->
	<footer class="showcase-footer">
		<p>All components use the terminal-grove aesthetic with shadcn-svelte primitives</p>
		<div class="footer-badges">
			<Badge variant="tag">SvelteKit</Badge>
			<Badge variant="tag">shadcn-svelte</Badge>
			<Badge variant="tag">Tailwind CSS</Badge>
		</div>
	</footer>
</div>

<style>
	.showcase-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
		font-family: 'Courier New', monospace;
	}

	.showcase-header {
		text-align: center;
		margin-bottom: 4rem;
		padding: 3rem 1rem;
		background: hsl(var(--card));
		border: 1px solid hsl(var(--border));
		border-radius: calc(var(--radius) * 1.5);
	}

	.showcase-header h1 {
		font-size: 3rem;
		font-weight: 700;
		color: hsl(var(--primary));
		margin-bottom: 0.75rem;
		text-shadow: 0 2px 10px hsl(var(--primary) / 0.2);
	}

	.subtitle {
		font-size: 1.25rem;
		color: hsl(var(--muted-foreground));
		margin-bottom: 1rem;
	}

	.component-section {
		margin-bottom: 3rem;
		padding: 2rem;
		transition: all 0.2s ease;
	}

	.component-section:hover {
		transform: translateY(-2px);
	}

	.component-section h2 {
		color: hsl(var(--primary));
		font-size: 1.75rem;
		margin-bottom: 0.5rem;
		font-weight: 600;
	}

	.description {
		color: hsl(var(--muted-foreground));
		margin-bottom: 1.5rem;
		font-size: 0.95rem;
	}

	.examples {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
		margin: 1.5rem 0;
		align-items: center;
	}

	.card-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 1rem;
	}

	.input-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1rem;
		margin: 1.5rem 0;
	}

	.select-demo {
		max-width: 400px;
		margin: 1.5rem 0;
	}

	.selected-value {
		margin-top: 1rem;
		color: hsl(var(--foreground));
	}

	.sheet-content {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.skeleton-demo {
		max-width: 400px;
	}

	.showcase-table {
		margin: 1.5rem 0;
	}

	.code-block {
		margin-top: 1.5rem;
		padding: 1rem;
		border-radius: var(--radius);
	}

	.code-block pre {
		margin: 0;
		padding: 0;
		background: transparent;
		border: none;
		overflow-x: auto;
	}

	code {
		font-family: 'Courier New', monospace;
		font-size: 0.9rem;
		color: white;
		line-height: 1.5;
	}

	.feature-list {
		margin-left: 1.5rem;
		color: hsl(var(--foreground));
	}

	.showcase-footer {
		text-align: center;
		margin-top: 4rem;
		padding: 2rem;
		background: hsl(var(--muted));
		border-radius: var(--radius);
	}

	.showcase-footer p {
		color: hsl(var(--muted-foreground));
		margin-bottom: 1rem;
	}

	.footer-badges {
		display: flex;
		gap: 0.5rem;
		justify-content: center;
		flex-wrap: wrap;
	}

	/* Responsive adjustments */
	@media (max-width: 768px) {
		.showcase-container {
			padding: 1rem;
		}

		.showcase-header h1 {
			font-size: 2rem;
		}

		.component-section {
			padding: 1.5rem;
		}

		.card-grid,
		.input-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
