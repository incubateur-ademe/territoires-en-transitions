import { makeReferentielActionUrl } from '@/app/app/paths';
import {
  ActionListItem,
} from '@/app/referentiels/actions/use-list-actions';
import { useListActionsGroupedById } from '@/app/referentiels/actions/use-list-actions-grouped-by-id';
import { useCollectiviteId } from '@tet/api/collectivites';
import { PersonnalisationRegle } from '@tet/domain/collectivites';
import { getReferentielIdFromActionId } from '@tet/domain/referentiels';
import { AccordionControlled, InfoTooltip } from '@tet/ui';
import DOMPurify from 'dompurify';
import Link from 'next/link';
import { useState } from 'react';
import { useListPersonnalisationRegles } from '../data/use-list-personnalisation-regles';
import { QuestionReponseProps } from './question-reponse-props.types';

/** Affiche les mesures des référentiels liées à une question */
export const QuestionActionsLiees = (props: QuestionReponseProps) => {
  const { question } = props;
  const { actionIds } = question;
  const [isOpen, setIsOpen] = useState(false);

  const enabled = (actionIds?.length && isOpen) || false;
  const referentielIds = [
    ...new Set((actionIds ?? []).map(getReferentielIdFromActionId)),
  ];
  const queryResults = useListActionsGroupedById(
    { referentielIds },
    { enabled }
  );
  const isPending = queryResults.some((result) => result.isPending);
  const queryByReferentielId = new Map(
    referentielIds.map((referentielId, index) => [
      referentielId,
      queryResults[index]?.data,
    ])
  );
  const actionsLiees = (actionIds ?? [])
    .map((id) => {
      const referentielId = getReferentielIdFromActionId(id);
      const result = queryByReferentielId.get(referentielId);
      if (!result) {
        return undefined;
      }
      return (
        result.actionsById[id] ??
        result.hiddenActions.find((action) => action.actionId === id)
      );
    })
    .filter((action): action is Pick<ActionListItem, 'actionId' | 'identifiant' | 'nom'> => action !== undefined);
  const { data: regles } = useListPersonnalisationRegles(
    actionIds || [],
    enabled
  );

  return (
    <AccordionControlled
      containerClassname="border-none"
      headerClassname="text-grey-8 py-2"
      title="Afficher les éléments affectés et règles associées"
      content={<ActionsLiees actions={actionsLiees} regles={regles} isPending={isPending} />}
      expanded={isOpen}
      setExpanded={setIsOpen}
    />
  );
};

const ActionsLiees = ({
  actions,
  regles,
  isPending,
}: {
  actions?: Pick<ActionListItem, 'actionId' | 'identifiant' | 'nom'>[];
  regles: PersonnalisationRegle[];
  isPending: boolean;
}) => {
  const collectiviteId = useCollectiviteId();
  if (isPending) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2 pl-8 font-medium">
      {actions?.map((action) => {
        const { actionId, identifiant, nom } = action;
        const referentiel = getReferentielIdFromActionId(actionId);
        const url = makeReferentielActionUrl({
          collectiviteId,
          actionId,
          referentielId: referentiel,
        });
        const reglesActions = regles.filter((r) => r.actionId === actionId);

        return (
          <div key={actionId} className="flex flex-row gap-2 items-center">
            <Link href={url} className="underline">
              {referentiel} {referentiel === 'te' ? '' : identifiant} - {nom}
            </Link>
            {!!reglesActions.length && (
              <InfoTooltip
                label={
                  <ul className="max-w-lg pl-4 list-disc">
                    {reglesActions.map(({ description }, index) =>
                      description ? (
                        <li
                          key={`r${index}`}
                          dangerouslySetInnerHTML={{
                            __html: DOMPurify.sanitize(description),
                          }}
                        />
                      ) : null
                    )}
                    {/* vérifie ceci... le score n'est plus disponible pour les actions masquées */}
                  </ul>
                }
              />
            )}
          </div>
        );
      })}
    </div>
  );
};
