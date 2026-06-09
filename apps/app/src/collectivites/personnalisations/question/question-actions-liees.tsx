import { makeReferentielActionUrl } from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
import {
  ResolvedActionSummary,
  useResolveActionsByIds,
} from '@/app/referentiels/actions/use-resolve-actions-by-ids';
import { toLocaleFixed } from '@/app/utils/to-locale-fixed';
import { useCollectiviteId } from '@tet/api/collectivites';
import { PersonnalisationRegle } from '@tet/domain/collectivites';
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

  const enabled = Boolean(actionIds?.length && isOpen);
  const { data: actionsLiees, isPending } = useResolveActionsByIds(
    actionIds ?? undefined,
    {
      enabled,
    }
  );
  const { data: regles } = useListPersonnalisationRegles(
    actionIds || [],
    enabled
  );

  return (
    <AccordionControlled
      containerClassname="border-none"
      headerClassname="text-grey-8 py-2"
      title="Afficher les éléments affectés et règles associées"
      content={
        <ActionsLiees
          actions={actionsLiees}
          regles={regles}
          isPending={isPending}
        />
      }
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
  actions?: ResolvedActionSummary[];
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
        const { actionId, identifiant, nom, referentiel, score } = action;
        const url = makeReferentielActionUrl({
          collectiviteId,
          actionId,
          referentielId: referentiel,
        });
        const reglesActions = regles.filter((r) => r.actionId === actionId);
        const pointReferentiel = score?.pointReferentiel;

        return (
          <div key={actionId} className="flex flex-row gap-2 items-center">
            <Link href={url} className="underline">
              {`${referentiel} ${
                referentiel === 'te' ? '' : identifiant
              } - ${nom}`}
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
                    {pointReferentiel !== undefined && pointReferentiel !== null && (
                      <li>
                        {`${appLabels.nombreDePointsInitial} : ${toLocaleFixed(
                          pointReferentiel,
                          2
                        )}`}
                      </li>
                    )}
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
