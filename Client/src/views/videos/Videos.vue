<template>
	<v-row
		justify="center"
		class="pa-8"
	>
		<v-btn
			color="red"
			variant="outlined"
			class="mx-2"
			prepend-icon="mdi-youtube"
			@click="openCreateVideoDialog"
		>
			Add YouTube video
		</v-btn>

		<v-btn
			color="green"
			variant="outlined"
			prepend-icon="mdi-folder-search"
			:loading="isScanning"
			class="mx-2"
			@click="scanLocalVideos"
		>
			Add all Local Videos
		</v-btn>
	</v-row>

	<v-divider :thickness="3" />

	<v-container fluid>
		<v-row
			justify="center"
			align="center"
		>
			<v-col
				cols="12"
				md="auto"
			>
				<v-btn
					color="blue"
					variant="outlined"
					prepend-icon="mdi-playlist-plus"
					class="mx-2"
					@click="toggleSelectionMode"
				>
					{{ selectionMode ? 'Stop' : 'Select' }}
				</v-btn>
				<v-btn
					v-if="selectionMode"
					color="orange"
					variant="flat"
					prepend-icon="mdi-playlist-plus"
					:disabled="selectedVideoIds.length === 0"
					class="mx-2"
					@click="openAddToPlaylistDialog()"
				>
					Add ({{ selectedVideoIds.length }})
				</v-btn>
			</v-col>

			<v-col
				cols="12"
				sm="6"
				md="3"
			>
				<v-text-field
					v-model="videoSearch"
					label="Search"
					append-inner-icon="mdi-magnify"
					variant="solo-filled"
					hide-details
					clearable
					density="compact"
				/>
			</v-col>

			<v-col
				cols="12"
				sm="4"
				md="2"
			>
				<v-select
					v-model="sortBy"
					:items="sortOptions"
					item-title="title"
					item-value="value"
					label="Sort by"
					variant="solo-filled"
					hide-details
					density="compact"
				/>
			</v-col>

			<v-col cols="auto">
				<v-btn
					icon
					variant="text"
					@click="sortDesc = !sortDesc"
				>
					<v-icon>{{ sortDesc ? 'mdi-sort-descending' : 'mdi-sort-ascending' }}</v-icon>
					<v-tooltip
						activator="parent"
						location="top"
					>
						{{ sortDesc ? 'Descending' : 'Ascending' }}
					</v-tooltip>
				</v-btn>
			</v-col>

			<v-col cols="auto">
				<v-btn-toggle
					v-model="viewMode"
					mandatory
					density="compact"
					color="primary"
					variant="outlined"
					divided
				>
					<v-btn
						value="grid"
						icon="mdi-view-grid"
					>
						<v-tooltip
							activator="parent"
							location="top"
						>
							Grid View
						</v-tooltip>
						<v-icon>mdi-view-grid</v-icon>
					</v-btn>
					<v-btn
						value="list"
						icon="mdi-view-list"
					>
						<v-tooltip
							activator="parent"
							location="top"
						>
							List View
						</v-tooltip>
						<v-icon>mdi-view-list</v-icon>
					</v-btn>
				</v-btn-toggle>
			</v-col>

			<v-col
				cols="12"
				sm="auto"
				class="d-flex justify-center"
			>
				<v-chip-group
					v-model="sourceFilter"
					mandatory
					filter
					selected-class="text-primary"
				>
					<v-chip
						value="all"
						size="small"
					>
						All
					</v-chip>
					<v-chip
						value="youtube"
						size="small"
					>
						YouTube
					</v-chip>
					<v-chip
						value="local"
						size="small"
					>
						Local
					</v-chip>
				</v-chip-group>
			</v-col>

			<v-col
				v-if="viewMode === 'grid'"
				cols="12"
				md="3"
			>
				<v-pagination
					v-model="page"
					:length="chunkedVideos.length"
					density="compact"
				/>
			</v-col>
		</v-row>
	</v-container>

	<v-container v-if="viewMode === 'grid'">
		<v-row class="mb-4">
			<v-col
				v-for="item in chunkedVideos[page - 1]"
				:key="item.id"
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

									@click.stop="selectionMode ? toggleVideoSelection(item.id) : null"
								>
									<v-img
										:src="item.thumbnail_url || placeholderImage"
										:lazy-src="placeholderImage"
										cover
										width="100%"
										:aspect-ratio="16 / 9"
										v-bind="props"
									/>
									<v-overlay
										:model-value="isHovering && !selectionMode"
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
													@click.stop="queueVideo(item.id)"
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
													@click.stop="openAddToPlaylistDialog(item)"
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
													@click.stop="openEditVideoDialog(item)"
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
													@click.stop="openDeleteDialog(item)"
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
									<v-overlay
										:model-value="selectionMode"
										contained
										class="align-center justify-center"
										scrim="#00000088"
										:opacity="0.8"
										:z-index="1"
									>
										<v-icon
											:icon="isVideoSelected(item.id) ? 'mdi-check-circle' : 'mdi-checkbox-blank-circle-outline'"
											size="80"
											:color="isVideoSelected(item.id) ? 'green' : 'white'"
										/>
									</v-overlay>
								</v-card>
							</v-hover>
						</div>
						<v-spacer />
						<v-card-title>
							<v-col class="pa-0">
								<span
									:title="item.title"
									style="white-space: normal;"
								>
									{{ item.title }}
								</span>
							</v-col>
						</v-card-title>
						<v-spacer />
						<v-card-subtitle class="mb-2">
							<div class="mb-1">
								<v-chip
									v-if="item.source_type === 'local'"
									color="blue"
									density="compact"
									prepend-icon="mdi-folder-play"
									size="small"
									class="mr-1"
								>
									Local
								</v-chip>
								<v-chip
									v-else-if="item.source_type === 'youtube'"
									color="red"
									density="compact"
									prepend-icon="mdi-youtube"
									size="small"
									class="mr-1"
								>
									YouTube
								</v-chip>
							</div>
							<p>
								<strong>Video ID:</strong>
								<a
									v-if="item.source_type === 'youtube'"
									:href="`https://youtube.com/watch?v=${item.id}`"
									target="_blank"
								>
									{{ item.id }}
								</a>
								<a
									v-else-if="item.source_type === 'local'"
									:title="item.id"
								>
									{{ item.id }}
								</a>
								<span
									v-else
									:title="item.id"
								>
									{{ item.id.substring(0, 12) }}...
								</span>
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

	<v-card
		v-if="viewMode === 'list'"
		class="mx-4 mb-4"
		style="height: 70vh;"
	>
		<v-virtual-scroll
			:items="sortedVideos"
			height="100%"
			item-height="100"
		>
			<template #default="{ item }">
				<v-list-item
					class="py-2"
					@click="selectionMode ? toggleVideoSelection(item.id) : null"
				>
					<template #prepend>
						<div
							v-if="selectionMode"
							class="mr-4 d-flex align-center"
						>
							<v-checkbox-btn
								:model-value="isVideoSelected(item.id)"
								@click.stop="toggleVideoSelection(item.id)"
							/>
						</div>

						<v-img
							:src="item.thumbnail_url || placeholderImage"
							:lazy-src="placeholderImage"
							cover
							width="140"
							aspect-ratio="16/9"
							class="mr-4 rounded"
						/>
					</template>

					<v-list-item-title class="text-h6">
						{{ item.title }}
					</v-list-item-title>

					<v-list-item-subtitle class="mt-1">
						<v-chip
							v-if="item.source_type === 'local'"
							color="blue"
							size="x-small"
							density="compact"
							class="mr-2"
						>
							LOCAL
						</v-chip>
						<v-chip
							v-else
							color="red"
							size="x-small"
							density="compact"
							class="mr-2"
						>
							YOUTUBE
						</v-chip>
						<strong class="mr-2">{{ item.gameTitle }}</strong>
						<v-icon
							size="small"
							class="mr-1"
						>
							mdi-clock-outline
						</v-icon>
						{{ formatVideoLength(item.length) }}
					</v-list-item-subtitle>

					<template #append>
						<div class="d-flex align-center">
							<v-btn
								icon="mdi-clock-outline"
								variant="text"
								color="orange-darken-4"
								class="mr-1"
								@click.stop="queueVideo(item.id)"
							>
								<v-tooltip
									activator="parent"
									location="top"
								>
									Queue Video
								</v-tooltip>
								<v-icon>mdi-clock-outline</v-icon>
							</v-btn>

							<v-btn
								icon="mdi-plus"
								variant="text"
								color="blue-darken-1"
								class="mr-1"
								@click.stop="openAddToPlaylistDialog(item)"
							>
								<v-tooltip
									activator="parent"
									location="top"
								>
									Add to Playlist
								</v-tooltip>
								<v-icon>mdi-plus</v-icon>
							</v-btn>

							<v-btn
								icon="mdi-file-edit"
								variant="text"
								color="green-darken-1"
								class="mr-1"
								@click.stop="openEditVideoDialog(item)"
							>
								<v-tooltip
									activator="parent"
									location="top"
								>
									Edit
								</v-tooltip>
								<v-icon>mdi-file-edit</v-icon>
							</v-btn>

							<v-btn
								icon="mdi-trash-can"
								variant="text"
								color="red-darken-1"
								@click.stop="openDeleteDialog(item)"
							>
								<v-tooltip
									activator="parent"
									location="top"
								>
									Delete
								</v-tooltip>
								<v-icon>mdi-trash-can</v-icon>
							</v-btn>
						</div>
					</template>
				</v-list-item>
				<v-divider />
			</template>
		</v-virtual-scroll>
	</v-card>

	<v-col
		v-if="sortedVideos.length === 0 && videos.length > 0"
		cols="12"
		class="text-center mt-5"
	>
		<p>No videos found matching your search and filter criteria.</p>
	</v-col>
	<v-col
		v-if="videos.length === 0 && !isLoading"
		cols="12"
		class="text-center mt-5"
	>
		<p>No videos available. Try scanning for local videos or adding YouTube videos.</p>
	</v-col>

	<v-dialog
		v-model="scanDialog"
		persistent
		width="400"
	>
		<v-card>
			<v-card-title>Scanning Local Videos</v-card-title>
			<v-card-text>
				<div class="mb-2">
					Processing: {{ scanCurrent }} / {{ scanTotal }}
				</div>
				<v-progress-linear
					v-model="scanPercentage"
					color="blue"
					height="25"
					striped
				>
					<template #default="{ value }">
						<strong>{{ Math.ceil(value) }}%</strong>
					</template>
				</v-progress-linear>
				<div class="mt-2 text-caption text-truncate">
					{{ scanFilename }}
				</div>
			</v-card-text>
		</v-card>
	</v-dialog>

	<v-dialog
		v-model="createVideoDialog"
		width="800"
	>
		<v-card>
			<v-card-title>
				<span class="text-h5">Add a new YouTube video</span>
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
					<v-row v-if="selectedVideo.id">
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
								<v-text-field
									v-model="selectedVideo.title"
									label="Video Title"
									readonly
									variant="solo-filled"
									hide-details
								/>
								<v-text-field
									v-model="selectedVideo.id"
									label="YouTube ID"
									readonly
									variant="solo-filled"
									hide-details
								/>
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
				</v-container>
				<small>Creates a new YouTube video entry.</small>
			</v-card-text>
			<v-card-actions>
				<v-spacer />
				<v-btn
					color="red-darken-1"
					variant="text"
					@click="closeCreateVideoDialog"
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

	<SelectGameDialog
		ref="selectGameDialog"
		@select-game="selectGame"
	/>

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
				<v-row class="mb-0 mt-2">
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

	<v-dialog
		v-model="deleteDialog"
		width="auto"
	>
		<v-card>
			<v-card-title>Deleting {{ deletingVideo.title }}</v-card-title>
			<v-card-text>
				Do you really want to delete "{{ deletingVideo.title }}"?
				<v-checkbox
					v-if="deletingVideo && (deletingVideo.playlistCount > 0 || deletingVideo.isInRandomList)"
					v-model="forceDelete"
					label="Force delete (removes from all playlists and random list)"
				/>
			</v-card-text>
			<v-card-actions>
				<v-spacer />
				<v-btn
					color="red-darken-1"
					variant="text"
					@click="closeDeleteDialog"
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

	<v-dialog
		v-model="addToPlaylistDialog"
		width="800"
	>
		<v-card>
			<v-card-title>
				<span class="text-h5">Add {{ selectedVideoIds.length }} video(s) to Playlist</span>
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
					<v-row
						v-if="selectedPlaylist"
						class="mt-2"
					>
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
								<v-text-field
									:model-value="selectedPlaylist?.title"
									label="Playlist"
									readonly
									variant="solo-filled"
									hide-details
								/>
								<v-text-field
									:model-value="selectedPlaylist?.id"
									label="Playlist ID"
									readonly
									variant="solo-filled"
									hide-details
								/>
							</div>
						</v-col>
					</v-row>
				</v-container>
				<small>Adds the selected video to the chosen playlist.</small>
			</v-card-text>
			<v-card-actions>
				<v-spacer />
				<v-btn
					color="red-darken-1"
					variant="text"
					@click="closeAddToPlaylistDialog"
				>
					Close
				</v-btn>
				<v-btn
					color="green-darken-1"
					variant="text"
					:disabled="!selectedPlaylist || selectedVideoIds.length === 0"
					:loading="isLoading"
					@click="addVideoToPlaylist"
				>
					Add
				</v-btn>
			</v-card-actions>
		</v-card>
	</v-dialog>

	<SelectPlaylistDialog
		ref="selectPlaylistDialog"
		@select-playlist="selectPlaylist"
	/>

	<v-snackbar
		v-model="snackbar"
		timeout="4000"
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
import { socket } from '@/socket';

