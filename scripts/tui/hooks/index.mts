// Pont entre les classes (DockerStack, LineBuffer, StackService) et React :
// chaque hook porte un seul cycle de vie (poll statuts, poll mémoire, flux de
// logs) — les classes portent la logique, testables sans ink. La stack est
// reçue en paramètre, jamais importée : les doublures suffisent pour tester
// l'UI.
export { usePoll } from './use-poll.mts';
export type { StackSnapshot } from './use-poll.mts';
export { useStats } from './use-stats.mts';
export { useLogStream } from './use-log-stream.mts';
