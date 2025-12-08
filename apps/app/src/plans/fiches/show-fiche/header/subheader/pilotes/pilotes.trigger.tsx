import ListWithTooltip from '@/app/ui/lists/ListWithTooltip';
import { PersonneTagOrUser } from '@tet/domain/collectivites';
import { SANS_PILOTE_LABEL } from '@tet/domain/plans';
import PiloteIcon from '../../../../../plans/components/pilote-icon.svg';
import { useEditionModalManager } from '../../context/edition-modal-manager-context';

type PilotesTriggerProps = {
  personnes: PersonneTagOrUser[];
};

export const Pilotes = ({ personnes }: PilotesTriggerProps) => {
  const { openModal } = useEditionModalManager();

  return (
    <button
      onClick={() => openModal('pilotes')}
      className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
      type="button"
    >
      <PiloteIcon className="w-4 h-4" />
      {personnes.length > 0 ? (
        <>
          Pilotes:
          <ListWithTooltip
            className="text-sm text-grey-8 font-normal flex"
            list={personnes.map((p) => p.nom)}
          />
        </>
      ) : (
        <span className="text-sm text-grey-8 font-normal">
          {SANS_PILOTE_LABEL}
        </span>
      )}
    </button>
  );
};
