import { appLabels } from '@/app/labels/catalog';
import ActionStatutBadge from '@/app/referentiels/actions/action-statut/action-statut.badge';
import { ReponseAttendue } from '@tet/domain/referentiels';
import { ReactElement } from 'react';
import { match } from 'ts-pattern';

export const ReponseAttendueLabel = ({
  value,
}: {
  value: ReponseAttendue;
}): ReactElement =>
  match(value)
    .returnType<ReactElement>()
    .with({ kind: 'personne-renseignee' }, () => (
      <>{appLabels.reponseAvoirPersonneRenseignee}</>
    ))
    .with({ kind: 'statut-fait' }, () => (
      <span className="inline-flex flex-wrap items-center gap-1">
        {appLabels.avoirLeStatutA}
        <ActionStatutBadge statut="fait" />
      </span>
    ))
    .with({ kind: 'statut-fait-ou-programme' }, () => (
      <span className="inline-flex flex-wrap items-center gap-1">
        {appLabels.avoirLeStatutA}
        <ActionStatutBadge statut="fait" />
        {appLabels.ou}
        <ActionStatutBadge statut="programme" />
      </span>
    ))
    .with({ kind: 'pourcentage-fait-minimum' }, ({ fait }) => (
      <>{appLabels.reponsePourcentageFaitMinimum({ percent: fait })}</>
    ))
    .with(
      { kind: 'pourcentage-fait-ou-programme-minimum' },
      ({ fait, programme }) => (
        <>
          {appLabels.reponsePourcentageFaitOuProgrammeMinimum({
            fait,
            programme,
          })}
        </>
      )
    )
    .exhaustive();
