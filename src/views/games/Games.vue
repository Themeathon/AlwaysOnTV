<template>
	<v-row
		justify="center"
		class="pa-8"
	>
		<v-btn
			color="primary"
			variant="outlined"
			prepend-icon="mdi-plus"
			@click="openCreateGameDialog"
		>
			Add game
		</v-btn>
	</v-row>

	<v-divider :thickness="3" />

	<v-container>
		<v-row justify="center">
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
					:length="chunkedGames.length"
				/>
			</v-col>
		</v-row>
	</v-container>

	<v-container>
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
							<v-card-title>
								<span :title="item.title">{{ item.title }}</span>
							</v-card-title>
							<v-card-subtitle>
								<strong>Twitch ID:</strong> {{ item.id }}
							</v-card-subtitle>
							<v-card-subtitle>
								<strong>Total Videos:</strong> {{ item.videoCount }}
							</v-card-subtitle>
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
														<v-icon />
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

	<!-- Create Game -->
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
						label="Search"
						append-inner-icon="mdi-magnify"
						placeholder="Just Chatting"
						required
						variant="solo-filled"
						hide-details="auto"
					/>
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
						v-model="checkboxShowAdded"
						label="Show added"
						hide-details
					/>
					<span v-if="filteredSearchedGames.length">
						Found {{ filteredSearchedGames.length }} games ({{ filteredSearchedGames.filter(g => g.isAdded).length }} already added)
					</span>
					<span v-else>
						No games were found with that name
					</span>
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

	<!-- Delete Game -->
	<v-dialog
		v-model="deleteDialog"
		width="auto"
	>
		<v-card>
			<v-card-title>
				Deleting {{ deletingGame.title }}
			</v-card-title>
			<v-card-text>
				Do you really want to delete {{ deletingGame.title }}?
			</v-card-text>
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
import ky, { isLoading } from '@/ky';
import _ from 'lodash';
import { onMounted, ref, watch, computed } from 'vue';
import { useDisplay } from 'vuetify';

import placeholderImage from '@/assets/placeholder-500x700.jpg';

const createGameDialog = ref(false);
const games = ref([]);
const searchedGames = ref([]);
const searchErrorMessages = ref('');
const checkboxShowAdded = ref(false);

const filteredSearchedGames = computed(() => {
	const filtered = [];

	for (const game of searchedGames.value) {
		let isAdded = false;

		if (games.value.some(otherGame => otherGame.id === findTwitchGameID(game)))
			isAdded = true;

		filtered.push({
			...game,
			isAdded,
		});
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

watch(deletingGame, (newValue) => {
	deleteDialog.value = !!newValue;
});

const snackbar = ref(false);
const snackbarText = ref('');

const { name } = useDisplay();
const chunkedGames = computed(() => {
	let chunk = 6; // Default for lg+

	switch (name.value) {
	case 'xs':
		chunk = 4;
		break;
	case 'sm':
		chunk = 6;
		break;
	case 'md':
		chunk = 8;
		break;
	case 'lg':
		chunk = 8;
		break;
	case 'xl':
		chunk = 12;
		break;
	case 'xxl':
		chunk = 12;
		break;
	default:
		chunk = 12;
		break;
	}

	const filtered = _.filter(games.value, (game) => {
		if (!gameSearch.value) return true;

		return game.title.toLowerCase().includes(gameSearch.value.toLowerCase());
	});

	return _.chunk(filtered, chunk);
});

watch(chunkedGames, (newValue) => {
	if (page.value >= newValue.length)
		page.value = Math.max(1, newValue.length);
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

	// Check if the game already exists in the list
	const isDuplicate = games.value.some(
		(game) => game.title === igdbGame.name || game.id === twitchGameID,
	);

	if (isDuplicate) {
		console.error('Game already exists.');
		return;
	}

	try {
		await ky
			.put('games', {
				json: {
					igdbGameId: `${igdbGame.id}`,
				},
			})
			.json();

		await fetchGames();

		createGameDialog.value = false;

		snackbar.value = true;
		snackbarText.value = 'Successfully added game.';
	}
	catch (error) {
		const message = await error.response.text();

		snackbar.value = true;
		snackbarText.value = message;
	}
};

const openDeleteDialog = item => {
	deletingGame.value = item;
};

const deleteGame = async (game) => {
	try {
		await ky.post(`games/id/${game.id}/delete`, {
			json: {
				force: game.videoCount > 0,
			},
		}).json();

		await fetchGames();

		snackbar.value = true;
		snackbarText.value = 'Successfully deleted game.';

		deleteDialog.value = false;
	}
	catch (error) {
		const message = await error.response.text();

		snackbar.value = true;
		snackbarText.value = message;
	}
};

const searchInput = ref('');

watch(searchInput, (newValue) => {
	if (newValue === '') return;

	searchForGameOnTwitch();
});

const bigThumbnail = url => {
	return url.replace('t_thumb', 't_cover_big');
};

const searchForGameOnTwitch = _.debounce(async () => {
	searchErrorMessages.value = '';

	const searchTerm = searchInput.value.toLocaleLowerCase();

	try {

		const games = await ky
			.post('twitch/search-games', {
				json: {
					name: searchTerm,
				},
			})
			.json();

		if (!games.length) {
			searchErrorMessages.value = 'No games were found with that name';
			return;
		}

		searchedGames.value = games;
	} catch (error) {
		const message = await error.response.text();

		snackbar.value = true;
		snackbarText.value = message;
	}
}, 500);
</script>
