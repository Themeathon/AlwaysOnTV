<template>
	<v-row
		justify="center"
		class="pa-8"
	>
		<v-btn
			color="primary"
			variant="outlined"
			prepend-icon="mdi-plus"
			@click="openCreateVideoDialog"
		>
			Add video
		</v-btn>
	</v-row>

	<v-divider :thickness="3" />

	<v-container>
		<v-row justify="center">
			<v-col
				cols="12"
				sm="12"
				md="6"
				lg="4"
				xl="3"
			>
				<v-text-field
					v-model="videoSearch"
					label="Search videos"
					append-inner-icon="mdi-magnify"
					variant="solo-filled"
					hide-details
				/>
			</v-col>
			<v-col
				cols="12"
				sm="6"
				md="6"
				lg="4"
				xl="3"
			>
				<v-pagination
					v-model="page"
					:length="chunkedVideos.length"
				/>
			</v-col>
		</v-row>
	</v-container>

	<v-container>
		<v-row class="mb-4">
			<v-col
				v-for="item in chunkedVideos[page - 1]"
				:key="item.title"
				cols="12"
				sm="12"
				md="6"
				lg="4"
				xl="3"
				xxl="2"
			>
				<v-hover v-slot="{ isHovering: hoveringCard, props: propsCard }">
					<v-card
						class="mt-4 mx-2 text-center h-100 d-flex flex-column"
						:elevation="hoveringCard ? 10 : 0"
						v-bind="propsCard"
					>
						<div>
							<v-hover v-slot="{ isHovering, props }">
								<v-card
									rounded="false"
									flat
								>
									<v-img
										:src="item.thumbnail_url"
										:lazy-src="placeholderImage"
										cover
										width="100%"
										:aspect-ratio="16 / 9"
										v-bind="props"
									/>

									<v-overlay
										:model-value="isHovering"
										contained
										class="align-center justify-center"
										scrim="#000000"
										v-bind="props"
									>
										<div class="d-flex flex-column h-100 align-center">
											<v-spacer />

											<v-row>
												<v-btn
													class="mx-2"
													icon="mdi-clock-outline"
													size="large"
													color="orange-darken-4"
													variant="flat"
													:loading="isLoading"
													@click="queueVideo(item.id)"
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

												<v-btn
													class="mx-2"
													icon="mdi-plus"
													size="large"
													color="blue-darken-1"
													variant="flat"
													@click="openAddToPlaylistDialog(item)"
												>
													<v-tooltip
														activator="parent"
														location="top"
														:eager="false"
													>
														Add To Playlist
													</v-tooltip>
													<v-icon />
												</v-btn>

												<v-btn
													class="mx-2"
													icon="mdi-file-edit"
													size="large"
													color="green-darken-1"
													variant="flat"
													@click="openEditVideoDialog(item)"
												>
													<v-tooltip
														activator="parent"
														location="top"
														:eager="false"
													>
														Edit Video
													</v-tooltip>
													<v-icon />
												</v-btn>

												<v-btn
													class="mx-2"
													icon="mdi-trash-can"
													size="large"
													color="red-darken-1"
													variant="flat"
													@click="openDeleteDialog(item)"
												>
													<v-tooltip
														activator="parent"
														location="top"
														:eager="false"
													>
														Delete Video
													</v-tooltip>
													<v-icon />
												</v-btn>
											</v-row>

											<v-spacer />
										</div>
									</v-overlay>
								</v-card>
							</v-hover>
						</div>

						<v-spacer />

						<v-card-title class="text-wrap">
							<span :title="item.title">{{ item.title }}</span>
						</v-card-title>

						<v-spacer />

						<v-card-subtitle class="mb-2">
							<p>
								<strong>Video ID:</strong> <a
									:href="`https://youtube.com/watch?v=${item.id}`"
									target="_blank"
								>{{ item.id }}</a>
							</p>

							<p>
								<strong>Game:</strong> {{ item.gameTitle }}
							</p>

							<p>
								<strong>Length:</strong> {{ formatVideoLength(item.length) }}
							</p>
						</v-card-subtitle>
					</v-card>
				</v-hover>
			</v-col>
		</v-row>
	</v-container>

	<!-- Create Video -->
	<v-dialog
		v-model="createVideoDialog"
		width="800"
	>
		<v-card>
			<v-card-title>
				<span class="text-h5">Add a new video</span>
			</v-card-title>
			<v-card-text>
				<v-container>
					<v-row>
						<v-text-field
							v-model="searchInput"
							append-inner-icon="mdi-magnify"
							label="YouTube URL / Video ID"
							placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
							required
							variant="solo-filled"
							hide-details
							:loading="isLoading"
						/>
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
										label="Video Title"
										readonly
										variant="solo-filled"
										hide-details
									/>
								</div>
								<div>
									<v-text-field
										v-model="selectedVideo.id"
										label="YouTube ID"
										readonly
										variant="solo-filled"
										hide-details
									/>
								</div>
							</div>
						</v-col>
					</v-row>

					<v-row>
						<v-checkbox
							v-model="addVideoToRandomPlaylist"
							label="Add To Random Playlist"
						/>
					</v-row>

					<v-row>
						<v-btn
							color="green-darken-1"
							variant="text"
							prepend-icon="mdi-magnify"
							@click="openSelectGameDialog"
						>
							Select Game
						</v-btn>
					</v-row>

					<v-row>
						<v-col
							cols="12"
							sm="4"
							class="pl-0"
						>
							<v-img
								:src="getGameThumbnailURL()"
								cover
								:aspect-ratio="5 / 7"
								width="auto"
							/>
						</v-col>
						<v-col
							cols="12"
							sm="8"
							class="pr-0"
						>
							<div class="d-flex flex-column justify-space-around h-100">
								<div class="text-center">
									<p class="text-h5">
										<strong>Game Title</strong>
									</p>
									<p class="text-h5">
										{{ getGameTitle() }}
									</p>
								</div>
								<div class="text-center">
									<p class="text-h5">
										<strong>Twitch ID</strong>
									</p>
									<p class="text-h5">
										{{ getGameID() }}
									</p>
								</div>
							</div>
						</v-col>
					</v-row>
				</v-container>
				<small>Creates a new video</small>
			</v-card-text>
			<v-card-actions>
				<v-spacer />
				<v-btn
					color="red-darken-1"
					variant="text"
					@click="createVideoDialog = false"
				>
					Close
				</v-btn>
				<v-btn
					color="green-darken-1"
					variant="text"
					:disabled="disableAddVideo"
					:loading="isLoading"
					@click="addNewVideo"
				>
					Add
				</v-btn>
			</v-card-actions>
		</v-card>
	</v-dialog>

	<!-- Select Game -->
	<SelectGameDialog
		ref="selectGameDialog"
		@select-game="selectGame"
	/>

	<!-- Edit Video -->
	<v-dialog
		v-model="editVideoDialog"
		width="500px"
	>
		<v-card>
			<v-card-title class="headline">
				Edit Video
			</v-card-title>
			<v-card-text>
				<v-row class="mb-0">
					<v-text-field
						v-model="editingVideo.title"
						label="New Title"
						variant="solo-filled"
						hide-details
					/>
				</v-row>

				<v-row class="mb-0">
					<v-btn
						color="green-darken-1"
						variant="text"
						prepend-icon="mdi-magnify"
						@click="openSelectGameDialog"
					>
						Select Game
					</v-btn>
				</v-row>

				<v-row class="ml-0">
					<v-col
						cols="12"
						sm="4"
						class="pl-0"
					>
						<v-img
							:src="getGameThumbnailURL()"
							cover
							:aspect-ratio="5 / 7"
							width="auto"
						/>
					</v-col>
					<v-col
						cols="12"
						sm="8"
						class="pr-0"
					>
						<div class="d-flex flex-column justify-space-around h-100">
							<div class="text-center">
								<p class="text-h5">
									<strong>Game Title</strong>
								</p>
								<p class="text-h5">
									{{ getGameTitle() }}
								</p>
							</div>
							<div class="text-center">
								<p class="text-h5">
									<strong>Twitch ID</strong>
								</p>
								<p class="text-h5">
									{{ getGameID() }}
								</p>
							</div>
						</div>
					</v-col>
				</v-row>
			</v-card-text>
			<v-card-actions>
				<v-btn
					color="red-darken-1"
					text
					@click="editVideoDialog = false"
				>
					Cancel
				</v-btn>
				<v-btn
					color="green-darken-1"
					text
					:disabled="!canSave"
					:loading="isLoading"
					@click="editVideo(editingVideo.id)"
				>
					Save
				</v-btn>
			</v-card-actions>
		</v-card>
	</v-dialog>

	<!-- Delete Video -->
	<v-dialog
		v-model="deleteDialog"
		width="auto"
	>
		<v-card>
			<v-card-title>
				Deleting {{ deletingVideo.title }}
			</v-card-title>
			<v-card-text>
				Do you really want to delete {{ deletingVideo.title }}?
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
					@click="deleteVideo(deletingVideo.id)"
				>
					Delete
				</v-btn>
			</v-card-actions>
		</v-card>
	</v-dialog>

	<!-- Add Video To Playlist -->
	<v-dialog
		v-model="addToPlaylistDialog"
		width="800"
	>
		<v-card>
			<v-card-title>
				<span class="text-h5">Adds a playlist to the queue</span>
			</v-card-title>
			<v-card-text>
				<v-container>
					<v-row>
						<v-btn
							color="green-darken-1"
							variant="text"
							prepend-icon="mdi-magnify"
							@click="openSelectPlaylistDialog"
						>
							Select Playlist
						</v-btn>
					</v-row>

					<v-row class="mt-2">
						<v-col
							cols="12"
							sm="6"
							class="pl-0"
						>
							<v-img
								:src="selectedPlaylist?.thumbnail_url || placeholderImage"
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
										:model-value="selectedPlaylist?.title"
										label="Playlist"
										readonly
										variant="solo-filled"
										hide-details
									/>
								</div>
								<div>
									<v-text-field
										:model-value="selectedPlaylist?.id"
										label="Playlist ID"
										readonly
										variant="solo-filled"
										hide-details
									/>
								</div>
							</div>
						</v-col>
					</v-row>
				</v-container>
				<small>Adds a playlist to the queue</small>
			</v-card-text>

			<v-card-actions>
				<v-spacer />
				<v-btn
					color="red-darken-1"
					variant="text"
					@click="addToPlaylistDialog = false"
				>
					Close
				</v-btn>
				<v-btn
					color="green-darken-1"
					variant="text"
					:disabled="!selectedPlaylist"
					:loading="isLoading"
					@click="addVideoToPlaylist"
				>
					Add
				</v-btn>
			</v-card-actions>
		</v-card>
	</v-dialog>

	<!-- Select Playlist -->
	<SelectPlaylistDialog
		ref="selectPlaylistDialog"
		@select-playlist="selectPlaylist"
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
import _ from 'lodash';
import { onMounted, ref, watch, computed } from 'vue';
import { useDisplay } from 'vuetify';

