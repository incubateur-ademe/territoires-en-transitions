import { format } from "date-fns";

export const getFilename = (nom: string, ext: string) => `Export_${nom}_${format(new Date(), 'yyyy-MM-dd')}.${ext}`;

const depthToLabel: Record<number, string> = {
  1: 'Axe (x)',
  2: 'Sous-axe (x.x)',
  3: 'Sous-sous-axe (x.x.x)',
};
export const getDepthLabel = (depth: number) => depthToLabel[depth] || Array(depth).fill('x').join('.');

export const participationCitoyenneTypeToLabel: Record<string, string> = {
  'pas-de-participation': 'Pas de participation citoyenne',
  information: 'Information',
  consultation: 'Consultation',
  concertation: 'Concertation',
  'co-construction': 'Co-construction',
};
