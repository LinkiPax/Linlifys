export default async function getDeviceId() {
  if (typeof window === "undefined") {
    return null;
  }

  const FingerprintJS = (await import("@fingerprintjs/fingerprintjs")).default;
  const fp = await FingerprintJS.load();
  const result = await fp.get();
  return result.visitorId;
}