// Ligne d'un service : statut (ou glyphe d'action en vol), nom, mémoire
// (dégradé de couleur), URL. Purement présentationnel — ServiceList lui
// fournit tout ce qu'elle affiche, aucun état ni logique ici.
import { Box, Text } from 'ink';
import type { StackAction } from '../docker-stack.mts';
import { memColor } from '../stack-service/index.mts';
import type { StackService, StatusGlyph } from '../stack-service/index.mts';
import { html } from '../ui-kit.mts';

// Marqueurs des actions en vol, le temps que compose rende la main.
const PENDING_GLYPHS: Record<StackAction, StatusGlyph> = {
  start: { symbol: '▶', color: 'yellow', label: 'start…' },
  stop: { symbol: '⏹', color: 'yellow', label: 'stop…' },
  restart: { symbol: '↻', color: 'yellow', label: 'restart…' },
};

interface ServiceRowProps {
  service: StackService;
  nameWidth: number;
  isSelected: boolean;
  pendingAction: StackAction | undefined;
  mem: string | undefined;
}

export const ServiceRow = ({
  service,
  nameWidth,
  isSelected,
  pendingAction,
  mem,
}: ServiceRowProps) => {
  const g = pendingAction ? PENDING_GLYPHS[pendingAction] : service.status;
  return html`
    <${Box}>
      <${Text} color=${g.color} dimColor=${service.dimmed}> ${g.symbol} <//>
      <${Text} inverse=${isSelected} dimColor=${
    service.dimmed
  }>${service.name.padEnd(nameWidth)}<//>
      <${Text} color=${g.color} dimColor=${service.dimmed}>  ${g.label.padEnd(
    12
  )}<//>
      <${Text} color=${memColor(mem)} dimColor=${service.dimmed}>${(
    mem ?? ''
  ).padStart(9)}  <//>
      ${
        service.url
          ? html`<${Text} color="cyan" dimColor=${service.dimmed} wrap="truncate-end">${service.url}<//>`
          : null
      }
    <//>`;
};
