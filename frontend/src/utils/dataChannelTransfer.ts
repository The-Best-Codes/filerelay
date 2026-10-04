const HIGH_WATER = 256 * 1024;
const LOW_WATER = 128 * 1024;
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

// Pace file reads with the transport instead of flooding SCTP with large batches.
export async function sendFileData(
  channel: RTCDataChannel,
  file: Blob,
  maxMessageSize: number | undefined,
  onProgress: (sent: number) => void,
): Promise<void> {
  const chunkSize = Math.min(MESSAGE_SIZE, maxMessageSize || MESSAGE_SIZE);
  let sent = 0;
  let lastProgress = performance.now();
  const reader = new FileReader();
  while (sent < file.size) {
    if (channel.bufferedAmount > HIGH_WATER) {
      await waitForDrain(channel, LOW_WATER);
    }
    if (channel.readyState !== "open")
      throw new Error("File transfer connection closed");

    const chunk = await new Promise<ArrayBuffer>((resolve, reject) => {
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = () =>
        reject(reader.error ?? new Error("File read error"));
      reader.onabort = () => reject(new Error("File read aborted"));
      reader.readAsArrayBuffer(file.slice(sent, sent + chunkSize));
    });
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
  // Do not report completion while bytes are still queued locally.
  await waitForDrain(channel, 0);
  onProgress(sent);
}
