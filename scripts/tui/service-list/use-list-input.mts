// Clavier de la liste : navigation (flèches/vim, tab/←→ = section), actions
// (s/␣ toggle, r relancer), raccourcis (⏎ logs, o ouvrir, t shell, p charger
// un profile, x le sauvegarder), q/Échap quitter. La liste (ServiceList)
// ne connaît, elle, que le résultat de ces callbacks.
import { useApp, useInput } from 'ink';
import type { StackAction } from '../docker-stack.mts';
import type { StackService } from '../stack-service/index.mts';
import { openUrl } from '../ui-kit.mts';

// Index du premier service de chaque section présente.
const sectionStarts = (services: StackService[]): number[] => {
  const starts: number[] = [];
  let section = -1;
  services.forEach((service, index) => {
    if (service.section !== section) {
      section = service.section;
      starts.push(index);
    }
  });
  return starts;
};

interface UseListInputParams {
  services: StackService[];
  current: number;
  pending: Map<string, StackAction>;
  onSelect: (index: number) => void;
  onShowLogs: (service: string) => void;
  onAction: (action: StackAction, service: string) => void;
  onShell: (service: string) => void;
  onSaveProfile: () => void;
  onPickProfile: () => void;
}

export const useListInput = ({
  services,
  current,
  pending,
  onSelect,
  onShowLogs,
  onAction,
  onShell,
  onSaveProfile,
  onPickProfile,
}: UseListInputParams): void => {
  const { exit } = useApp();
  // Saut cyclique au premier service de la section suivante/précédente.
  const jumpSection = (dir: 1 | -1) => {
    const starts = sectionStarts(services);
    if (!starts.length) return;
    const at = starts.findLastIndex((start) => start <= current);
    onSelect(starts[(at + dir + starts.length) % starts.length]);
  };
  useInput((input, key) => {
    // ^s = alias de x (sauvegarde). On n'avale que les ctrl+lettre, qui
    // entreraient sinon en collision avec les toggles ; ctrl+flèches (input
    // vide, key.upArrow/… positionné) retombe sur la navigation ci-dessous.
    // ctrl+c n'arrive pas ici (exitOnCtrlC d'ink l'intercepte avant).
    // NB : ctrl+s et F10 sont souvent interceptés par le terminal ou l'IDE,
    // d'où une simple lettre (x) comme raccourci officiel.
    if (key.ctrl) {
      if (input === 's') onSaveProfile();
      if (input) return;
    }
    if (input === 'q' || key.escape) return exit();
    if (key.upArrow || input === 'k') return onSelect(Math.max(current - 1, 0));
    if (key.downArrow || input === 'j')
      return onSelect(Math.min(current + 1, services.length - 1));
    if (key.tab) return jumpSection(key.shift ? -1 : 1);
    if (key.rightArrow) return jumpSection(1);
    if (key.leftArrow) return jumpSection(-1);
    if (key.return && services[current])
      return onShowLogs(services[current].name);
    if (input === 'o') {
      const url = services[current]?.url;
      if (url?.startsWith('http')) openUrl(url);
    }
    if (input === 't') {
      const svc = services[current];
      // Un exec exige un conteneur en marche.
      if (svc?.isRunning) onShell(svc.name);
    }
    if (input === 'p') return onPickProfile();
    if (input === 'x') return onSaveProfile();
    // s ou ␣ = toggle démarré/stoppé ; r = relance explicite.
    const action: StackAction | undefined =
      input === ' ' || input === 's'
        ? services[current]?.isRunning
          ? 'stop'
          : 'start'
        : input === 'r'
          ? 'restart'
          : undefined;
    if (action) {
      const svc = services[current];
      // Jamais sur les one-shots : les (re)démarrer ré-exécuterait leur
      // commande (migrations sqitch, seeds…).
      if (svc && !svc.isOneShot && !pending.has(svc.name))
        onAction(action, svc.name);
    }
  });
};
