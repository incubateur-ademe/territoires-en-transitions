import { appLabels } from '@/app/labels/catalog';
import ActionStatutBadge from '@/app/referentiels/actions/action-statut/action-statut.badge';
import { ReactElement } from 'react';
import { ReponseAttendue } from './format-reponse-attendue';

export const ReponseAttendueLabel = ({
  value,
}: {
  value: ReponseAttendue;
}): ReactElement => {
  switch (value.kind) {
    case 'personne-renseignee':
      return <>{appLabels.reponseAvoirPersonneRenseignee}</>;
    case 'statut-fait':
      return (
        <span className="inline-flex flex-wrap items-center gap-1">
          {appLabels.avoirLeStatutA}
          <ActionStatutBadge statut="fait" />
        </span>
      );
    case 'statut-fait-ou-programme':
      return (
        <span className="inline-flex flex-wrap items-center gap-1">
          {appLabels.avoirLeStatutA}
          <ActionStatutBadge statut="fait" />
          {appLabels.ou}
          <ActionStatutBadge statut="programme" />
        </span>
      );
    case 'pourcentage-fait-minimum':
      return (
        <>
          {appLabels.reponsePourcentageFaitMinimum({ percent: value.percent })}
        </>
      );
  }
};
