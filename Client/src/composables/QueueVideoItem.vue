<template>
	<v-list-item
		class="py-2"
	>
		<v-list-item-title>
			{{ item.title }}
		</v-list-item-title>

		<v-list-item-subtitle>
			<strong>Game:</strong> {{ item.game?.title || item.gameId }}
		</v-list-item-subtitle>

		<v-list-item-subtitle>
			<strong>Length:</strong> {{ formatVideoLength(item.length) }}
		</v-list-item-subtitle>

		<template #prepend>
			<span class="mr-5 text-center">
				{{ index + 1 }}
			</span>

			<v-btn
				icon="mdi-file-edit"
				size="x-small"
				variant="tonal"
				class="mr-5"
				@click="openEditPos(index)"
			>
				<v-tooltip
					activator="parent"
					location="top"
					:eager="false"
				>
					Edit Position
				</v-tooltip>
				<v-icon />
			</v-btn>

			<v-img
				:src="item.thumbnail_url"
				:lazy-src="placeholderImage"
				:aspect-ratio="16/9"
				width="125"
				cover
				class="mr-5"
			/>

			<v-btn
				v-bind="props"
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
					Watch On YouTube
				</v-tooltip>
				<v-icon />
			</v-btn>
		</template>

		<template #append>
			<v-btn
				icon="mdi-trash-can"
				size="x-small"
				color="red"
				variant="tonal"
				class="mr-1"
				:loading="isLoading"
				@click="deleteFromQueue(index)"
			>
				<v-tooltip
					activator="parent"
					location="top"
					:eager="false"
				>
					Delete From Queue
				</v-tooltip>
				<v-icon />
			</v-btn>

			<v-btn
				icon="mdi-arrow-collapse-up"
				size="x-small"
				variant="tonal"
				class="mr-1"
				:loading="isLoading"
				@click="editPosStart(index)"
			>
				<v-tooltip
					activator="parent"
					location="top"
					:eager="false"
				>
					Move To Top
				</v-tooltip>
				<v-icon />
			</v-btn>

			<v-btn
				icon="mdi-arrow-collapse-down"
				size="x-small"
				variant="tonal"
				class="mr-1"
				:loading="isLoading"
				@click="editPosEnd(index)"
			>
				<v-tooltip
					activator="parent"
					location="top"
					:eager="false"
				>
					Move To Bottom
				</v-tooltip>
				<v-icon />
			</v-btn>
		</template>
	</v-list-item>
</template>

<script setup>
import placeholderImage from '@/assets/placeholder-500x700.jpg';
import { Duration } from 'luxon';

const props = defineProps(['item', 'index', 'isLoading']);

const emit = defineEmits(['openEditPos', 'deleteFromQueue', 'editPosStart', 'editPosEnd']);

const openEditPos = index => {
	emit('openEditPos', index);
};

const deleteFromQueue = index => {
	emit('deleteFromQueue', index);
};

const editPosStart = index => {
	emit('editPosStart', index);
};

const editPosEnd = index => {
	emit('editPosEnd', index);
};

const formatVideoLength = length => {
	const progress = Duration.fromObject({ seconds: length });

	return progress.toFormat('hh:mm:ss');
};
</script>