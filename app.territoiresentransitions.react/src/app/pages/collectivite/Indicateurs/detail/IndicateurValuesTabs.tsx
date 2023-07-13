import {Tab, Tabs, useActiveTab} from 'ui/shared/Tabs';
import {TIndicateurDefinition} from '../types';
import {useCurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';
import {IndicateurValuesTable} from './IndicateurValuesTable';

/** Affiche les onglets résultats/objectifs */
export const IndicateurValuesTabs = ({
  definition,
}: {
  definition: TIndicateurDefinition;
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
          />
        )}
      </Tab>
      <Tab label="Objectifs" icon="calendar-2">
        {activeTab === 1 && (
          <IndicateurValuesTable
            definition={definition}
            type="objectif"
            isReadonly={isReadonly}
          />
        )}
      </Tab>
    </Tabs>
  );
};
