/**
 * Constants for the Edge TTS project.
 */

export const TRUSTED_CLIENT_TOKEN = "6A5AA1D4EAFF4E9FB37E23D68491D6F4";

export const WSS_URL =
  "wss://speech.platform.bing.com/consumer/speech/synthesize/" +
  "readaloud/edge/v1?TrustedClientToken=" +
  TRUSTED_CLIENT_TOKEN;

export const WSS_ORIGIN = "chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold";

export const WSS_HEADERS = {
  Origin: WSS_ORIGIN,
  Pragma: "no-cache",
  "Cache-Control": "no-cache",
  "Accept-Encoding": "gzip, deflate, br",
  "Accept-Language": "en-US,en;q=0.9",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.77 Safari/537.36 Edg/91.0.864.41",
};

export const VOICE_LIST_URL =
  "https://speech.platform.bing.com/consumer/speech/synthesize/" +
  "readaloud/voices/list?trustedclienttoken=" +
  TRUSTED_CLIENT_TOKEN;

export const VOICE_LIST_HEADERS = {
  Authority: "speech.platform.bing.com",
  "Sec-CH-UA":
    '" Not;A Brand";v="99", "Microsoft Edge";v="91", "Chromium";v="91"',
  "Sec-CH-UA-Mobile": "?0",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.77 Safari/537.36 Edg/91.0.864.41",
  Accept: "*/*",
  "Sec-Fetch-Site": "none",
  "Sec-Fetch-Mode": "cors",
  "Sec-Fetch-Dest": "empty",
  "Accept-Encoding": "gzip, deflate, br",
  "Accept-Language": "en-US,en;q=0.9",
};

export const WEBSOCKET_MAX_SIZE = 1 << 16;

export const WEBSOCKET_MARGIN = 50;

export const WEBSOCKET_SPEECH_CONFIG = JSON.stringify({
  context: {
    synthesis: {
      audio: {
        metadataoptions: {
          sentenceBoundaryEnabled: false,
          wordBoundaryEnabled: true,
        },
        outputFormat: "audio-24khz-48kbitrate-mono-mp3",
      },
    },
  },
});
