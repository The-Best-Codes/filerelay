export const formatFileSize = (bytes: number): string => {
  if (window.devVerboseLogging)
    console.log("formatFileSize: Formatting bytes:", bytes);
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export const formatSpeed = (bytesPerSecond: number): string => {
  if (window.devVerboseLogging)
    console.log("formatSpeed: Formatting speed:", bytesPerSecond);
  if (bytesPerSecond <= 0) return "0 Bytes/s";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.max(0, Math.floor(Math.log(bytesPerSecond) / Math.log(k)));
  return (bytesPerSecond / Math.pow(k, i)).toFixed(1) + " " + sizes[i] + "/s";
};

export const formatTime = (seconds: number): string => {
  if (window.devVerboseLogging)
    console.log("formatTime: Formatting seconds:", seconds);
  if (!isFinite(seconds) || seconds < 0) return "—";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
};
