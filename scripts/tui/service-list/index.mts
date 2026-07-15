// Vue liste : une ligne par service (statut, nom, URL), sélection au clavier
// et raccourcis. N'exécute rien elle-même : elle remonte des callbacks
// étroits (onSelect / onShowLogs / onAction) — l'orchestration vit dans App,
// le clavier dans use-list-input, le rendu d'une ligne dans service-row.
import { Box, Spacer, Text } from 'ink';
import type { StackAction } from '../docker-stack.mts';
import { totalMemory } from '../stack-service/index.mts';
import type { StackService } from '../stack-service/index.mts';
import { HelpBar, html } from '../ui-kit.mts';
import { buildItems } from './list-items.mts';
import { ServiceRow } from './service-row.mts';
import { useListInput } from './use-list-input.mts';

interface ServiceListProps {
  services: StackService[];
  error: string | null;
  actionError: string | null;
  loaded: boolean;
  height: number;
  selected: number;
  pending: Map<string, StackAction>;
  stats: Map<string, string>;
  onSelect: (index: number) => void;
  onShowLogs: (service: string) => void;
  onAction: (action: StackAction, service: string) => void;
  onShell: (service: string) => void;
}

export const ServiceList = ({
  services,
  error,
  actionError,
  loaded,
  height,
  selected,
  pending,
  stats,
  onSelect,
  onShowLogs,
  onAction,
  onShell,
}: ServiceListProps) => {
  // La liste bouge entre deux polls : l'index sélectionné est re-clampé.
  const current = Math.max(0, Math.min(selected, services.length - 1));
  useListInput({
    services,
    current,
    pending,
    onSelect,
    onShowLogs,
    onAction,
    onShell,
  });
  // Fenêtre de défilement si la liste dépasse l'écran (titre + aide + erreurs).
  const listRows = Math.max(
    height - 2 - (error ? 1 : 0) - (actionError ? 1 : 0),
    1
  );
  const items = buildItems(services);
  const selectedAt = items.findIndex(
    (item) => item.kind === 'service' && item.index === current
  );
  const start = Math.max(
    0,
    Math.min(selectedAt - Math.floor(listRows / 2), items.length - listRows)
  );
  const visible = items.slice(start, start + listRows);
  const nameWidth = Math.max(0, ...services.map((s) => s.name.length));
  const totalMem = totalMemory(stats.values());
  return html`
    <${Box} flexDirection="column" flexGrow=${1}>
      <${Box}>
        <${Text} bold> tet — stack locale<//>
        ${
          totalMem
            ? html`<${Text} dimColor> · RAM <//><${Text} color=${totalMem.color}>${totalMem.label}<//>`
            : null
        }
      <//>
      ${error ? html`<${Text} color="red"> ✗ ${error}<//>` : null}
      ${actionError ? html`<${Text} color="red"> ✗ ${actionError}<//>` : null}
      ${
        loaded && !services.length && !error
          ? html`<${Text} dimColor> aucun conteneur — lancez make up<//>`
          : null
      }
      ${visible.map((item) =>
        item.kind === 'header'
          ? html`<${Text} key=${`section-${item.label}`} bold dimColor> ${
              item.label
            }<//>`
          : html`<${ServiceRow}
              key=${item.service.name}
              service=${item.service}
              nameWidth=${nameWidth}
              isSelected=${item.index === current}
              pendingAction=${pending.get(item.service.name)}
              mem=${stats.get(item.service.containerName)}
            />`
      )}
      <${Spacer} />
      <${HelpBar}>↑↓ ←→ · ⏎ logs · t shell · o ouvrir · ␣ start/stop · r relancer · q quitter<//>
    <//>`;
};
