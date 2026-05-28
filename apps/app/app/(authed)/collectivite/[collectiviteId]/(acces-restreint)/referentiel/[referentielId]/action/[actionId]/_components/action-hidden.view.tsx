'use client';

import { makeMaCollectiviteUrl, makeReferentielUrl } from '@/app/app/paths';
import { autoOpenThematiquesSearchParam } from '@/app/collectivites/personnalisations/data/use-list-opened-thematiques';
import { ActionListItem } from '@/app/referentiels/actions/use-list-actions';
import { default as PictoMesure } from '@/app/ui/pictogrammes/mesure.picto.svg';
import { useCollectiviteId } from '@tet/api/collectivites';
import { getReferentielIdFromActionId } from '@tet/domain/referentiels';
import { EmptyCard } from '@tet/ui';

export const ActionHiddenView = ({
  action,
}: {
  action: Pick<ActionListItem, 'actionId' | 'identifiant' | 'nom'>;
}) => {
  const collectiviteId = useCollectiviteId();
  const referentielId = getReferentielIdFromActionId(action.actionId);

  return (
    <EmptyCard
      dataTest="ActionHidden"
      picto={(props) => <PictoMesure {...props} />}
      title="Mesure masquée par la personnalisation"
      subTitle={`${action.identifiant} — ${action.nom}`}
      description="Cette mesure n'apparaît plus dans votre référentiel car elle dépend de vos réponses à des questions de personnalisation. Ces choix permettent d'adapter les indicateurs affichés aux compétences et aux caractéristiques de votre collectivité."
      variant="transparent"
      actions={[
        {
          children: 'Voir les questions',
          href: makeMaCollectiviteUrl({
            collectiviteId,
            view: 'personnalisation',
            searchParams: {
              a: action.actionId,
              ...autoOpenThematiquesSearchParam,
            },
          }),
          variant: 'grey',
        },
        {
          children: 'Retour au référentiel',
          href: makeReferentielUrl({ collectiviteId, referentielId }),
          variant: 'primary',
        },
      ]}
    />
  );
};