import SelectGameDialog from '@/composables/SelectGameDialog.vue';
import SelectPlaylistDialog from '@/composables/SelectPlaylistDialog.vue';

import placeholderImage from '@/assets/placeholder-500x700.jpg';
import { Duration } from 'luxon';

const formatVideoLength = length => {
	const progress = Duration.fromObject({ seconds: length });

	return progress.toFormat('hh:mm:ss');
};

// ---
// Select Game

const selectGameDialog = ref(null);
const selectedGame = ref(false);

const openSelectGameDialog = () => {
	selectGameDialog.value.open();
};

const selectGame = game => {
	selectedGame.value = game;
};

const getGameThumbnailURL = () => {
	return selectedGame.value?.thumbnail_url;
};

const getGameTitle = () => {
	return selectedGame.value?.title;
};

const getGameID = () => {
	return selectedGame.value?.id;
};

// ---

// ---
// Select Playlist

const addToPlaylistDialog = ref(false);
const selectedVideoForPlaylist = ref(false);

const openAddToPlaylistDialog = video => {
	selectedVideoForPlaylist.value = video;

	addToPlaylistDialog.value = true;
	openSelectPlaylistDialog();
};

const selectPlaylistDialog = ref(null);
const selectedPlaylist = ref(false);

const openSelectPlaylistDialog = () => {
	selectPlaylistDialog.value.open();
};

