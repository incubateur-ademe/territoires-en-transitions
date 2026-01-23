import { useCurrentCollectivite } from '@tet/api/collectivites';
import { Tab, Tabs } from '@tet/ui';
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
  const { hasCollectivitePermission } = useCurrentCollectivite();
  return (
    <Tabs
      defaultActiveTab={defaultActiveTab}
      tabPanelClassName="p-6 border border-grey-3 rounded-lg"
    >
      <Tab label="Personnalisation du potentiel" icon="settings-5-line">
        <PersoPotentielQR
          actionDef={actionDef}
          questionReponses={questionReponses}
          onChange={onChange}
          canEdit={hasCollectivitePermission('referentiels.mutate')}
        />
      </Tab>
      <Tab label="Règles applicables" icon="information-line">
        <PersoPotentielDoc actionDef={actionDef} regles={regles} />
      </Tab>
    </Tabs>
  );
};
