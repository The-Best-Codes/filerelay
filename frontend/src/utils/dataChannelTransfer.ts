const READ_SIZE = 4 * 1024 * 1024;
const HIGH_WATER = 4 * 1024 * 1024;
const LOW_WATER = 1024 * 1024;
const MESSAGE_SIZE = 64 * 1024;

function waitForDrain(
  channel: RTCDataChannel,
  threshold: number,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      channel.removeEventListener("bufferedamountlow", check);
      channel.removeEventListener("close", fail);
      channel.removeEventListener("error", fail);
      clearTimeout(timeout);
    };
    const fail = () => {
      cleanup();
      reject(new Error("File transfer connection closed or stalled"));
    };
    const check = () => {
      if (channel.readyState !== "open") return fail();
      if (channel.bufferedAmount <= threshold) {
        cleanup();
        resolve();
      }
    };
    const timeout = setTimeout(fail, 60_000);
    channel.bufferedAmountLowThreshold = threshold;
    channel.addEventListener("bufferedamountlow", check);
    channel.addEventListener("close", fail);
    channel.addEventListener("error", fail);
    check();
  });
}

// Batch disk reads independently of network message size. Keep reliable ordering
// and bounded memory while allowing the transport to stay busy between reads.
export async function sendFileData(
  channel: RTCDataChannel,
  file: Blob,
  maxMessageSize: number | undefined,
  onProgress: (sent: number) => void,
): Promise<void> {
  const chunkSize = Math.min(MESSAGE_SIZE, maxMessageSize || MESSAGE_SIZE);
  let sent = 0;
  let lastProgress = performance.now();
  for (let readOffset = 0; readOffset < file.size; readOffset += READ_SIZE) {
    const batch = await file
      .slice(readOffset, readOffset + READ_SIZE)
      .arrayBuffer();
    for (let offset = 0; offset < batch.byteLength; offset += chunkSize) {
      const chunk = new Uint8Array(
        batch,
        offset,
        Math.min(chunkSize, batch.byteLength - offset),
      );
      if (channel.bufferedAmount + chunk.byteLength > HIGH_WATER) {
        await waitForDrain(channel, LOW_WATER);
      }
      if (channel.readyState !== "open")
        throw new Error("File transfer connection closed");
      channel.send(chunk);
      sent += chunk.byteLength;
      const now = performance.now();
      if (now - lastProgress >= 100) {
        onProgress(Math.max(0, sent - channel.bufferedAmount));
        lastProgress = now;
      }
    }
  }
  // Do not report completion while bytes are still queued locally.
  await waitForDrain(channel, 0);
  onProgress(sent);
}
