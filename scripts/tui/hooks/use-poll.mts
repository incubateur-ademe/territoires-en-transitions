// Poll périodique de `docker compose ps` → services enrichis. Tick immédiat
// puis toutes les POLL_MS ; un tick encore en vol fait sauter le suivant
// (docker lent) ; une erreur alimente le bandeau sans démonter la liste — la
// stack revient, l'erreur s'efface.
import { useEffect, useState } from 'react';
import type { DockerStack } from '../docker-stack.mts';
import { buildServices } from '../stack-service/index.mts';
import type { StackService, UrlResolver } from '../stack-service/index.mts';

const POLL_MS = 2000;

export interface StackSnapshot {
  services: StackService[];
  error: string | null;
  loaded: boolean;
}

const errorMessage = (err: unknown): string =>
  err instanceof Error ? err.message : String(err);

export const usePoll = (
  stack: DockerStack,
  resolver: UrlResolver
): StackSnapshot => {
  const [snapshot, setSnapshot] = useState<StackSnapshot>({
    services: [],
    error: null,
    loaded: false,
  });
  useEffect(() => {
    let alive = true;
    let busy = false;
    const tick = async () => {
      if (busy) return;
      busy = true;
      try {
        const services = buildServices(await stack.ps(), resolver);
        if (alive) setSnapshot({ services, error: null, loaded: true });
      } catch (err) {
        if (alive)
          setSnapshot((prev) => ({
            ...prev,
            error: errorMessage(err),
            loaded: true,
          }));
      } finally {
        busy = false;
      }
    };
    tick();
    const timer = setInterval(tick, POLL_MS);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [stack, resolver]);
  return snapshot;
};