const selectPlaylist = playlist => {
	selectedPlaylist.value = playlist;
};

const addVideoToPlaylist = async () => {
	try {
		await ky
			.put(`playlists/id/${selectedPlaylist.value.id}/video`, {
				json: {
					videoId: selectedVideoForPlaylist.value.id,
				},
			})
			.json();

		addToPlaylistDialog.value = false;

		snackbar.value = true;
		snackbarText.value = 'Successfully added video to playlist.';
	}
	catch (error) {
		const message = await error.response.text();

		snackbar.value = true;
		snackbarText.value = message;
	}
};

// ---

const selectedVideo = ref(false);
const createVideoDialog = ref(false);
const videos = ref([]);
const searchInput = ref('');
const deleteDialog = ref(false);
const deletingVideo = ref(false);
const editingVideo = ref(false);
const editVideoDialog = ref(false);

const addVideoToRandomPlaylist = ref(true);

const videoTitle = ref('');
const videoGameId = ref('');
const videoThumbnail = ref('');

const snackbar = ref(false);
const snackbarText = ref('');

const videoSearch = ref('');
const page = ref(1);

const openCreateVideoDialog = () => {
	createVideoDialog.value = true;
};

const queueVideo = async (videoId) => {
	try {
		await ky
			.put('queue/video', {
				json: {
					videoId,
				},
			})
			.json();

		snackbar.value = true;
		snackbarText.value = 'Successfully queued video.';
	}
	catch (error) {
		const message = await error.response.text();

		snackbar.value = true;
		snackbarText.value = message;
	}
};

const canSave = computed(() => {
	if (videoTitle.value !== videos.value?.title)
		return true;

	if (videoGameId.value !== videos.value?.gameId)
		return true;

	if (videoThumbnail.value !== videos.value?.thumbnail_url)
		return true;

	return false;
});

watch(editingVideo, (newValue) => {
	editVideoDialog.value = !!newValue;
});

