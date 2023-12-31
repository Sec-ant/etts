import { assertNever } from "assert-never";
import {
  VOICE_LIST_URL,
  VOICE_LIST_HEADERS,
  WEBSOCKET_SPEECH_CONFIG,
  WEBSOCKET_MAX_SIZE,
  WEBSOCKET_MARGIN,
  WSS_URL,
  WSS_HEADERS,
} from "./constants.js";
import { Voice, Name } from "./voice.js";
import { WebSocket, escapeXml as escapeXmlString } from "./stubs/bun.js";

export function getId() {
  return crypto.randomUUID().replaceAll("-", "");
}

export function getDateTime() {
  const parts: Partial<Intl.DateTimeFormatPartTypesRegistry> = {};

  Intl.DateTimeFormat("en", {
    weekday: "short",
    month: "short",
    day: "2-digit",
    year: "numeric",
    hourCycle: "h23",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "UTC",
  })
    .formatToParts(Date.now())
    .forEach(({ type, value }) => {
      parts[type] = value;
    });

  return `${parts.weekday} ${parts.month} ${parts.day} ${parts.year} ${parts.hour}:${parts.minute}:${parts.second} GMT+0000 (Coordinated Universal Time)`;
}

export async function listVoices(): Promise<Voice[]> {
  const resp = await fetch(VOICE_LIST_URL, {
    headers: VOICE_LIST_HEADERS,
  });
  if (resp.ok) {
    const data = (await resp.json()) as Voice[];
    return data;
  } else {
    throw Error("Cannot get correct voice list response from the server.");
  }
}

export interface RequestOptions {
  requestId: string;
  timestamp: string;
}

export function makeSpeechConfigRequest(
  { timestamp = getDateTime() }: Partial<Omit<RequestOptions, "requestId">> = {
    timestamp: getDateTime(),
  }
) {
  return (
    `X-Timestamp:${timestamp}Z\r\n` +
    "Content-Type:application/json; charset=utf-8\r\n" +
    "Path:speech.config\r\n\r\n" +
    `${WEBSOCKET_SPEECH_CONFIG}\r\n`
  );
}

export function makeSsmlRequest(
  chunk: string,
  {
    requestId = getId(),
    timestamp = getDateTime(),
  }: Partial<RequestOptions> = {
    requestId: getId(),
    timestamp: getDateTime(),
  }
) {
  return (
    `X-RequestId:${requestId}\r\n` +
    "Content-Type:application/ssml+xml\r\n" +
    `X-Timestamp:${timestamp}Z\r\n` +
    "Path:ssml\r\n\r\n" +
    chunk
  );
}

export async function calculateMaxMessageSize({
  voice = defaultSsmlOptions.voice,
  rate = defaultSsmlOptions.rate,
  volume = defaultSsmlOptions.volume,
}: Partial<SsmlOptions> = defaultSsmlOptions) {
  let bytes = "";
  for await (const chunk of makeSsml("", { voice, rate, volume })) {
    bytes += makeSsmlRequest(chunk);
  }
  return (
    WEBSOCKET_MAX_SIZE -
    WEBSOCKET_MARGIN -
    new TextEncoder().encode(bytes).byteLength
  );
}

export type Path = "turn.start" | "response" | "audio.metadata" | "turn.end";

export type BoundaryType = "WordBoundary" | "SessionEnd";

export interface Metadata {
  Type: BoundaryType;
  Data: {
    Offset: number;
    Duration: number;
    text: {
      Text: string;
      Length: number;
      BoundaryType: BoundaryType;
    };
  };
}

export type MetadataTypeBody = Metadata[];

export interface TurnStartTypeBody {
  context: {
    serviceTag: string;
  };
}

export interface ReponseTypeBody extends TurnStartTypeBody {
  audio: {
    type: string;
    streamId: string;
  };
}

export interface ResponseHeaders {
  "X-RequestId": string;
  "X-StreamId"?: string;
  "Content-Type"?: string;
  Path: Path;
}

export type ResponseBody =
  | TurnStartTypeBody
  | ReponseTypeBody
  | MetadataTypeBody
  | {};

