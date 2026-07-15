// Liste rendue = en-têtes de section intercalés entre les services (triés
// par section) — pure transformation, aucun état.
import { SECTION_TITLES } from '../stack-service/index.mts';
import type { StackService } from '../stack-service/index.mts';

export type ListItem =
  | { kind: 'header'; label: string }
  | { kind: 'service'; service: StackService; index: number };

export const buildItems = (services: StackService[]): ListItem[] => {
  const items: ListItem[] = [];
  let section = -1;
  services.forEach((service, index) => {
    if (service.section !== section) {
      section = service.section;
      items.push({ kind: 'header', label: SECTION_TITLES[section] ?? '' });
    }
    items.push({ kind: 'service', service, index });
  });
  return items;
};
