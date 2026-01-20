import { getFicheAllEditorCollectiviteIds } from '@/app/plans/fiches/share-fiche/share-fiche.utils';
import { useFicheContext } from '@/app/plans/fiches/show-fiche/context/fiche-context';
import PersonnesDropdown from '@/app/ui/dropdownLists/PersonnesDropdown/PersonnesDropdown';
import { getPersonneStringId } from '@/app/ui/dropdownLists/PersonnesDropdown/utils';
import ListWithTooltip from '@/app/ui/lists/ListWithTooltip';
import { PersonneTagOrUser } from '@tet/domain/collectivites';
import { SANS_PILOTE_LABEL } from '@tet/domain/plans';
import { cn, InlineEditWrapper } from '@tet/ui';
import PiloteIcon from '../../../../plans/components/pilote-icon.svg';

type PilotesTriggerProps = {
  personnes: PersonneTagOrUser[];
};

export const Pilotes = ({ personnes }: PilotesTriggerProps) => {
  const { fiche, isReadonly, isUpdating, update } = useFicheContext();

  return (
    <InlineEditWrapper
      disabled={isReadonly}
      renderOnEdit={() => (
        <div className="min-w-[360px]">
          <PersonnesDropdown
            dataTest="personnes-pilotes"
            collectiviteIds={getFicheAllEditorCollectiviteIds(fiche)}
            values={fiche.pilotes?.map((p) => getPersonneStringId(p))}
            placeholder="Sélectionnez ou créez un pilote"
            disabled={isUpdating}
            onChange={({ personnes }) => {
              update({
                ficheId: fiche.id,
                ficheFields: { pilotes: personnes },
              });
            }}
          />
        </div>
      )}
    >
      {(props) => (
        <button
          type="button"
          {...props}
          className={cn(
            props.className,
            'flex items-center gap-2 hover:opacity-80 transition-opacity'
          )}
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
      )}
    </InlineEditWrapper>
  );
};
