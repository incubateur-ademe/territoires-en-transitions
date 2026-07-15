// Flux de logs d'un service, accumulé dans un LineBuffer hors état React ; un
// timer de LOG_RENDER_MS re-rend seulement si de nouvelles lignes sont
// arrivées — jamais un setState par chunk (anti-flicker sur les services
// verbeux). Le compteur d'état est monotone : la longueur du buffer plafonne
// à LOG_MAX_LINES et cesserait de changer.
import { useEffect, useRef, useState } from 'react';
import type { DockerStack } from '../docker-stack.mts';
import { LineBuffer } from '../line-buffer.mts';

const LOG_TAIL = 200;
const LOG_MAX_LINES = 2000;
const LOG_RENDER_MS = 100;

export const useLogStream = (
  stack: DockerStack,
  service: string
): { current: LineBuffer } => {
  const bufferRef = useRef<LineBuffer | null>(null);
  if (bufferRef.current === null)
    bufferRef.current = new LineBuffer(LOG_MAX_LINES);
  const [, setVersion] = useState(0);
  useEffect(() => {
    const buffer = new LineBuffer(LOG_MAX_LINES);
    bufferRef.current = buffer;
    let fresh = false;
    const stop = stack.streamLogs(service, {
      tail: LOG_TAIL,
      onChunk: (chunk) => {
        if (buffer.push(chunk)) fresh = true;
      },
      onError: (err) => {
        buffer.pushLine(`✗ ${err.message}`);
        fresh = true;
      },
    });
    const timer = setInterval(() => {
      if (!fresh) return;
      fresh = false;
      setVersion((v) => v + 1);
    }, LOG_RENDER_MS);
    return () => {
      clearInterval(timer);
      stop();
    };
  }, [stack, service]);
  return bufferRef as { current: LineBuffer };
};
