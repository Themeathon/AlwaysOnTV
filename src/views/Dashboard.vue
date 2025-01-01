<template>
	<v-container
		fluid
		class="h-100"
	>
		<div
			class="d-flex flex-column h-100"
		>
			<v-row>
				<v-col
					sm="12"
					xl="6"
				>
					<v-card
						class="h-100"
					>
						<div class="d-flex flex-column h-100">
							<div class="my-4">
								<div class="d-flex align-center mr-4">
									<v-card-title class="text-h3 mb-4">
										Queue
									</v-card-title>

									<v-spacer />

									<v-btn
										class="mx-2"
										color="blue"
										variant="outlined"
										prepend-icon="mdi-plus"
										@click="openSelectVideoDialog"
									>
										Video
									</v-btn>

									<v-btn
										class="mx-2"
										color="blue"
										variant="outlined"
										prepend-icon="mdi-plus"
										@click="openSelectPlaylistDialog"
									>
										Playlist
									</v-btn>

									<v-btn
										class="mx-2"
										color="green"
										variant="outlined"
										prepend-icon="mdi-plus"
										@click="openAddRandomVideosDialog"
									>
										Random Videos
									</v-btn>

									<v-btn
										class="mx-2"
										color="red"
										variant="outlined"
										prepend-icon="mdi-delete"
										:disabled="isQueueEmpty"
										@click="deleteDialog = true"
									>
										Clear
									</v-btn>
								</div>

								<v-card-subtitle v-if="isQueueEmpty">
									The queue is empty.
								</v-card-subtitle>
								<v-card-subtitle v-else>
									<p v-if="getQueueLength === 1">
										There is <strong>{{ getQueueLength }}</strong> video in the queue
									</p>
									<p v-else>
										There are <strong>{{ getQueueLength }}</strong> videos in the queue
									</p>

									<p>
										<strong>Estimated length:</strong> {{ queueLength }}
									</p>
								</v-card-subtitle>

								<v-card-text class="pb-0">
									<v-row>
										<v-col cols="3">
											<v-img
												:src="currentVideo.thumbnail_url"
												:lazy-src="placeholderImage"
												:aspect-ratio="16/9"
												width="auto"
												cover
												class="mr-5"
											/>
										</v-col>
										<v-col
											cols="12"
											md="9"
											class="d-flex flex-column text-center"
										>
											<span class="text-h5 mb-2 font-weight-medium">{{ currentVideo.title }}</span>

											<v-slider
												v-model="sliderValue"
												class="mt-5"
												:min="0"
												:max="videoLength"
												:disabled="videoLoading"
												density="compact"
												hide-details
												thumb-label
												@start="sliderStartDrag"
												@end="sliderEndDrag"
											>
												<template #thumb-label="{}">
													{{ videoThumb }}
												</template>
											</v-slider>

											<span class="text-subtitle-1">{{ videoProgressString }}</span>

											<div class="d-flex flex-row">
												<v-spacer />
												<v-btn
													class="mr-2"
													:icon="videoPlaying ? 'mdi-pause' : 'mdi-play'"
													:loading="videoLoading"
													@click="updatePlayingState"
												>
													<v-tooltip
														activator="parent"
														location="top"
														:eager="false"
													>
														{{ videoPlaying ? 'Pause' : 'Play' }}
													</v-tooltip>
													<v-icon />
												</v-btn>
												<v-btn
													class="mr-2"
													icon="mdi-skip-next"
													:loading="videoLoading"
													@click="skipVideo"
												>
													<v-tooltip
														activator="parent"
														location="top"
														:eager="false"
													>
														Skip
													</v-tooltip>
													<v-icon />
												</v-btn>
												<v-btn
													icon="mdi-refresh"
													:loading="videoLoading"
													@click="refreshVideo"
												>
													<v-tooltip
														activator="parent"
														location="top"
														:eager="false"
													>
														Refresh
													</v-tooltip>
													<v-icon />
												</v-btn>
												<v-spacer />
											</div>
										</v-col>
									</v-row>
								</v-card-text>
							</div>

							<v-divider thickness="3" />

							<v-card-text
								style="position: relative; height:100%;"
							>
								<v-virtual-scroll
									style="position: absolute; left: 0; right: 0; top: 0; bottom: 0;"
									:items="queueData.items"
									item-height="100"
								>
									<template #default="{ item, index }">
										<QueueVideoItem
											:item="item"
											:index="index"

											:loading="isLoading"

											@open-edit-pos="openEditQueuePositionDialog"
											@delete-from-queue="deleteVideoFromQueue"
											@edit-pos-start="editQueuePositionStart"
											@edit-pos-end="editQueuePositionEnd"
										/>
									</template>
								</v-virtual-scroll>
							</v-card-text>
						</div>
					</v-card>
				</v-col>
				<v-col
					sm="12"
					xl="6"
				>
					<v-card
						class="h-100"
					>
						<div class="d-flex flex-column h-100">
							<div class="my-4">
								<v-card-title class="text-h3 my-4">
									History
								</v-card-title>
								<v-card-subtitle v-if="isHistoryEmpty">
									The history is empty.
								</v-card-subtitle>
								<v-card-subtitle v-else>
									<p v-if="getHistoryLength === 1">
										There is <strong>{{ getHistoryLength }}</strong> video in the history
									</p>
									<p v-else>
										There are <strong>{{ getHistoryLength }}</strong> videos in the history
									</p>
								</v-card-subtitle>
							</div>

							<v-divider thickness="3" />

							<v-card-text
								style="position: relative; height:100%;"
							>
								<v-virtual-scroll
									style="position: absolute; left: 0; right: 0; top: 0; bottom: 0;"
									:items="historyData.items"
									item-height="100"
								>
									<template #default="{ item }">
										<v-list-item
											class="py-4"
										>
											<v-list-item-title>
												{{ item.title }}
											</v-list-item-title>

											<v-list-item-subtitle>
												<strong>Game:</strong> {{ item.game?.title || item.gameId }}
												<br>
												<strong>Played At:</strong> {{ item.played_at }}
											</v-list-item-subtitle>

											<template #prepend>
												<v-img
													:src="item.thumbnail_url"
													:lazy-src="placeholderImage"
													:aspect-ratio="16/9"
													width="125"
													cover
													class="mr-5"
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
											</template>

											<template #append>
												<v-btn
													icon="mdi-clock-outline"
													size="x-small"
													color="orange-darken-4"
													variant="tonal"
													class="mr-1"
													@click="addToQueueFromHistory(item.id)"
												>
													<v-tooltip
														activator="parent"
														location="top"
														:eager="false"
													>
														Queue Video
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
				</v-col>
			</v-row>
		</div>
	</v-container>

	<!-- Edit queue position -->
	<v-dialog
		v-model="editQueuePositionDialog"
		max-width="500"
	>
		<v-card>
			<v-card-title class="headline">
				Edit Position
			</v-card-title>
			<v-card-text>
				<v-text-field
					v-model.number="editQueuePositionInput"
					label="New Position"
					variant="solo-filled"
					hide-details
				/>
			</v-card-text>
			<v-card-actions>
				<v-btn
					color="red-darken-1"
					text
					@click="editQueuePositionDialog = false"
				>
					Cancel
				</v-btn>
				<v-btn
					color="green-darken-1"
					text
					:loading="isLoading"
					@click="editQueuePosition"
				>
					Save
				</v-btn>
			</v-card-actions>
		</v-card>
	</v-dialog>

	<!-- Select Video -->
	<SelectVideoDialog
		ref="selectVideoDialog"
		@select-video="selectVideo"
	/>

	<!-- Select Playlist -->
	<SelectPlaylistDialog
		ref="selectPlaylistDialog"
		@select-playlist="selectPlaylist"
	/>

	<!-- Add Playlist Confirmation -->
	<v-dialog
		v-model="confirmAddPlaylistDialog"
		width="auto"
		max-width="800"
	>
		<v-card>
			<v-card-title>Queue playlist</v-card-title>

			<v-card-text class="text-center">
				<h2>
					Do you really want to queue this playlist?
				</h2>

				<p>
					The estimated length is <strong>{{ selectedPlaylistLength }}</strong>
				</p>
			</v-card-text>

			<v-card-text class="text-center">
				<h2 class="pb-3">
					{{ selectedPlaylist.title }}
				</h2>

				<v-row>
					<v-spacer />

					<v-col cols="6">
						<v-img
							:src="selectedPlaylist.thumbnail_url"
							:lazy-src="placeholderImage"
							:aspect-ratio="16/9"
							width="300"
							cover
							class="mr-5"
						/>
					</v-col>

					<v-spacer />
				</v-row>
			</v-card-text>

			<v-card-actions>
				<v-spacer />
				<v-btn
					color="red-darken-1"
					variant="text"
					@click="confirmAddPlaylistDialog = false"
				>
					Cancel
				</v-btn>
				<v-btn
					color="green-darken-1"
					variant="text"
					:loading="isLoading"
					@click="confirmPlaylist"
				>
					Add Playlist
				</v-btn>
			</v-card-actions>
		</v-card>
	</v-dialog>

	<!-- Add Random Videos -->
	<AddRandomVideosDialog
		ref="addRandomVideosDialog"
		@add-random-videos="addRandomVideos"
	/>

	<!-- Clear the queue -->
	<v-dialog
		v-model="deleteDialog"
		width="auto"
	>
		<v-card>
			<v-card-title> Clearing the entire queue </v-card-title>
			<v-card-text>
				Do you really want to clear the entire queue?
			</v-card-text>
			<v-card-actions>
				<v-spacer />
				<v-btn
					color="red-darken-1"
					variant="text"
					@click="deleteDialog = false"
				>
					Cancel
				</v-btn>
				<v-btn
					color="green-darken-1"
					variant="text"
					:loading="isLoading"
					@click="clearQueue"
				>
					Clear Queue
				</v-btn>
			</v-card-actions>
		</v-card>
	</v-dialog>

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
import { socket, asyncEmit } from '@/socket';

