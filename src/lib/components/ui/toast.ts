import { toast as sonnerToast } from "sonner";

export const toast = {
	/**
	 * Show a success toast notification
	 */
	success: (message: string, options?: { duration?: number; description?: string }) => {
		sonnerToast.success(message, {
			duration: options?.duration || 3000,
			description: options?.description
		});
	},

	/**
	 * Show an error toast notification
	 */
	error: (message: string, options?: { duration?: number; description?: string }) => {
		sonnerToast.error(message, {
			duration: options?.duration || 4000,
			description: options?.description
		});
	},

	/**
	 * Show an info toast notification
	 */
	info: (message: string, options?: { duration?: number; description?: string }) => {
		sonnerToast.info(message, {
			duration: options?.duration || 3000,
			description: options?.description
		});
	},

	/**
	 * Show a warning toast notification
	 */
	warning: (message: string, options?: { duration?: number; description?: string }) => {
		sonnerToast.warning(message, {
			duration: options?.duration || 3500,
			description: options?.description
		});
	},

	/**
	 * Show a custom/loading toast notification
	 */
	loading: (message: string) => {
		return sonnerToast.loading(message);
	},

	/**
	 * Show a promise-based toast (resolves/rejects based on promise state)
	 */
	promise: <T,>(
		promise: Promise<T>,
		messages: {
			loading: string;
			success: string;
			error: string;
		}
	) => {
		sonnerToast.promise(promise, messages);
	},

	/**
	 * Dismiss a specific toast by ID
	 */
	dismiss: (toastId?: string | number) => {
		sonnerToast.dismiss(toastId);
	},

	/**
	 * Dismiss all toasts
	 */
	dismissAll: () => {
		sonnerToast.dismiss();
	}
};