import SelectGameDialog from '@/composables/SelectGameDialog.vue';
import SelectPlaylistDialog from '@/composables/SelectPlaylistDialog.vue';

import placeholderImage from '@/assets/placeholder-500x700.jpg';
import { Duration } from 'luxon';

const videos = ref([]);
const videoSearch = ref('');
const page = ref(1);
const snackbar = ref(false);
const snackbarText = ref('');
const isScanning = ref(false);
const sourceFilter = ref('all');

const viewMode = ref(localStorage.getItem('videos_view_mode') || 'grid');

watch(viewMode, (newValue) => {
	localStorage.setItem('videos_view_mode', newValue);
});

const sortBy = ref('created_at');
const sortDesc = ref(true);

const sortOptions = [
	{ title: 'Date Added', value: 'created_at' },
	{ title: 'Title', value: 'title' },
	{ title: 'Video ID', value: 'id' },
	{ title: 'Length', value: 'length' },
	{ title: 'Game', value: 'gameTitle' },
];

const scanDialog = ref(false);
const scanCurrent = ref(0);
const scanTotal = ref(0);
const scanFilename = ref('');

const scanPercentage = computed(() => {
	if (scanTotal.value === 0) return 0;
	return (scanCurrent.value / scanTotal.value) * 100;
});

