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
      {REFERENTIELS.map(referentiel => {
        const tableData = useTableData(referentiel);
        return (
          <Tab
            key={referentiel}
            label={`Référentiel ${
              referentielToName[referentiel as Referentiel]
            }`}
          >
            <PreuvesTable tableData={tableData} referentiel={referentiel} />
          </Tab>
        );
      })}
    </Tabs>
  );
};
