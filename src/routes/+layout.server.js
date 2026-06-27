export async function load({ locals }) {
	return {
		user: locals.user || null,
		csrfToken: locals.csrfToken || null,
	};
}
