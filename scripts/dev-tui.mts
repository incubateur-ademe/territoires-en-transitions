// Tableau de bord interactif de la stack docker `tet` (make tui) : statuts et
// santé des services (docker compose ps, rafraîchi toutes les 2 s), URL locale
// de chaque composant, logs navigables par service (compose logs -f, scroll,
// Échap pour revenir à la liste) et actions ciblées : d démarrer, s stopper,
// r relancer. Utilisable depuis un worktree, comme make logs / make ps : les
// actions, compose start/stop/restart, agissent sur le conteneur EN PLACE
// (aucune recréation, donc pas de remontage des bind mounts du worktree dans
// la stack partagée).
//   make tui   |   node scripts/dev-tui.mts [--once]
// --once : snapshot texte sans TUI (utilisable sans TTY, ex. par la CI).
// Ce fichier n'est que l'entrée : le TUI vit dans scripts/tui/ (adapter
// docker, modèle des services, hooks, vues — injectés ici, jamais importés
// entre eux en sens inverse). Exécuté par node nu : le type-stripping natif
// (Node ≥ 23.6) retire les types des .mts, d'où htm plutôt que du JSX.
import { pathToFileURL } from 'node:url';
import { render } from 'ink';
import { App } from './tui/app.mts';
import { DockerStack } from './tui/docker-stack.mts';
import {
  SECTION_TITLES,
  UrlResolver,
  buildServices,
  totalMemory,
} from './tui/stack-service/index.mts';
import type { StackService } from './tui/stack-service/index.mts';
import { html } from './tui/ui-kit.mts';

const printSnapshot = (
  services: StackService[],
  stats: Map<string, string>
): void => {
  if (!services.length) {
    console.log('aucun conteneur — lancez make up');
    return;
  }
  const nameWidth = Math.max(...services.map((s) => s.name.length));
  const labels = services.map((s) => s.status.label);
  const labelWidth = Math.max(...labels.map((l) => l.length));
  let section = -1;
  services.forEach((s, i) => {
    if (s.section !== section) {
      section = s.section;
      console.log(SECTION_TITLES[section] ?? '');
    }
    const mem = stats.get(s.containerName) ?? '';
    console.log(
      `${s.status.symbol} ${s.name.padEnd(nameWidth)}  ${labels[i].padEnd(labelWidth)}  ${mem.padStart(9)}  ${s.url ?? ''}`.trimEnd()
    );
  });
  const total = totalMemory(stats.values());
  if (total) console.log(`RAM totale : ${total.label}`);
};

const isMain =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  const stack = new DockerStack();
  const resolver = new UrlResolver();
  if (process.argv.includes('--once')) {
    try {
      const [rows, statsRows] = await Promise.all([stack.ps(), stack.stats()]);
      printSnapshot(
        buildServices(rows, resolver),
        new Map(statsRows.map((r) => [r.Name, r.MemUsage.split(' / ')[0]]))
      );
      process.exit(0);
    } catch (err) {
      console.error(`✗ ${err instanceof Error ? err.message : String(err)}`);
      process.exit(1);
    }
  }
  if (!process.stdout.isTTY || !process.stdin.isTTY) {
    console.error(
      '✗ pas de TTY — le tableau de bord exige un terminal interactif (snapshot : node scripts/dev-tui.mts --once)'
    );
    process.exit(1);
  }
  // Boucle rendre ⇄ shell : `t` démonte le TUI (ink restaure écran et raw
  // mode), compose exec prend le terminal, puis on remonte une nouvelle
  // instance en retrouvant la sélection. Holder muté par le callback — pas
  // une variable locale, pour que TS ne fige pas le narrowing.
  const shellRequest: {
    current: { service: string; selected: number } | null;
  } = { current: null };
  let initialSelected = 0;
  for (;;) {
    shellRequest.current = null;
    const instance = render(
      html`<${App}
        stack=${stack}
        resolver=${resolver}
        initialSelected=${initialSelected}
        onShell=${(service: string, selected: number) => {
          shellRequest.current = { service, selected };
          instance.unmount();
        }}
      />`,
      {
        alternateScreen: true, // scrollback du shell préservé, restauré à la sortie
        incrementalRendering: true, // ne repeint que les lignes modifiées
        exitOnCtrlC: true,
      }
    );
    await instance.waitUntilExit();
    // Cast : TS a figé le narrowing à null (la mutation vit dans le callback).
    const request = shellRequest.current as {
      service: string;
      selected: number;
    } | null;
    if (!request) break;
    initialSelected = request.selected;
    await stack.shell(request.service);
  }
}
