/**
 * Affiche le dialogue de personnalisation du potentiel de points d'une sous-action
 */

import { Tab, Tabs } from '@/app/ui/shared/Tabs';
import {
  PersoPotentielDoc,
  TPersoPotentielDocProps,
} from './PersoPotentielDoc';
import { PersoPotentielQR, TPersoPotentielQRProps } from './PersoPotentielQR';

export type TPersoPotentielTabsProps = TPersoPotentielQRProps &
  TPersoPotentielDocProps & {
    /** Index de l'onglet actif */
    defaultActiveTab?: number;
  };

export const PersoPotentielTabs = (props: TPersoPotentielTabsProps) => {
  const { defaultActiveTab, ...other } = props;
  return (
    <Tabs defaultActiveTab={defaultActiveTab}>
      <Tab label="Personnalisation du potentiel" icon="settings-5">
        <PersoPotentielQR {...other} />
      </Tab>
      <Tab label="Règles applicables" icon="information">
        <PersoPotentielDoc {...other} />
      </Tab>
    </Tabs>
  );
};