const createVideoDialog = ref(false);
const searchInput = ref('');
const selectedVideo = ref({});
const addVideoToRandomPlaylist = ref(true);
const defaultGame = ref(null);

const selectGameDialog = ref(null);
const selectedGame = ref(null);

const editVideoDialog = ref(false);
const editingVideo = ref({});
const originalEditingVideo = ref({});
const thumbnailFile = ref(null);

const deleteDialog = ref(false);
const deletingVideo = ref({});
const forceDelete = ref(false);

const addToPlaylistDialog = ref(false);
const selectedVideoForPlaylist = ref({});
const selectPlaylistDialog = ref(null);
const selectedPlaylist = ref(null);

const selectionMode = ref(false);
const selectedVideoIds = ref([]);

const formatVideoLength = (length) => {
	const progress = Duration.fromObject({ seconds: length || 0 });
	return progress.toFormat('hh:mm:ss');
};

const toggleSelectionMode = () => {
	selectionMode.value = !selectionMode.value;
	selectedVideoIds.value = [];
};

const toggleVideoSelection = (videoId) => {
	const index = selectedVideoIds.value.indexOf(videoId);
	if (index > -1) {
		selectedVideoIds.value.splice(index, 1);
	} else {
		selectedVideoIds.value.push(videoId);
	}
};

