<template>
	<div>
		<video
			id="videoPlayer"
			autoplay
			controls
		/>
	</div>
</template>

<script setup>
import Plyr from 'plyr';
import ky from 'ky';
import { queue, getMPDForVideo } from '@/ky';
import emitter from '@/event-bus';
import { onMounted, ref } from 'vue';
import { MediaPlayer } from 'dashjs';
import { onUnmounted } from 'vue';

import { socket, asyncEmit } from '@/socket';

const hideControls = ref(false);
const dashjsPlayer = ref(false);
const plyrPlayer = ref(false);
const videoBitrates = ref([]);

const currentVideoTime = ref(0);
const currentVideo = ref({});

const plyrShowControls = ref('flex');
const bodyShowScrollbar = ref('none');

addEventListener('keypress', event => {
	if (event.key !== 'k') return;

	hideControls.value = !hideControls.value;

	plyrShowControls.value = hideControls.value ? 'none' : 'flex';
	bodyShowScrollbar.value = hideControls.value ? 'none' : 'auto';

	emitter.$emit('navbar_update', hideControls.value);

	localStorage.setItem('navbar_hidden', hideControls.value);
});

addEventListener('keypress', event => {
	if (event.key !== 'c') return;

	plyrShowControls.value = plyrShowControls.value === 'flex' ? 'none' : 'flex';
});

onMounted(async () => {
	// --- Load localStorage value for controls
	hideControls.value = localStorage.navbar_hidden && JSON.parse(localStorage.navbar_hidden);

	const { progress } = await asyncEmit('request_video_time');
	currentVideoTime.value = progress;

	emitter.$emit('navbar_update', hideControls.value);

	plyrShowControls.value = hideControls.value ? 'none' : 'flex';
	bodyShowScrollbar.value = hideControls.value ? 'none' : 'auto';

	fetchVideo();
	startFreezeCheck();
});

onUnmounted(() => {
	if (plyrPlayer.value) plyrPlayer.value?.destroy();
	if (dashjsPlayer.value) dashjsPlayer.value?.reset();

	if (freezeCheckInterval) clearInterval(freezeCheckInterval);
});

const fetchVideo = async (nextVideo = false) => {
	try {
		const response = await queue(
			nextVideo ? 'next' : 'current',
			{
				method: nextVideo ? 'POST' : 'GET',
			},
		);

		if (response.status !== 200) {
			console.error(response.message);
			setTimeout(() => fetchVideo(), 1000 * 5);
			return;
		}

		currentVideo.value = await response.json();

		playVideo();
	}
	catch (error) {
		const message = await error?.response?.text();

		console.error('Error fetching video:', message || error);
	}
};

socket.on('set_video_time', value => {
	plyrPlayer.value.currentTime = value;
});

socket.on('skip_video', () => {
	fetchVideo(true);
});

socket.on('update_playing_state', isPlaying => {
	if (isPlaying) {
		plyrPlayer.value.play();
	}
	else {
		plyrPlayer.value.pause();
	}
});

socket.on('refresh_video', () => {
	fetchVideo();
});

// Freeze check
let freezeCheckInterval = false;
let freezeCounter = 0;
let retryAttempts = 0;
const startFreezeCheck = () => {
	if (freezeCheckInterval) clearInterval(freezeCheckInterval);

	freezeCheckInterval = setInterval(async () => {
		// TODO: Manual pause check

		// 60 seconds reached
		if (++freezeCounter > 20) {
			if (++retryAttempts > 3) {
				console.error('Video frozen even after 3 retries, skipping...');
				await fetchVideo(true);

				freezeCounter = 0;
				retryAttempts = 0;
			}
			else {
				console.error(`Video frozen for more than 60 seconds, reloading... (${retryAttempts}/3)`);
				await fetchVideo();
			}

			const { progress } = await asyncEmit('request_video_time');
			currentVideoTime.value = progress;
		}
	}, 1000 * 3);
};

const createDashPlayer = () => {
	const videoPlayer = document.getElementById('videoPlayer');

	dashjsPlayer.value = MediaPlayer().create();

	dashjsPlayer.value.on(MediaPlayer.events['PLAYBACK_ENDED'], () => {
		fetchVideo(true);

		retryAttempts = 0;
	});

	dashjsPlayer.value.on(MediaPlayer.events['PLAYBACK_TIME_UPDATED'], (e) => {
		socket.emit('playback_update', {
			time: e.time,
			timeToEnd: e.timeToEnd,
			length: Math.round(e.time) + Math.round(e.timeToEnd),
			isPlaying: plyrPlayer.value.playing,
		});

		// Reset freeze counter
		freezeCounter = 0;
	});

	dashjsPlayer.value.on(MediaPlayer.events['PLAYBACK_PLAYING'], () => {
		socket.emit('update_playing_state', true);
	});

	dashjsPlayer.value.on(MediaPlayer.events['PLAYBACK_PAUSED'], () => {
		socket.emit('update_playing_state', false);
	});

	dashjsPlayer.value.on(MediaPlayer.events['PLAYBACK_ERROR'], (e) => {
		console.error('PLAYBACK_ERROR');
		console.error(JSON.stringify(e));
	});

	dashjsPlayer.value.on(MediaPlayer.events['ERROR'], (e) => {
		console.error('GENERIC_ERROR');
		console.error(JSON.stringify(e));
	});

	dashjsPlayer.value.on('streamInitialized', () => {
		videoBitrates.value = [];
		const bitrateInfo = dashjsPlayer.value.getBitrateInfoListFor('video');

		for (const info of bitrateInfo) {
			if (info.height > 1440) continue;

			videoBitrates.value.push(info.height);
		}

		const defaultOptions = {
			controls: [
				'play',
				'progress',
				'current-time',
				'mute',
				'volume',
				'fullscreen',
			],
			keyboard: {
				focused: false,
				global: false,
			},
		};

		if (!plyrPlayer.value) {
			plyrPlayer.value = new Plyr(videoPlayer, defaultOptions);
		}

		if (currentVideoTime.value) {
			plyrPlayer.value.currentTime = currentVideoTime.value;
			currentVideoTime.value = 0;
		}
	});
};

const playVideo = async () => {
	try {
		const player = document.getElementById('videoPlayer');

		// Fetch it once, see if we error
		await ky.get(getMPDForVideo(currentVideo.value));

		if (!dashjsPlayer.value) {
			createDashPlayer();
		}

		dashjsPlayer.value.initialize(player, getMPDForVideo(currentVideo.value), true);
	} catch (error) {
		const response = await error?.response?.json();
		console.error('Error trying to play video:', response || error);

		if (response?.message === 'NO_VIDEO_OR_AUDIO') {
			fetchVideo(true);
		}
	}
};
</script>

<style>
@import 'https://cdn.plyr.io/3.7.8/plyr.css';

.plyr__controls {
	display: v-bind(plyrShowControls);
}

html, body {
	overflow-y: v-bind(bodyShowScrollbar);
}
</style>

<style scoped>
#videoPlayer {
    width: 100vw;
    height: 100vh;
	object-fit: contain;
}
</style>
