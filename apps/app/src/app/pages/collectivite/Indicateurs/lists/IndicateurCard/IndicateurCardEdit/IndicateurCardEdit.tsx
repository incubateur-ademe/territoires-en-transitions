import IndicateurCardEditModal from '@/app/app/pages/collectivite/Indicateurs/lists/IndicateurCard/IndicateurCardEdit/IndicateurCardEditModal';
import { IndicateurDefinitionListItem } from '@/app/indicateurs/definitions/use-list-indicateur-definitions';
import { OpenState } from '@/ui/utils/types';

type Props = {
  definition: IndicateurDefinitionListItem;
  openState: OpenState;
};

export const IndicateurCardEdit = ({ definition, openState }: Props) => {
  return (
    <IndicateurCardEditModal indicateur={definition} openState={openState} />
  );
};