export function parseHeaders(data: string) {
  return Object.fromEntries(
    data
      .trim()
      .split("\r\n")
      .map((line) => line.split(/\s*:\s*/))
  ) as ResponseHeaders;
}

export function parseTextResponse(data: string) {
  const [headers, body] = data.split("\r\n\r\n");
  return [parseHeaders(headers), JSON.parse(body) as ResponseBody] as const;
}

export async function* replaceIncompats(
  input: AsyncIterable<string> | Iterable<string>
) {
  for await (const chunk of input) {
    yield chunk.replace(/\u0000-\u0008|\u000B-\u000C|\u000E-\u001F/g, " ");
  }
}

export async function* escapeXml(
  input: AsyncIterable<string> | Iterable<string>
) {
  for await (const chunk of input) {
    yield escapeXmlString(chunk);
  }
}

export async function* encodeText(
  input: AsyncIterable<string> | Iterable<string>
) {
  const textEncoder = new TextEncoder();
  for await (const chunk of input) {
    yield textEncoder.encode(chunk);
  }
}

export async function* decodeText(
  input: AsyncIterable<Uint8Array> | Iterable<Uint8Array>
) {
  const textDecoder = new TextDecoder();
  for await (const chunk of input) {
    yield textDecoder.decode(chunk);
  }
}

// https://learn.microsoft.com/en-us/azure/ai-services/speech-service/speech-synthesis-markup-voice#adjust-prosody

type Digit = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";

export type Rate =
  | `-${Digit | `${"1" | "2" | "3" | "4"}${Digit}` | "50"}%`
  | `${"+"}${Digit | `${Exclude<Digit, "0">}${Digit}` | "100"}%`;

export type Volume = `${"+" | "-"}${
  | Digit
  | `${Exclude<Digit, "0">}${Digit}`
  | `${Exclude<Digit, "0">}${Digit}${Digit}`}%`;

export interface SsmlOptions {
  voice: Name;
  rate: Rate;
  volume: Volume;
}

export const defaultSsmlOptions: SsmlOptions = {
  voice: "Microsoft Server Speech Text to Speech Voice (cy-GB, NiaNeural)",
  rate: "+0%",
  volume: "+0%",
};

export async function* makeSsml(
  input: AsyncIterable<string> | Iterable<string>,
  {
    voice = defaultSsmlOptions.voice,
    rate = defaultSsmlOptions.rate,
    volume = defaultSsmlOptions.volume,
  }: Partial<SsmlOptions> = defaultSsmlOptions
) {
  for await (const chunk of input) {
    yield `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'><voice name='${voice}'><prosody pitch='+0Hz' rate='${rate}' volume='${volume}'>${chunk}</prosody></voice></speak>`;
  }
}

export interface RequestOptions {
  requestId: string;
  timestamp: string;
}

export interface RequestGroup {
  id: string;
  requests: [string, string];
}

export async function* makeRequestGroups(
  input: AsyncIterable<string> | Iterable<string>
) {
  for await (const chunk of input) {
    const requestId = getId();
    const timestamp = getDateTime();
    yield {
      id: requestId,
      requests: [
        makeSpeechConfigRequest({ timestamp }),
        makeSsmlRequest(chunk, { requestId, timestamp }),
      ],
    } as RequestGroup;
  }
}

export type Granularity = Exclude<
  Intl.SegmenterOptions["granularity"],
  undefined
>;

export interface SmartSplitOptions {
  maxByteLength: number;
  granularity: Granularity;
  locales?: Intl.BCP47LanguageTag | Intl.BCP47LanguageTag[];
  isEscaped: boolean;
}

export const defaultSmartSplitOptions: SmartSplitOptions = {
  maxByteLength: await calculateMaxMessageSize(),
  granularity: "grapheme",
  isEscaped: false,
};

