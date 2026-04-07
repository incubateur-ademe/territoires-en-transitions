import { makeReferentielTacheUrl } from '@/app/app/paths';
import { useListActions } from '@/app/referentiels/actions/use-list-actions';
import { toLocaleFixed } from '@/app/utils/to-locale-fixed';
import { useCollectiviteId } from '@tet/api/collectivites';
import { PersonnalisationRegle } from '@tet/domain/collectivites';
import { ActionWithScore } from '@tet/domain/referentiels';
import { AccordionControlled, InfoTooltip } from '@tet/ui';
import DOMPurify from 'dompurify';
import Link from 'next/link';
import { useState } from 'react';
import { usePersonnalisationRegles } from '../data/use-personnalisation-regles';
import { QuestionReponseProps } from './question-reponse-props.types';

const endWithADigit = /[0-9]$/;

/** Affiche les mesures des référentiels liées à une question */
export const QuestionActionsLiees = (props: QuestionReponseProps) => {
  const { question } = props;
  const { actionIds } = question;
  const [isOpen, setIsOpen] = useState(false);

  // TODO: à supprimer
  // filtrage pour éviter une erreur dans `referentiels.actions.listActions`
  // avec les actionId tel que te_2.1.1.6.a
  const actionIdsFiltered = actionIds?.filter((actionId) =>
    actionId.match(endWithADigit)
  );

  const enabled = (actionIdsFiltered?.length && isOpen) || false;
  const { data: actionsLiees } = useListActions(
    { actionIds: actionIdsFiltered || [] },
    enabled
  );
  const { data: regles } = usePersonnalisationRegles(
    actionIdsFiltered || [],
    enabled
  );

  return (
    <AccordionControlled
      containerClassname="border-none"
      headerClassname="text-grey-8 py-2"
      title="Afficher les éléments impactés et règles associées"
      content={<ActionsLiees actions={actionsLiees} regles={regles} />}
      expanded={isOpen}
      setExpanded={setIsOpen}
    />
  );
};

const ActionsLiees = ({
  actions,
  regles,
}: {
  actions?: ActionWithScore[];
  regles: PersonnalisationRegle[];
}) => {
  const collectiviteId = useCollectiviteId();

  return (
    <div className="flex flex-col gap-2 pl-8 font-medium">
      {actions?.map((action) => {
        const { actionId, referentiel, identifiant, nom, score } = action;
        const url = makeReferentielTacheUrl({
          collectiviteId,
          actionId,
          referentielId: referentiel,
        });
        const reglesActions = regles.filter((r) => r.actionId === actionId);
        const pointReferentiel = score?.pointReferentiel;

        return (
          <div key={actionId} className="flex flex-row gap-2 items-center">
            <Link href={url} className="underline">
              {referentiel} {identifiant} - {nom}
            </Link>
            {pointReferentiel !== undefined && !!reglesActions.length && (
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
                    <li>
                      Nombre de points initial :{' '}
                      {toLocaleFixed(pointReferentiel, 2)}
                    </li>
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
