// Clavier de la liste : navigation (flèches/vim, tab/←→ = section), actions
// (␣/d/s/r), raccourcis (⏎ logs, o ouvrir, t shell), q/Échap quitter. La
// liste (ServiceList) ne connaît, elle, que le résultat de ces callbacks.
import { useApp, useInput } from 'ink';
import type { StackAction } from '../docker-stack.mts';
import type { StackService } from '../stack-service/index.mts';
import { openUrl } from '../ui-kit.mts';

const KEY_ACTIONS: Record<string, StackAction> = {
  d: 'start',
  s: 'stop',
  r: 'restart',
};

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
}

export const useListInput = ({
  services,
  current,
  pending,
  onSelect,
  onShowLogs,
  onAction,
  onShell,
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
    // ␣ = toggle démarré/stoppé ; d/s/r = actions explicites.
    const action =
      input === ' '
        ? services[current]?.isRunning
          ? 'stop'
          : 'start'
        : KEY_ACTIONS[input];
    if (action) {
      const svc = services[current];
      // Jamais sur les one-shots : les (re)démarrer ré-exécuterait leur
      // commande (migrations sqitch, seeds…).
      if (svc && !svc.isOneShot && !pending.has(svc.name))
        onAction(action, svc.name);
    }
  });
};
