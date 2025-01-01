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
				<v-toolbar-title>Select Video</v-toolbar-title>
			</v-toolbar>

			<v-card-text>
				<v-row>
					<v-col>
						<v-text-field
							v-model="search"
							append-inner-icon="mdi-magnify"
							label="Video Name"
							variant="solo-filled"
							hide-details
						/>
					</v-col>

					<v-col cols="2">
						<v-select
							v-model="filter"
							label="Filter"
							append-inner-icon="mdi-filter-menu"
							variant="solo-filled"
							:items="['Title', 'Game']"
							multiple
							hide-details
						/>
					</v-col>
				</v-row>
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
					:items="filteredVideos"
					item-height="100"
				>
					<template #default="{ item }">
						<v-list-item
							class="py-2"
							@click="selectVideo(item)"
						>
							<v-list-item-title class="text-h5 font-weight-bold">
								{{ item.title }}
							</v-list-item-title>

							<v-list-item-subtitle class="text-h6 font-weight-regular">
								<strong>Game:</strong> {{ item.gameTitle }}
							</v-list-item-subtitle>

							<v-list-item-subtitle class="text-h6 font-weight-regular">
								<strong>Video Length:</strong> {{ formatVideoLength(item.length) }}
							</v-list-item-subtitle>

							<template #prepend>
								<v-img
									:src="item.thumbnail_url"
									:lazy-src="placeholderImage"
									cover
									:aspect-ratio="16 / 9"
									height="100"
									style="aspect-ratio: 16 / 9;"
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
const videos = ref([]);

const filter = ref(['Title']);

const formatVideoLength = length => {
	const progress = Duration.fromObject({ seconds: length });

	return progress.toFormat('hh:mm:ss');
};

const open = async () => {
	dialog.value = true;

	loading.value = true;

	videos.value = await ky.get('videos').json();

	loading.value = false;
};

const filteredVideos = computed(() => {
	return videos.value.filter(video => {
		if (!search.value) return true;

		const searchLower = search.value.toLowerCase();
		if (filter.value.includes('Title') && video.title.toLowerCase().includes(searchLower)) return true;
		if (filter.value.includes('Game') && video.gameTitle.toLowerCase().includes(searchLower)) return true;

		return false;
	});
});

const emit = defineEmits(['selectVideo']);

const selectVideo = game => {
	emit('selectVideo', game);

	dialog.value = false;
};

defineExpose({
	open,
});
</script>