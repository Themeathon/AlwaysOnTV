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
				<v-toolbar-title>Select Playlist</v-toolbar-title>
			</v-toolbar>

			<v-card-text>
				<v-text-field
					v-model="search"
					append-inner-icon="mdi-magnify"
					label="Search Playlist"
					variant="solo-filled"
					hide-details
					autofocus
				/>
			</v-card-text>

			<v-divider thickness="3" />

			<v-progress-linear
				:indeterminate="loading"
				color="blue"
			/>

			<v-card-text
				style="position: relative; height:100%;"
			>
				<v-virtual-scroll
					style="position: absolute; left: 0; right: 0; top: 0; bottom: 0;"
					:items="filteredPlaylists"
					item-height="100"
				>
					<template #default="{ item }">
						<v-list-item
							v-if="item.id === 'create-new'"
							class="py-2"
							@click="openCreateDialog"
						>
							<template #prepend>
								<v-avatar
									color="green-darken-1"
									rounded="0"
									class="mr-4"
									size="125"
								>
									<v-icon size="large">
										mdi-plus
									</v-icon>
								</v-avatar>
							</template>

							<v-list-item-title class="text-h5 font-weight-bold text-green">
								Create New Playlist...
							</v-list-item-title>

							<v-list-item-subtitle>
								Click here to create a new playlist and select it immediately.
							</v-list-item-subtitle>
						</v-list-item>

						<v-list-item
							v-else
							class="py-2"
							@click="selectPlaylist(item)"
						>
							<v-list-item-title class="text-h5 font-weight-bold">
								{{ item.title }}
							</v-list-item-title>

							<v-list-item-subtitle class="text-h6 font-weight-regular">
								<p>
									<strong>Total Videos:</strong> {{ item.videoCount }}
								</p>

								<p>
									<strong>Estimated Length:</strong> {{ getPlaylistLengthFormatted(item.playlistLength) }}
								</p>
							</v-list-item-subtitle>

							<template #prepend>
								<v-img
									:src="item.thumbnail_url"
									:lazy-src="placeholderImage"
									cover
									:aspect-ratio="16 / 9"
									width="125"
									class="mr-4"
								/>
							</template>
						</v-list-item>
					</template>
				</v-virtual-scroll>
			</v-card-text>
		</v-card>
	</v-dialog>

	<v-dialog
		v-model="createDialog"
		max-width="500"
	>
		<v-card>
			<v-card-title>Create New Playlist</v-card-title>
			<v-card-text>
				<v-text-field
					v-model="newPlaylistName"
					label="Playlist Name"
					variant="solo-filled"
					hide-details
					autofocus
					@keyup.enter="createPlaylist"
				/>
			</v-card-text>
			<v-card-actions>
				<v-spacer />
				<v-btn
					color="red"
					variant="text"
					@click="createDialog = false"
				>
					Cancel
				</v-btn>
				<v-btn
					color="green"
					variant="text"
					:loading="isCreating"
					:disabled="!newPlaylistName"
					@click="createPlaylist"
				>
					Create & Select
				</v-btn>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>

<script setup>
import ky from '@/ky';
import { ref, computed } from 'vue';

import placeholderImage from '@/assets/placeholder-500x700.jpg';
import { Duration } from 'luxon';

const loading = ref(false);
const dialog = ref(false);
const search = ref(null);
const playlists = ref([]);

const createDialog = ref(false);
const newPlaylistName = ref('');
const isCreating = ref(false);

const openCreateDialog = () => {
	newPlaylistName.value = search.value || '';
	createDialog.value = true;
};

const createPlaylist = async () => {
	if (!newPlaylistName.value) return;

	try {
		isCreating.value = true;

		const response = await ky.put('playlists', {
			json: {
				title: newPlaylistName.value,
			},
		}).json();

		const createdPlaylist = response;

		createDialog.value = false;

		selectPlaylist(createdPlaylist);

	} catch (error) {
		console.error(error);
		alert('Failed to create playlist: ' + (await error.response?.text() || error.message));
	} finally {
		isCreating.value = false;
	}
};

const open = async () => {
	dialog.value = true;
	fetchPlaylists();
};

const fetchPlaylists = async () => {
	loading.value = true;
	playlists.value = await ky.get('playlists').json();
	loading.value = false;
};

const getPlaylistLengthFormatted = length => {
	const progress = Duration.fromObject({ seconds: length });
	return progress.toFormat('hh:mm:ss');
};

const filteredPlaylists = computed(() => {
	const filtered = playlists.value.filter(playlist => {
		if (!search.value) return true;
		return playlist.title.toLowerCase().includes(search.value.toLowerCase());
	});

	filtered.unshift({
		id: 'create-new',
		title: 'Create New Playlist...',
		videoCount: 0,
		playlistLength: 0,
		thumbnail_url: null,
	});

	return filtered;
});

const emit = defineEmits(['selectPlaylist']);

const selectPlaylist = playlist => {
	emit('selectPlaylist', playlist);
	dialog.value = false;
};

defineExpose({
	open,
});
</script>