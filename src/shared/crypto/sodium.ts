import sodium from "libsodium-wrappers-sumo";

let readyPromise: Promise<typeof sodium> | null = null;

export function getSodium(): Promise<typeof sodium> {
  if (readyPromise === null) {
    readyPromise = sodium.ready.then(() => sodium);
  }
  return readyPromise;
}
