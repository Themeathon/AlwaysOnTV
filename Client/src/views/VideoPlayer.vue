<template>
	<div>
		<video
			id="videoPlayer"
			autoplay
			controls
			muted
		/>
	</div>
</template>

<script setup>
import Plyr from 'plyr';
import ky, { queue, API_URL } from '@/ky';
import emitter from '@/event-bus';
import { onMounted, ref, onUnmounted, watch } from 'vue';
import { MediaPlayer } from 'dashjs';
import { socket, asyncEmit } from '@/socket';

const dashjsPlayer = ref(null);
const plyrPlayer = ref(null);
const currentVideo = ref({});
const currentVideoTime = ref(0);
const videoLoading = ref(true);
const isPlayingLocal = ref(false);
const lengthUpdateSent = ref(false);

const hideControls = ref(false);
const plyrShowControls = ref('flex');
const bodyShowScrollbar = ref('auto');

let freezeCheckInterval = null;
let freezeCounter = 0;
let retryAttempts = 0;

watch(currentVideo, (newVideo, oldVideo) => {
	if (newVideo?.id !== oldVideo?.id) {
		// console.log(`Video changed from ${oldVideo?.id} to ${newVideo?.id}. Resetting lengthUpdateSent.`);
		lengthUpdateSent.value = false;
	}
});

const handleKeyPress = (event) => {
	if (event.key === 'k') {
		hideControls.value = !hideControls.value;
		plyrShowControls.value = hideControls.value ? 'none' : 'flex';
		bodyShowScrollbar.value = hideControls.value ? 'hidden' : 'auto';
		emitter.$emit('navbar_update', hideControls.value);
		localStorage.setItem('navbar_hidden', JSON.stringify(hideControls.value));
	}
	if (event.key === 'c') {
		plyrShowControls.value = plyrShowControls.value === 'flex' ? 'none' : 'flex';
	}
};

onMounted(async () => {
	const storedHidden = localStorage.getItem('navbar_hidden');
	hideControls.value = storedHidden ? JSON.parse(storedHidden) : false;
	plyrShowControls.value = hideControls.value ? 'none' : 'flex';
	bodyShowScrollbar.value = hideControls.value ? 'hidden' : 'auto';
	emitter.$emit('navbar_update', hideControls.value);

	try {
		const { progress } = await asyncEmit('request_video_time');
		currentVideoTime.value = progress || 0;
		// console.log('Initial video time from server:', currentVideoTime.value);
	} catch (e) {
		// console.warn('Could not get initial video time from server.');
		currentVideoTime.value = 0;
	}

	window.addEventListener('keypress', handleKeyPress);

	await fetchVideo();
	startFreezeCheck();
});

onUnmounted(() => {
	destroyPlayers();
	if (freezeCheckInterval) clearInterval(freezeCheckInterval);
	window.removeEventListener('keypress', handleKeyPress);
});

const destroyPlayers = () => {
	// console.log('Destroying players...');
	if (plyrPlayer.value) {
		try {
			plyrPlayer.value.destroy();
			// console.log('Plyr instance destroyed.');
		} catch (e) { // console.warn('Error destroying Plyr:', e);
		}
		plyrPlayer.value = null;
	}
	if (dashjsPlayer.value) {
		dashjsPlayer.value.reset();
		// console.log('Dash.js instance reset.');
		dashjsPlayer.value = null;
	}
	const videoElement = document.getElementById('videoPlayer');
	if (videoElement) {
		videoElement.pause();
		videoElement.removeAttribute('src');
		videoElement.load();
		// console.log('Video element source cleared and loaded.');
	}
	isPlayingLocal.value = false;
	videoLoading.value = true;
	lengthUpdateSent.value = false;
};

const fetchVideo = async (nextVideo = false) => {
	// console.log(`Fetching video (nextVideo: ${nextVideo})...`);
	destroyPlayers();
	currentVideo.value = {};
	freezeCounter = 0;
	retryAttempts = 0;
	lengthUpdateSent.value = false;

	try {
		videoLoading.value = true;
		const response = await queue(
			nextVideo ? 'next' : 'current',
			{ method: nextVideo ? 'POST' : 'GET' },
		);

		if (response.status !== 200) {
			// console.error('Failed to fetch video:', await response.text());
			setTimeout(() => fetchVideo(nextVideo), 5000);
			return;
		}

		currentVideo.value = await response.json();
		// console.log('Fetched video:', currentVideo.value);
		playVideo();

	} catch (error) {
		// console.error('Error fetching video:', await error?.response?.text() || error.message);
		setTimeout(() => fetchVideo(nextVideo), 5000);
	} finally {
		// Loading state
	}
};

