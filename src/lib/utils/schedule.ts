export function scheduleIdle(cb: (deadline?: IdleDeadline) => void): number {
	if (typeof requestIdleCallback !== "undefined") {
		return requestIdleCallback(cb);
	}
	return setTimeout(cb, 0) as unknown as number;
}

export function cancelIdle(handle: number): void {
	if (typeof cancelIdleCallback !== "undefined") {
		cancelIdleCallback(handle);
	} else {
		clearTimeout(handle);
	}
}
