<template>
	<div class="d-flex flex-column h-100">
		<div class="pa-8 text-center">
			<v-btn
				color="primary"
				variant="outlined"
				prepend-icon="mdi-plus"
				@click="openCreateGameDialog"
			>
				Add game
			</v-btn>
		</div>

		<v-divider :thickness="3" />

		<v-container>
			<v-row
				justify="center"
				align="center"
			>
				<v-col
					cols="12"
					sm="6"
					md="6"
					lg="4"
					xl="3"
				>
					<v-text-field
						v-model="gameSearch"
						label="Search games"
						append-inner-icon="mdi-magnify"
						variant="solo-filled"
						hide-details
					/>
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
							<v-icon>mdi-view-grid</v-icon>
						</v-btn>
						<v-btn
							value="list"
							icon="mdi-view-list"
						>
							<v-icon>mdi-view-list</v-icon>
						</v-btn>
					</v-btn-toggle>
				</v-col>
				<v-col
					v-if="viewMode === 'grid'"
					cols="12"
					sm="6"
					md="6"
					lg="4"
					xl="3"
				>
					<v-pagination
						v-model="page"
						:length="chunkedGames.length"
					/>
				</v-col>
			</v-row>
		</v-container>

		<div
			class="flex-grow-1 overflow-y-auto"
			style="min-height: 0;"
		>
			<v-container v-if="viewMode === 'grid'">
				<v-row class="mb-4">
					<v-col
						v-for="item in chunkedGames[page - 1]"
						:key="item.title"
						cols="6"
						sm="4"
						md="3"
						lg="3"
						xl="2"
					>
						<v-hover v-slot="{ isHovering: hoveringCard, props: propsCard }">
							<v-card
								class="mt-4 mx-2 text-center"
								:elevation="hoveringCard ? 10 : 0"
								v-bind="propsCard"
							>
								<div>
									<v-card-title><span :title="item.title">{{ item.title }}</span></v-card-title>
									<v-card-subtitle><strong>Twitch ID:</strong> {{ item.id }}</v-card-subtitle>
									<v-card-subtitle><strong>Total Videos:</strong> {{ item.videoCount }}</v-card-subtitle>
									<v-card-text>
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
													:aspect-ratio="5 / 7"
													v-bind="props"
												/>

												<v-overlay
													v-if="item.id !== '499973'"
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
																icon="mdi-movie-open-plus"
																size="large"
																color="blue-darken-1"
																variant="flat"
																@click="openAssignGameDialog(item)"
															>
																<v-tooltip
																	activator="parent"
																	location="top"
																	:eager="false"
																>
																	Assign Game to Videos
																</v-tooltip>
																<v-icon>mdi-movie-open-plus</v-icon>
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
																	Delete Game
																</v-tooltip>
																<v-icon>mdi-trash-can</v-icon>
															</v-btn>
														</v-row>
														<v-spacer />
													</div>
												</v-overlay>
											</v-card>
										</v-hover>
									</v-card-text>
								</div>
							</v-card>
						</v-hover>
					</v-col>
				</v-row>
			</v-container>

			<v-card
				v-if="viewMode === 'list'"
				class="mx-4 mb-4 h-100"
				flat
			>
				<v-virtual-scroll
					:items="sortedGames"
					height="100%"
					item-height="120"
				>
					<template #default="{ item }">
						<v-list-item
							class="draggable-item py-2 mb-1 rounded"
							:class="{
								'drag-source': draggedItem && draggedItem.id === item.id,
								'drag-target': dragOverItem && dragOverItem.id === item.id && draggedItem && draggedItem.id !== item.id
							}"
							draggable="true"
							@dragstart="onDragStart($event, item)"
							@dragenter.prevent="onDragEnter(item)"
							@dragover.prevent
							@dragend="onDragEnd"
							@drop="onDrop($event, item)"
						>
							<template #prepend>
								<v-icon
									class="mr-4 cursor-grab"
									color="grey-darken-1"
								>
									mdi-drag-horizontal-variant
								</v-icon>

								<v-img
									:src="item.thumbnail_url || placeholderImage"
									:lazy-src="placeholderImage"
									cover
									width="80"
									aspect-ratio="3/4"
									class="mr-4 rounded"
								/>
							</template>

							<v-list-item-title class="text-h6">
								{{ item.title }}
							</v-list-item-title>

							<v-list-item-subtitle class="mt-1">
								<strong>Twitch ID:</strong> {{ item.id }}
								<span class="mx-2">•</span>
								<strong>Videos:</strong> {{ item.videoCount }}
							</v-list-item-subtitle>

							<template #append>
								<div class="d-flex align-center">
									<v-btn
										v-if="item.id !== '499973'"
										icon="mdi-movie-open-plus"
										variant="text"
										color="blue-darken-1"
										class="mr-1"
										@click="openAssignGameDialog(item)"
									>
										<v-tooltip
											activator="parent"
											location="top"
										>
											Assign to Videos
										</v-tooltip>
										<v-icon>mdi-movie-open-plus</v-icon>
									</v-btn>

									<v-btn
										v-if="item.id !== '499973'"
										icon="mdi-trash-can"
										variant="text"
										color="red-darken-1"
										@click="openDeleteDialog(item)"
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
		</div>
	</div>

	<SelectVideoDialog
		ref="selectVideoDialog"
		@select-videos="assignGameToVideos"
		@select-video="(video) => assignGameToVideos([video])"
	/>

	<v-dialog
		v-model="createGameDialog"
		width="800"
	>
		<v-card>
			<v-card-title>
				<span class="text-h5">Add a new game</span>
			</v-card-title>
			<v-card-text>
				<v-row>
					<v-text-field
						v-model="searchInput"
						:disabled="isLoading"
						:loading="isLoading"
						:error-messages="searchErrorMessages"
						label="Search by Name or ID"
						append-inner-icon="mdi-magnify"
						placeholder="Just Chatting or ID=509658"
						required
						variant="solo-filled"
						hide-details="auto"
					/>
				</v-row>
				<v-row class="mt-2">
					<v-col class="text-caption">
						To find the correct Twitch Category ID, you can use this page: <a
							href="https://aquillium.com/get-twitch-category-id/"
							target="_blank"
							rel="noopener"
						>aquillium.com/get-twitch-category-id</a>
					</v-col>
				</v-row>
			</v-card-text>
			<v-card-text
				class="mt-4"
				style="position: relative; height: 800px;"
			>
				<v-virtual-scroll
					style="position: absolute; left: 0; right: 0; top: 0; bottom: 0;"
					:items="checkboxBasedSearchedGames"
					item-height="150"
				>
					<template #default="{ item }">
						<v-list-item
							class="py-2"
							:disabled="isLoading"
							@click="!item.isAdded && addNewGame(item)"
						>
							<v-list-item-title class="text-h5 font-weight-bold">
								{{ item.name }}
							</v-list-item-title>
							<v-list-item-subtitle v-if="item.isAdded">
								Already added
							</v-list-item-subtitle>
							<template #prepend>
								<v-img
									:src="bigThumbnail(item.cover.url)"
									:lazy-src="placeholderImage"
									cover
									:aspect-ratio="3 / 4"
									width="100"
									class="mr-4"
								/>
							</template>
						</v-list-item>
					</template>
				</v-virtual-scroll>
			</v-card-text>
			<v-card-actions>
				<div class="d-flex flex-column text-center">
					<v-checkbox
						v-model="addMultipleGames"
						label="Add multiple games"
						hide-details
						density="compact"
					/>
					<v-checkbox
						v-model="checkboxShowAdded"
						label="Show added"
						hide-details
						density="compact"
					/>
					<span v-if="filteredSearchedGames.length">Found {{ filteredSearchedGames.length }} games ({{ filteredSearchedGames.filter(g => g.isAdded).length }} already added)</span>
					<span v-else>No games were found with that name or ID</span>
				</div>
				<v-spacer />
				<v-btn
					color="red-darken-1"
					variant="text"
					@click="createGameDialog = false"
				>
					Close
				</v-btn>
			</v-card-actions>
		</v-card>
	</v-dialog>

	<v-dialog
		v-model="deleteDialog"
		width="auto"
	>
		<v-card>
			<v-card-title>Deleting {{ deletingGame.title }}</v-card-title>
			<v-card-text>Do you really want to delete {{ deletingGame.title }}?</v-card-text>
			<v-card-actions>
				<v-spacer />
				<v-btn
					color="red-darken-1"
					variant="text"
					@click="deletingGame = false"
				>
					Cancel
				</v-btn>
				<v-btn
					color="green-darken-1"
					variant="text"
					:loading="isLoading"
					@click="deleteGame(deletingGame)"
				>
					Delete
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
import ky, {isLoading} from '@/ky';
import _ from 'lodash';
import {computed, onMounted, ref, watch} from 'vue';
import {useDisplay} from 'vuetify';

