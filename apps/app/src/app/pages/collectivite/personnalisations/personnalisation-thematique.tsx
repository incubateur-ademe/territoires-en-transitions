'use client';

import { PersonnalisationThematique as TPersonnalisationThematique } from '@tet/domain/collectivites';
import { Badge, cn, Icon } from '@tet/ui';
import { useOpeneedThematiques } from './data/use-opened-thematiques';
import { PersonnalisationQuestionsList } from './personnalisation-questions.list';

type Props = {
  thematique: TPersonnalisationThematique;
};

export function PersonnalisationThematique({ thematique }: Props) {
  const { isOpenThematique, openThematique } = useOpeneedThematiques();
  const isOpen = isOpenThematique(thematique.id);

  return (
    <div
      className="relative flex flex-col border rounded-md"
      data-test={`thematique-${thematique.id}`}
    >
      <div
        className={cn(
          'relative py-4 pr-4 pl-2 overflow-hidden rounded-md hover:bg-grey-2',
          { 'rounded-b-none': isOpen }
        )}
      >
        <button
          type="button"
          className="flex grow w-full items-center hover:!bg-transparent active:!bg-transparent"
          onClick={() => openThematique(thematique.id, !isOpen)}
        >
          <div className={cn('self-center mr-2', { 'rotate-90': isOpen })}>
            <Icon icon="arrow-right-s-line" size="lg" className="text-grey-8" />
          </div>
          <span className="grow text-left">{thematique.nom}</span>
          {thematique.isComplete ? (
            <Badge
              size="sm"
              title={`Complété ${thematique.reponsesCount}/${thematique.questionsCount}`}
              variant="success"
              className="border-none"
            />
          ) : (
            <Badge
              size="sm"
              title={`À compléter ${thematique.reponsesCount}/${thematique.questionsCount}`}
              variant="warning"
              className="border-none"
            />
          )}
        </button>
      </div>
      {isOpen && <PersonnalisationQuestionsList thematique={thematique} />}
    </div>
  );
}
