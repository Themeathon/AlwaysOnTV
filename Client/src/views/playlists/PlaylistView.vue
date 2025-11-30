<template>
	<v-container class="h-100">
		<v-card class="mx-auto h-100">
			<div class="d-flex flex-column h-100">
				<v-card-text>
					<div class="d-flex align-center">
						<v-img
							:src="playlistData.thumbnail_url || placeholderImage"
							cover
							:aspect-ratio="16 / 9"
							width="250"
							max-width="250"
							class="mx-4"
						/>

						<v-spacer />

						<div class="text-center text-wrap">
							<div class="d-flex justify-center align-center">
								<p class="text-h3 mx-2">
									{{ playlistData.title }}
								</p>
								<v-btn
									icon="mdi-pencil"
									variant="text"
									size="small"
									color="grey"
									@click="openRenameDialog"
								>
									<v-tooltip
										activator="parent"
										location="top"
									>
										Rename Playlist
									</v-tooltip>
									<v-icon>mdi-pencil</v-icon>
								</v-btn>
							</div>

							<p class="mt-2 text-subtitle-1">
								<strong>Estimated length:</strong> {{ queueLength }}
							</p>
						</div>

						<v-spacer />

						<div class="d-flex flex-column mr-4">
							<v-btn
								block
								class="my-2"
								color="primary"
								variant="outlined"
								prepend-icon="mdi-plus"
								@click="openAddVideoDialog"
							>
								Add video to Playlist
							</v-btn>

							<v-btn
								block
								class="my-2"
								color="orange-darken-4"
								variant="outlined"
								prepend-icon="mdi-clock-outline"
								@click="queuePlaylistDialog = true"
							>
								Queue Playlist
							</v-btn>

							<v-spacer />

							<v-btn
								block
								class="my-2"
								color="red"
								variant="outlined"
								prepend-icon="mdi-delete"
								@click="deleteDialog = true"
							>
								Delete Playlist
							</v-btn>
						</div>
					</div>
				</v-card-text>
				<v-divider thickness="3" />

				<v-card-text
					id="virtualScrollOuter"
					style="position: relative; height:100%;"
					class="pa-0"
				>
					<v-virtual-scroll
						style="position: absolute; left: 0; right: 0; top: 0; bottom: 0;"
						:items="videos"
						item-height="100"
					>
						<template #default="{ item }">
							<v-list-item
								class="draggable-item"
								link
								:class="{
									'drag-source': draggedItem && draggedItem.index === item.index,
									'drag-target': dragOverIndex === item.index && draggedItem && draggedItem.index !== item.index
								}"
								draggable="true"
								@dragstart="onDragStart($event, item)"
								@dragenter.prevent="onDragEnter(item)"
								@dragover.prevent
								@dragend="onDragEnd"
								@drop="onDrop($event, item)"
							>
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
									<v-icon
										class="mr-4 cursor-grab"
										color="grey-darken-1"
									>
										mdi-drag-horizontal-variant
									</v-icon>

									<div
										class="mx-2 text-center"
										style="min-width: 30px;"
									>
										<span class="text-center font-weight-bold">
											{{ item.index }}
										</span>
									</div>

									<v-btn
										icon="mdi-file-edit"
										size="x-small"
										variant="tonal"
										class="ml-2 mr-5"
										@click="openEditPositionDialog(item.index)"
									>
										<v-tooltip
											activator="parent"
											location="top"
											:eager="false"
										>
											Edit Position Manually
										</v-tooltip>
										<v-icon />
									</v-btn>

									<v-img
										:src="playlistData?.videoInfo[item.id]?.thumbnail_url || placeholderImage"
										:lazy-src="placeholderImage"
										cover
										width="140"
										aspect-ratio="16/9"
										class="mr-4 rounded"
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
											Watch on YouTube
										</v-tooltip>
										<v-icon />
									</v-btn>
								</template>

								<template #append>
									<div class="d-flex align-center">
										<v-btn
											icon="mdi-clock-outline"
											size="x-small"
											variant="tonal"
											class="mr-2"
											color="orange-darken-4"
											@click="queueVideo(item.id)"
										>
											<v-tooltip
												activator="parent"
												location="top"
												:eager="false"
											>
												Queue Video
											</v-tooltip>
											<v-icon>mdi-clock-outline</v-icon>
										</v-btn>

										<v-btn
											icon="mdi-file-edit"
											size="x-small"
											variant="tonal"
											class="mr-2"
											color="green-darken-1"
											@click="openEditVideoDialog(item)"
										>
											<v-tooltip
												activator="parent"
												location="top"
												:eager="false"
											>
												Edit Video Details
											</v-tooltip>
											<v-icon>mdi-file-edit</v-icon>
										</v-btn>

										<v-btn
											icon="mdi-trash-can"
											size="x-small"
											variant="tonal"
											class="mr-2"
											color="red"
											:loading="isLoading"
											@click="removeVideoFromPlaylist(item.index)"
										>
											<v-tooltip
												activator="parent"
												location="top"
												:eager="false"
											>
												Remove Video From Playlist
											</v-tooltip>
											<v-icon>mdi-trash-can</v-icon>
										</v-btn>
									</div>
								</template>
							</v-list-item>
							<v-divider />
						</template>
					</v-virtual-scroll>
				</v-card-text>
			</div>
		</v-card>
	</v-container>

	<v-dialog
		v-model="deleteDialog"
		width="auto"
	>
		<v-card flat>
			<v-card-title> Deleted the playlist </v-card-title>
			<v-card-text> Do you really want to delete the playlist? </v-card-text>
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
					@click="deletePlaylist"
				>
					Delete
				</v-btn>
			</v-card-actions>
		</v-card>
	</v-dialog>

	<v-dialog
		v-model="renameDialog"
		max-width="500"
	>
		<v-card>
			<v-card-title>Rename Playlist</v-card-title>
			<v-card-text>
				<v-text-field
					v-model="renamePlaylistInput"
					label="New Name"
					variant="solo-filled"
					hide-details
					autofocus
					@keyup.enter="renamePlaylist"
				/>
			</v-card-text>
			<v-card-actions>
				<v-spacer />
				<v-btn
					color="red-darken-1"
					variant="text"
					@click="renameDialog = false"
				>
					Cancel
				</v-btn>
				<v-btn
					color="green-darken-1"
					variant="text"
					:loading="isLoading"
					@click="renamePlaylist"
				>
					Save
				</v-btn>
			</v-card-actions>
		</v-card>
	</v-dialog>

	<v-dialog
		v-model="queuePlaylistDialog"
		width="auto"
	>
		<v-card>
			<v-card-title>Queue Playlist</v-card-title>
			<v-card-text> Do you really want to queue this playlist? </v-card-text>
			<v-card-actions>
				<v-spacer />
				<v-btn
					color="red-darken-1"
					variant="text"
					@click="queuePlaylistDialog = false"
				>
					Cancel
				</v-btn>
				<v-btn
					color="green-darken-1"
					variant="text"
					:loading="isLoading"
					@click="queuePlaylist"
				>
					Queue
				</v-btn>
			</v-card-actions>
		</v-card>
	</v-dialog>

	<v-dialog
		v-model="addVideoDialog"
		width="800"
	>
		<v-card flat>
			<v-card-title> <span class="text-h5">Adds a video to the playlist</span> </v-card-title>
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
					:disabled="!selectedVideo"
					:loading="isLoading"
					@click="addNewVideoToPlaylist"
				>
					Add
				</v-btn>
			</v-card-actions>
		</v-card>
	</v-dialog>

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

				<v-row class="mt-4">
					<v-file-input
						v-model="thumbnailFile"
						accept="image/*"
						label="Upload Custom Thumbnail"
						prepend-icon="mdi-camera"
						variant="solo-filled"
						hide-details
						show-size
					/>
				</v-row>

				<v-row class="mb-0 mt-6">
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
						<div class="d-flex flex-column justify-space-around h-100 text-center">
							<div>
								<p class="text-h5">
									<strong>Game Title</strong>
								</p>
								<p class="text-h5">
									{{ getGameTitle() }}
								</p>
							</div>
							<div>
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
					:disabled="!canSaveEdit"
					:loading="isLoading"
					@click="editVideo(editingVideo.id)"
				>
					Save
				</v-btn>
			</v-card-actions>
		</v-card>
	</v-dialog>

	<SelectVideoDialog
		ref="selectVideoDialog"
		@select-video="selectVideo"
		@select-videos="addVideosDirectly"
	/>

	<SelectGameDialog
		ref="selectGameDialog"
		@select-game="selectGame"
	/>

	<v-dialog
		v-model="editPositionDialog"
		max-width="500"
	>
		<v-card>
			<v-card-title class="headline">
				Edit Position
			</v-card-title>
			<v-card-text>
				<v-text-field
					v-model.number="editPositionInput"
					label="New Position"
					variant="solo-filled"
					hide-details
				/>
			</v-card-text>
			<v-card-actions>
				<v-btn
					color="red-darken-1"
					text
					@click="editPositionDialog = false"
				>
					Cancel
				</v-btn>
				<v-btn
					color="green-darken-1"
					text
					:loading="isLoading"
					@click="editPos"
				>
					Save
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
import ky, { isLoading } from '@/ky';