const isVideoSelected = (videoId) => selectedVideoIds.value.includes(videoId);

const getGameThumbnailURL = () => selectedGame.value?.thumbnail_url || placeholderImage;
const getGameTitle = () => selectedGame.value?.title || 'N/A';
const getGameID = () => selectedGame.value?.id || 'N/A';

const { name } = useDisplay();

const sortedVideos = computed(() => {
	const sourceFiltered = videos.value.filter(video => {
		if (sourceFilter.value === 'all') return true;
		return video.source_type === sourceFilter.value;
	});

	const searchFiltered = sourceFiltered.filter((video) => {
		if (!videoSearch.value) return true;
		return video.title?.toLowerCase().includes(videoSearch.value.toLowerCase());
	});

	// Natural Sort Logic
	return searchFiltered.sort((a, b) => {
		const field = sortBy.value;
		let valA = a[field];
		let valB = b[field];

		const modifier = sortDesc.value ? -1 : 1;

		valA = valA ?? '';
		valB = valB ?? '';

		if (typeof valA === 'string' && typeof valB === 'string') {
			return valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' }) * modifier;
		}

		if (valA < valB) return -1 * modifier;
		if (valA > valB) return 1 * modifier;
		return 0;
	});
});

const chunkedVideos = computed(() => {
	let chunk = 6;
	switch (name.value) {
		case 'xs': chunk = 2; break;
		case 'sm': chunk = 2; break;
		case 'md': chunk = 4; break;
		case 'lg': chunk = 6; break;
		case 'xl': chunk = 8; break;
		case 'xxl': chunk = 12; break;
		default: chunk = 12; break;
	}

	return _.chunk(sortedVideos.value, chunk);
});

