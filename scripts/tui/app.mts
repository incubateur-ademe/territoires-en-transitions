// Composant racine : navigation liste ⇄ logs, actions start/stop/restart
// avec marqueurs en vol et bandeau d'erreur d'action. La stack docker et le
// résolveur d'URLs sont injectés par l'entrée (scripts/dev-tui.mts) — aucun
// composant n'importe l'infrastructure, des doublures suffisent à tester.
import { Box, useWindowSize } from 'ink';
import { useState } from 'react';
import type { StackProfiles } from '../stack-profiles.mts';
import type { DockerStack, StackAction } from './docker-stack.mts';
import { usePoll, useProfileName, useStats } from './hooks/index.mts';
import { LogView } from './log-view.mts';
import { ServiceList } from './service-list/index.mts';
import { runningServiceNames } from './stack-service/index.mts';
import type { UrlResolver } from './stack-service/index.mts';
import { html } from './ui-kit.mts';

type View = { name: 'list' } | { name: 'logs'; service: string };

// Interlude : action qui exige le terminal (le TUI est démonté le temps de
// l'exécuter) — demandée par l'UI, exécutée par l'entrée (dev-tui.mts).
export type Interlude =
  | { kind: 'shell'; service: string }
  | { kind: 'save'; services: string[] } // services running (hors one-shots)
  | { kind: 'pick' };

interface AppProps {
  stack: DockerStack;
  resolver: UrlResolver;
  // Lecture des profiles enregistrés — injectée comme stack/resolver (pas
  // d'import de la couche de stockage ici) : une doublure suffit à tester.
  // Un thunk, pas les données : relu à chaque appel pour refléter une
  // sauvegarde (x) survenue depuis le dernier rendu.
  readProfiles: () => StackProfiles;
  // Demande d'interlude : l'entrée démonte le TUI, exécute, puis remonte une
  // nouvelle instance avec initialSelected pour retrouver la sélection.
  onInterlude: (interlude: Interlude, selected: number) => void;
  initialSelected?: number;
}

export const App = ({
  stack,
  resolver,
  readProfiles,
  onInterlude,
  initialSelected = 0,
}: AppProps) => {
  const [view, setView] = useState<View>({ name: 'list' });
  // Conservé au retour des logs (et du shell, via initialSelected).
  const [selected, setSelected] = useState(initialSelected);
  // Actions en vol (service → start|stop|restart), marqueur ▶/⏹/↻ le temps
  // que compose rende la main ; l'état vit ici pour survivre à un
  // aller-retour dans les logs.
  const [pending, setPending] = useState<Map<string, StackAction>>(
    () => new Map()
  );
  const [actionError, setActionError] = useState<string | null>(null);
  const { services, error, loaded } = usePoll(stack, resolver);
  const stats = useStats(stack);
  const profileName = useProfileName(services, readProfiles);
  const { columns, rows } = useWindowSize();
  // Garde-fous des interludes profile : bandeau d'erreur plutôt que démonter
  // le TUI pour un flux qui n'aurait rien à proposer.
  const saveProfile = () => {
    const running = runningServiceNames(services);
    if (!running.length)
      return setActionError('aucun service en marche — rien à sauvegarder');
    onInterlude({ kind: 'save', services: running }, selected);
  };
  const pickProfile = () => {
    if (!Object.keys(readProfiles()).length)
      return setActionError('aucun profile enregistré — x pour en créer un');
    onInterlude({ kind: 'pick' }, selected);
  };
  const runAction = (action: StackAction, service: string) => {
    setActionError(null);
    setPending((prev) => new Map(prev).set(service, action));
    stack
      .run(action, service)
      .catch((err: unknown) =>
        setActionError(
          `${action} ${service} : ${
            err instanceof Error ? err.message : String(err)
          }`
        )
      )
      .finally(() =>
        setPending((prev) => {
          const next = new Map(prev);
          next.delete(service);
          return next;
        })
      );
  };
  return html`
    <${Box} flexDirection="column" width=${columns} height=${rows}>
      ${
        view.name === 'logs'
          ? html`<${LogView}
            stack=${stack}
            service=${view.service}
            height=${rows}
            onBack=${() => setView({ name: 'list' })}
          />`
          : html`<${ServiceList}
            services=${services}
            error=${error}
            actionError=${actionError}
            loaded=${loaded}
            height=${rows}
            selected=${selected}
            pending=${pending}
            stats=${stats}
            profileName=${profileName}
            onSelect=${setSelected}
            onShowLogs=${(service: string) =>
              setView({ name: 'logs', service })}
            onAction=${runAction}
            onShell=${(service: string) =>
              onInterlude({ kind: 'shell', service }, selected)}
            onSaveProfile=${saveProfile}
            onPickProfile=${pickProfile}
          />`
      }
    <//>`;
};
