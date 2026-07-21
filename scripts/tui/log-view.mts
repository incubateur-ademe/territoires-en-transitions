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
  // offset = index ABSOLU dans le flux (lignes évincées comprises) de la
  // première ligne affichée ; null = suivi du flux. L'index absolu (et non
  // l'index du tableau interne) permet à la vue figée de rester sur la même
  // ligne logique quand LineBuffer évince ses lignes les plus anciennes.
  const [offset, setOffset] = useState<number | null>(null);
  const viewportRows = Math.max(height - 2, 1);
  const total = bufferRef.current.length;
  const evicted = bufferRef.current.evicted;
  const maxOffset = Math.max(total - viewportRows, 0);
  useInput((input, key) => {
    if (key.escape) return onBack();
    if (input === 'q') return exit();
    if (input === 'f' || key.end) return setOffset(null);
    if (key.home) return setOffset(evicted);
    const move = (delta: number) => {
      // base = index tableau courant de la position figée (ou bas si suivi).
      const base = offset === null ? maxOffset : offset - evicted;
      const next = Math.max(base + delta, 0);
      // Revenu en bas → on se raccroche au flux ; sinon on fige en absolu.
      setOffset(next >= maxOffset ? null : evicted + next);
    };
    if (key.upArrow || input === 'k') return move(-1);
    if (key.downArrow || input === 'j') return move(1);
    if (key.pageUp) return move(-viewportRows);
    if (key.pageDown) return move(viewportRows);
  });
  // Reconversion en index tableau, borné : si la ligne figée a été évincée
  // (start négatif), on colle au plus ancien disponible plutôt que de dériver.
  const start =
    offset === null
      ? maxOffset
      : Math.min(Math.max(offset - evicted, 0), maxOffset);
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
