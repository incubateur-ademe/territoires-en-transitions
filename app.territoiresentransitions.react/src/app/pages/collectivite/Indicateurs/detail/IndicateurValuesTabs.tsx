import {Tab, Tabs, useActiveTab} from 'ui/shared/Tabs';
import ToggleButton from 'ui/shared/designSystem/ToggleButton';
import {TIndicateurDefinition} from '../types';
import {useCurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';
import {IndicateurValuesTable} from './IndicateurValuesTable';
import {SOURCE_COLLECTIVITE} from './useImportSources';
import {useToggleIndicateurConfidentiel} from './useToggleIndicateurConfidentiel';
import {useIndicateurInfoLiees} from './useIndicateurInfoLiees';

/** Affiche les onglets résultats/objectifs */
export const IndicateurValuesTabs = ({
  definition,
  importSource,
}: {
  definition: TIndicateurDefinition;
  importSource?: string;
}) => {
  const {activeTab, onChangeTab} = useActiveTab();
  const collectivite = useCurrentCollectivite();
  const isReadonly = !collectivite || collectivite.readonly;
  const {mutate: toggleIndicateurConfidentiel, isLoading} =
    useToggleIndicateurConfidentiel(definition);
  const {data} = useIndicateurInfoLiees(definition);
  const {confidentiel} = data || {};

  return (
    <>
      {!isReadonly && (
        <ToggleButton
          className="mb-4"
          description="Le résultat le plus récent est en mode privé"
          isChecked={confidentiel}
          disabled={isLoading}
          onClick={() => toggleIndicateurConfidentiel(confidentiel || false)}
        />
      )}
      <Tabs defaultActiveTab={activeTab} onChange={onChangeTab}>
        <Tab label="Résultats" icon="checkbox">
          {activeTab === 0 && (
            <IndicateurValuesTable
              definition={definition}
              type="resultat"
              isReadonly={isReadonly}
              importSource={importSource}
            />
          )}
        </Tab>
        {!importSource || importSource === SOURCE_COLLECTIVITE ? (
          <Tab label="Objectifs" icon="calendar-2">
            {activeTab === 1 && (
              <IndicateurValuesTable
                definition={definition}
                type="objectif"
                isReadonly={isReadonly}
              />
            )}
          </Tab>
        ) : null}
      </Tabs>
    </>
  );
};
