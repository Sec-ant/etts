#!/usr/bin/env bun
import {
  SSMLOptions,
  calculateMaxMessageSize,
  communicate,
  escapeXML,
  makeRequests,
  makeSSML,
  replaceIncompats,
  smartSplit,
  parseMessage,
} from "../utils.js";

const input = "123123123123123123123123123123123123123123123123";

const ssmlOptions: Partial<SSMLOptions> = {
  voice: "Microsoft Server Speech Text to Speech Voice (zh-CN, XiaoxiaoNeural)",
};

const maxByteLength = await calculateMaxMessageSize(ssmlOptions);

let count = 0;
for await (const chunk of parseMessage(
  communicate(
    makeRequests(
      makeSSML(
        smartSplit(escapeXML(replaceIncompats([input])), {
          maxByteLength,
          isEscaped: true,
          granularity: "word",
        }),
        ssmlOptions
      )
    )
  )
)) {
  console.log(`${count}. message received: ${chunk.type}`);
  ++count;
}
