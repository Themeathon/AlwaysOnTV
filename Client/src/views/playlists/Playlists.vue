<template>
	<v-row
		justify="center"
		class="pa-8"
	>
		<div class="mb-4">
			<v-btn
				color="primary"
				variant="outlined"
				class="mx-2"
				prepend-icon="mdi-plus"
				@click="openPlaylistDialog"
			>
				Create playlist
			</v-btn>

			<v-btn
				color="red"
				variant="outlined"
				class="mx-2"
				prepend-icon="mdi-youtube"
				@click="openImportPlaylistDialog"
			>
				Import playlist
			</v-btn>
		</div>

		<v-divider :thickness="3" />

		<v-container id="paginationContainer">
			<v-row justify="center">
				<v-col
					cols="12"
					sm="12"
					md="6"
					lg="4"
					xl="3"
				>
					<v-text-field
						v-model="playlistSearch"
						label="Search playlists"
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
						:length="chunkedPlaylists.length"
					/>
				</v-col>
			</v-row>
		</v-container>

		<v-container>
			<v-row class="mb-4">
				<v-col
					v-for="item in chunkedPlaylists[page - 1]"
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
														v-if="!item.randomPlaylist"
														class="mx-2"
														icon="mdi-clock-outline"
														size="large"
														color="orange-darken-4"
														variant="flat"
														:disabled="!item.videoCount"
														@click="openQueuePlaylistDialog(item)"
													>
														<v-tooltip
															activator="parent"
															location="top"
															:eager="false"
														>
															Queue Playlist
														</v-tooltip>
														<v-icon />
													</v-btn>

													<v-btn
														class="mx-2"
														icon="mdi-file-edit"
														size="large"
														color="green-darken-1"
														variant="flat"
														:to="{
															name: item.randomPlaylist ? 'random-playlist-view' : 'playlist-view',
															params: { id: item?.id },
														}"
													>
														<v-tooltip
															activator="parent"
															location="top"
															:eager="false"
															attach="#paginationContainer"
														>
															Edit Playlist
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

							<v-card-title class="text-wrap">
								<span :title="item.title">{{ item.title }}</span>
							</v-card-title>

							<v-spacer />

							<v-card-subtitle class="mb-2">
								<p>
									<strong>Total Videos:</strong> {{ item.videoCount }}
								</p>

								<p>
									<strong>Estimated Length:</strong> {{ getPlaylistLengthFormatted(item.playlistLength) }}
								</p>
							</v-card-subtitle>
						</v-card>
					</v-hover>
				</v-col>
			</v-row>
		</v-container>
	</v-row>

	<!-- Create Playlist -->
	<v-dialog
		v-model="createPlaylistDialog"
		width="800"
	>
		<v-card>
			<v-card-title>
				<span class="text-h5">Create a new playlist</span>
			</v-card-title>
			<v-card-text>
				<v-container>
					<v-row>
						<v-col cols="12">
							<v-text-field
								v-model="newPlaylistName"
								label="Playlist name"
								placeholder="My awesome playlist"
								required
								counter
								variant="solo-filled"
								hide-details
							/>
						</v-col>
					</v-row>
				</v-container>
				<small>Only creates the base playlist</small>
			</v-card-text>
			<v-card-actions>
				<v-spacer />
				<v-btn
					color="red-darken-1"
					variant="text"
					@click="createPlaylistDialog = false"
				>
					Close
				</v-btn>
				<v-btn
					color="green-darken-1"
					variant="text"
					:loading="isLoading"
					@click="createPlaylist"
				>
					Add
				</v-btn>
			</v-card-actions>
		</v-card>
	</v-dialog>

	<!-- Import Playlist -->
	<v-dialog
		v-model="importPlaylistDialog"
		width="800"
	>
		<v-card>
			<v-card-title>
				<span class="text-h5">Import a YouTube playlist</span>
			</v-card-title>
			<v-card-text>
				<v-container>
					<v-row>
						<v-text-field
							v-model="searchInput"
							append-inner-icon="mdi-magnify"
							label="YouTube Playlist URL / Playlist ID"
							placeholder="https://www.youtube.com/playlist?list=PLn705Am2h2mu31k50RreRmotREPDHqJoz"
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
								:src="selectedYTplaylist.thumbnail_url || placeholderImage"
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
										v-model="selectedYTplaylist.title"
										label="Playlist Title"
										readonly
										variant="solo-filled"
										hide-details
									/>
								</div>
								<div>
									<v-text-field
										v-model="selectedYTplaylist.id"
										label="Playlist ID"
										readonly
										variant="solo-filled"
										hide-details
									/>
								</div>
								<div>
									<v-text-field
										v-model="selectedYTplaylist.videoCount"
										label="Total Videos"
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
							v-model="addVideosToRandomPlaylist"
							label="Add Videos To Random Playlist"
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
				<small>Creates a playlist with the YouTube playlist name. Adds all the videos with the selected game and optionally adds them to the random playlist.</small>
			</v-card-text>
			<v-card-actions>
				<v-spacer />
				<v-btn
					color="red-darken-1"
					variant="text"
					@click="importPlaylistDialog = false"
				>
					Close
				</v-btn>
				<v-btn
					color="green-darken-1"
					variant="text"
					:disabled="!canImportPlaylist"
					:loading="isLoading"
					@click="importPlaylist"
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

	<!-- Queue Playlist -->
	<v-dialog
		v-model="queuePlaylistDialog"
		width="auto"
	>
		<v-card>
			<v-card-title>Queue Playlist</v-card-title>
			<v-card-text>
				Do you really want to queue this playlist?
			</v-card-text>
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
import _ from 'lodash';
import ky, { isLoading } from '@/ky';
import { onMounted, ref, computed, watch } from 'vue';
import { useDisplay } from 'vuetify';

