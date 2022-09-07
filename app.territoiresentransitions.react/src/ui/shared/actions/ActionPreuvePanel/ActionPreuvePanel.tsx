import {PreuveRead} from 'generated/dataLayer/preuve_read';
import {ActionDefinitionSummary} from 'core-logic/api/endpoints/ActionDefinitionSummaryReadEndpoint';
import {usePreuvesParType} from 'app/pages/collectivite/Bibliotheque/usePreuves';
import {PreuvesAction} from 'app/pages/collectivite/Bibliotheque/PreuvesAction';
import {
  TPreuveComplementaire,
  TPreuveReglementaire,
} from 'app/pages/collectivite/Bibliotheque/types';

export type TActionPreuvePanelProps = {
  action: ActionDefinitionSummary;
};

export type TActionPreuvesProps = {
  action: ActionDefinitionSummary;
  preuves: PreuveRead[];
};

/**
 * Affiche le panneau "preuves" d'une action
 */
export default (props: TActionPreuvePanelProps) => {
  const {action} = props;
  const {reglementaire, complementaire} = usePreuvesParType(action.id);

  return (
    <PreuvesAction
      reglementaires={reglementaire as TPreuveReglementaire[]}
      complementaires={complementaire as TPreuveComplementaire[]}
      showWarning
    />
  );
};
