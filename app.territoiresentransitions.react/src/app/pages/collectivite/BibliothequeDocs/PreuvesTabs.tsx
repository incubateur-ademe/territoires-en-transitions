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

const PreuvesTab = (props: { referentielId: Referentiel }) => {
  const tableData = useTableData(props.referentielId);
  return <PreuvesTable tableData={tableData} referentielId={props.referentielId} />
};

export const PreuvesTabs = () => {
  return (
    <Tabs>
      {REFERENTIELS.map(referentielId => {
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