const playVideo = async () => {
	const videoElement = document.getElementById('videoPlayer');
	if (!videoElement) {
		// console.error('Video element not found!');
		videoLoading.value = false;
		return;
	}

	try {
		// console.log('PlayVideo Check:', currentVideo.value);

		if (currentVideo.value.source_type === 'local' && currentVideo.value.stream_url) {
			// console.log('PlayVideo: Detected local source.');
			isPlayingLocal.value = true;

			let streamUrl = '';
			const streamPath = currentVideo.value.stream_url;
			const viteApiUrl = import.meta.env.VITE_API_URL;
			if (viteApiUrl && viteApiUrl.startsWith('http')) {
				try {
					const apiUrlObject = new URL(viteApiUrl);
					const baseUrl = apiUrlObject.origin;
					streamUrl = `${baseUrl}${streamPath}`;
				} catch(e) {
					// console.error('Error creating URL object from VITE_API_URL, falling back to relative path:', e);
					streamUrl = streamPath;
				}
			} else {
				streamUrl = streamPath;
			}

			// console.log('PlayVideo: Setting local source:', streamUrl);
			videoElement.src = streamUrl;
			setupPlyrForLocal(videoElement);

		} else if (currentVideo.value.source_type === 'youtube' && currentVideo.value.id) {
			// console.log('PlayVideo: Detected YouTube source.');
			isPlayingLocal.value = false;
			videoElement.removeAttribute('src');
			videoElement.load();

			const mpdUrl = `${API_URL}youtube/get-mpd?videoId=${currentVideo.value.id}&videoQuality=${currentVideo.value.video_quality}`;
			// console.log('PlayVideo: Initializing Dash.js with MPD:', mpdUrl);
			await setupDashPlayer(videoElement, mpdUrl);

		} else {
			// console.error('PlayVideo: Unknown or invalid video source type:', currentVideo.value);
			videoLoading.value = false;
			fetchVideo(true);
		}

	} catch (error) {
		// console.error('Error during playVideo execution:', error);
		videoLoading.value = false;
		fetchVideo(true);
	}
};

const setupPlyrForLocal = (videoElement) => {
	if (plyrPlayer.value) {
		try { plyrPlayer.value.destroy(); } catch(e) { console.warn('Error destroying previous Plyr instance:', e); }
	}

	const defaultOptions = {
		controls: [
			'play-large', 'play', 'progress', 'current-time',
			'mute', 'volume', 'fullscreen',
		],
		keyboard: { focused: false, global: false },
		muted: false,
	};
	plyrPlayer.value = new Plyr(videoElement, defaultOptions);

	plyrPlayer.value.on('timeupdate', (event) => {
		if (!isPlayingLocal.value || !plyrPlayer.value) return;
		const player = event.detail.plyr;
		const currentDuration = player.duration;

		if (
			!lengthUpdateSent.value &&
        currentVideo.value?.id &&
        (!currentVideo.value.length || currentVideo.value.length === 0) &&
        currentDuration && isFinite(currentDuration) && currentDuration > 0
		) {
			const roundedLength = Math.round(currentDuration);
			// console.log(`Sending length update for ${currentVideo.value.id}: ${roundedLength}`);
			socket.emit('update_video_length', { id: currentVideo.value.id, length: roundedLength });
			lengthUpdateSent.value = true;
		}

		socket.emit('playback_update', {
			time: player.currentTime,
			length: currentDuration || currentVideo.value?.length || 0,
			isPlaying: player.playing,
		});
		freezeCounter = 0;
	});

	plyrPlayer.value.on('ended', () => {
		if (!isPlayingLocal.value) return;
		// console.log('Local video ended, fetching next.');
		fetchVideo(true);
	});

	plyrPlayer.value.on('playing', () => {
		if (!isPlayingLocal.value || !plyrPlayer.value) return;
		videoLoading.value = false;
		socket.emit('update_playing_state', true);
		freezeCounter = 0;
	});
	plyrPlayer.value.on('pause', () => {
		if (!isPlayingLocal.value || !plyrPlayer.value) return;
		socket.emit('update_playing_state', false);
	});
	plyrPlayer.value.on('error', (event) => {
		// console.error('Plyr Error (Local):', event.detail?.error || event.detail);
		if (event.detail?.plyr?.media?.error) {
			// console.warn('MediaError detected, fetching next video.');
			fetchVideo(true);
		}
	});

	plyrPlayer.value.once('ready', () => {
		if (!plyrPlayer.value) return;
		if (currentVideoTime.value > 0 && isPlayingLocal.value) {
			// console.log('Setting local start time:', currentVideoTime.value);
			setTimeout(() => {
				if(plyrPlayer.value && isPlayingLocal.value) {
					try {
						plyrPlayer.value.currentTime = currentVideoTime.value;
						currentVideoTime.value = 0;
					} catch(e) {
						// console.warn('Error setting current time:', e);
					}
				}
			}, 100);
		}
	});

	plyrPlayer.value.once('canplay', () => {
		if (!plyrPlayer.value) return;
		if (isPlayingLocal.value) {
			videoLoading.value = false;
			// console.log('Attempting programmatic play...');
			const playPromise = plyrPlayer.value.play();
			if (playPromise !== undefined) {
				playPromise.then(() => {
					// console.log('Programmatic play successful or already playing.');
					if(plyrPlayer.value?.playing) {
						socket.emit('update_playing_state', true);
					}
				}).catch(error => {
					// console.warn('Programmatic play failed/blocked by browser:', error);
					socket.emit('update_playing_state', false);
				});
			} else {
				if (!plyrPlayer.value.playing) {
					// console.warn('Autoplay might be blocked (no promise returned, player not playing).');
					socket.emit('update_playing_state', false);
				}
			}
		}
	});
};

