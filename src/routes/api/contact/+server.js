import { json, error } from "@sveltejs/kit";
import { validateCSRF } from "$lib/utils/csrf";
import { validateEmail } from "$lib/utils/validation";

export async function POST({ request, locals }) {
	if (!validateCSRF(request)) {
		throw error(403, "Invalid origin");
	}

	try {
		const data = await request.json();
		const name = data.name?.toString().trim();
		const email = data.email?.toString().trim();
		const message = data.message?.toString().trim();

		if (!name || !email || !message) {
			throw error(400, "All fields are required");
		}

		if (!validateEmail(email)) {
			throw error(400, "Invalid email address");
		}

		if (name.length > 200) {
			throw error(400, "Name too long");
		}

		if (message.length > 5000) {
			throw error(400, "Message too long (max 5000 characters)");
		}

		// TODO: Store in DB or send notification
		console.log("[CONTACT API] Message received:", { name, email, messageLength: message.length });

		return json({ success: true });
	} catch (err) {
		if (err.status) throw err;
		console.error("Contact error:", err);
		throw error(500, "Failed to process message");
	}
}
