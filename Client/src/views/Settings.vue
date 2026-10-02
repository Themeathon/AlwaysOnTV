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
							class="mb-2"
						/>
						<v-select
							v-model="youtubePlaybackMode"
							:items="playbackModeOptions"
							item-title="name"
							item-value="mode"
							persistent-hint
							hint="Streaming starts instantly; downloading fetches videos to disk before they play"
							label="YouTube Playback"
							class="mb-2"
						/>
						<v-alert
							v-if="youtubePlaybackMode === 'stream' && !settingsData.youtube_cookies"
							color="error"
							variant="outlined"
							:icon="false"
							class="mb-4"
						>
							<div class="text-subtitle-1 font-weight-medium mb-1">
								cookies.txt is highly recommended
							</div>
							<p class="text-body-2 text-medium-emphasis">
								Without YouTube cookies the server can run into YouTube's bot detection
								("Sign in to confirm you're not a bot") and videos won't play.
								To avoid this, add a <code>cookies.txt</code> as described in the README.
							</p>
							<v-btn
								variant="outlined"
								size="small"
								class="mt-3 text-high-emphasis"
								@click="cookiesHelpDialog = true"
							>
								How to get the cookies
							</v-btn>
						</v-alert>
						<v-select
							v-model="prefetchQueueAmount"
							:items="prefetchOptions"
							persistent-hint
							:hint="youtubePlaybackMode === 'download' ? 'How many upcoming videos to pre-download in advance' : 'How many upcoming videos to prepare streams for in advance'"
							label="Queue Caching Look-Ahead Amount"
						/>
					</v-card-text>
				</v-card>

				<v-divider thickness="3" />

				<v-card variant="flat">
					<v-card-title>
						Local Media
					</v-card-title>
					<v-card-subtitle>
						Paths the server will scan for local video files.
					</v-card-subtitle>
					<v-card-text>
						<v-row
							v-for="(path, index) in localBasePaths"
							:key="index"
							density="compact"
							align="center"
						>
							<v-col cols="10">
								<v-text-field
									v-model="localBasePaths[index]"
									:label="`Path ${index + 1}`"
									variant="solo-filled"
									density="compact"
									hide-details="auto"
									placeholder="/path/to/your/videos"
								/>
							</v-col>
							<v-col cols="2">
								<v-btn
									icon="mdi-delete"
									variant="text"
									color="red"
									size="small"
									title="Remove Path"
									@click="removePath(index)"
								/>
							</v-col>
						</v-row>
						<v-row density="compact">
							<v-col class="d-flex justify-center">
								<v-btn
									icon="mdi-plus"
									variant="outlined"
									color="green"
									size="small"
									title="Add New Path"
									@click="addPath"
								/>
							</v-col>
						</v-row>
					</v-card-text>
				</v-card>
				<v-divider thickness="3" />

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
							hint="If you want to use the video title in your streaming title use this: {{videoTitle}}"
						/>
						<template v-if="!twitchConfigured">
							<div class="text-caption my-2">
								Create an application in the Twitch Developer Console to get a Client ID and Client Secret.
								Set its OAuth Redirect URL to <code>{{ twitchCallbackURL }}</code>.
							</div>
							<v-btn
								color="purple"
								variant="text"
								prepend-icon="mdi-open-in-new"
								href="https://dev.twitch.tv/console/apps"
								target="_blank"
								rel="noopener"
								class="mb-2"
							>
								Open Twitch Developer Console
							</v-btn>
						</template>
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
						/>
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
						/>
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

	<v-dialog
		v-model="cookiesHelpDialog"
		max-width="640"
	>
		<v-card title="How to get the cookies">
			<v-card-text>
				<ol class="ml-4">
					<li class="mb-2">
						Install a browser extension that exports cookies in Netscape format, for example "Get cookies.txt LOCALLY".
					</li>
					<li class="mb-2">
						Log into YouTube in that browser. A secondary account is safest.
					</li>
					<li class="mb-2">
						Open youtube.com and export the cookies with the extension.
					</li>
					<li class="mb-2">
						Name the file <code>cookies.txt</code> and put it in the server folder: <code>Server/cookies.txt</code>.
					</li>
					<li>
						Reload this page. The server picks up the file without a restart.
					</li>
				</ol>
				<p class="mt-4 text-medium-emphasis">
					If the bot check comes back later, the cookies have expired. Export them again.
				</p>
			</v-card-text>
			<v-card-actions>
				<v-spacer />
				<v-btn
					variant="text"
					@click="cookiesHelpDialog = false"
				>
					Close
				</v-btn>
			</v-card-actions>
		</v-card>
	</v-dialog>

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
import _ from 'lodash';

const settingsData = ref({});
const showClientID = ref(false);
const showClientSecret = ref(false);
const isAuthenticating = ref(false);
const useRandomPlaylist = ref(false);
const useEntireRandomPlaylist = ref(false);
const selectedVideoQuality = ref(null);
const prefetchQueueAmount = ref(1);
const youtubePlaybackMode = ref('stream');
const cookiesHelpDialog = ref(false);
const twitchEnabled = ref(false);
const streamingTitle = ref('');
const clientID = ref('');
const clientSecret = ref('');
const snackbar = ref(false);
const snackbarText = ref('');

const localBasePaths = ref(['']);
const originalLocalBasePaths = ref([]);

