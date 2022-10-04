/**
 * Affiche toutes les preuves réglementaires/complémentaires de la collectivité
 * par référentiel et niveau
 */

import {Tabs, Tab} from '@dataesr/react-dsfr';
import {referentielToName} from 'app/labels';
import {Referentiel} from 'types/litterals';
import {useTableData} from './useTableData';
import {PreuvesTable} from './PreuvesTable';

const REFERENTIELS: Referentiel[] = ['cae', 'eci'];

export const PreuvesTabs = () => {
  return (
    <Tabs>
      {REFERENTIELS.map(referentielId => {
        const tableData = useTableData(referentielId);
        return (
          <Tab
            key={referentielId}
            data-test={referentielId}
            label={`Référentiel ${
              referentielToName[referentielId as Referentiel]
            }`}
          >
            <PreuvesTable tableData={tableData} referentielId={referentielId} />
          </Tab>
        );
      })}
    </Tabs>
  );
};
