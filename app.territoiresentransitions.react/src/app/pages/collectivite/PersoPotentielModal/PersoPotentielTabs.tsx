/**
 * Affiche le dialogue de personnalisation du potentiel de points d'une sous-action
 */

import {Tabs, Tab} from '@dataesr/react-dsfr';
import {PersoPotentielQR, TPersoPotentielQRProps} from './PersoPotentielQR';
import {PersoPotentielDoc, TPersoPotentielDocProps} from './PersoPotentielDoc';

export type TPersoPotentielTabsProps = TPersoPotentielQRProps &
  TPersoPotentielDocProps & {
    /** Index de l'onglet actif */
    defaultActiveTab?: number;
  };

export const PersoPotentielTabs = (props: TPersoPotentielTabsProps) => {
  const {defaultActiveTab, ...other} = props;
  return (
    <Tabs defaultActiveTab={defaultActiveTab}>
      <Tab
        label="&nbsp;Personnalisation du potentiel"
        icon="fr-fi-settings-line"
      >
        <PersoPotentielQR {...other} />
      </Tab>
      <Tab label="&nbsp;Règles applicables" icon="fr-fi-information-line">
        <PersoPotentielDoc {...other} />
      </Tab>
    </Tabs>
  );
};
