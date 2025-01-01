<template>
	<v-dialog
		v-model="dialog"
		fullscreen
	>
		<v-card>
			<v-toolbar
				dark
				density="compact"
			>
				<v-btn
					icon
					dark
					@click="dialog = false"
				>
					<v-icon>mdi-close</v-icon>
				</v-btn>
				<v-toolbar-title>Select Game</v-toolbar-title>
			</v-toolbar>

			<v-card-text>
				<v-text-field
					v-model="search"
					append-inner-icon="mdi-magnify"
					label="Game Name"
					variant="solo-filled"
					:disabled="isLoading"
					:loading="isLoading"
					hide-details
				/>
			</v-card-text>

			<v-card-text
				style="position: relative; height:100%;"
			>
				<v-virtual-scroll
					style="position: absolute; left: 0; right: 0; top: 0; bottom: 0;"
					:items="filteredGames"
					item-height="150"
				>
					<template #default="{ item }">
						<v-list-item
							v-if="item.id === 'add-game'"
							class="py-2"
							@click="openCreateGameDialog"
						>
							<v-list-item-title class="text-h5 font-weight-bold">
								{{ item.title }}
							</v-list-item-title>

							<template #prepend>
								<v-img
									:src="item.thumbnail_url"
									:lazy-src="placeholderImage"
									cover
									:aspect-ratio="3 / 4"
									width="100"
									class="mr-4"
								/>
							</template>
						</v-list-item>
						<v-list-item
							v-else
							class="py-2"
							@click="selectGame(item)"
						>
							<v-list-item-title class="text-h5 font-weight-bold">
								{{ item.title }}
							</v-list-item-title>

							<template #prepend>
								<v-img
									:src="item.thumbnail_url"
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
		</v-card>
	</v-dialog>

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
					:items="filteredSearchedGames"
					item-height="150"
				>
					<template #default="{ item }">
						<v-list-item
							class="py-2"
							:disabled="isLoading"
							@click="addNewGame(item)"
						>
							<v-list-item-title class="text-h5 font-weight-bold">
								{{ item.name }}
							</v-list-item-title>

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
				<span>Found {{ filteredSearchedGames.length }} games</span>
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
import { ref, computed, watch } from 'vue';

import placeholderImage from '@/assets/placeholder-500x700.jpg';

const searchErrorMessages = ref('');

const dialog = ref(false);
const search = ref(null);
const games = ref([]);

const open = async () => {
	dialog.value = true;

	games.value = await ky.get('games').json();
};

const filteredGames = computed(() => {
	const filteredGames = games.value.filter(game => {
		if (!search.value) return true;

		return game.title.toLowerCase().includes(search.value.toLowerCase());
	});

	filteredGames.unshift({
		id: 'add-game',
		title: 'Add New Game...',
	});

	return filteredGames;
});

const emit = defineEmits(['selectGame']);

const snackbar = ref(false);
const snackbarText = ref('');

const searchInput = ref('');
const searchedGames = ref([]);
const createGameDialog = ref(false);

const filteredSearchedGames = computed(() => {
	const filtered = [];

	for (const game of searchedGames.value) {
		if (games.value.some(otherGame => otherGame.id === findTwitchGameID(game)))
			continue;

		filtered.push(game);
	}

	return filtered;
});

const openCreateGameDialog = () => {
	searchInput.value = '';
	searchErrorMessages.value = '';
	searchedGames.value = [];
	createGameDialog.value = true;
};

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
			searchErrorMessages.value = 'No games were found with that name.';
			return;
		}

		searchedGames.value = games;
	} catch (error) {
		const message = await error.response.text();

		snackbar.value = true;
		snackbarText.value = message;
	}
}, 500);

const findTwitchGameID = igdbGame => {
	return igdbGame.external_games?.find(external => external.category === 14)?.uid;
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

		games.value = await ky.get('games').json();

		const addedGame = games.value.find(game => game.id === twitchGameID);

		createGameDialog.value = false;

		snackbar.value = true;
		snackbarText.value = 'Successfully added game.';

		selectGame(addedGame);
	}
	catch (error) {
		const message = await error.response.text();

		snackbar.value = true;
		snackbarText.value = message;
	}
};

const selectGame = game => {
	emit('selectGame', game);

	dialog.value = false;
};

defineExpose({
	open,
});
</script>