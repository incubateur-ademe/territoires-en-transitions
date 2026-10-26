import 'server-only';

import { unstable_cache } from 'next/cache';

const PEERTUBE_ORIGIN = 'https://tube.numerique.gouv.fr';
const PEERTUBE_VIDEO_ID = '9QfiUGr3fXiwHRCndgbwBt';

const PEERTUBE_DEMO_URL = `${PEERTUBE_ORIGIN}/w/${PEERTUBE_VIDEO_ID}`;
const YOUTUBE_DEMO_URL = 'https://www.youtube.com/watch?v=fFyxb7M4Wio';

async function isPeertubeVideoAvailable(): Promise<boolean> {
  try {
    const response = await fetch(
      `${PEERTUBE_ORIGIN}/api/v1/videos/${PEERTUBE_VIDEO_ID}`,
      { signal: AbortSignal.timeout(3000), cache: 'no-store' }
    );
    return response.ok;
  } catch {
    return false;
  }
}

// Une iframe ne signale pas l'échec de chargement d'une source tierce : la
// disponibilité de l'instance se vérifie donc côté serveur. Le résultat, panne
// comprise, est gardé 5 minutes pour qu'une instance qui ne répond plus ne
// ralentisse pas chaque visite.
const isPeertubeVideoAvailableCached = unstable_cache(
  isPeertubeVideoAvailable,
  ['demo-video-peertube-available'],
  { revalidate: 300 }
);

/** Vidéo de démo : celle de tube.numerique.gouv.fr, YouTube si l'instance est indisponible. */
export async function getDemoVideoUrl(): Promise<string> {
  return (await isPeertubeVideoAvailableCached())
    ? PEERTUBE_DEMO_URL
    : YOUTUBE_DEMO_URL;
}
