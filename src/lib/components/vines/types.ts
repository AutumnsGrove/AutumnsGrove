import type { Component } from "svelte";

export interface TOCHeader {
	id: string;
	text: string;
	level?: number;
}

export const DEFAULT_SCROLL_OFFSET = 80;

export function isValidIcon(icon: unknown): icon is Component<{ class?: string }> {
	if (icon === null || icon === undefined) return false;
	return typeof icon === "function" || (typeof icon === "object" && Object.keys(icon as object).length > 0);
}
