// Composables
import { createRouter, createWebHistory } from 'vue-router';

const routes = [
	{
		path: '/',
		name: 'dashboard',
		meta: {
			title: 'Dashboard',
		},
		// route level code-splitting
		// this generates a separate chunk (about.[hash].js) for this route
		// which is lazy-loaded when the route is visited.
		component: () => import(/* webpackChunkName: "dashboard" */ '@/views/Dashboard.vue'),
	},
	{
		path: '/video',
		name: 'video-player',
		meta: {
			title: 'Video Player',
		},
		component: () =>
			import(/* webpackChunkName: "video-player" */ '@/views/VideoPlayer.vue'),
	},
	{
		path: '/settings',
		name: 'settings',
		meta: {
			title: 'Settings',
		},
		component: () =>
			import(/* webpackChunkName: "settings" */ '@/views/Settings.vue'),
	},
	{
		path: '/games',
		name: 'games',
		meta: {
			title: 'Games',
		},
		component: () =>
			import(/* webpackChunkName: "games" */ '@/views/games/Games.vue'),
	},
	{
		path: '/videos',
		name: 'videos',
		meta: {
			title: 'Videos',
		},
		component: () =>
			import(/* webpackChunkName: "videos" */ '@/views/videos/Videos.vue'),
	},
	{
		path: '/playlists',
		name: 'playlists',
		meta: {
			title: 'Playlists',
		},
		component: () =>
			import(/* webpackChunkName: "playlists" */ '@/views/playlists/Playlists.vue'),
	},
	{
		path: '/playlists/:id',
		name: 'playlist-view',
		meta: {
			title: 'Playlists',
		},
		component: () =>
			import(/* webpackChunkName: "playlist-view" */ '@/views/playlists/PlaylistView.vue'),
	},
	{
		path: '/playlists/random',
		name: 'random-playlist-view',
		meta: {
			title: 'Random Playlist',
		},
		component: () =>
			import(/* webpackChunkName: "random-playlist-view" */ '@/views/playlists/RandomPlaylistView.vue'),
	},
];

const router = createRouter({
	history: createWebHistory(process.env.BASE_URL),
	routes,
});

export default router;
