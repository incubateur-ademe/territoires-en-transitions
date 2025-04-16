import { Action } from '@/domain/referentiels';
import { TAxe } from './axe';

export const buildReferentiel = (actions: Action[]): TAxe[] => {
  return actions.reduce((acc: TAxe[], a) => {
    const parentAxe = acc.find((axe) => a.actionId.startsWith(axe.actionId));
    if (a.actionType === 'axe' || a.actionType === 'sous-axe') {
      // Sous-axe
      if (parentAxe) {
        parentAxe.children?.push({ ...a, children: [] });
        // Axe
      } else {
        acc.push({ ...a, children: [] });
      }
    }
    if (a.actionType === 'action') {
      // Ajout à un sous-axe
      const parentSousAxe = parentAxe?.children?.find((sousAxe) =>
        a.actionId.startsWith(sousAxe.actionId)
      );
      if (parentSousAxe) {
        parentSousAxe.children = parentSousAxe.children || [];
        parentSousAxe.children.push(a);
      } else {
        // Ajout à un axe
        if (parentAxe) {
          parentAxe.children = parentAxe.children || [];
          parentAxe.children.push(a);
        }
      }
    }
    return acc;
  }, []);
};
