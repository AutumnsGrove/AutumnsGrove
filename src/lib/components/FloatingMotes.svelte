<script lang="ts">
	import { browser } from '$app/environment';

	let canvas = $state<HTMLCanvasElement>();
	let animationId: number;
	let visible = $state(true);

	interface Mote {
		x: number;
		y: number;
		r: number;
		opacity: number;
		dx: number;
		dy: number;
		phase: number;
		speed: number;
	}

	const MOTE_COUNT = 18;
	const COLORS = [
		'oklch(0.75 0.08 55)',
		'oklch(0.70 0.06 310)',
		'oklch(0.80 0.04 70)',
		'oklch(0.65 0.10 55)',
	];

	function createMotes(w: number, h: number): Mote[] {
		return Array.from({ length: MOTE_COUNT }, () => ({
			x: Math.random() * w,
			y: Math.random() * h,
			r: 1.2 + Math.random() * 2,
			opacity: 0.08 + Math.random() * 0.25,
			dx: (Math.random() - 0.5) * 0.15,
			dy: -0.05 - Math.random() * 0.12,
			phase: Math.random() * Math.PI * 2,
			speed: 0.3 + Math.random() * 0.5,
		}));
	}

	$effect(() => {
		if (!browser || !canvas) return;

		const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		if (prefersReduced) return;

		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		const rect = canvas.getBoundingClientRect();
		const dpr = window.devicePixelRatio || 1;
		canvas.width = rect.width * dpr;
		canvas.height = rect.height * dpr;
		ctx.scale(dpr, dpr);

		const w = rect.width;
		const h = rect.height;
		let motes = createMotes(w, h);
		let t = 0;

		const observer = new IntersectionObserver(
			([entry]) => { visible = entry.isIntersecting; },
			{ threshold: 0 }
		);
		observer.observe(canvas);

		function draw() {
			if (!ctx || !visible) {
				animationId = requestAnimationFrame(draw);
				return;
			}

			ctx.clearRect(0, 0, w, h);
			t += 0.008;

			for (const mote of motes) {
				mote.x += mote.dx + Math.sin(t * mote.speed + mote.phase) * 0.08;
				mote.y += mote.dy;

				if (mote.y < -10) { mote.y = h + 10; mote.x = Math.random() * w; }
				if (mote.x < -10) mote.x = w + 10;
				if (mote.x > w + 10) mote.x = -10;

				const flickerOpacity = mote.opacity * (0.7 + 0.3 * Math.sin(t * 1.5 + mote.phase));

				ctx.beginPath();
				ctx.arc(mote.x, mote.y, mote.r, 0, Math.PI * 2);
				ctx.fillStyle = COLORS[Math.floor(mote.phase * 10) % COLORS.length];
				ctx.globalAlpha = flickerOpacity;
				ctx.fill();
			}

			ctx.globalAlpha = 1;
			animationId = requestAnimationFrame(draw);
		}

		animationId = requestAnimationFrame(draw);

		return () => {
			cancelAnimationFrame(animationId);
			observer.disconnect();
		};
	});
</script>

<canvas bind:this={canvas} class="motes-canvas" aria-hidden="true"></canvas>

<style>
	.motes-canvas {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
		z-index: 2;
	}
</style>
