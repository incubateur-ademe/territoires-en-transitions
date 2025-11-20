/**
 * Affiche toutes les preuves réglementaires/complémentaires de la collectivité
 * par référentiel et niveau
 */

import { referentielToName } from '@/app/app/labels';
import { Tab, Tabs } from '@/app/ui/shared/Tabs';
import { ReferentielId } from '@tet/domain/referentiels';
import { PreuvesTable } from './PreuvesTable';
import { useTableData } from './useTableData';

const REFERENTIELS: Exclude<ReferentielId, 'te' | 'te-test'>[] = ['cae', 'eci'];

const PreuvesTab = (props: {
  referentielId: Exclude<ReferentielId, 'te' | 'te-test'>;
}) => {
  const tableData = useTableData(props.referentielId);
  return (
    <PreuvesTable tableData={tableData} referentielId={props.referentielId} />
  );
};

export const PreuvesTabs = () => {
  return (
    <Tabs>
      {REFERENTIELS.map((referentielId) => {
        return (
          <Tab
            key={referentielId}
            data-test={referentielId}
            label={`Référentiel ${referentielToName[referentielId]}`}
          >
            <PreuvesTab referentielId={referentielId} />
          </Tab>
        );
      })}
    </Tabs>
  );
};