import placeholderImage from '@/assets/placeholder-500x700.jpg';
import SelectVideoDialog from '@/composables/SelectVideoDialog.vue';
import snackbarText from 'lodash/seq';

const createGameDialog = ref(false);
const games = ref([]);
const searchedGames = ref([]);
const searchErrorMessages = ref('');
const checkboxShowAdded = ref(false);
const addMultipleGames = ref(false);
const viewMode = ref(localStorage.getItem('games_view_mode') || 'grid');

const draggedItem = ref(null);
const dragOverItem = ref(null);

const onDragStart = (event, item) => {
	draggedItem.value = item;
	event.dataTransfer.effectAllowed = 'move';
};

const onDragEnter = (item) => {
	if (item.id !== draggedItem.value?.id) {
		dragOverItem.value = item;
	}
};

const onDragEnd = () => {
	draggedItem.value = null;
	dragOverItem.value = null;
};

const onDrop = (event, targetItem) => {
	const sourceItem = draggedItem.value;
	if (!sourceItem || sourceItem.id === targetItem.id) {
		onDragEnd();
		return;
	}
	moveGame(sourceItem, targetItem);
	onDragEnd();
};

const moveGame = async (sourceItem, targetItem) => {
	const newIndex = sortedGames.value.findIndex(g => g.id === targetItem.id) + 1;

	try {
		isLoading.value = true;
		await ky.post('games/order', {
			json: {
				id: sourceItem.id,
				newIndex: newIndex,
			},
		}).json();

		await fetchGames();
		snackbarText.value = 'Game moved successfully.';
		snackbar.value = true;
	} catch (error) {
		const message = await error.response?.text() || error.message;
		snackbarText.value = message;
		snackbar.value = true;
	} finally {
		isLoading.value = false;
	}
};

