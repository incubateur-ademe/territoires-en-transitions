import ListWithTooltip from '@/app/ui/lists/ListWithTooltip';
import { PersonneTagOrUser, Tag } from '@tet/domain/collectivites';
import { OpenState } from '@tet/ui/utils/types';

type Props = {
  openState: OpenState;
  pilotes?: PersonneTagOrUser[];
  services?: Tag[];
  isReadOnly?: boolean;
};

const Infos = ({ openState, pilotes, services, isReadOnly }: Props) => {
  const hasPilotes = pilotes && pilotes.length > 0;
  const hasServices = services && services.length > 0;

  return (
    (hasPilotes || hasServices) && (
      <div className="flex gap-3">
        <div className="w-[0.5px] h-5 bg-grey-5 max-lg:hidden" />
        {hasPilotes && (
          <ListWithTooltip
            title="Pilotes"
            list={pilotes.map((p) => p.nom ?? '')}
            icon="user-line"
            hoveringColor="grey"
            onClick={() => openState.setIsOpen(true)}
            disabled={isReadOnly}
          />
        )}
        {hasPilotes && hasServices && (
          <div className="w-[0.5px] h-5 bg-grey-5" />
        )}
        {hasServices && (
          <ListWithTooltip
            title="Direction ou service pilote"
            list={services.map((s) => s.nom ?? '')}
            icon="briefcase-line"
            hoveringColor="grey"
            onClick={() => openState.setIsOpen(true)}
            disabled={isReadOnly}
          />
        )}
      </div>
    )
  );
};

export default Infos;