const disableAddVideo = computed(() => {
	if (!selectedVideo.value?.id || !selectedGame.value?.id) return true;
	const duplicate = videos.value.some(v => v.id === selectedVideo.value?.id);
	if (duplicate) return true;
	return !!selectedVideo.value?.age_restricted;
});

const canSaveEdit = computed(() => {
	if (!editingVideo.value || !originalEditingVideo.value) return false;

	if (thumbnailFile.value) return true;

	return editingVideo.value.title !== originalEditingVideo.value.title ||
		selectedGame.value?.id !== originalEditingVideo.value.gameId;
});

watch([videoSearch, sourceFilter, sortBy, sortDesc], () => {
	page.value = 1;
});

watch(chunkedVideos, (newValue) => {
	if (page.value > newValue.length) {
		page.value = Math.max(1, newValue.length);
	}
}, { immediate: false });

watch(searchInput, (newValue) => {
	if (createVideoDialog.value && newValue !== '') {
		searchForYouTubeVideosDebounced();
	} else if (!newValue && createVideoDialog.value) {
		selectedVideo.value = {};
	}
});

watch(editVideoDialog, (newValue) => {
	if (!newValue && defaultGame.value) {
		selectedGame.value = defaultGame.value;
	}
});

const fetchVideos = async () => {
	try {
		isLoading.value = true;
		videos.value = await ky.get('videos').json();
	} catch (error) {
		showSnackbar(`Error fetching videos: ${await error?.response?.text() || error.message}`);
	} finally {
		isLoading.value = false;
	}
};

const fetchDefaultGame = async () => {
	try {
		defaultGame.value = await ky.get('games/id/499973').json();
		if (!selectedGame.value) {
			selectedGame.value = defaultGame.value;
		}
	} catch (error) {
		showSnackbar(`Error fetching default game: ${await error?.response?.text() || error.message}`);
	}
};

onMounted(async () => {
	await fetchDefaultGame();
	await fetchVideos();

	socket.on('scan_start', (data) => {
		scanCurrent.value = 0;
		scanTotal.value = data.total;
		scanFilename.value = 'Starting scan...';
		scanDialog.value = true;
	});

	socket.on('scan_progress', (data) => {
		scanCurrent.value = data.current;
		scanTotal.value = data.total;
		scanFilename.value = data.filename;
	});

	socket.on('scan_complete', async (result) => {
		scanDialog.value = false;
		isScanning.value = false;

		if (result && result.added !== undefined) {
			showSnackbar(`Scan complete! Added: ${result.added}, Skipped: ${result.skipped}, Failed: ${result.failed}`);
		} else {
			showSnackbar('Scan complete!');
		}

		await fetchVideos();
	});
});

const showSnackbar = (text) => {
	snackbarText.value = text;
	snackbar.value = true;
};

const openCreateVideoDialog = () => {
	resetCreateVideoDialog();
	createVideoDialog.value = true;
};

const closeCreateVideoDialog = () => {
	createVideoDialog.value = false;
	resetCreateVideoDialog();
};

const resetCreateVideoDialog = () => {
	searchInput.value = '';
	selectedVideo.value = {};
	selectedGame.value = defaultGame.value;
	addVideoToRandomPlaylist.value = true;
};

const searchForYouTubeVideos = async () => {
	if (!searchInput.value) {
		selectedVideo.value = {};
		return;
	}

	const searchTerm = searchInput.value;
	try {
		isLoading.value = true;

		const data = await ky.post('youtube/get-video', { json: { videoId: searchTerm } }).json();

		if (!data) {
			showSnackbar('No YouTube video found with that ID/URL.');
			selectedVideo.value = {};
		} else {
			selectedVideo.value = data;
			if (data.age_restricted) {
				showSnackbar('Cannot add age-restricted videos.');
			}
		}
	} catch (error) {
		showSnackbar(`Error searching YouTube: ${await error?.response?.text() || error.message}`);
		selectedVideo.value = {};
	} finally {
		isLoading.value = false;
	}
};

const searchForYouTubeVideosDebounced = _.debounce(searchForYouTubeVideos, 500);

