import ListWithTooltip from '@/app/ui/lists/ListWithTooltip';
import { PersonneTagOrUser, Tag } from '@/domain/collectivites';
import { OpenState } from '@/ui/utils/types';

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
      <div className="flex gap-2 pl-2 border-l border-primary-3">
        {hasPilotes && (
          <ListWithTooltip
            className="!mx-0"
            title="Pilotes"
            list={pilotes.map((p) => p.nom ?? '')}
            icon="user-line"
            hoveringColor="grey"
            onClick={() => openState.setIsOpen(true)}
            disabled={isReadOnly}
          />
        )}
        {hasPilotes && hasServices && (
          <div className="w-px grow bg-primary-3" />
        )}
        {hasServices && (
          <ListWithTooltip
            className="mx-0"
            title="Direction ou service pilote"
            list={services.map((s) => s.nom ?? '')}
            icon="leaf-line"
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
