import {PreuveRead} from 'generated/dataLayer/preuve_read';
import {ActionDefinitionSummary} from 'core-logic/api/endpoints/ActionDefinitionSummaryReadEndpoint';
import {usePreuvesParType} from 'ui/shared/preuves/Bibliotheque/usePreuves';
import {PreuvesAction} from 'ui/shared/preuves/Bibliotheque/PreuvesAction';
import {
  TPreuveComplementaire,
  TPreuveReglementaire,
} from 'ui/shared/preuves/Bibliotheque/types';

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
