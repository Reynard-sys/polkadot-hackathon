const IPFS_GATEWAY = "https://gateway.pinata.cloud/ipfs/";

export function getFastCardImageUrl(imageUrl: string) {
  const marker = "/ipfs/";
  const markerIndex = imageUrl.indexOf(marker);

  if (markerIndex === -1) return imageUrl;
  return `${IPFS_GATEWAY}${imageUrl.slice(markerIndex + marker.length)}`;
}

export function preloadCardImage(imageUrl: string) {
  return new Promise<void>((resolve) => {
    if (!imageUrl || typeof window === "undefined") {
      resolve();
      return;
    }

    const image = new window.Image();
    const timeout = window.setTimeout(() => resolve(), 8_000);
    const finish = () => {
      window.clearTimeout(timeout);
      resolve();
    };
    image.onload = finish;
    image.onerror = finish;
    image.src = getFastCardImageUrl(imageUrl);

    if (image.complete) finish();
  });
}