import SelectGameDialog from '@/composables/SelectGameDialog.vue';

import placeholderImage from '@/assets/placeholder-500x700.jpg';
import { Duration } from 'luxon';

const snackbar = ref(false);
const snackbarText = ref('');

const getPlaylistLengthFormatted = length => {
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

const searchInput = ref('');
const selectedYTplaylist = ref(false);
const addVideosToRandomPlaylist = ref(true);

watch(searchInput, (newValue) => {
	if (newValue === '') return;

	searchForYTplaylists();
});

const searchForYTplaylists = _.debounce(async () => {
	if (!searchInput.value) {
		selectedYTplaylist.value = false;
	} else {
		const searchTerm = searchInput.value;

		try {
			const data = await ky
				.post('youtube/get-playlist', {
					json: {
						playlistId: searchTerm,
					},
				})
				.json();

			if (!data) {
				console.error('No playlist found with that name');
				return;
			}

			selectedYTplaylist.value = data;
		}
		catch (error) {
			const message = await error.response.text();

			snackbar.value = true;
			snackbarText.value = message;
		}
	}
}, 500);

const canImportPlaylist = computed(() => {
	return selectedYTplaylist.value && selectedGame.value;
});

const createPlaylistDialog = ref(false);
const playlists = ref([]);
const newPlaylistName = ref('');

const playlistSearch = ref('');
const page = ref(1);

const importPlaylistDialog = ref(false);

const queuePlaylistDialog = ref(false);
const queuePlaylistSelected = ref(false);

const openQueuePlaylistDialog = (playlist) => {
	queuePlaylistSelected.value = playlist;
	queuePlaylistDialog.value = true;
};

const openImportPlaylistDialog = () => {
	importPlaylistDialog.value = true;
};

const openPlaylistDialog = () => {
	createPlaylistDialog.value = true;
};

const queuePlaylist = async () => {
	try {
		await ky
			.put('queue/playlist', {
				json: {
					playlistId: queuePlaylistSelected.value.id,
				},
			})
			.json();

		snackbar.value = true;
		snackbarText.value = 'Successfully queued playlist.';
	}
	catch (error) {
		const message = await error.response.text();

		snackbar.value = true;
		snackbarText.value = message;
	}

	queuePlaylistDialog.value = false;
};

const { name } = useDisplay();
const chunkedPlaylists = computed(() => {
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

	const filtered = _.filter(playlists.value, (playlist) => {
		if (!playlistSearch.value) return true;
		if (playlist.title === 'Random Playlist') return true;

		return playlist.title.toLowerCase().includes(playlistSearch.value.toLowerCase());
	});

	return _.chunk(filtered, chunk);
});

watch(chunkedPlaylists, (newValue) => {
	if (page.value >= newValue.length)
		page.value = Math.max(1, newValue.length);
});

const fetchPlaylists = async () => {
	playlists.value = await ky.get('playlists').json();

	const randomPlaylist = await ky.get('random-playlist').json();

	randomPlaylist.title = 'Random Playlist';
	randomPlaylist.randomPlaylist = true;

	playlists.value.unshift(randomPlaylist);
};

onMounted(async () => {
	await fetchPlaylists();

	selectedGame.value = await ky.get('games/id/499973').json();
});

const createPlaylist = async () => {
	try {
		await ky
			.put('playlists', {
				json: {
					title: newPlaylistName.value,
				},
			})
			.json();

		await fetchPlaylists();

		createPlaylistDialog.value = false;
		newPlaylistName.value = '';

		snackbar.value = true;
		snackbarText.value = 'Successfully added playlist.';
	}
	catch (error) {
		const message = await error.response.text();

		snackbar.value = true;
		snackbarText.value = message;
	}
};

const importPlaylist = async () => {
	try {
		await ky
			.put('playlists', {
				json: {
					gameId: selectedGame.value.id,
					youTubePlaylistID: selectedYTplaylist.value.id,
					addNewToRandomPlaylist: addVideosToRandomPlaylist.value,
				},
			})
			.json();

		await fetchPlaylists();

		importPlaylistDialog.value = false;
		newPlaylistName.value = '';

		snackbar.value = true;
		snackbarText.value = 'Successfully imported playlist.';
	}
	catch (error) {
		const message = await error.response.text();

		snackbar.value = true;
		snackbarText.value = message;
	}
};
</script>