export async function* smartSplit(
  input: AsyncIterable<string> | Iterable<string>,
  {
    maxByteLength = defaultSmartSplitOptions.maxByteLength,
    granularity = defaultSmartSplitOptions.granularity,
    locales = defaultSmartSplitOptions.locales,
    isEscaped = defaultSmartSplitOptions.isEscaped,
  }: Partial<SmartSplitOptions> = defaultSmartSplitOptions
) {
  if (maxByteLength <= 0 || !Number.isSafeInteger(maxByteLength)) {
    throw RangeError("maxByteLength must be a safe positive integer.");
  }
  const truncatedEntityRegExp = /&[^;]*$/;
  const textEncoder = new TextEncoder();
  const segmenters: Intl.Segmenter[] = [];
  for (const g of ["sentence", "word", "grapheme"] as const) {
    segmenters.push(
      new Intl.Segmenter(locales, {
        granularity: g,
      })
    );
    if (granularity === g) {
      break;
    }
  }
  let accumulatedChunk = "";
  let accumulatedByteLength = 0;
  for await (let incomingChunk of input) {
    let incomingBytes = textEncoder.encode(incomingChunk);
    let { byteLength: incomingByteLength } = incomingBytes;
    while (accumulatedByteLength + incomingByteLength >= maxByteLength) {
      let breakSegmenterLoop = false;
      for (const segmenter of segmenters) {
        if (breakSegmenterLoop === true) {
          break;
        }
        const temporaryChunk = accumulatedChunk + incomingChunk;
        for (const { segment, index: segmentStartPos } of segmenter.segment(
          temporaryChunk
        )) {
          const segmentBytes = textEncoder.encode(segment);
          const { byteLength: segmentBytesLength } = segmentBytes;
          if (accumulatedByteLength + segmentBytesLength === maxByteLength) {
            let splitAt = segmentStartPos + segment.length;
            if (isEscaped) {
              const truncatedStartPos = temporaryChunk
                .slice(0, splitAt)
                .search(truncatedEntityRegExp);
              if (truncatedStartPos !== -1) {
                splitAt = truncatedStartPos;
              }
              if (splitAt === 0) {
                throw new Error(
                  `maxByteLength is too small or the text contains invalid XML escaped entities.`
                );
              }
            }
            yield temporaryChunk.slice(0, splitAt);
            accumulatedChunk = "";
            incomingChunk = temporaryChunk.slice(splitAt);
            accumulatedByteLength = 0;
            incomingBytes = textEncoder.encode(incomingChunk);
            ({ length: incomingByteLength } = incomingBytes);
            breakSegmenterLoop = true;
            break;
          }
          if (accumulatedByteLength + segmentBytesLength > maxByteLength) {
            if (accumulatedByteLength === 0) {
              if (segmenter.resolvedOptions().granularity === granularity) {
                throw new Error(
                  "maxByteLength is too small or the granularity is too low."
                );
              }
              accumulatedChunk = temporaryChunk.slice(0, segmentStartPos);
              incomingChunk = temporaryChunk.slice(segmentStartPos);
              break;
            }
            let splitAt = segmentStartPos;
            if (isEscaped) {
              const truncatedStartPos = temporaryChunk
                .slice(0, splitAt)
                .search(truncatedEntityRegExp);
              if (truncatedStartPos !== -1) {
                splitAt = truncatedStartPos;
              }
              if (splitAt === 0) {
                throw new Error(
                  `maxByteLength is too small or the text contains invalid XML escaped entities.`
                );
              }
            }
            yield temporaryChunk.slice(0, splitAt);
            accumulatedChunk = "";
            incomingChunk = temporaryChunk.slice(splitAt);
            accumulatedByteLength = 0;
            incomingBytes = textEncoder.encode(incomingChunk);
            ({ length: incomingByteLength } = incomingBytes);
            breakSegmenterLoop = true;
            break;
          }
          accumulatedByteLength += segmentBytesLength;
        }
      }
    }
    accumulatedChunk += incomingChunk;
    accumulatedByteLength += incomingByteLength;
  }
  if (accumulatedChunk.length > 0) {
    if (isEscaped) {
      const truncatedStartPos = accumulatedChunk.search(truncatedEntityRegExp);
      if (truncatedStartPos !== -1) {
        throw new Error("The text contains a truncated XML escaped entity.");
      }
    }
    yield accumulatedChunk;
  }
}

