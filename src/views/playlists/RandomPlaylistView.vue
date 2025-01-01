<template>
	<v-container class="h-100">
		<v-card
			class="mx-auto h-100"
		>
			<div class="d-flex flex-column h-100">
				<v-card-text>
					<div
						class="d-flex align-center"
					>
						<v-img
							:src="playlistData.thumbnail_url || placeholderImage"
							cover
							:aspect-ratio="16 / 9"
							width="250"
							max-width="250"
							class="ma-4"
						/>

						<v-spacer />

						<div class="text-center text-wrap">
							<p class="text-h3 mx-4">
								Random Playlist
							</p>

							<p class="mt-2 text-subtitle-1">
								<strong>Estimated length:</strong> {{ queueLength }}
							</p>
						</div>

						<v-spacer />

						<v-btn
							class="ml-2"
							color="primary"
							variant="outlined"
							prepend-icon="mdi-plus"
							@click="openAddVideoDialog"
						>
							Add Video To Playlist
						</v-btn>
					</div>
				</v-card-text>

				<v-divider thickness="3" />

				<v-card-text
					style="position: relative; height:100%;"
				>
					<v-virtual-scroll
						style="position: absolute; left: 0; right: 0; top: 0; bottom: 0;"
						:items="playlistData.videos"
						item-height="100"
					>
						<template #default="{ item }">
							<v-list-item>
								<v-list-item-title>
									{{ playlistData.videoInfo[item.id].title }}
								</v-list-item-title>

								<v-list-item-subtitle>
									<strong>Game:</strong> {{ getGameByVideoID(item.id)?.title }}
								</v-list-item-subtitle>

								<v-list-item-subtitle>
									<strong>Length:</strong> {{ getVideoLength(item.id) }}
								</v-list-item-subtitle>

								<template #prepend>
									<v-img
										:src="playlistData?.videoInfo[item.id]?.thumbnail_url || placeholderImage"
										:lazy-src="placeholderImage"
										cover
										:aspect-ratio="16 / 9"
										width="125"
										class="mr-5 my-2"
									/>
									<v-btn
										icon="mdi-youtube"
										size="x-small"
										variant="tonal"
										class="mr-3"
										color="red"
										:href="'https://youtu.be/' + item.id"
										target="_blank"
									>
										<v-tooltip
											activator="parent"
											location="top"
											:eager="false"
										>
											Watch On YouTube
										</v-tooltip>
										<v-icon />
									</v-btn>
									<v-btn
										icon="mdi-trash-can"
										size="x-small"
										variant="tonal"
										class="mr-5"
										color="red"
										:loading="isLoading"
										@click="removeVideoFromPlaylist(item.id)"
									>
										<v-tooltip
											activator="parent"
											location="top"
											:eager="false"
										>
											Remove Video From Playlist
										</v-tooltip>
										<v-icon />
									</v-btn>
								</template>
							</v-list-item>
						</template>
					</v-virtual-scroll>
				</v-card-text>
			</div>
		</v-card>
	</v-container>

	<!-- Add Video To Playlist -->
	<v-dialog
		v-model="addVideoDialog"
		width="800"
	>
		<v-card flat>
			<v-card-title>
				<span class="text-h5">Adds a video to the playlist</span>
			</v-card-title>
			<v-card-text>
				<v-container>
					<v-row>
						<v-btn
							color="green-darken-1"
							variant="text"
							prepend-icon="mdi-magnify"
							@click="openSelectVideoDialog"
						>
							Select Video
						</v-btn>
					</v-row>

					<v-row>
						<v-col
							cols="12"
							sm="6"
							class="pl-0"
						>
							<v-img
								:src="selectedVideo.thumbnail_url || placeholderImage"
								cover
								:aspect-ratio="16 / 9"
								width="auto"
							/>
						</v-col>
						<v-col
							cols="12"
							sm="6"
							class="pr-0"
						>
							<div class="d-flex flex-column justify-space-around h-100">
								<div>
									<v-text-field
										v-model="selectedVideo.title"
										label="Video"
										readonly
										variant="solo-filled"
										hide-details
									/>
								</div>
								<div>
									<v-text-field
										v-model="selectedVideo.id"
										label="Video ID"
										readonly
										variant="solo-filled"
										hide-details
									/>
								</div>
							</div>
						</v-col>
					</v-row>
				</v-container>
				<small>Adds a video to the playlist</small>
			</v-card-text>
			<v-card-actions>
				<v-spacer />
				<v-btn
					color="red-darken-1"
					variant="text"
					@click="addVideoDialog = false"
				>
					Close
				</v-btn>
				<v-btn
					color="green-darken-1"
					variant="text"
					:disabled="disableAddVideoToPlaylist"
					:loading="isLoading"
					@click="addNewVideoToPlaylist"
				>
					Add
				</v-btn>
			</v-card-actions>
		</v-card>
	</v-dialog>

	<!-- Select Video -->
	<SelectVideoDialog
		ref="selectVideoDialog"
		@select-video="selectVideo"
	/>

	<!-- Snackbar -->
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
import ky, { isLoading } from '@/ky';
import { onMounted, ref, computed } from 'vue';