import { onMounted, ref, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import SelectVideoDialog from '@/composables/SelectVideoDialog.vue';
import SelectGameDialog from '@/composables/SelectGameDialog.vue';

import placeholderImage from '@/assets/placeholder-500x700.jpg';
import { Duration } from 'luxon';

const draggedItem = ref(null);
const dragOverIndex = ref(null);

const onDragStart = (event, item) => {
	draggedItem.value = item;
	event.dataTransfer.effectAllowed = 'move';
};

const onDragEnter = (item) => {
	if (item.index !== draggedItem.value?.index) {
		dragOverIndex.value = item.index;
	}
};

const onDragEnd = () => {
	draggedItem.value = null;
	dragOverIndex.value = null;
};

const onDrop = (event, targetItem) => {
	const sourceItem = draggedItem.value;

	if (!sourceItem || sourceItem.index === targetItem.index) {
		onDragEnd();
		return;
	}

	moveVideo(sourceItem.index, targetItem.index);
	onDragEnd();
};

const moveVideo = async (oldIndex, newIndex) => {
	try {
		isLoading.value = true;

		await ky
			.post(`playlists/id/${id}/video`, {
				json: {
					index: oldIndex,
					newIndex: newIndex,
				},
			})
			.json();

		playlistData.value = await ky.get(`playlists/id/${id}`).json();

		snackbar.value = true;
		snackbarText.value = `Moved video from position ${oldIndex} to ${newIndex}.`;
	}
	catch (error) {
		const message = await error.response?.text() || error.message;
		snackbar.value = true;
		snackbarText.value = message;
	} finally {
		isLoading.value = false;
	}
};

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

const editVideoDialog = ref(false);
const editingVideo = ref({});
const originalEditingVideo = ref({});
const thumbnailFile = ref(null);
const selectGameDialog = ref(null);
const selectedGame = ref(null);
const defaultGame = ref(null);

const getGameThumbnailURL = () => selectedGame.value?.thumbnail_url || placeholderImage;
const getGameTitle = () => selectedGame.value?.title || 'N/A';
const getGameID = () => selectedGame.value?.id || 'N/A';

const canSaveEdit = computed(() => {
	if (!editingVideo.value || !originalEditingVideo.value) return false;
	if (thumbnailFile.value) return true;
	return editingVideo.value.title !== originalEditingVideo.value.title ||
		selectedGame.value?.id !== originalEditingVideo.value.gameId;
});

watch(editVideoDialog, (newValue) => {
	if (!newValue && defaultGame.value) {
		selectedGame.value = defaultGame.value;
	}
});

const openSelectGameDialog = () => selectGameDialog.value.open();
const selectGame = (game) => selectedGame.value = game;

const openEditVideoDialog = async (item) => {
	const videoId = item.id;
	const videoInfo = playlistData.value.videoInfo[videoId];

	if (!videoInfo) return;

	editingVideo.value = { ...videoInfo };
	originalEditingVideo.value = { ...videoInfo };
	thumbnailFile.value = null;

	try {
		let game = playlistData.value.gameInfo[videoInfo.gameId];
		if (!game) {
			game = await ky.get(`games/id/${videoInfo.gameId}`).json();
		}
		selectedGame.value = game;
	} catch {
		selectedGame.value = defaultGame.value;
	}
	editVideoDialog.value = true;
};

const editVideo = async (videoId) => {
	if (!canSaveEdit.value) return;
	try {
		isLoading.value = true;

		if (editingVideo.value.title !== originalEditingVideo.value.title || selectedGame.value?.id !== originalEditingVideo.value.gameId) {
			await ky.post(`videos/id/${videoId}`, {
				json: {
					title: editingVideo.value.title,
					gameId: selectedGame.value?.id,
				},
			}).json();
		}

		if (thumbnailFile.value) {
			const formData = new FormData();
			const file = Array.isArray(thumbnailFile.value) ? thumbnailFile.value[0] : thumbnailFile.value;
			formData.append('thumbnail', file);

			await ky.post(`videos/id/${videoId}/thumbnail`, {
				body: formData,
			});
		}

		playlistData.value = await ky.get(`playlists/id/${id}`).json();

		editVideoDialog.value = false;
		snackbar.value = true;
		snackbarText.value = 'Successfully edited video.';

	} catch (error) {
		let msg = error.message;
		try { msg = await error.response.text(); } catch(e){}
		snackbar.value = true;
		snackbarText.value = `Error editing video: ${msg}`;
	} finally {
		isLoading.value = false;
	}
};

const renameDialog = ref(false);
const renamePlaylistInput = ref('');

const openRenameDialog = () => {
	renamePlaylistInput.value = playlistData.value.title;
	renameDialog.value = true;
};

const renamePlaylist = async () => {
	if (!renamePlaylistInput.value || renamePlaylistInput.value === playlistData.value.title) {
		renameDialog.value = false;
		return;
	}

	try {
		isLoading.value = true;
		await ky.post(`playlists/id/${id}`, {
			json: {
				title: renamePlaylistInput.value,
			},
		}).json();

		playlistData.value.title = renamePlaylistInput.value;

		snackbar.value = true;
		snackbarText.value = 'Playlist renamed successfully.';
		renameDialog.value = false;
	} catch (error) {
		const message = await error.response?.text() || error.message;
		snackbar.value = true;
		snackbarText.value = message;
	} finally {
		isLoading.value = false;
	}
};

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

const addVideosDirectly = async (videos) => {
	if (!videos || videos.length === 0) return;

	try {
		isLoading.value = true;

		const videoIds = videos.map(v => v.id);

		await ky
			.put(`playlists/id/${id}/video`, {
				json: {
					videoId: videoIds,
				},
			})
			.json();

		playlistData.value = await ky.get(`playlists/id/${id}`).json();
		addVideoDialog.value = false;

		snackbar.value = true;
		snackbarText.value = `Successfully added ${videos.length} videos to playlist.`;
	}
	catch (error) {
		const message = await error.response?.text() || error.message;
		snackbar.value = true;
		snackbarText.value = message;
	} finally {
		isLoading.value = false;
	}
};

const route = useRoute();
const router = useRouter();
const id = route.params.id;

const videos = computed(() => {
	return playlistData.value?.videos || [];
});

const editPositionDialog = ref(false);
const editPositionIndex = ref(false);
const editPositionInput = ref('');

const openEditPositionDialog = index => {
	editPositionInput.value = '';
	editPositionIndex.value = index;
	editPositionDialog.value = true;
};

const deleteDialog = ref(false);
const playlistData = ref({});

const snackbar = ref(false);
const snackbarText = ref('');

const queuePlaylistDialog = ref(false);

const queuePlaylist = async () => {
	try {
		isLoading.value = true;
		await ky
			.put('queue/playlist', {
				json: {
					playlistId: id,
				},
			})
			.json();

		snackbar.value = true;
		snackbarText.value = 'Successfully queued playlist.';
	}
	catch (error) {
		const message = await error.response?.text() || error.message;
		snackbar.value = true;
		snackbarText.value = message;
	} finally {
		isLoading.value = false;
		queuePlaylistDialog.value = false;
	}
};

const queueVideo = async (videoId) => {
	try {
		isLoading.value = true;

		await ky.put('queue/video', { json: { videoId } }).json();

		snackbar.value = true;
		snackbarText.value = 'Successfully queued video.';
	} catch (error) {
		const message = await error.response?.text() || error.message;
		snackbar.value = true;
		snackbarText.value = message;
	} finally {
		isLoading.value = false;
	}
};

const addNewVideoToPlaylist = async () => {
	const videoData = {
		id: selectedVideo.value.id,
		title: selectedVideo.value.title,
	};

	try {
		await ky
			.put(`playlists/id/${id}/video`, {
				json: {
					videoId: videoData.id,
				},
			})
			.json();

		playlistData.value = await ky.get(`playlists/id/${id}`).json();

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
	playlistData.value = await ky.get(`playlists/id/${id}`).json();
	try {
		defaultGame.value = await ky.get('games/id/499973').json();
	} catch {}
});

const deletePlaylist = async () => {
	try {
		await ky.post(`playlists/id/${id}/delete`, {
			json: {
				force: playlistData.value.videos.length > 0,
			},
		}).json();

		router.push({
			name: 'playlists',
		});
	}
	catch (error) {
		const message = await error.response.text();

		snackbar.value = true;
		snackbarText.value = message;
	}
};

const removeVideoFromPlaylist = async (index) => {
	try {
		await ky
			.post(`playlists/id/${id}/video/delete`, {
				json: {
					index: index,
				},
			})
			.json();

		playlistData.value = await ky.get(`playlists/id/${id}`).json();

		snackbar.value = true;
		snackbarText.value = 'Successfully deleted video from playlist.';
	}
	catch (error) {
		const message = await error.response.text();

		snackbar.value = true;
		snackbarText.value = message;
	}
};

const editPos = async () => {
	moveVideo(editPositionIndex.value, editPositionInput.value);
	editPositionDialog.value = false;
};
</script>

<style scoped>
.cursor-grab {
	cursor: grab;
}
.cursor-grab:active {
	cursor: grabbing;
}
.draggable-item {
	transition: all 0.2s ease-in-out;
	border: 2px solid transparent !important;
}

.drag-source {
	opacity: 0.4;
	background-color: #E0E0E0;
	box-shadow: none !important;
}

.drag-target {
	border-color: rgb(var(--v-theme-primary)) !important;
	background-color: rgba(var(--v-theme-primary), 0.08);
	transform: scale(1.005);
	z-index: 1;
}
</style>