export type Message =
  | {
      isBinary: true;
      headers: ResponseHeaders;
      body: Uint8Array;
    }
  | {
      isBinary: false;
      headers: ResponseHeaders;
      body: ResponseBody;
    };

export async function* communicate(
  input: AsyncIterable<RequestGroup> | Iterable<RequestGroup>
) {
  // create a new web socket
  const websocketUrl = new URL(WSS_URL);
  websocketUrl.searchParams.set("ConnectionId", getId());
  const ws = new WebSocket(websocketUrl, {
    headers: WSS_HEADERS,
  });
  ws.binaryType = "arraybuffer";
  // create a transform stream to yield results in callback functions
  const transformStream = new TransformStream<Message, Message>();
  const { writable, readable } = transformStream;
  const writer = writable.getWriter();
  // acquire the input iterator
  const iterator =
    (input as AsyncIterable<RequestGroup>)[Symbol.asyncIterator]() ||
    (input as Iterable<RequestGroup>)[Symbol.iterator]();
  // flags to check for unexpected messages
  let downloadAudio = false;
  let requestId: string;
  // error handler
  // is this handler necessary?
  // https://stackoverflow.com/questions/38181156/websockets-is-an-error-event-always-followed-by-a-close-event
  ws.addEventListener("error", async (e) => {
    await writer.abort(e);
  });
  // close handler
  ws.addEventListener("close", async ({ code, reason }) => {
    // TODO: handle 1006 properly
    // TODO: maybe we should close or abort writer earlier, not in ws close handler
    if (code === 1000 || code === 1006) {
      await writer.close();
    } else {
      await writer.abort(reason);
    }
  });
  // open handler
  ws.addEventListener("open", async () => {
    const { value, done } = await iterator.next();
    if (!done) {
      const { id, requests } = value;
      requestId = id;
      for (const request of requests) {
        ws.send(request);
      }
    } else {
      ws.close(1000, "No values to be sent.");
    }
  });
  // message handler
  ws.addEventListener("message", async ({ data }) => {
    // binary message
    if (data instanceof ArrayBuffer) {
      if (!downloadAudio) {
        ws.close(4000, "Unexpected binary message.");
      }
      if (data.byteLength < 2) {
        ws.close(4001, "Invalid binary message format. Header length missing.");
      }
      const dataView = new DataView(data);
      const headerLength = dataView.getUint16(0);
      if (data.byteLength < headerLength + 2) {
        ws.close(
          4002,
          "Invalid binary message format. Header content missing."
        );
      }
      const textDecoder = new TextDecoder();
      const headers = parseHeaders(
        textDecoder.decode(new Uint8Array(data, 2, headerLength))
      );
      if (headers["X-RequestId"] !== requestId) {
        ws.close(4003, "Unexpected X-RequestId.");
      }
      const body = new Uint8Array(data, 2 + headerLength);
      await writer.write({
        isBinary: true,
        headers,
        body,
      });
    }
    // non-binary message
    else {
      const [headers, body] = parseTextResponse(data as string);
      if (headers["X-RequestId"] !== requestId) {
        ws.close(4003, "Unexpected X-RequestId.");
      }
      await writer.write({
        isBinary: false,
        headers,
        body,
      });
      switch (headers.Path) {
        case "turn.start":
          downloadAudio = true;
          break;
        case "turn.end":
          downloadAudio = false;
          const { value, done } = await iterator.next();
          if (!done) {
            const { id, requests } = value;
            requestId = id;
            for (const request of requests) {
              ws.send(request);
            }
          } else {
            ws.close(1000, "No values to be sent");
          }
          break;
        case "response":
          break;
        case "audio.metadata":
          break;
        default:
          assertNever(headers.Path);
      }
    }
  });
  // server ping handler
  ws.addEventListener("ping", () => {
    ws.pong();
  });
  // yield results
  for await (const chunk of readable) {
    yield chunk;
  }
}