watch(viewMode, (newValue) => {
	localStorage.setItem('games_view_mode', newValue);
});

const selectVideoDialog = ref(null);
const gameForAssignment = ref(null);

const openAssignGameDialog = (game) => {
	gameForAssignment.value = game;
	selectVideoDialog.value.open();
};

const assignGameToVideos = async (videos) => {
	if (!videos || videos.length === 0 || !gameForAssignment.value) return;

	try {
		isLoading.value = true;
		let successCount = 0;
		let failCount = 0;

		for (const video of videos) {
			try {
				await ky.post(`videos/id/${video.id}`, { json: { gameId: gameForAssignment.value.id } }).json();
				successCount++;
			} catch (e) {
				console.error(e);
				failCount++;
			}
		}
		await fetchGames();
		snackbarText.value = failCount > 0
			? `Assigned game to ${successCount} videos. Failed: ${failCount}.`
			: `Successfully assigned game "${gameForAssignment.value.title}" to ${successCount} videos.`;
		snackbar.value = true;
	} catch (error) {
		const message = await error.response?.text() || error.message;
		snackbarText.value = message;
		snackbar.value = true;
	} finally {
		isLoading.value = false;
		gameForAssignment.value = null;
	}
};

const filteredSearchedGames = computed(() => {
	const filtered = [];
	for (const game of searchedGames.value) {
		let isAdded = false;
		if (games.value.some(otherGame => otherGame.id === findTwitchGameID(game))) isAdded = true;
		filtered.push({ ...game, isAdded });
	}
	return filtered;
});

