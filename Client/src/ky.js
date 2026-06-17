import { useCookies } from 'vue3-cookies';
import { ref } from 'vue';

import ky from 'ky';

export let isLoading = ref(false);

export const API_URL = import.meta.env.VITE_API_URL || '/';

function addAuthorization ({ request }) {
	const { cookies } = useCookies();

	if (!cookies.isKey('password')) return;

	request.headers.set('Authorization', cookies.get('password'));
}

export function getMPDForVideo (video) {
	return `${API_URL}api/youtube/get-mpd?videoId=${video.id}&videoQuality=${video.video_quality}`;
}

const api = ky.create({
	prefix: `${API_URL}api`,
	hooks: {
		beforeRequest: [
			() => isLoading.value = false,
			addAuthorization,
		],
		afterResponse: [
			async ({ response }) => {
				const contentType = response.headers.get('content-type');
				if (!contentType || !contentType.includes('application/json')) {
					return response;
				}

				const resClone = response.clone();
				const { data, message } = await resClone.json();

				if (!response.ok) {
					throw new Error(message || `HTTP Error ${response.status}`);
				}

				const body = typeof data === 'object' ? JSON.stringify(data) : (message || '');

				return new Response(body, {
					status: response.status,
					headers: response.headers
				});
			},
		],
	},
});

export const auth = ky.create({
	prefix: `${API_URL}auth`,
	hooks: {
		beforeRequest: [
			addAuthorization,
		],
		afterResponse: [
			async ({ response }) => {
				const contentType = response.headers.get('content-type');
				if (!contentType || !contentType.includes('application/json')) {
					return response;
				}

				const resClone = response.clone();
				const { data, message } = await resClone.json();

				if (!response.ok) {
					throw new Error(message || `HTTP Error ${response.status}`);
				}

				const body = typeof data === 'object' ? JSON.stringify(data) : (message || '');

				return new Response(body, {
					status: response.status,
					headers: response.headers
				});
			},
		],
	},
});

export const queue = ky.create({
	prefix: `${API_URL}api/queue`,
	hooks: {
		beforeRequest: [
			addAuthorization,
		],
		afterResponse: [
			async ({ response }) => {
				const contentType = response.headers.get('content-type');
				if (!contentType || !contentType.includes('application/json')) {
					return response;
				}

				const resClone = response.clone();
				const { data, message } = await resClone.json();

				if (!response.ok) {
					throw new Error(message || `HTTP Error ${response.status}`);
				}

				const body = typeof data === 'object' ? JSON.stringify(data) : (message || '');

				return new Response(body, {
					status: response.status,
					headers: response.headers
				});
			},
		],
	},
});

export default api;