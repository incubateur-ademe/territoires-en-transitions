'use client';

import PersonneTagDropdown from '@/app/collectivites/tags/personne-tag.dropdown';
import { getPersonneStringId } from '@/app/collectivites/tags/personnes.utils';
import { appLabels } from '@/app/labels/catalog';
import PiloteIcon from '@/app/plans/plans/components/pilote-icon.svg';
import ListWithTooltip from '@/app/ui/lists/ListWithTooltip';
import { PersonneTagOrUser } from '@tet/domain/collectivites';
import { SANS_PILOTE_LABEL } from '@tet/domain/plans';
import { cn, InlineEditWrapper } from '@tet/ui';

type Props = {
  pilotes: PersonneTagOrUser[];
  collectiviteId: number;
  disabled?: boolean;
  dataTest?: string;
  onChange: (pilotes: PersonneTagOrUser[]) => void;
};

const normalizePilotes = (personnes: PersonneTagOrUser[]): PersonneTagOrUser[] =>
  personnes.map((p) => ({
    ...p,
    nom: p.nom ?? '',
  }));

export const DemarchePcaetPilotesField = ({
  pilotes,
  collectiviteId,
  disabled,
  dataTest = 'demarche-pilotes',
  onChange,
}: Props) => {
  return (
    <div className="flex gap-2 items-center hover:bg-grey-3 rounded px-2 py-1 -my-1 -mx-2 w-fit">
      <span className="text-sm text-grey-7">Pilotes :</span>
      <InlineEditWrapper
        disabled={disabled}
        renderOnEdit={({ openState }) => (
          <div className="w-72">
            <PersonneTagDropdown
              inlineEdit
              openState={openState}
              dataTest={dataTest}
              collectiviteIds={[collectiviteId]}
              values={pilotes.map((p) => getPersonneStringId(p))}
              placeholder={appLabels.selectionnerOuCreerPilote}
              onChange={({ personnes }) => {
                onChange(normalizePilotes(personnes));
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
            {pilotes.length > 0 ? (
              <ListWithTooltip
                className="text-sm text-grey-8 font-normal flex"
                list={pilotes.map((p) => p.nom)}
              />
            ) : (
              <span className="text-sm text-grey-8 font-normal">
                {SANS_PILOTE_LABEL}
              </span>
            )}
          </button>
        )}
      </InlineEditWrapper>
    </div>
  );
};
