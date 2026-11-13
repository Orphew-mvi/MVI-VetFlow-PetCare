import { BR_RANGES_GZIP_BASE64 } from "./br-ranges.data";

type Address = { family: 4 | 6; bytes: Uint8Array };
let indexPromise: Promise<Uint8Array> | undefined;

function parseIPv4(value: string): Uint8Array | null {
  const octets = value.split(".");
  if (octets.length !== 4 || octets.some(part => !/^\d{1,3}$/.test(part) || Number(part) > 255)) return null;
  return Uint8Array.from(octets.map(Number));
}

function parseIP(value: string): Address | null {
  if (value.length > 45 || !/^[0-9a-fA-F:.]+$/.test(value)) return null;
  if (!value.includes(":")) {
    const bytes = parseIPv4(value);
    return bytes ? { family: 4, bytes } : null;
  }
  const mapped = value.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i);
  if (mapped) {
    const bytes = parseIPv4(mapped[1]);
    return bytes ? { family: 4, bytes } : null;
  }
  if (value.includes(".")) return null;
  const halves = value.toLowerCase().split("::");
  if (halves.length > 2) return null;
  const left = halves[0] ? halves[0].split(":") : [];
  const right = halves[1] ? halves[1].split(":") : [];
  if ([...left, ...right].some(part => !/^[0-9a-f]{1,4}$/.test(part))) return null;
  const missing = 8 - left.length - right.length;
  if (halves.length === 1 ? missing !== 0 : missing < 1) return null;
  const words = [...left, ...Array(missing).fill("0"), ...right];
  const bytes = new Uint8Array(16);
  words.forEach((word, i) => {
    const number = parseInt(word, 16);
    bytes[i * 2] = number >>> 8;
    bytes[i * 2 + 1] = number & 255;
  });
  return { family: 6, bytes };
}

async function loadIndex(): Promise<Uint8Array> {
  const binary = atob(BR_RANGES_GZIP_BASE64);
  const zipped = Uint8Array.from(binary, char => char.charCodeAt(0));
  const stream = new Blob([zipped]).stream().pipeThrough(new DecompressionStream("gzip"));
  const data = new Uint8Array(await new Response(stream).arrayBuffer());
  const header = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const count4 = header.getUint32(4);
  const count6 = header.getUint32(8);
  if (String.fromCharCode(...data.slice(0, 4)) !== "PBR1" || data.length !== 12 + count4 * 10 + count6 * 34) {
    throw new Error("Invalid Brazil geo index");
  }
  return data;
}

function compare(data: Uint8Array, offset: number, ip: Uint8Array): number {
  for (let i = 0; i < ip.length; i++) {
    if (data[offset + i] !== ip[i]) return data[offset + i] < ip[i] ? -1 : 1;
  }
  return 0;
}

/** Returns a Brazilian state code. No individual IP is stored or logged. */
export async function lookupBrazilState(ip: string): Promise<string> {
  const address = parseIP(ip);
  if (!address) return "";
  const data = await (indexPromise ??= loadIndex().catch(error => { indexPromise = undefined; throw error; }));
  const header = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const count4 = header.getUint32(4);
  const count = address.family === 4 ? count4 : header.getUint32(8);
  const size = address.family === 4 ? 10 : 34;
  const base = address.family === 4 ? 12 : 12 + count4 * 10;
  let low = 0;
  let high = count;
  while (low < high) {
    const middle = (low + high) >>> 1;
    if (compare(data, base + middle * size, address.bytes) <= 0) low = middle + 1;
    else high = middle;
  }
  if (low === 0) return "";
  const offset = base + (low - 1) * size;
  if (compare(data, offset + address.bytes.length, address.bytes) < 0) return "";
  return String.fromCharCode(data[offset + size - 2], data[offset + size - 1]);
}