import SelectVideoDialog from '@/composables/SelectVideoDialog.vue';
import SelectPlaylistDialog from '@/composables/SelectPlaylistDialog.vue';
import QueueVideoItem from '@/composables/QueueVideoItem.vue';
import AddRandomVideosDialog from '@/composables/AddRandomVideosDialog.vue';

import placeholderImage from '@/assets/placeholder-500x700.jpg';
import { Duration } from 'luxon';

const videoProgress = ref(0);
const videoLength = ref(0);
const videoPlaying = ref(false);

const currentVideo = computed(() => {
	return queueData.value.current_video;
});

const videoThumb = computed(() => {
	const progress = Duration.fromObject({ seconds: sliderValue.value });

	return progress.toFormat('hh:mm:ss');
});

const videoProgressString = computed(() => {
	const total = Duration.fromObject({ seconds: videoLength.value });

	return `${videoThumb.value} / ${total.toFormat('hh:mm:ss')}`;
});

const queueLength = computed(() => {
	let progress = Duration.fromMillis(0);

	for (const video of queueData.value.items) {
		progress = progress.plus({ seconds: video.length });
	}

	if (progress.as('days') >= 1) {
		const progressWithoutDays = progress.minus({ days: Math.floor(progress.as('days')) });
		return `${progress.toFormat('d \'days\'')}, ${progressWithoutDays.toFormat('h \'hours\', m \'minutes\', s \'seconds\'')}`;
	}
	else {
		return progress.toFormat('h \'hours\', m \'minutes\', s \'seconds\'');
	}
});

