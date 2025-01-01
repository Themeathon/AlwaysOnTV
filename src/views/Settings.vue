<template>
	<v-row
		justify="center"
		class="mt-2"
	>
		<v-card
			class="mx-auto mt-2"
			min-width="400"
			width="30%"
			height="auto"
		>
			<v-card-title>
				Setup
			</v-card-title>
			<v-card-text class="py-0">
				<v-card variant="flat">
					<v-card-title>
						Generic Settings
					</v-card-title>
					<v-card-text>
						<v-checkbox
							v-model="useRandomPlaylist"
							hide-details
							label="Use random video playlist"
						/>
						<v-select
							v-model="selectedVideoQuality"
							:items="videoQualityOptions"
							item-title="name"
							item-value="quality"
							persistent-hint
							hint="Will be applied to the next video"
							label="Max. Video Quality"
						/>
					</v-card-text>
				</v-card>

				<v-divider
					thickness="3"
				/>

				<v-card variant="flat">
					<v-card-title>
						Twitch Connection
					</v-card-title>
					<v-card-subtitle>
						Channel: {{ channelNameAndLogin }}

						<v-checkbox
							v-model="twitchEnabled"
							hide-details
							label="Enabled"
						/>
					</v-card-subtitle>
					<v-card-text>
						<v-text-field
							v-model="streamingTitle"
							:disabled="!twitchEnabled"
							color="dark"
							label="Streaming Title"
							variant="solo-filled"
							hide-details
							hint="If you want to use the video title in your streaming title use this: {{videotitle}}"
						/>

						<v-text-field
							v-model="clientID"
							:disabled="!twitchEnabled"
							class="my-2"
							:append-icon="showClientID ? 'mdi-eye' : 'mdi-eye-off'"
							:type="showClientID ? 'text' : 'password'"
							label="Client ID"
							variant="solo-filled"
							hide-details
							@click:append="showClientID = !showClientID"
						>
							<template #append />
						</v-text-field>
						<v-text-field
							v-model="clientSecret"
							:disabled="!twitchEnabled"
							class="my-2"
							:append-icon="showClientSecret ? 'mdi-eye' : 'mdi-eye-off'"
							:type="showClientSecret ? 'text' : 'password'"
							label="Client Secret"
							variant="solo-filled"
							hide-details
							@click:append="showClientSecret = !showClientSecret"
						>
							<template #append />
						</v-text-field>

						<v-btn
							color="purple"
							variant="outlined"
							prepend-icon="mdi-twitch"
							:loading="isAuthenticating"
							:disabled="!canAuthenticate || !twitchEnabled"
							class="my-2"
							@click="openAuth"
						>
							Connect With Twitch
						</v-btn>
					</v-card-text>
				</v-card>
			</v-card-text>
			<v-card-actions>
				<v-spacer />
				<v-btn
					class="px-4"
					color="green"
					variant="outlined"
					prepend-icon="mdi-content-save"
					:disabled="!canSave"
					:loading="isLoading"
					@click="saveSettings"
				>
					Save
				</v-btn>
				<v-spacer />
			</v-card-actions>
		</v-card>
	</v-row>

	<v-snackbar
		v-model="snackbar"
		timeout="3000"
	>
		{{ snackbarText }}

		<template #actions>
			<v-btn
				color="blue"
				variant="text"
				@click="snackbar = false"
			>
				Close
			</v-btn>
		</template>
	</v-snackbar>
</template>

<script setup>
import ky, { isLoading, API_URL } from '@/ky';
import { onMounted, ref, computed } from 'vue';

const settingsData = ref({});
const showClientID = ref(false);
const showClientSecret = ref(false);
const isAuthenticating = ref(false);
const useRandomPlaylist = ref(false);

const selectedVideoQuality = ref(null);
const videoQualityOptions = [
	{ quality: 360, name: '360p' },
	{ quality: 480, name: '480p' },
	{ quality: 720, name: '720p' },
	{ quality: 1080, name: '1080p' },
	{ quality: 1440, name: '1440p' },
	{ quality: 2160, name: '2160p' },
];

const twitchEnabled = ref(false);

const streamingTitle = ref('');
const clientID = ref('');
const clientSecret = ref('');

const snackbar = ref(false);
const snackbarText = ref('');

const canAuthenticate = computed(() => {
	if (!settingsData.value?.twitch?.client_id)
		return false;

	if (!settingsData.value?.twitch?.client_secret)
		return false;

	return true;
});

const canSave = computed(() => {
	if (streamingTitle.value !== settingsData.value?.twitch?.title_replacement)
		return true;

	if (twitchEnabled.value !== settingsData.value?.twitch?.enabled)
		return true;

	if (clientID.value !== settingsData.value?.twitch?.client_id)
		return true;

	if (clientSecret.value !== settingsData.value?.twitch?.client_secret)
		return true;

	if (useRandomPlaylist.value !== settingsData.value?.use_random_playlist)
		return true;

	if (selectedVideoQuality.value !== settingsData.value?.max_video_quality)
		return true;

	return false;
});

const channelNameAndLogin = computed(() => {
	const twitch = settingsData.value?.twitch?.data;

	if (!twitch) return 'Not connected';

	return `${twitch.display_name} (${twitch.login})`;
});

const getSettings = async () => {
	settingsData.value = await ky.get('settings').json();

	streamingTitle.value = settingsData.value.twitch.title_replacement;
	twitchEnabled.value = settingsData.value.twitch.enabled;
	clientID.value = settingsData.value.twitch.client_id;
	clientSecret.value = settingsData.value.twitch.client_secret;
	useRandomPlaylist.value = settingsData.value.use_random_playlist;
	selectedVideoQuality.value = videoQualityOptions.find(q => q.quality === settingsData.value.max_video_quality)?.quality;
};

onMounted(getSettings);

const openAuth = async () => {
	isAuthenticating.value = true;

	const authWindow = window.open(
		`${API_URL}auth/connect/twitch`,
		'authWindow',
	);

	const checkWindowClosed = setInterval(() => {
		if (!authWindow || authWindow.closed) {
			isAuthenticating.value = false;

			clearInterval(checkWindowClosed);
		}
	}, 100);

	const listener = window.addEventListener('message', async (event) => {
		if (event.source !== authWindow) return;

		authWindow.close();

		isAuthenticating.value = false;

		window.removeEventListener('message', listener);

		// -- Data
		const { data } = event;
		if (data.status === 200) {
			snackbar.value = true;
			snackbarText.value = data.message;

			await getSettings();
		}
		else {
			snackbar.value = true;
			snackbarText.value = `Error ${data.status}: ${data.message}`;
		}
	});
};

const saveSettings = async () => {
	try {

		await ky
			.post('settings', {
				json: {
					title_replacement: streamingTitle.value,
					twitch_enabled: twitchEnabled.value,
					client_id: clientID.value,
					client_secret: clientSecret.value,
					use_random_playlist: useRandomPlaylist.value,
					max_video_quality: selectedVideoQuality.value,
				},
			})
			.json();

		await getSettings();

		snackbar.value = true;
		snackbarText.value = 'Successfully updated settings.';
	}
	catch (error) {
		const message = await error.response.text();

		snackbar.value = true;
		snackbarText.value = message;
	}
};
</script>
