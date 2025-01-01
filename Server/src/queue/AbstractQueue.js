import pino from '~/utils/Pino.js';

import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';

export default class AbstractQueue {
	constructor (path, maxLength = -1) {
		this.maxLength = maxLength;

		const adapter = new JSONFile(path);

		this.db = new Low(adapter, this.getDefaultData());
		this.db.read();
	}

	getDefaultData () {
		return {
			items: [],
		};
	}

	onQueueChange () {}

	async limitLength () {
		if (this.maxLength === -1) return;

		const items = this.getAll();

		items.length = Math.min(items.length, this.maxLength);
	}

	async clear () {
		const items = this.getAll();

		items.length = 0;

		await this.db.write();

		this.onQueueChange();

		return this.db.data;
	}

	get (index) {
		const items = this.getAll();

		if (index < 0 || index >= items.length) {
			pino.error('Error in AbstractQueue.get - Invalid index');
			pino.error(`Index: ${index}`);
			return false;
		}

		return items[index];
	}

	getData () {
		return this.db.data;
	}

	getAll () {
		return this.getData().items;
	}

	async add (elements) {
		elements = Array.isArray(elements) ? elements : [elements];

		const items = this.getAll();
		items.push(...elements);

		this.limitLength();

		await this.db.write();

		this.onQueueChange();

		return this.db.data;
	}

	async addFirst (elements) {
		elements = Array.isArray(elements) ? elements : [elements];

		const items = this.getAll();
		items.unshift(...elements);

		this.limitLength();

		await this.db.write();

		this.onQueueChange();

		return this.db.data;
	}

	async remove (index) {
		const items = this.getAll();

		if (index < 0 || index >= items.length) {
			pino.error('Error in AbstractQueue.remove - Invalid index');
			pino.error(`Index: ${index}`);
			return false;
		}

		items.splice(index, 1);

		await this.db.write();

		this.onQueueChange();

		return this.db.data;
	}

	async move (index, newIndex) {
		const items = this.getAll();

		if (!this.hasItems()) {
			return 'No items in the queue';
		}

		if (newIndex === 'start') newIndex = 0;
		else if(newIndex === 'end') newIndex = items.length - 1;

		index = Math.min(Math.max(index, 0), items.length - 1);
		newIndex = Math.min(Math.max(newIndex, 0), items.length - 1);

		if (index === newIndex) {
			return 'index matches newIndex';
		}

		const item = items.splice(index, 1)[0];

		items.splice(newIndex, 0, item);

		await this.db.write();

		this.onQueueChange();

		return this.db.data;
	}

	hasItems () {
		return this.getAll().length > 0;
	}

	getFirst () {
		if (!(this.hasItems())) return false;

		return this.get(0);
	}

	async getAndAdvance () {
		if (!(this.hasItems())) return false;

		const items = this.getAll();

		const result = items.shift();

		await this.db.write();

		this.onQueueChange();

		return result;
	}

	async advanceQueue () {
		if (!(this.hasItems())) return false;

		const items = this.getAll();

		items.shift();

		await this.db.write();

		this.onQueueChange();

		return items[0];
	}
}