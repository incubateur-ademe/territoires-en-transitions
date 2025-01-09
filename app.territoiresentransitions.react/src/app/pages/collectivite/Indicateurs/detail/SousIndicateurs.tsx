import { findCommonLinkedActions } from '../Indicateur/detail/IndicateurCompose';
import { IndicateurEnfant } from '../Indicateur/detail/IndicateurEnfant';
import { useIndicateurDefinitions } from '../Indicateur/useIndicateurDefinition';
import { TIndicateurDefinition } from '../types';

type Props = {
  definition: TIndicateurDefinition;
  enfantsIds: number[];
};

const SousIndicateurs = ({ definition, enfantsIds }: Props) => {
  const { data: enfants } = useIndicateurDefinitions(definition.id, enfantsIds);

  if (!enfants?.length) return null;

  const actionsLieesCommunes = findCommonLinkedActions([
    definition,
    ...enfants,
  ]);

  const enfantsTries = enfants.sort((a, b) => {
    if (!a.identifiant || !b.identifiant) {
      return 0;
    }
    return a.identifiant.localeCompare(b.identifiant);
  });

  return (
    <div>
      {enfantsTries.map((enfant) => (
        <IndicateurEnfant
          key={enfant.id}
          definition={enfant}
          actionsLieesCommunes={actionsLieesCommunes}
        />
      ))}
    </div>
  );
};

export default SousIndicateurs;
