import {Tab, Tabs, useActiveTab} from 'ui/shared/Tabs';
import {TIndicateurDefinition} from '../types';
import {useCurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';
import {IndicateurValuesTable} from './IndicateurValuesTable';
import {SOURCE_COLLECTIVITE} from './useImportSources';

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

  return (
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
  );
};
