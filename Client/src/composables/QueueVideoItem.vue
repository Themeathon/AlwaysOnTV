<template>
	<v-list-item
		class="draggable-item py-2 mb-1 rounded"
		link
		:class="{
			'drag-source': isDragSource,
			'drag-target': isDragTarget
		}"
		:draggable="!compact"
		@dragstart="onDragStart"
		@dragenter.prevent="onDragEnter"
		@dragover.prevent
		@dragend="onDragEnd"
		@drop="onDrop"
	>
		<v-list-item-title
			class="text-wrap"
			:class="{ 'title-clamp': compact }"
		>
			{{ item.title }}
		</v-list-item-title>

		<v-list-item-subtitle v-if="compact">
			{{ item.game?.title || item.gameId }} · {{ formatVideoLength(item.length) }}
		</v-list-item-subtitle>

		<template v-else>
			<v-list-item-subtitle>
				<strong>Game:</strong> {{ item.game?.title || item.gameId }}
			</v-list-item-subtitle>

			<v-list-item-subtitle>
				<strong>Length:</strong> {{ formatVideoLength(item.length) }}
			</v-list-item-subtitle>
		</template>

		<template #prepend>
			<v-icon
				v-if="!compact"
				class="mr-4 cursor-grab"
				color="grey-darken-1"
			>
				mdi-drag-horizontal-variant
			</v-icon>

			<span
				class="text-center font-weight-bold"
				:class="compact ? 'mr-2' : 'mr-5'"
				style="min-width: 20px;"
			>
				{{ index + 1 }}
			</span>

			<v-btn
				v-if="!compact"
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
				:width="compact ? 72 : 125"
				cover
				class="rounded"
				:class="compact ? 'mr-3' : 'mr-5'"
			/>

			<v-btn
				v-if="!compact"
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

		<template
			v-if="compact"
			#append
		>
			<v-menu location="bottom end">
				<template #activator="{ props: menuProps }">
					<v-btn
						v-bind="menuProps"
						icon="mdi-dots-vertical"
						size="small"
						variant="text"
						:loading="isLoading"
					/>
				</template>

				<v-list density="compact">
					<v-list-item
						prepend-icon="mdi-file-edit"
						title="Edit Position"
						@click="openEditPos(index)"
					/>
					<v-list-item
						prepend-icon="mdi-arrow-collapse-up"
						title="Move To Top"
						@click="editPosStart(index)"
					/>
					<v-list-item
						prepend-icon="mdi-arrow-collapse-down"
						title="Move To Bottom"
						@click="editPosEnd(index)"
					/>
					<v-list-item
						prepend-icon="mdi-youtube"
						title="Watch On YouTube"
						:href="'https://youtu.be/' + item.id"
						target="_blank"
					/>
					<v-list-item
						prepend-icon="mdi-trash-can"
						title="Delete From Queue"
						base-color="red"
						@click="deleteFromQueue(index)"
					/>
				</v-list>
			</v-menu>
		</template>

		<template
			v-else
			#append
		>
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
import { useDisplay } from 'vuetify';

const props = defineProps(['item', 'index', 'isLoading', 'isDragSource', 'isDragTarget']);

const { xs: compact } = useDisplay();

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
.title-clamp {
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
	overflow: hidden;
}

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