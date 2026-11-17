import type { DefinitionFieldsInput } from '@/app/indicateurs/indicateurs/use-update-indicateur';
import type { IndicateurDetaille } from '@tet/domain/indicateurs';

export type IndicateurTexteField = 'titre' | 'unite' | 'commentaire';

export const toTexteUpdate = ({
  indicateur,
  field,
  texte,
}: {
  indicateur: Pick<IndicateurDetaille, IndicateurTexteField>;
  field: IndicateurTexteField;
  texte: string;
}): DefinitionFieldsInput | null => {
  const trimmedTexte = texte.trim();
  return trimmedTexte === indicateur[field] ? null : { [field]: trimmedTexte };
};
