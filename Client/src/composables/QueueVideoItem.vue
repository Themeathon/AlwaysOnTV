<template>
	<v-list-item
		class="draggable-item py-2 mb-1 rounded"
		:class="{
			'drag-source': isDragSource,
			'drag-target': isDragTarget
		}"
		draggable="true"
		@dragstart="onDragStart"
		@dragenter.prevent="onDragEnter"
		@dragover.prevent
		@dragend="onDragEnd"
		@drop="onDrop"
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
			<v-icon
				class="mr-4 cursor-grab"
				color="grey-darken-1"
			>
				mdi-drag-horizontal-variant
			</v-icon>

			<span class="mr-5 text-center font-weight-bold" style="min-width: 20px;">
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
				class="mr-5 rounded"
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

const props = defineProps(['item', 'index', 'isLoading', 'isDragSource', 'isDragTarget']);

const emit = defineEmits([
	'openEditPos', 'deleteFromQueue', 'editPosStart', 'editPosEnd',
	'drag-start', 'drag-enter', 'drag-end', 'drop',
]);

const onDragStart = (event) => {
	event.dataTransfer.effectAllowed = 'move';
	emit('drag-start', event, props.item, props.index);
};

const onDragEnter = () => {
	emit('drag-enter', props.item, props.index);
};

const onDragEnd = () => {
	emit('drag-end');
};

const onDrop = (event) => {
	emit('drop', event, props.item, props.index);
};

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