import { useCookies } from 'vue3-cookies';
import { ref } from 'vue';

import ky from 'ky';

export let isLoading = ref(false);

export const API_URL = import.meta.env.VITE_API_URL || '/';

function addAuthorization (request) {
	const { cookies } = useCookies();

	if (!cookies.isKey('password')) return;

	request.headers.set('Authorization', cookies.get('password'));
}

export function getMPDForVideo (video) {
	return `${API_URL}api/youtube/get-mpd?videoId=${video.id}&videoQuality=${video.video_quality}`;
}

const api = ky.create({
	prefixUrl: `${API_URL}api`,
	hooks: {
		beforeRequest: [
			() => isLoading.value = true,
			addAuthorization,
		],
		afterResponse: [
			async (_request, _options, response) => {
				isLoading.value = false;

				const { data, message } = await response.json();

				const body = typeof data === 'object' ? JSON.stringify(data) : message;

				return new Response(body, {
					status: response.status,
				});
			},
		],
	},
});

export const auth = ky.create({
	prefixUrl: `${API_URL}auth`,
	hooks: {
		beforeRequest: [
			addAuthorization,
		],
		afterResponse: [
			async (_request, _options, response) => {
				const { data, message } = await response.json();

				const body = typeof data === 'object' ? JSON.stringify(data) : message;

				return new Response(body, {
					status: response.status,
				});
			},
		],
	},
});

export const queue = ky.create({
	prefixUrl: `${API_URL}api/queue`,
	hooks: {
		beforeRequest: [
			addAuthorization,
		],
		afterResponse: [
			async (_request, _options, response) => {
				const { data, message } = await response.json();

				const body = typeof data === 'object' ? JSON.stringify(data) : message;

				return new Response(body, {
					status: response.status,
				});
			},
		],
	},
});

export default api;