const setupDashPlayer = async (videoElement, mpdUrl) => {
	return new Promise((resolve, reject) => {
		if (!dashjsPlayer.value) {
			dashjsPlayer.value = MediaPlayer().create();

			dashjsPlayer.value.on(MediaPlayer.events.STREAM_INITIALIZED, () => {
				if (isPlayingLocal.value) return;
				// console.log('Dash stream initialized');
				videoLoading.value = false;

				if (plyrPlayer.value) { try { plyrPlayer.value.destroy(); } catch(e) {} }
				const defaultOptions = {
					controls: [],
					keyboard: { focused: false, global: false },
					muted: false,
				};
				plyrPlayer.value = new Plyr(videoElement, defaultOptions);

				plyrPlayer.value.once('ready', () => {
					if (!plyrPlayer.value) return;
					if (currentVideoTime.value > 0 && !isPlayingLocal.value) {
						// console.log('Setting Dash start time:', currentVideoTime.value);
						setTimeout(() => {
							if(plyrPlayer.value && !isPlayingLocal.value) {
								try {
									plyrPlayer.value.currentTime = currentVideoTime.value;
									currentVideoTime.value = 0;
								} catch(e) {
									// console.warn('Error setting dash current time:', e);
								}
							}
						}, 100);
					}
					// console.log('Attempting programmatic play for Dash stream...');
					const playPromise = plyrPlayer.value.play();
					if (playPromise !== undefined) {
						playPromise.then(() => {
							// console.log('Dash programmatic play successful or already playing.');
							if(plyrPlayer.value?.playing) {
								socket.emit('update_playing_state', true);
							}
						}).catch(error => {
							// console.warn('Dash programmatic play failed/blocked:', error);
							socket.emit('update_playing_state', false);
						});
					} else {
						if (!plyrPlayer.value.playing) {
							// console.warn('Dash autoplay might be blocked (no promise).');
							socket.emit('update_playing_state', false);
						}
					}
				});
				resolve();
			});

			dashjsPlayer.value.on(MediaPlayer.events.PLAYBACK_ENDED, () => {
				if (isPlayingLocal.value) return;
				// console.log('Dash stream ended, fetching next.');
				fetchVideo(true);
			});

			dashjsPlayer.value.on(MediaPlayer.events.PLAYBACK_TIME_UPDATED, (e) => {
				if (isPlayingLocal.value || !plyrPlayer.value) return;
				const currentLength = Math.round(e.time) + Math.round(e.timeToEnd);

				if (
					!lengthUpdateSent.value &&
            currentVideo.value?.id &&
            (!currentVideo.value.length || currentVideo.value.length === 0) &&
            currentLength && isFinite(currentLength) && currentLength > 1
				) {
					const roundedLength = Math.round(currentLength);
					// console.log(`Sending length update for YT ${currentVideo.value.id}: ${roundedLength}`);
					socket.emit('update_video_length', { id: currentVideo.value.id, length: roundedLength });
					lengthUpdateSent.value = true;
				}

				socket.emit('playback_update', {
					time: e.time,
					length: currentLength > 1 ? currentLength : (currentVideo.value?.length || 0),
					isPlaying: plyrPlayer.value.playing,
				});
				freezeCounter = 0;
			});

			dashjsPlayer.value.on(MediaPlayer.events.PLAYBACK_PLAYING, () => {
				if (isPlayingLocal.value) return;
				videoLoading.value = false;
				socket.emit('update_playing_state', true);
				freezeCounter = 0;
			});
			dashjsPlayer.value.on(MediaPlayer.events.PLAYBACK_PAUSED, () => {
				if (isPlayingLocal.value) return;
				socket.emit('update_playing_state', false);
			});
			dashjsPlayer.value.on(MediaPlayer.events.ERROR, (e) => {
				// console.error('Dash.js Error:', e);
				videoLoading.value = false;
				if (e.error?.code && e.error.code !== MediaPlayer.dependencies.ErrorHandler.prototype.TIME_SYNC_FAILED_ERROR_CODE) {
					fetchVideo(true);
				}
				reject(e);
			});

		} else {
			dashjsPlayer.value.reset();
			// console.log('Dash.js instance reset.');
			resolve();
		}

		// console.log('Initializing Dash.js with MPD (inside setup):', mpdUrl);
		dashjsPlayer.value.initialize(videoElement, mpdUrl, false);
	});
};

