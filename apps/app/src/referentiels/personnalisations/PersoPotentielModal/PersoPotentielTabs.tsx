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

export const PersoPotentielTabs = ({
  defaultActiveTab,
  actionDef,
  regles,
  questionReponses,
  onChange,
}: TPersoPotentielTabsProps) => {
  return (
    <Tabs defaultActiveTab={defaultActiveTab}>
      <Tab label="Personnalisation du potentiel" icon="settings-5">
        <PersoPotentielQR
          actionDef={actionDef}
          questionReponses={questionReponses}
          onChange={onChange}
        />
      </Tab>
      <Tab label="Règles applicables" icon="information">
        <PersoPotentielDoc actionDef={actionDef} regles={regles} />
      </Tab>
    </Tabs>
  );
};
