import { fail } from "@sveltejs/kit";
import { validateEmail } from "$lib/utils/validation";
import { validateCSRFToken } from "$lib/utils/csrf";

export const prerender = false;

export const actions = {
	default: async ({ request, locals, platform }) => {
		if (!validateCSRFToken(request, locals.csrfToken)) {
			return fail(403, { error: "Invalid CSRF token" });
		}

		const formData = await request.formData();
		const name = formData.get("name")?.toString().trim();
		const email = formData.get("email")?.toString().trim();
		const message = formData.get("message")?.toString().trim();

		if (!name || !email || !message) {
			return fail(400, { error: "All fields are required.", name, email, message });
		}

		if (!validateEmail(email)) {
			return fail(400, { error: "Please enter a valid email address.", name, email, message });
		}

		if (message.length > 5000) {
			return fail(400, { error: "Message is too long (max 5000 characters).", name, email, message });
		}

		// TODO: Store message in DB or send email notification
		console.log("[CONTACT] Message received:", { name, email, messageLength: message.length });

		return { success: true };
	},
};
