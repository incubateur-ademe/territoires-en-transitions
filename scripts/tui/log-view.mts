// Vue logs : viewport scrollable sur le flux compose logs -f d'un service.
// offset null = suivi du flux ; scroller vers le haut fige, revenir en bas
// raccroche. wrap="truncate-end" garantit 1 ligne logique = 1 rangée écran :
// les offsets du viewport restent exacts quel que soit le contenu (ANSI
// compris, mesuré/tronqué par ink).
import { Box, Text, useApp, useInput } from 'ink';
import { useState } from 'react';
import type { DockerStack } from './docker-stack.mts';
import { useLogStream } from './hooks/index.mts';
import { HelpBar, html } from './ui-kit.mts';

interface LogViewProps {
  stack: DockerStack;
  service: string;
  height: number;
  onBack: () => void;
}

export const LogView = ({ stack, service, height, onBack }: LogViewProps) => {
  const { exit } = useApp();
  const bufferRef = useLogStream(stack, service);
  // offset = index de la première ligne affichée ; null = suivi du flux.
  const [offset, setOffset] = useState<number | null>(null);
  const viewportRows = Math.max(height - 2, 1);
  const total = bufferRef.current.length;
  const maxOffset = Math.max(total - viewportRows, 0);
  useInput((input, key) => {
    if (key.escape) return onBack();
    if (input === 'q') return exit();
    if (input === 'f' || key.end) return setOffset(null);
    if (key.home) return setOffset(0);
    const move = (delta: number) => {
      const next = Math.max((offset ?? maxOffset) + delta, 0);
      // Revenu en bas → on se raccroche au flux.
      setOffset(next >= maxOffset ? null : next);
    };
    if (key.upArrow || input === 'k') return move(-1);
    if (key.downArrow || input === 'j') return move(1);
    if (key.pageUp) return move(-viewportRows);
    if (key.pageDown) return move(viewportRows);
  });
  const start = offset ?? maxOffset;
  const slice = bufferRef.current.slice(start, start + viewportRows);
  const position =
    offset === null
      ? 'suivi ▸'
      : `figé ${start + 1}–${start + slice.length}/${total}`;
  return html`
    <${Box} flexDirection="column" flexGrow=${1}>
      <${Text} bold> Logs ${service} — ${position}<//>
      <${Box} flexDirection="column" flexGrow=${1}>
        ${slice.map(
          (line, i) =>
            html`<${Text} key=${start + i} wrap="truncate-end">${
              line || ' '
            }<//>`
        )}
      <//>
      <${HelpBar}>↑↓ PgUp/PgDn défiler · f suivre · Échap retour · q quitter<//>
    <//>`;
};