socket.on('set_video_time', value => {
	// console.log('Socket: set_video_time', value);
	if (plyrPlayer.value) {
		if (plyrPlayer.value.ready) {
			plyrPlayer.value.currentTime = value;
		} else {
			// console.warn('Plyr not ready, delaying set_video_time slightly.');
			plyrPlayer.value.once('ready', () => {
				if (plyrPlayer.value) plyrPlayer.value.currentTime = value;
			});
		}
	}
});

socket.on('skip_video', () => {
	// console.log('Socket: skip_video');
	fetchVideo(true);
});

socket.on('update_playing_state', requestedIsPlaying => {
	// console.log('Socket: update_playing_state', requestedIsPlaying);
	if (plyrPlayer.value && plyrPlayer.value.ready) {
		if (requestedIsPlaying && !plyrPlayer.value.playing) {
			plyrPlayer.value.play();
		} else if (!requestedIsPlaying && plyrPlayer.value.playing) {
			plyrPlayer.value.pause();
		}
	} else if (plyrPlayer.value) {
		// console.warn('Received update_playing_state while Plyr not ready.');
	}
});

socket.on('refresh_video', () => {
	// console.log('Socket: refresh_video');
	if(plyrPlayer.value && plyrPlayer.value.ready) {
		currentVideoTime.value = plyrPlayer.value.currentTime;
	}
	fetchVideo();
});

const startFreezeCheck = () => {
	if (freezeCheckInterval) clearInterval(freezeCheckInterval);
	freezeCounter = 0;
	retryAttempts = 0;

	freezeCheckInterval = setInterval(async () => {
		if (!plyrPlayer.value || !plyrPlayer.value.playing || videoLoading.value) {
			freezeCounter = 0;
			return;
		}
		freezeCounter++;
		if (freezeCounter > 20) {
			// console.warn(`Video seems frozen (counter: ${freezeCounter}). Attempting recovery.`);
			if (retryAttempts >= 3) {
				// console.error('Video frozen after 3 retries, skipping...');
				await fetchVideo(true);
			} else {
				retryAttempts++;
				// console.warn(`Attempting reload (${retryAttempts}/3)...`);
				if(plyrPlayer.value) {
					currentVideoTime.value = plyrPlayer.value.currentTime;
				}
				await fetchVideo();
			}
			freezeCounter = 0;
		}
	}, 3000);
};

</script>

<style>
@import 'plyr/dist/plyr.css';

.plyr__controls {
  display: flex !important;
}

html, body {
  overflow-y: auto;
}
</style>

<style scoped>
#videoPlayer {
  width: 100vw;
  height: 100vh;
  object-fit: contain;
  background-color: #000;
  pointer-events: none;
}

:deep(.plyr--video) {
  pointer-events: auto;
}
</style>