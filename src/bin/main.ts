#!/usr/bin/env bun
import {
  SsmlOptions,
  calculateMaxMessageSize,
  communicate,
  escapeXml,
  makeRequestGroups,
  makeSsml,
  replaceIncompats,
  smartSplit,
} from "../utils.js";

const input = `Bun is an all-in-one toolkit for JavaScript and TypeScript apps. It ships as a single executable called bun.

At its core is the Bun runtime, a fast JavaScript runtime designed as a drop-in replacement for Node.js. It's written in Zig and powered by JavaScriptCore under the hood, dramatically reducing startup times and memory usage.`;

const ssmlOptions: Partial<SsmlOptions> = {
  voice: "Microsoft Server Speech Text to Speech Voice (zh-CN, XiaoxiaoNeural)",
};

const maxByteLength = await calculateMaxMessageSize(ssmlOptions);

const iterator = communicate(
  makeRequestGroups(
    makeSsml(
      smartSplit(escapeXml(replaceIncompats([input])), {
        maxByteLength,
        isEscaped: true,
        granularity: "word",
      }),
      ssmlOptions
    )
  )
);

for await (const chunk of iterator) {
  console.log(
    chunk.isBinary
      ? JSON.stringify({ headers: chunk.headers }, undefined, 2)
      : JSON.stringify(
          {
            headers: chunk.headers,
            body: chunk.body,
          },
          undefined,
          2
        )
  );
}