import SelectVideoDialog from '@/composables/SelectVideoDialog.vue';

import placeholderImage from '@/assets/placeholder-500x700.jpg';
import { Duration } from 'luxon';

const queueLength = computed(() => {
	let progress = Duration.fromMillis(0);

	if (!playlistData.value?.videos?.length) {
		return '0 seconds';
	}

	for (const video of playlistData.value.videos) {
		progress = progress.plus({ seconds: getVideoLength(video.id, false) });
	}

	if (progress.as('days') >= 1) {
		const progressWithoutDays = progress.minus({ days: Math.floor(progress.as('days')) });
		return `${progress.toFormat('d \'days\'')}, ${progressWithoutDays.toFormat('h \'hours\', m \'minutes\', s \'seconds\'')}`;
	}
	else {
		return progress.toFormat('h \'hours\', m \'minutes\', s \'seconds\'');
	}
});

const getGameByVideoID = videoId => {
	const videoInfo = playlistData.value.videoInfo[videoId];

	return playlistData.value.gameInfo[videoInfo.gameId];
};

const getVideoLength = (videoId, asString = true) => {
	const videoInfo = playlistData.value.videoInfo[videoId];

	const progress = Duration.fromObject({ seconds: videoInfo.length });

	return asString ? progress.toFormat('hh:mm:ss') : videoInfo.length;
};

// ---
// Select Video

const addVideoDialog = ref(false);

const openAddVideoDialog = () => {
	addVideoDialog.value = true;
	openSelectVideoDialog();
};

const selectVideoDialog = ref(null);
const selectedVideo = ref(false);

const openSelectVideoDialog = () => {
	selectVideoDialog.value.open();
};

const selectVideo = video => {
	selectedVideo.value = video;
};

// ---

const playlistData = ref({});

const snackbar = ref(false);
const snackbarText = ref('');

const disableAddVideoToPlaylist = computed(() => {
	if (!selectedVideo.value) return false;

	const hasVideo = playlistData.value.videos.some((video) =>
		video.id === selectedVideo.value.id,
	);

	return hasVideo;
});

const addNewVideoToPlaylist = async () => {
	const videoData = {
		id: selectedVideo.value.id,
		title: selectedVideo.value.title,
	};

	try {
		await ky
			.put('random-playlist', {
				json: {
					videoIds: videoData.id,
				},
			})
			.json();

		playlistData.value = await ky.get('random-playlist').json();

		addVideoDialog.value = false;

		snackbar.value = true;
		snackbarText.value = 'Successfully added video to playlist.';
	}
	catch (error) {
		const message = await error.response.text();

		snackbar.value = true;
		snackbarText.value = message;
	}
};

onMounted(async () => {
	playlistData.value = await ky.get('random-playlist').json();
});

const removeVideoFromPlaylist = async (videoId) => {
	try {
		await ky
			.post('random-playlist/delete', {
				json: {
					videoIds: videoId,
				},
			})
			.json();

		playlistData.value = await ky.get('random-playlist').json();

		snackbar.value = true;
		snackbarText.value = 'Successfully deleted video from random playlist.';
	}
	catch (error) {
		const message = await error.response.text();

		snackbar.value = true;
		snackbarText.value = message;
	}
};
</script>
