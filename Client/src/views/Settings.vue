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
							label="Uses a random video from the Random Playlist"
							@change="toggleCheckbox('useRandomPlaylist')"
						/>
						<v-checkbox
							v-model="useEntireRandomPlaylist"
							hide-details
							label="Uses an entire random playlist"
							@change="toggleCheckbox('useEntireRandomPlaylist')"
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
						Channel: {{ channelNameAndLogin.display_name }}
						({{ channelNameAndLogin.login }})<br>
						Status: {{ channelNameAndLogin.broadcaster_type }}

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

				<v-divider
					v-if="['affiliate', 'partner'].includes(channelNameAndLogin.broadcaster_type)"
					thickness="3"
				/>

				<v-card
					v-if="['affiliate', 'partner'].includes(channelNameAndLogin.broadcaster_type)"
					variant="flat"
				>
					<v-card-title>
						Twitch Ads Manager
					</v-card-title>
					<v-card-text>
						<p>Manage your Twitch ads settings below to optimize revenue and viewer experience.</p>
						<v-select
							v-model="twitchAdDuration"
							:items="twitchAdDurationOptions"
							item-title="name"
							item-value="duration"
							label="Ad Duration"
							hint="Select the duration for each ad break"
							persistent-hint
							:disabled="isAdsManagerRunning"
						/>
						<v-select
							v-model="twitchAdInterval"
							:items="twitchAdIntervalOptions"
							item-title="name"
							item-value="interval"
							label="Ad Interval"
							hint="Select the time interval between ad breaks"
							persistent-hint
							:disabled="isAdsManagerRunning"
						/>

						<p v-if="lastAdPlayed">Last ad played: {{ lastAdPlayed }}</p>
						<p v-if="nextAdScheduled">Next ad scheduled: {{ nextAdScheduled }}</p>

						<v-btn
					color="green"
					variant="outlined"
					prepend-icon="mdi-play"
					@click="startAdsManager"
					:disabled="isAdsManagerRunning"
				>
					Start Ads Manager
				</v-btn>
				<v-btn
					color="red"
					variant="outlined"
					prepend-icon="mdi-stop"
					@click="stopAdsManager"
					:disabled="!isAdsManagerRunning"
				>
					Stop Ads Manager
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
import { onMounted, ref, computed, watch } from 'vue';

const settingsData = ref({});
const showClientID = ref(false);
const showClientSecret = ref(false);
const isAuthenticating = ref(false);
const useRandomPlaylist = ref(false);
const useEntireRandomPlaylist = ref(false);

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
const twitchAdDuration = ref(null);
const twitchAdDurationOptions = [
	{ duration: 30, name: '30s' },
	{ duration: 60, name: '60s' },
	{ duration: 90, name: '90s' },
	{ duration: 120, name: '120s' },
	{ duration: 150, name: '150s' },
	{ duration: 180, name: '180s' }
];

const twitchAdInterval = ref(null);
const twitchAdIntervalOptions = [
	{ interval: 15, name: '15 minutes'},
	{ interval: 30, name: '30 minutes'},
	{ interval: 45, name: '45 minutes'},
	{ interval: 60, name: '60 minutes'},
];

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

	if (useEntireRandomPlaylist.value !== settingsData.value?.use_entire_random_playlist)
		return true;

	if (selectedVideoQuality.value !== settingsData.value?.max_video_quality)
		return true;

	if (twitchAdDuration.value !== settingsData.value?.twitch_ad_duration)
		return true;

	if (twitchAdInterval.value !== settingsData.value?.twitch_ad_interval)
		return true;

	return false;
});

const channelNameAndLogin = computed(() => {
	const twitch = settingsData.value?.twitch?.data;
	return twitch ? twitch: 'Not connected';
});

const getSettings = async () => {
	settingsData.value = await ky.get('settings').json();

	streamingTitle.value = settingsData.value.twitch.title_replacement;
	twitchEnabled.value = settingsData.value.twitch.enabled;
	clientID.value = settingsData.value.twitch.client_id;
	clientSecret.value = settingsData.value.twitch.client_secret;
	useRandomPlaylist.value = settingsData.value.use_random_playlist;
	useEntireRandomPlaylist.value = settingsData.value.use_entire_random_playlist;
	selectedVideoQuality.value = videoQualityOptions.find(q => q.quality === settingsData.value.max_video_quality)?.quality;
	twitchAdDuration.value = settingsData.value.twitch_ad_duration;
	twitchAdInterval.value = settingsData.value.twitch_ad_interval;
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
					use_entire_random_playlist: useEntireRandomPlaylist.value,
					max_video_quality: selectedVideoQuality.value,
					twitch_ad_duration: twitchAdDuration.value,
					twitch_ad_interval: twitchAdInterval.value,
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

const toggleCheckbox = (changedCheckbox) => {
  if (changedCheckbox === 'useRandomPlaylist' && useRandomPlaylist.value) {
    useEntireRandomPlaylist.value = false;
  } else if (changedCheckbox === 'useEntireRandomPlaylist' && useEntireRandomPlaylist.value) {
    useRandomPlaylist.value = false;
  }
};

// Initial states
const isAdsManagerRunning = ref(false);
const lastAdPlayed = ref(null);
const nextAdScheduled = ref(null);
const intervalId = ref(null);

// Load saved state from localStorage when page loads
onMounted(() => {
	const savedState = JSON.parse(localStorage.getItem('adsManagerState'));
	if (savedState && savedState.isRunning) {
		// Restore previous state
		twitchAdInterval.value = savedState.interval;
		lastAdPlayed.value = savedState.lastAdPlayed;
		nextAdScheduled.value = savedState.nextAdScheduled;
		isAdsManagerRunning.value = true;
		// Restart interval if necessary
		intervalId.value = setInterval(playAd, twitchAdInterval.value * 5000);
	}
});

// Watch for changes to the ads manager state and save to localStorage
watch(isAdsManagerRunning, (newVal) => {
	localStorage.setItem(
		'adsManagerState',
		JSON.stringify({
			isRunning: newVal,
			interval: twitchAdInterval.value,
			lastAdPlayed: lastAdPlayed.value,
			nextAdScheduled: nextAdScheduled.value,
		})
	);
});

const playAd = async () => {
	try {
		await ky.post('twitch/start-commercial', {
			json: { duration: 30 }, // Example ad duration
		}).json();

		lastAdPlayed.value = new Date().toLocaleTimeString();
		nextAdScheduled.value = new Date(
			Date.now() + twitchAdInterval.value * 5000
		).toLocaleTimeString();

		snackbarText.value = 'Ad played successfully!';
	} catch (error) {
		snackbarText.value = `Error playing ad: ${
			error.response ? await error.response.text() : error.message
		}`;
	} finally {
		snackbar.value = true;
	}
};

const startAdsManager = () => {
	isAdsManagerRunning.value = true;
	lastAdPlayed.value = null;
	nextAdScheduled.value = new Date(
		Date.now() + twitchAdInterval.value * 5000
	).toLocaleTimeString();

	// Start the ad interval
	intervalId.value = setInterval(() => {
		playAd();
	}, twitchAdInterval.value * 5000);

	snackbarText.value = 'Ads Manager started!';
	snackbar.value = true;
};

const stopAdsManager = () => {
	isAdsManagerRunning.value = false;

	// Stop the interval and clear it
	clearInterval(intervalId.value);
	intervalId.value = null;

	// Clear the next scheduled ad
	nextAdScheduled.value = null;

	snackbarText.value = 'Ads Manager stopped!';
	snackbar.value = true;
};

</script>
