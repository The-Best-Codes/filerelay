export const isWebRTCSupported = (): boolean => {
  return (
    typeof RTCPeerConnection !== "undefined" &&
    typeof RTCSessionDescription !== "undefined" &&
    typeof RTCIceCandidate !== "undefined"
  );
};

export const checkWebRTCSupport = (): {
  supported: boolean;
  details: string[];
} => {
  const details: string[] = [];
  let supported = true;

  if (typeof RTCPeerConnection === "undefined") {
    details.push("RTCPeerConnection not supported");
    supported = false;
  }

  if (typeof RTCSessionDescription === "undefined") {
    details.push("RTCSessionDescription not supported");
    supported = false;
  }

  if (typeof RTCIceCandidate === "undefined") {
    details.push("RTCIceCandidate not supported");
    supported = false;
  }

  if (typeof navigator === "undefined" || !navigator.mediaDevices) {
    details.push("Media devices API not available");
    supported = false;
  }

  return { supported, details };
};
