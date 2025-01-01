<template>
	<v-dialog
		v-model="dialog"
		max-width="500"
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
				<v-toolbar-title>Queue Random Videos</v-toolbar-title>
			</v-toolbar>

			<v-card-text class="pb-0">
				<v-text-field
					v-model.number="amount"
					:rules="[
						value => value >= 1 || 'Minimum value: 1',
						value => value <= 10 || 'Maximum value: 10'
					]"
					label="Amount"
					variant="solo-filled"
					hide-details="auto"
				/>
			</v-card-text>

			<v-card-actions>
				<v-spacer />

				<v-btn
					color="red"
					@click="dialog = false"
				>
					Close
				</v-btn>

				<v-btn
					color="green"
					:disabled="!isValidAmount"
					@click="addRandomVideos"
				>
					Add
				</v-btn>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>

<script setup>
import { ref, computed } from 'vue';

const dialog = ref(false);

const amount = ref(1);

const isValidAmount = computed(() => {
	return amount.value >= 1 && amount.value <= 10;
});

const open = async () => {
	amount.value = 1;

	dialog.value = true;
};

const emit = defineEmits(['addRandomVideos']);

const addRandomVideos = () => {
	emit('addRandomVideos', amount.value);

	dialog.value = false;
};

defineExpose({
	open,
});
</script>