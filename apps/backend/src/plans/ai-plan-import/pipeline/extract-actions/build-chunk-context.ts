import { ExtractedAction } from '../../models/extracted-action';

const CONTEXT_TITLES_COUNT = 5;

/**
 * Préambule d'une tranche après la première : sans lui, le modèle ignore à
 * quel axe se rattachent les actions qui ouvrent la tranche.
 */
export const buildChunkContext = ({
  chunkIndex,
  chunkCount,
  previousActions,
}: {
  chunkIndex: number;
  chunkCount: number;
  previousActions: ExtractedAction[];
}): string => {
  const sentences = [
    `Extrait ${
      chunkIndex + 1
    } sur ${chunkCount} d'un document découpé pour l'analyse.`,
  ];
  const lastAction = previousActions.at(-1);
  if (lastAction) {
    const sousAxe = lastAction.sousAxe
      ? ` et le sous-axe « ${lastAction.sousAxe} »`
      : '';
    const titles = previousActions
      .slice(-CONTEXT_TITLES_COUNT)
      .map((action) => `« ${action.titre} »`)
      .join(', ');
    sentences.push(
      `L'extrait précédent se terminait dans l'axe « ${lastAction.axe} »${sousAxe} : rattachez-y les actions de cet extrait tant que le texte n'ouvre pas un autre axe ou sous-axe.`,
      `Ses dernières actions étaient : ${titles}. Le début de cet extrait peut les reprendre : n'en faites pas de nouvelles actions, mais reprenez-les sous le même titre si le texte les complète.`
    );
  }
  return `[${sentences.join(' ')}]\n\n`;
};
