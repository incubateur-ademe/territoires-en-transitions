// Mémoire par conteneur (nom de conteneur → « 885.2MiB »), sur un poll séparé
// et plus lent que usePoll (le sampling `stats --no-stream` coûte ~2 s à lui
// seul). Best-effort : une erreur conserve la dernière valeur, jamais de
// bandeau — c'est de la télémétrie de confort, pas un état de la stack.
import { useEffect, useState } from 'react';
import type { DockerStack } from '../docker-stack.mts';

// stats --no-stream sample ~2 s par appel : poll dédié, plus lent que ps.
const STATS_MS = 4000;

export const useStats = (stack: DockerStack): Map<string, string> => {
  const [stats, setStats] = useState<Map<string, string>>(() => new Map());
  useEffect(() => {
    let alive = true;
    let busy = false;
    const tick = async () => {
      if (busy) return;
      busy = true;
      try {
        const rows = await stack.stats();
        if (alive)
          setStats(
            new Map(rows.map((r) => [r.Name, r.MemUsage.split(' / ')[0]]))
          );
      } catch {
        /* best-effort : on garde la dernière mesure */
      } finally {
        busy = false;
      }
    };
    tick();
    const timer = setInterval(tick, STATS_MS);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [stack]);
  return stats;
};
