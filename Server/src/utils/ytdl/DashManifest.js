import { Buffer } from 'node:buffer';

import got from 'got';
import { withCookies } from '#utils/ytdl/Cookies.js';

const PROBE_BYTES = 256 * 1024;

const EBML_HEADER = 0x1A45DFA3;
const EBML_SEGMENT = 0x18538067;
const EBML_CUES = 0x1C53BB6B;
const EBML_CLUSTER = 0x1F43B675;

function readVint (buf, pos, keepMarker) {
	const first = buf[pos];
	if (first === undefined || first === 0) throw new Error('Invalid EBML vint');

	const length = Math.clz32(first) - 23;
	let value = keepMarker ? first : first & (0xFF >> length);
	for (let i = 1; i < length; i++) {
		value = value * 256 + buf[pos + i];
	}

	return { value, length };
}

function readEbmlElement (buf, pos) {
	const id = readVint(buf, pos, true);
	const size = readVint(buf, pos + id.length, false);

	return {
		id: id.value,
		start: pos,
		dataStart: pos + id.length + size.length,
		size: size.value,
	};
}

function parseWebm (buf) {
	const header = readEbmlElement(buf, 0);
	if (header.id !== EBML_HEADER) throw new Error('Not a WebM file');

	const segment = readEbmlElement(buf, header.dataStart + header.size);
	if (segment.id !== EBML_SEGMENT) throw new Error('WebM segment not found');

	let pos = segment.dataStart;
	while (pos < buf.length) {
		const element = readEbmlElement(buf, pos);

		if (element.id === EBML_CUES) {
			return {
				init: [0, element.start - 1],
				index: [element.start, element.dataStart + element.size - 1],
			};
		}

		if (element.id === EBML_CLUSTER) break;

		pos = element.dataStart + element.size;
	}

	throw new Error('WebM Cues not found before first Cluster');
}

function parseMp4 (buf) {
	let init;
	let pos = 0;

	while (pos + 8 <= buf.length) {
		let size = buf.readUInt32BE(pos);
		const type = buf.toString('ascii', pos + 4, pos + 8);
		if (size === 1) size = Number(buf.readBigUInt64BE(pos + 8));
		if (size < 8) break;

		if (type === 'moov') init = [0, pos + size - 1];
		if (type === 'sidx' && init) {
			return { init, index: [pos, pos + size - 1] };
		}

		pos += size;
	}

	throw new Error('MP4 moov/sidx not found');
}

export async function probeRanges (format) {
	const body = await got(format.url, {
		headers: withCookies({
			...format.http_headers,
			range: `bytes=0-${PROBE_BYTES - 1}`,
		}, format.url),
	}).buffer();
	const buf = Buffer.from(body.buffer, body.byteOffset, body.byteLength);

	return format.container === 'webm' ? parseWebm(buf) : parseMp4(buf);
}

function representation (format, ranges, baseUrl) {
	const bandwidth = Math.round((format.tbr || 0) * 1000) || 1;
	const attrs = [
		`id="${format.format_id}"`,
		`codecs="${format.codecs}"`,
		`bandwidth="${bandwidth}"`,
	];

	if (format.width) attrs.push(`width="${format.width}"`, `height="${format.height}"`);
	if (format.fps) attrs.push(`frameRate="${format.fps}"`);
	if (format.asr) attrs.push(`audioSamplingRate="${format.asr}"`);

	return `
      <Representation ${attrs.join(' ')}>
        <BaseURL>${baseUrl}</BaseURL>
        <SegmentBase indexRange="${ranges.index.join('-')}">
          <Initialization range="${ranges.init.join('-')}"/>
        </SegmentBase>
      </Representation>`;
}

export function buildManifest (streams, duration) {
	const adaptationSets = streams.map(({ format, ranges, baseUrl }, i) => {
		const contentType = format.width ? 'video' : 'audio';

		return `
    <AdaptationSet id="${i}" contentType="${contentType}" mimeType="${contentType}/${format.container}" subsegmentAlignment="true">${representation(format, ranges, baseUrl)}
    </AdaptationSet>`;
	});

	return `<?xml version="1.0" encoding="UTF-8"?>
<MPD xmlns="urn:mpeg:dash:schema:mpd:2011" profiles="urn:mpeg:dash:profile:isoff-on-demand:2011" type="static" minBufferTime="PT2S" mediaPresentationDuration="PT${duration}S">
  <Period>${adaptationSets.join('')}
  </Period>
</MPD>
`;
}
