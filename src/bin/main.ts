import {
  SSMLOptions,
  calculateMaxMessageSize,
  communicate,
  escapeXML,
  makeRequests,
  makeSSML,
  parseTextResponse,
  replaceIncompats,
  smartSplit,
} from "../utils.js";

const input = "123&456";

const ssmlOptions: Partial<SSMLOptions> = {
  voice: "Microsoft Server Speech Text to Speech Voice (zh-CN, XiaoxiaoNeural)",
};

const maxByteLength = await calculateMaxMessageSize(ssmlOptions);

for await (const chunk of communicate(
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
)) {
  if (!chunk.isBinary) {
    console.log(parseTextResponse(chunk.data));
  } else {
    console.log(chunk);
  }
}