const checkboxBasedSearchedGames = computed(() => {
	return filteredSearchedGames.value.filter(game => !game.isAdded || checkboxShowAdded.value);
});

const findTwitchGameID = igdbGame => {
	return igdbGame.external_games?.find(external => external.category === 14)?.uid;
};

const deleteDialog = ref(false);
const deletingGame = ref(false);
const gameSearch = ref('');
const page = ref(1);

watch(deletingGame, (newValue) => { deleteDialog.value = !!newValue; });

const { name } = useDisplay();

const sortedGames = computed(() => {
	return _.filter(games.value, (game) => {
		if (!gameSearch.value) return true;
		return game.title.toLowerCase().includes(gameSearch.value.toLowerCase());
	});
});

const chunkedGames = computed(() => {
	let chunk = 6;
	switch (name.value) {
	case 'xs': chunk = 4; break;
	case 'sm': chunk = 6; break;
	case 'md': chunk = 8; break;
	case 'lg': chunk = 8; break;
	case 'xl': chunk = 12; break;
	case 'xxl': chunk = 12; break;
	default: chunk = 12; break;
	}
	return _.chunk(sortedGames.value, chunk);
});

watch(chunkedGames, (newValue) => {
	if (page.value >= newValue.length) page.value = Math.max(1, newValue.length);
});

const fetchGames = async () => {
	games.value = await ky.get('games').json();
};

onMounted(fetchGames);

const openCreateGameDialog = () => {
	searchedGames.value = [];
	searchInput.value = '';
	createGameDialog.value = true;
};

const addNewGame = async (igdbGame) => {
	const twitchGameID = findTwitchGameID(igdbGame);
	const isDuplicate = games.value.some((game) => game.title === igdbGame.name || game.id === twitchGameID);

	if (isDuplicate) {
		console.error('Game already exists.');
		return;
	}

	try {
		await ky.put('games', { json: { igdbGameId: `${igdbGame.id}` } }).json();
		await fetchGames();
		if (!addMultipleGames.value) createGameDialog.value = false;
		snackbarText.value = 'Successfully added game.';
		snackbar.value = true;
	} catch (error) {
		const message = await error.response.text();
		snackbarText.value = message;
		snackbar.value = true;
	}
};

const openDeleteDialog = item => { deletingGame.value = item; };

const deleteGame = async (game) => {
	try {
		await ky.post(`games/id/${game.id}/delete`, { json: { force: game.videoCount > 0 } }).json();
		await fetchGames();
		snackbarText.value = 'Successfully deleted game.';
		snackbar.value = true;
		deleteDialog.value = false;
	} catch (error) {
		const message = await error.response.text();
		snackbarText.value = message;
		snackbar.value = true;
	}
};

const searchInput = ref('');
watch(searchInput, (newValue) => { if (newValue) searchForGameOnTwitch(); });

const bigThumbnail = url => url.replace('t_thumb', 't_cover_big');

const searchForGameOnTwitch = _.debounce(async () => {
	searchErrorMessages.value = '';
	const searchTerm = searchInput.value.toLocaleLowerCase();
	try {
		const result = await ky.post('twitch/search-games', { json: { name: searchTerm } }).json();
		if (!result.length) {
			searchErrorMessages.value = 'No games were found with that name';
			return;
		}
		searchedGames.value = result;
	} catch (error) {
		snackbarText.value = await error.response.text();
		snackbar.value = true;
	}
}, 500);
</script>

<style scoped>
.cursor-grab { cursor: grab; }
.cursor-grab:active { cursor: grabbing; }
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