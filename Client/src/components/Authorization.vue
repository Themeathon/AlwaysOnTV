<template>
	<v-container
		class="h-100 d-flex flex-column"
		align="center"
		justify-content="center"
	>
		<v-row
			align="center"
			justify="center"
		>
			<v-card width="800px">
				<v-card-title class="text-h3 py-4">
					Authorization
				</v-card-title>

				<v-card-subtitle>
					Please authenticate with this app.
				</v-card-subtitle>

				<v-card-text>
					<v-text-field
						ref="passwordField"
						v-model="password"
						:rules="[
							() => validPassword
						]"
						required
						label="Password"
						variant="solo-filled"
					/>
				</v-card-text>

				<v-card-actions>
					<v-spacer />

					<v-btn
						:disabled="!password"
						:loading="isLoading"
						@click="updatePasswordAndAuth"
					>
						Authorize
					</v-btn>
				</v-card-actions>
			</v-card>
		</v-row>
	</v-container>
</template>

<script setup>
import { auth, isLoading } from '@/ky';
import { useCookies } from 'vue3-cookies';
import { onMounted, ref, watch } from 'vue';

const emit = defineEmits(['authenticate']);

const { cookies } = useCookies();

const passwordField = ref(null);
const password = ref('');

const validPassword = ref(true);

watch(password, () => {
	validPassword.value = true;
});

const updatePasswordAndAuth = () => {
	cookies.set('password', password.value, '1y');

	tryAuth();
};

const tryAuth = async () => {
	try {
		const { authenticated } = await auth.post('').json();

		if (authenticated) {
			cookies.set('password', cookies.get('password'), '1y');

			emit('authenticate');
		}
	}
	catch (error) {
		const message = error.response.text();

		validPassword.value = message;

		await passwordField.value.validate();
	}
};

onMounted(async () => {
	password.value = cookies.get('password');
	if (!password.value) return;

	await tryAuth();
});
</script>