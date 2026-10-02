<template>
	<v-alert
		v-if="update?.update_available"
		color="primary"
		variant="tonal"
		icon="mdi-update"
		density="compact"
		class="ma-2"
	>
		<div class="d-flex flex-wrap align-center ga-2">
			<span class="flex-grow-1">
				A new AOTV update is available: <strong>{{ update.latest_version }}</strong>
				(installed: v{{ update.current_version }})
			</span>
			<v-btn
				:href="update.url"
				target="_blank"
				rel="noopener"
				variant="outlined"
				size="small"
				prepend-icon="mdi-github"
			>
				View on GitHub
			</v-btn>
			<v-btn
				:loading="isDismissing"
				variant="text"
				size="small"
				@click="dismiss"
			>
				Don't remind me of this update
			</v-btn>
		</div>
	</v-alert>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue';
import ky from '@/ky';
import emitter from '@/event-bus';

// Only asks the local server, which itself checks GitHub once a day
const REFRESH_INTERVAL = 60 * 60 * 1000;

const update = ref(null);
const isDismissing = ref(false);
let timer = null;

const fetchUpdate = async () => {
	try {
		update.value = await ky.get('update').json();
	} catch {
		update.value = null;
	}
};

const dismiss = async () => {
	try {
		isDismissing.value = true;
		await ky.post('update/dismiss', { json: { version: update.value.latest_version } });
		update.value = null;
	} finally {
		isDismissing.value = false;
	}
};

onMounted(() => {
	fetchUpdate();
	timer = setInterval(fetchUpdate, REFRESH_INTERVAL);
	emitter.$on('update_settings_changed', fetchUpdate);
});

onUnmounted(() => {
	clearInterval(timer);
	emitter.$off('update_settings_changed', fetchUpdate);
});
</script>