const videoQualityOptions = [
	{ quality: 360, name: '360p' },
	{ quality: 480, name: '480p' },
	{ quality: 720, name: '720p' },
	{ quality: 1080, name: '1080p' },
	{ quality: 1440, name: '1440p' },
	{ quality: 2160, name: '2160p' },
];

const playbackModeOptions = [
	{ mode: 'stream', name: 'Stream (DASH)' },
	{ mode: 'download', name: 'Download first' },
];

const prefetchOptions = Array.from({ length: 10 }, (v, i) => i + 1);

const twitchCallbackURL = new URL('auth/connect/twitch/callback', new URL(API_URL, window.location.href)).href;

const twitchConfigured = computed(() => {
	const twitch = settingsData.value?.twitch;
	return Boolean(twitch?.enabled && twitch?.client_id && twitch?.client_secret);
});

const canAuthenticate = computed(() => !!clientID.value && !!clientSecret.value);

const canSave = computed(() => {
	const currentPaths = localBasePaths.value.filter(p => p.trim() !== '');
	const originalPaths = originalLocalBasePaths.value.filter(p => p.trim() !== '');

	return streamingTitle.value !== settingsData.value?.twitch?.title_replacement ||
      twitchEnabled.value !== settingsData.value?.twitch?.enabled ||
      clientID.value !== settingsData.value?.twitch?.client_id ||
      clientSecret.value !== settingsData.value?.twitch?.client_secret ||
      useRandomPlaylist.value !== settingsData.value?.use_random_playlist ||
      useEntireRandomPlaylist.value !== settingsData.value?.use_entire_random_playlist ||
      selectedVideoQuality.value !== settingsData.value?.max_video_quality ||
      prefetchQueueAmount.value !== settingsData.value?.prefetch_queue_amount ||
      youtubePlaybackMode.value !== (settingsData.value?.youtube_playback_mode ?? 'stream') ||
      !_.isEqual(currentPaths.sort(), originalPaths.sort());
});

const channelNameAndLogin = computed(() => {
	const twitch = settingsData.value?.twitch?.data;

	if (!twitch) return 'Not connected';

	return `${twitch.display_name} (${twitch.login})`;
});

const getSettings = async () => {
	try {
		isLoading.value = true;
		settingsData.value = await ky.get('settings').json();
		streamingTitle.value = settingsData.value.twitch?.title_replacement || '';
		twitchEnabled.value = settingsData.value.twitch?.enabled || false;
		clientID.value = settingsData.value.twitch?.client_id || '';
		clientSecret.value = settingsData.value.twitch?.client_secret || '';
		useRandomPlaylist.value = settingsData.value.use_random_playlist ?? true;
		useEntireRandomPlaylist.value = settingsData.value.use_entire_random_playlist ?? false;
		selectedVideoQuality.value = videoQualityOptions.find(q => q.quality === settingsData.value.max_video_quality)?.quality || 1080;
		prefetchQueueAmount.value = settingsData.value.prefetch_queue_amount ?? 1;
		youtubePlaybackMode.value = settingsData.value.youtube_playback_mode ?? 'stream';

		const loadedPaths = settingsData.value.local_media?.base_paths || [];
		localBasePaths.value = loadedPaths.length > 0 ? [...loadedPaths] : [''];
		originalLocalBasePaths.value = [...loadedPaths];

	} catch(error) {
		showSnackbar(`Error loading settings: ${await error?.response?.text() || error.message}`);
	} finally {
		isLoading.value = false;
	}
};

onMounted(getSettings);

const showSnackbar = (text) => {
	snackbarText.value = text;
	snackbar.value = true;
};

const addPath = () => {
	localBasePaths.value.push('');
};

const removePath = (index) => {
	if (localBasePaths.value.length > 1) {
		localBasePaths.value.splice(index, 1);
	} else if (localBasePaths.value.length === 1) {
		localBasePaths.value[0] = '';
	}
};

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
		isLoading.value = true;

		const pathsToSave = localBasePaths.value.filter(p => p && p.trim() !== '');

		await ky.post('settings', {
			json: {
				title_replacement: streamingTitle.value,
				twitch_enabled: twitchEnabled.value,
				client_id: clientID.value,
				client_secret: clientSecret.value,
				use_random_playlist: useRandomPlaylist.value,
				use_entire_random_playlist: useEntireRandomPlaylist.value,
				max_video_quality: selectedVideoQuality.value,
				prefetch_queue_amount: prefetchQueueAmount.value,
				youtube_playback_mode: youtubePlaybackMode.value,
				local_base_paths: pathsToSave,
			},
		}).json();

		await getSettings();
		showSnackbar('Successfully updated settings.');

	} catch (error) {
		showSnackbar(`Error saving settings: ${await error?.response?.text() || error.message}`);
	} finally {
		isLoading.value = false;
	}
};

const toggleCheckbox = (changedCheckbox) => {
	if (changedCheckbox === 'useRandomPlaylist' && useRandomPlaylist.value) {
		useEntireRandomPlaylist.value = false;
	} else if (changedCheckbox === 'useEntireRandomPlaylist' && useEntireRandomPlaylist.value) {
		useRandomPlaylist.value = false;
	}
};

</script>

<style scoped>
.v-row + .v-row {
  margin-top: 8px;
}
</style>