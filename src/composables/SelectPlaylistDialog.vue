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
					label="Playlist Name"
					variant="solo-filled"
					hide-details
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
					:items="filteredGames"
					item-height="100"
				>
					<template #default="{ item }">
						<v-list-item
							class="py-2"
							@click="selectPlaylist(item)"
						>
							<v-list-item-title class="text-h5 font-weight-bold">
								{{ item.title }}
							</v-list-item-title>

							<!-- <v-list-item-subtitle class="text-h6 font-weight-regular">
								<strong>Videos:</strong> {{ item.videoCount }}
							</v-list-item-subtitle>

							<v-list-item-subtitle class="text-h6 font-weight-regular">
								<strong>Videos:</strong> {{ item.videoCount }}
							</v-list-item-subtitle> -->

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

const open = async () => {
	dialog.value = true;

	loading.value = true;

	playlists.value = await ky.get('playlists').json();

	loading.value = false;
};

const getPlaylistLengthFormatted = length => {
	const progress = Duration.fromObject({ seconds: length });

	return progress.toFormat('hh:mm:ss');
};

const filteredGames = computed(() => {
	return playlists.value.filter(playlist => {
		if (!search.value) return true;

		return playlist.title.toLowerCase().includes(search.value.toLowerCase());
	});
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