const sliderValue = ref(0);
const requestUpdate = ref(false);

const sliderDragging = ref(false);
const sliderStartDrag = () => {
	sliderDragging.value = true;
};

const sliderEndDrag = (value) => {
	socket.emit('set_video_time', value);

	videoLoading.value = true;
	sliderDragging.value = false;
	requestUpdate.value = true;
};

const videoLoading = ref(false);
const skipVideo = () => {
	videoLoading.value = true;

	socket.emit('skip_video');
};

const refreshVideo = () => {
	videoLoading.value = true;

	socket.emit('refresh_video');
};

socket.on('update_dashboard', msg => {
	if (msg.time <= 1 || requestUpdate.value) {
		videoLoading.value = false;
		requestUpdate.value = false;
	}

	videoProgress.value = Math.round(msg.time);
	videoLength.value = msg.length;

	videoPlaying.value = msg.isPlaying;

	if (sliderDragging.value) return;
	sliderValue.value = videoProgress.value;
});

const updatePlayingState = () => {
	socket.emit('update_playing_state', !videoPlaying.value);
};

socket.on('update_playing_state', isPlaying => {
	videoPlaying.value = isPlaying;
});

socket.on('next_video', async () => {
	videoLoading.value = true;

	queueData.value = await ky.get('queue').json();
	historyData.value = await ky.get('history').json();
});

socket.on('queue_history_update', ({ queue, history }) => {
	queueData.value = queue;
	historyData.value = history;
});

// ---
// Select Video
const selectVideoDialog = ref(null);

const openSelectVideoDialog = () => {
	selectVideoDialog.value.open();
};

const selectVideo = video => {
	addNewVideoToQueue(video);
};

// ---

// ---
// Select Playlist
const selectedPlaylist = ref(false);
const selectPlaylistDialog = ref(null);
const confirmAddPlaylistDialog = ref(false);

const openSelectPlaylistDialog = () => {
	selectPlaylistDialog.value.open();
};

const selectPlaylist = playlist => {
	selectedPlaylist.value = playlist;
	confirmAddPlaylistDialog.value = true;
};

const confirmPlaylist = () => {
	addNewPlaylistToQueue();
};

const selectedPlaylistLength = computed(() => {
	const progress = Duration.fromObject({ seconds: selectedPlaylist.value?.playlistLength || 0 });

	return progress.toFormat('hh:mm:ss');
});

// ---

// ---
// Random Videos

const addRandomVideosDialog = ref(null);

const openAddRandomVideosDialog = () => {
	addRandomVideosDialog.value.open();
};

