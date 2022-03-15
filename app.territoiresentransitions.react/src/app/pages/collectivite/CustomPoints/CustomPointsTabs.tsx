/**
 * Affiche le dialogue de personnalisation du potentiel de points d'une sous-action
 */

import {Tabs, Tab} from '@dataesr/react-dsfr';
import {CustomPointsSettings} from './CustomPointsSettings';
import {CustomPointsDoc} from './CustomPointsDoc';

export type TCustomPointsTabsProps = {
  /** Index de l'onglet actif */
  defaultActiveTab?: number;
  // action: ActionDefinitionSummary
};

export const CustomPointsTabs = (props: TCustomPointsTabsProps) => {
  const {defaultActiveTab} = props;
  return (
    <Tabs defaultActiveTab={defaultActiveTab}>
      <Tab
        label="&nbsp;Personnalisation du potentiel"
        icon="fr-fi-settings-line"
      >
        <CustomPointsSettings />
      </Tab>
      <Tab label="&nbsp;Documentation" icon="fr-fi-information-line">
        <CustomPointsDoc />
      </Tab>
    </Tabs>
  );
};
