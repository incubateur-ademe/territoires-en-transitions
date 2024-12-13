import { transformeValeurs } from '@/app/app/pages/collectivite/Indicateurs/Indicateur/detail/transformeValeurs';
import { useIndicateurValeurs } from '@/app/app/pages/collectivite/Indicateurs/useIndicateurValeurs';
import { useCurrentCollectivite } from '@/app/core-logic/hooks/useCurrentCollectivite';
import { Tab, Tabs, useActiveTab } from '@/app/ui/shared/Tabs';
import { Checkbox, Tooltip } from '@/ui';
import { useEffect } from 'react';
import { SOURCE_COLLECTIVITE } from '../../constants';
import { TIndicateurDefinition } from '../../types';
import { IndicateurValuesTable } from './IndicateurValuesTable';
import { useToggleIndicateurConfidentiel } from './useToggleIndicateurConfidentiel';

/** Affiche les onglets résultats/objectifs */
export const IndicateurValuesTabs = ({
  definition,
  importSource,
}: {
  definition: TIndicateurDefinition;
  importSource?: string;
}) => {
  const { activeTab, onChangeTab } = useActiveTab();
  const collectivite = useCurrentCollectivite();
  const isReadonly =
    !collectivite ||
    collectivite.readonly ||
    (!!importSource && importSource !== SOURCE_COLLECTIVITE);
  const { mutate: toggleIndicateurConfidentiel, isLoading } =
    useToggleIndicateurConfidentiel(definition);
  const { confidentiel } = definition;

  const { data: valeursBrutes } = useIndicateurValeurs({
    id: definition.id,
    importSource,
  });
  const { objectifs, resultats } = transformeValeurs(
    valeursBrutes,
    importSource
  );

  // force l'affichage de l'onglet Résultats sil il n'y a pas d'onglet Objectifs
  // quand on passe d'une source de données à une autre
  const avecResultats =
    !importSource ||
    importSource === SOURCE_COLLECTIVITE ||
    resultats?.length > 0;
  const avecObjectifs =
    !importSource ||
    importSource === SOURCE_COLLECTIVITE ||
    objectifs?.length > 0;

  useEffect(() => {
    if (activeTab === 1 && !(avecObjectifs && avecResultats)) {
      onChangeTab(0);
    }
  }, [avecObjectifs, avecResultats, activeTab]);

  return (
    <>
      {!isReadonly && (
        <>
          <div className="flex my-10">
            <Tooltip
              label="Si le mode privé est activé, le résultat le plus récent n'est plus
              consultable par les personnes n’étant pas membres de votre
              collectivité. Seuls les autres résultats restent accessibles pour
              tous les utilisateurs et la valeur privée reste consultable par
              l’ADEME et le service support de la plateforme."
            >
              <div>
                {' '}
                {/** Permet de prendre en compte la checkbox + le label (autrement uniquement la checkbox trigger le tooltip) */}
                <Checkbox
                  variant="switch"
                  label="Résultat récent en mode privé"
                  checked={confidentiel}
                  disabled={isLoading}
                  onChange={() =>
                    toggleIndicateurConfidentiel(confidentiel || false)
                  }
                />
              </div>
            </Tooltip>
          </div>
        </>
      )}
      <Tabs defaultActiveTab={activeTab} onChange={onChangeTab}>
        {avecResultats ? (
          <Tab label="Résultats" icon="checkbox">
            <IndicateurValuesTable
              definition={definition}
              type="resultat"
              valeurs={resultats}
              valeursBrutes={valeursBrutes!}
              isReadonly={isReadonly}
              importSource={importSource}
              confidentiel={confidentiel}
            />
          </Tab>
        ) : null}
        {avecObjectifs ? (
          <Tab label="Objectifs" icon="calendar-2">
            <IndicateurValuesTable
              definition={definition}
              type="objectif"
              valeurs={objectifs}
              valeursBrutes={valeursBrutes!}
              isReadonly={isReadonly}
            />
          </Tab>
        ) : null}
      </Tabs>
    </>
  );
};
