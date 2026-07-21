// Tableau de bord interactif de la stack docker `tet` (make tui) : statuts et
// santé des services (docker compose ps, rafraîchi toutes les 2 s), URL locale
// de chaque composant, logs navigables par service (compose logs -f, scroll,
// Échap pour revenir à la liste), actions ciblées (s ou espace start/stop,
// r relancer) et profiles de stack (x sauvegarder, p recharger).
// Utilisable depuis un worktree, comme make logs / make ps : les actions,
// compose start/stop/restart, agissent sur le conteneur EN PLACE (aucune
// recréation, donc pas de remontage des bind mounts du worktree dans la
// stack partagée).
//   make tui   |   node scripts/dev-tui.mts [--once]
// --once : snapshot texte sans TUI (utilisable sans TTY, ex. par la CI).
// Ce fichier n'est que l'entrée : le TUI vit dans scripts/tui/ (adapter
// docker, modèle des services, hooks, vues — injectés ici, jamais importés
// entre eux en sens inverse). Exécuté par node nu : le type-stripping natif
// (Node ≥ 23.6) retire les types des .mts, d'où htm plutôt que du JSX.
import { pathToFileURL } from 'node:url';
import { render } from 'ink';
import { writeEnvValue } from './env-local.mts';
import {
  pauseForEnter,
  pickProfileFlow,
  saveProfileFlow,
} from './stack-profile-prompts.mts';
import { readStackProfiles } from './stack-profiles.mts';
import { App } from './tui/app.mts';
import type { Interlude } from './tui/app.mts';
import { DockerStack } from './tui/docker-stack.mts';
import type { StackAction } from './tui/docker-stack.mts';
import {
  SECTION_TITLES,
  UrlResolver,
  buildServices,
  runningServiceNames,
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

// Bascule la stack vers un profile par compose start/stop EN PLACE (les
// équivalents du toggle s/␣, service par service) : ni down, ni recréation,
// ni build — la bascule ne coûte que le démarrage/arrêt du différentiel.
// Contrepartie : un conteneur jamais créé ne peut pas être démarré ainsi —
// make up p="<nom>" reste la voie de réconciliation complète, proposée en
// cas d'échec (pause avant remontage, l'alternate screen masquerait tout).
const applyProfile = async (
  name: string,
  stack: DockerStack,
  resolver: UrlResolver
): Promise<void> => {
  const entry = readStackProfiles()[name];
  if (!entry) return;
  // Mémorise la sélection — même source de vérité que pick-stack/make up.
  writeEnvValue('.env.local', 'COMPOSE_PROFILES', entry.profiles);
  // Différentiel ensembliste symétrique entre l'état running (hors one-shots,
  // même définition que le matching d'en-tête) et le snapshot du profile.
  const running = new Set(
    runningServiceNames(buildServices(await stack.ps(), resolver))
  );
  const snapshot = new Set(entry.services);
  const toStop = [...running].filter((svc) => !snapshot.has(svc));
  const toStart = entry.services.filter((svc) => !running.has(svc));
  if (!toStop.length && !toStart.length) return;
  if (toStop.length) console.log(`⏹ stop  : ${toStop.join(' ')}`);
  if (toStart.length) console.log(`▶ start : ${toStart.join(' ')}`);
  // Un seul `compose stop`/`start` par sens (compose accepte plusieurs
  // services) plutôt qu'un process par service : la bascule ne paie que deux
  // invocations au lieu de N+M re-parsings du projet. On perd l'attribution
  // d'erreur par service, tolérable puisqu'un échec renvoie vers make up.
  const batches: { action: StackAction; services: string[] }[] = [];
  if (toStop.length) batches.push({ action: 'stop', services: toStop });
  if (toStart.length) batches.push({ action: 'start', services: toStart });
  const results = await Promise.allSettled(
    batches.map((b) => stack.run(b.action, ...b.services))
  );
  const failures = results
    .map((result, i) => ({ result, batch: batches[i] }))
    .filter(({ result }) => result.status === 'rejected');
  if (failures.length) {
    for (const { result, batch } of failures)
      console.error(
        `✗ ${batch.action} ${batch.services.join(' ')} : ${String(
          (result as PromiseRejectedResult).reason
        )}`
      );
    await pauseForEnter(
      `bascule incomplète — make up p="${name}" pour une réconciliation complète ; entrée pour revenir`
    );
  }
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
  // Boucle rendre ⇄ interlude : certaines actions exigent le terminal (t
  // shell, x sauvegarde de profile, p chargement de profile) — le TUI
  // se démonte (ink restaure écran et raw mode), l'interlude s'exécute, puis
  // on remonte une nouvelle instance en retrouvant la sélection. Holder muté
  // par le callback — pas une variable locale, pour que TS ne fige pas le
  // narrowing.
  const request: {
    current: { interlude: Interlude; selected: number } | null;
  } = { current: null };
  let initialSelected = 0;
  for (;;) {
    request.current = null;
    const instance = render(
      html`<${App}
        stack=${stack}
        resolver=${resolver}
        readProfiles=${readStackProfiles}
        initialSelected=${initialSelected}
        onInterlude=${(interlude: Interlude, selected: number) => {
          request.current = { interlude, selected };
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
    const req = request.current as {
      interlude: Interlude;
      selected: number;
    } | null;
    if (!req) break;
    initialSelected = req.selected;
    const { interlude } = req;
    if (interlude.kind === 'shell') await stack.shell(interlude.service);
    else {
      // ink dé-référence stdin au démontage (cleanup de useInput) ; readline
      // (prompts) le relit sans le re-référencer — sans ref(), la boucle
      // d'événements se vide pendant l'attente du clavier et node sort
      // (« unsettled top-level await »). Le resume() de fermeture (sinon
      // l'instance ink remontée ne reçoit plus aucune touche) et la gestion
      // d'erreur DOIVENT tourner même si un flux jette (docker indisponible,
      // écriture .env.local) — try/catch/finally, sans quoi la boucle
      // sortirait sur un rejet non géré au lieu de remonter le TUI.
      process.stdin.ref();
      try {
        if (interlude.kind === 'save')
          await saveProfileFlow(interlude.services);
        else {
          const name = await pickProfileFlow();
          if (name) await applyProfile(name, stack, resolver);
        }
      } catch (err) {
        await pauseForEnter(
          `✗ ${err instanceof Error ? err.message : String(err)} — entrée pour revenir au tableau de bord`
        );
      } finally {
        process.stdin.resume();
      }
    }
  }
}