const addRandomVideos = async amount => {
	try {
		await ky
			.put('queue/random', {
				json: {
					amount,
				},
			})
			.json();

		snackbar.value = true;
		snackbarText.value = `Successfully added ${amount} random videos.`;
	}
	catch (error) {
		const message = await error.response.text();

		snackbar.value = true;
		snackbarText.value = message;
	}
};

// ---

// ---
// Queue Video Items

const editQueuePositionDialog = ref(false);
const editQueuePositionIndex = ref(false);
const editQueuePositionInput = ref('');

const openEditQueuePositionDialog = index => {
	editQueuePositionInput.value = '';
	editQueuePositionIndex.value = index;
	editQueuePositionDialog.value = true;
};

const editQueuePosition = async () => {
	try {
		await ky
			.post('queue', {
				json: {
					index: editQueuePositionIndex.value,
					newIndex: editQueuePositionInput.value - 1,
				},
			})
			.json();

		editQueuePositionDialog.value = false;

		snackbar.value = true;
		snackbarText.value = 'Successfully edited queue.';
	}
	catch (error) {
		const message = await error.response.text();

		snackbar.value = true;
		snackbarText.value = message;
	}
};

const editQueuePositionStart = async (index) => {
	try {
		await ky
			.post('queue', {
				json: {
					index: index,
					newIndex: 'start',
				},
			})
			.json();

		editQueuePositionDialog.value = false;

		snackbar.value = true;
		snackbarText.value = 'Successfully moved the video to the beginning.';
	}
	catch (error) {
		const message = await error.response.text();

		snackbar.value = true;
		snackbarText.value = message;
	}
};

const editQueuePositionEnd = async (index) => {
	try {
		await ky
			.post('queue', {
				json: {
					index: index,
					newIndex: 'end',
				},
			})
			.json();

		editQueuePositionDialog.value = false;

		snackbar.value = true;
		snackbarText.value = 'Successfully moved the video to the end.';
	}
	catch (error) {
		const message = await error.response.text();

		snackbar.value = true;
		snackbarText.value = message;
	}
};

const deleteVideoFromQueue = async (index) => {
	try {
		await ky
			.delete(`queue/${index}`)
			.json();

		snackbar.value = true;
		snackbarText.value = 'Successfully deleted video from queue.';
	}
	catch (error) {
		const message = await error.response.text();

		snackbar.value = true;
		snackbarText.value = message;
	}
};

// ---

const deleteDialog = ref(false);

const queueData = ref({
	current_video: {},
	items: [],
});
const historyData = ref({
	items: [],
});

const snackbar = ref(false);
const snackbarText = ref('');

onMounted(async () => {
	videoLoading.value = true;

	queueData.value = await ky.get('queue').json();
	historyData.value = await ky.get('history').json();

	const { progress, length } = await asyncEmit('request_video_time');
	videoProgress.value = progress || 0;
	videoLength.value = queueData.value.current_video.length || length || 0;

	sliderValue.value = videoProgress.value;

	videoLoading.value = false;
});

const getQueueLength = computed(() => {
	return queueData.value.items.length;
});

const isQueueEmpty = computed(() => {
	return !getQueueLength.value;
});

const getHistoryLength = computed(() => {
	return historyData.value.items.length;
});

const isHistoryEmpty = computed(() => {
	return !getHistoryLength.value;
});

const addNewVideoToQueue = async video => {
	try {
		await ky
			.put('queue/video', {
				json: {
					videoId: video.id,
				},
			})
			.json();

		snackbar.value = true;
		snackbarText.value = 'Successfully added video.';
	}
	catch (error) {
		const message = await error.response.text();

		snackbar.value = true;
		snackbarText.value = message;
	}
};

const clearQueue = async () => {
	try {
		await ky
			.delete('queue')
			.json();

		deleteDialog.value = false;

		snackbar.value = true;
		snackbarText.value = 'Successfully cleared queue.';
	}
	catch (error) {
		const message = await error.response.text();

		snackbar.value = true;
		snackbarText.value = message;
	}
};

const addToQueueFromHistory = async (videoId) => {
	try {
		await ky
			.put('queue/video', {
				json: {
					videoId,
				},
			})
			.json();

		snackbar.value = true;
		snackbarText.value = 'Successfully added video.';
	}
	catch (error) {
		const message = await error.response.text();

		snackbar.value = true;
		snackbarText.value = message;
	}
};

const addNewPlaylistToQueue = async () => {
	try {
		await ky
			.put('queue/playlist', {
				json: {
					playlistId: selectedPlaylist.value.id,
				},
			})
			.json();

		selectedPlaylist.value = false;
		confirmAddPlaylistDialog.value = false;

		snackbar.value = true;
		snackbarText.value = 'Successfully added playlist to queue.';
	}
	catch (error) {
		const message = await error.response.text();

		snackbar.value = true;
		snackbarText.value = message;
	}
};
</script>
