/**
 * Affiche toutes les preuves réglementaires/complémentaires de la collectivité
 * par référentiel et niveau
 */

import { referentielToName } from '@/app/app/labels';
import { Referentiel } from '@/app/types/litterals';
import { Tab, Tabs } from 'ui/shared/Tabs';
import { PreuvesTable } from './PreuvesTable';
import { useTableData } from './useTableData';

const REFERENTIELS: Exclude<Referentiel, 'te' | 'te-test'>[] = ['cae', 'eci'];

const PreuvesTab = (props: {
  referentielId: Exclude<Referentiel, 'te' | 'te-test'>;
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
            label={`Référentiel ${
              referentielToName[referentielId as Referentiel]
            }`}
          >
            <PreuvesTab referentielId={referentielId} />
          </Tab>
        );
      })}
    </Tabs>
  );
};