const addNewVideo = async () => {
	if (disableAddVideo.value) return;

	try {
		isLoading.value = true;

		await ky.put('videos', {
			json: {
				videoId: selectedVideo.value.id,
				gameId: selectedGame.value.id,
				addToRandomPlaylist: addVideoToRandomPlaylist.value,
			},
		}).json();

		await fetchVideos();

		closeCreateVideoDialog();
		showSnackbar('Successfully added YouTube video.');

	} catch (error) {
		showSnackbar(`Error adding video: ${await error?.response?.text() || error.message}`);
	} finally {
		isLoading.value = false;
	}
};

const scanLocalVideos = async () => {
	isScanning.value = true;

	try {
		await ky.post('videos/scan-local').json();
		showSnackbar('Scan started in background...');
	} catch (error) {
		showSnackbar(`Error starting scan: ${await error?.response?.text() || error.message}`);
		isScanning.value = false;
	}
};

const openEditVideoDialog = async (video) => {
	const original = videos.value.find(v => v.id === video.id);

	if (!original) return;
	editingVideo.value = { ...original };
	originalEditingVideo.value = { ...original };
	thumbnailFile.value = null;
	try {
		selectedGame.value = await ky.get(`games/id/${original.gameId}`).json();
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

		await fetchVideos();

		editVideoDialog.value = false;
		showSnackbar('Successfully edited video.');

	} catch (error) {
		let msg = error.message;
		try { msg = await error.response.text(); } catch (e) { }
		showSnackbar(`Error editing video: ${msg}`);
	} finally {
		isLoading.value = false;
	}
};

const openDeleteDialog = (video) => {
	deletingVideo.value = video;
	forceDelete.value = false;
	deleteDialog.value = true;
};

const closeDeleteDialog = () => {
	deleteDialog.value = false;
	deletingVideo.value = {};
};

const deleteVideo = async (videoId) => {
	try {
		isLoading.value = true;

		await ky.post(`videos/id/${videoId}/delete`, {
			json: {
				force: forceDelete.value,
			},
		}).json();

		await fetchVideos();

		closeDeleteDialog();
		showSnackbar('Successfully deleted video.');

	} catch (error) {
		showSnackbar(`Error deleting video: ${await error?.response?.text() || error.message}`);
	} finally {
		isLoading.value = false;
	}
};

const openSelectGameDialog = () => selectGameDialog.value.open();

const selectGame = (game) => selectedGame.value = game;

const openAddToPlaylistDialog = (video = null) => {
	if (selectionMode.value && selectedVideoIds.value.length > 0) {
		selectedVideoForPlaylist.value = {};
	} else if (video) {
		selectedVideoForPlaylist.value = video;
		selectedVideoIds.value = [video.id];
	} else if (selectedVideoIds.value.length === 0) {
		showSnackbar('No videos selected.');
		return;
	}

	selectedPlaylist.value = null;
	addToPlaylistDialog.value = true;
};

const closeAddToPlaylistDialog = () => {
	addToPlaylistDialog.value = false;
	selectedVideoForPlaylist.value = {};
	selectedPlaylist.value = null;
	selectedVideoIds.value = [];
};

const openSelectPlaylistDialog = () => selectPlaylistDialog.value.open();

const selectPlaylist = (playlist) => selectedPlaylist.value = playlist;

const addVideoToPlaylist = async () => {
	if (!selectedPlaylist.value || selectedVideoIds.value.length === 0) return;

	try {
		isLoading.value = true;

		await ky.put(`playlists/id/${selectedPlaylist.value.id}/video`, {
			json: { videoId: selectedVideoIds.value },
		}).json();

		const count = selectedVideoIds.value.length;
		closeAddToPlaylistDialog();
		showSnackbar(`Successfully added ${count} video(s) to playlist.`);

		if (selectionMode.value) {
			selectionMode.value = false;
		}

	} catch (error) {
		let errorMessage = 'An unknown error occurred.';

		try {
			const errorText = await error.response.text();
			errorMessage = errorText;
		} catch (e) {
			errorMessage = error.message;
		}

		showSnackbar(`Error adding video to playlist: ${errorMessage}`);
	} finally {
		isLoading.value = false;
	}
};

const queueVideo = async (videoId) => {
	try {
		isLoading.value = true;

		await ky.put('queue/video', { json: { videoId } }).json();

		showSnackbar('Successfully queued video.');
	} catch (error) {
		showSnackbar(`Error queuing video: ${await error?.response?.text() || error.message}`);
	} finally {
		isLoading.value = false;
	}
};
</script>

<style scoped>
.v-card-title span {
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	display: block;
}
</style>