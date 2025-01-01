<template>
	<v-app id="application">
		<Authorization
			v-if="!isAuthenticated"
			@authenticate="isAuthenticated = true"
		/>
		<template v-else>
			<Navbar />
			<v-main>
				<router-view />
			</v-main>
			<Footer v-if="route.name !== 'video-player'" />
		</template>
	</v-app>
</template>

<script setup>
import { useRoute } from 'vue-router';
import { ref } from 'vue';
import emitter from '@/event-bus';

import Authorization from '@/components/Authorization.vue';
import Navbar from '@/components/Navbar.vue';
import Footer from '@/components/Footer.vue';

const route = useRoute();

const isAuthenticated = ref(false);
const backgroundColor = ref('rgb(var(--v-theme-background))');

emitter.$on('navbar_update', isHidden => {
	backgroundColor.value = isHidden ? 'transparent' : 'rgb(var(--v-theme-background))';
});
</script>

<style>
#application {
	background: v-bind(backgroundColor);
}
</style>
