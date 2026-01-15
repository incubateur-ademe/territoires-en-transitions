import IndicateurCard from '@/app/app/pages/collectivite/Indicateurs/lists/IndicateurCard/IndicateurCard';
import { getIndicateurGroup } from '@/app/app/pages/collectivite/Indicateurs/lists/IndicateurCard/utils';
import { makeCollectiviteIndicateursUrl } from '@/app/app/paths';
import { hasPermission } from '@/app/users/authorizations/permission-access-level.utils';
import { Button } from '@tet/ui';
import { PlanDisplayOptionsEnum } from '../plan-options.context';
import { AxeSectionTitle } from './axe-section-title';
import { useAxeContext } from './axe.context';

export const AxeIndicateurs = () => {
  const {
    planOptions,
    isOpen,
    isReadOnly,
    selectedIndicateurs,
    toggleIndicateur,
    providerProps,
  } = useAxeContext();
  const { collectivite } = providerProps;
  const isEditable = hasPermission(
    collectivite.permissions,
    'indicateurs.indicateurs.update'
  );

  if (
    !isOpen ||
    !planOptions.isOptionEnabled(PlanDisplayOptionsEnum.INDICATEURS) ||
    !selectedIndicateurs?.length
  ) {
    return null;
  }

  return (
    <section>
      <AxeSectionTitle name="indicateurs" />
      <div className="grid sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-3 pt-4">
        {selectedIndicateurs.map((indicateur) => {
          const collectiviteId = collectivite.collectiviteId;
          return (
            <IndicateurCard
              key={`${indicateur.id}-${indicateur.titre}`}
              readonly={collectivite.isReadOnly}
              isEditable={isEditable}
              definition={indicateur}
              externalCollectiviteId={collectiviteId}
              hideChart={
                !planOptions.isOptionEnabled(
                  PlanDisplayOptionsEnum.GRAPHIQUE_INDICATEURS
                )
              }
              href={makeCollectiviteIndicateursUrl({
                collectiviteId,
                indicateurView: getIndicateurGroup(
                  indicateur.identifiantReferentiel
                ),
                indicateurId: indicateur.id,
                identifiantReferentiel: indicateur.identifiantReferentiel,
              })}
              selectState={{
                selected: true,
                setSelected: (indicateur) => toggleIndicateur(indicateur),
              }}
              otherMenuActions={
                isReadOnly
                  ? undefined
                  : (indicateur) => [
                      <Button
                        key={indicateur.id}
                        onClick={() => toggleIndicateur(indicateur)}
                        icon="link-unlink"
                        title="Dissocier l'indicateur"
                        size="xs"
                        variant="grey"
                      />,
                    ]
              }
            />
          );
        })}
      </div>
    </section>
  );
};
