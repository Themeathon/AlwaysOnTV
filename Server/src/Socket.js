import { Server } from 'socket.io';
import HistoryQueue from '~/queue/HistoryQueue.js';
import VideoQueue from '~/queue/VideoQueue.js';
import VideoDatabase from '~/db/VideoDatabase.js';
import pino from '~/utils/Pino.js';

export default class Socket {
	static {
		this.io = false;

		this.current_video_time = 0;
		this.current_video_length = 0;
	}

	static setup (server) {
		this.io = new Server(server, {
			cors: true,
		});

		this.io.on('connection', (socket) => {
			socket.on('playback_update', (msg) => {
				this.currentVideoTime = msg.time;
				this.currentVideoLength = msg.length;

				socket.broadcast.emit('update_dashboard', msg);
			});

			socket.on('set_video_time', time => {
				this.currentVideoTime = time;

				socket.broadcast.emit('set_video_time', time);
			});

			socket.on('skip_video', () => {
				this.resetCurrentVideoTime();

				socket.broadcast.emit('skip_video');
			});

			socket.on('refresh_video', () => {
				socket.broadcast.emit('refresh_video');
			});

			socket.on('update_playing_state', isPlaying => {
				socket.broadcast.emit('update_playing_state', isPlaying);
			});

			socket.on('request_video_time', () => {
				socket.emit('request_video_time', {
					progress: this.currentVideoTime,
					length: this.currentVideoLength,
				});
			});

			socket.on('update_video_length', async (data) => {
				if (data && data.id && typeof data.length === 'number' && data.length > 0) {
					try {
						const updated = await VideoDatabase.updateVideoLengthIfZero(data.id, data.length);

						if (updated) {
							pino.info(`Socket: Successfully updated length for video ${data.id} to ${data.length}.`);
						}
					} catch (error) {
						pino.error({ err: error }, `Socket: Error updating video length for ID ${data.id}`);
					}
				} else {
					pino.warn({ receivedData: data }, 'Socket: Received invalid data for update_video_length event.');
				}
			});
		});
	}

	static get currentVideoTime () {
		return this.current_video_time;
	}

	static set currentVideoTime (time) {
		this.current_video_time = time;
	}

	static get currentVideoLength () {
		return this.current_video_length;
	}

	static set currentVideoLength (length) {
		this.current_video_length = length;
	}

	static resetCurrentVideoTime () {
		this.current_video_time = 0;
		this.current_video_length = 0;
	}

	static broadcastQueueHistoryUpdate () {
		this.io.emit('queue_history_update', {
			queue: VideoQueue.getData(),
			history: HistoryQueue.getData(),
		});
	}
}