const { name } = useDisplay();
const chunkedVideos = computed(() => {
	let chunk = 6; // Default for lg+

	switch (name.value) {
	case 'xs':
		chunk = 2;
		break;
	case 'sm':
		chunk = 2;
		break;
	case 'md':
		chunk = 4;
		break;
	case 'lg':
		chunk = 6;
		break;
	case 'xl':
		chunk = 8;
		break;
	case 'xxl':
		chunk = 12;
		break;
	default:
		chunk = 12;
		break;
	}

	const filtered = _.filter(videos.value, (video) => {
		if (!videoSearch.value) return true;

		return video.title.toLowerCase().includes(videoSearch.value.toLowerCase());
	});

	return _.chunk(filtered, chunk);
});

watch(chunkedVideos, (newValue) => {
	if (page.value >= newValue.length)
		page.value = Math.max(1, newValue.length);
});

onMounted(async () => {
	videos.value = await ky.get('videos').json();

	selectedGame.value = await ky.get('games/id/499973').json();
});

watch(searchInput, (newValue) => {
	if (newValue === '') return;

	searchForVideos();
});

const searchForVideos = _.debounce(async () => {
	if (!searchInput.value) {
		selectedVideo.value = false;
	} else {
		const searchTerm = searchInput.value;

		try {
			const data = await ky
				.post('youtube/get-video', {
					json: {
						videoId: searchTerm,
					},
				})
				.json();

			if (!data) {
				console.error('No videos found with that name');
				return;
			}

			selectedVideo.value = data;

			if (selectedVideo.value?.age_restricted) {
				snackbar.value = true;
				snackbarText.value = 'Can\'t add video because it\'s age-restricted.';
			}
		}
		catch (error) {
			const message = await error.response.text();

			snackbar.value = true;
			snackbarText.value = message;
		}

	}
}, 500);

const disableAddVideo = computed(() => {
	if (!selectedVideo.value?.id || !selectedGame.value?.id) return true;

	const duplicate = videos.value.some(
		(video) =>
			video.title === selectedVideo.value?.title ||
            video.id === selectedVideo.value?.id,
	);

	if (duplicate) return true;

	if (selectedVideo.value?.age_restricted) return true;

	return false;
});

const addNewVideo = async () => {
	const videoData = {
		id: selectedVideo.value.id,
		gameId: selectedGame.value.id,
	};

	// Check if the game already exists in the list
	const isDuplicate = videos.value.some(
		(videos) =>
			videos.title === videoData.title && videos.id === videoData.id,
	);

	if (isDuplicate) {
		console.error('Video already exists.');
		return;
	}

	try {
		await ky
			.put('videos', {
				json: {
					videoId: videoData.id,
					gameId: videoData.gameId,
					addToRandomPlaylist: addVideoToRandomPlaylist.value,
				},
			})
			.json();

		videos.value = await ky.get('videos').json();

		createVideoDialog.value = false;
		selectedVideo.value = false;
		searchInput.value = '';

		snackbar.value = true;
		snackbarText.value = 'Successfully added video.';
	}
	catch (error) {
		const message = await error.response.text();

		snackbar.value = true;
		snackbarText.value = message;
	}
};

const editVideo = async (videoId) => {
	try {
		await ky
			.post(`videos/id/${videoId}`, {
				json: {
					title: editingVideo.value.title,
					gameId: selectedGame.value?.id,
					thumbnail_url: editingVideo.value.thumbnail_url,
				},
			})
			.json();

		videos.value = await ky.get('videos').json();

		editVideoDialog.value = false;

		snackbar.value = true;
		snackbarText.value = 'Successfully edited video.';
	}
	catch (error) {
		const message = await error.response.text();

		snackbar.value = true;
		snackbarText.value = message;
	}
};

const openEditVideoDialog = async (video) => {
	editingVideo.value = {
		id: video.id,
		title: video.title, // Set the existing title
		thumbnail_url: video.thumbnail_url, // Set the existing thumbnail URL
	};

	selectedGame.value = await ky.get(`games/id/${video.gameId}`).json();
};

watch(editVideoDialog, async (newValue) => {
	if (newValue) return;

	selectedGame.value = await ky.get('games/id/499973').json();
});

const openDeleteDialog = video => {
	deletingVideo.value = video;
	deleteDialog.value = true;
};

const deleteVideo = async (videoId) => {
	try {
		await ky.post(`videos/id/${videoId}/delete`, {
			json: {
				force: true,
			},
		}).json();

		videos.value = await ky.get('videos').json();

		deleteDialog.value = false;

		snackbar.value = true;
		snackbarText.value = 'Successfully deleted video.';
	}
	catch (error) {
		const message = await error.response.text();

		snackbar.value = true;
		snackbarText.value = message;
	}
};
</script>
