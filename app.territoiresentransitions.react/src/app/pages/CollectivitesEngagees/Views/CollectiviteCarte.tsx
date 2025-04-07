import { RecherchesCollectivite } from '@/api/collectiviteEngagees';
import { makeCollectiviteAccueilUrl } from '@/app/app/paths';
import { Card, Icon } from '@/ui';
import classNames from 'classnames';
import ContactsDisplay from '../contacts/contacts-display';

type Props = {
  collectivite: RecherchesCollectivite;
  canUserClickCard: boolean;
};

/**
 * Carte représentant une collectivité.
 * Utilisée dans la vue collectivités engagées.
 *
 * Affiche le nom et des éléments de scores.
 * Lien vers le tableau de bord de la collectivité.
 */
export const CollectiviteCarte = ({
  collectivite,
  canUserClickCard,
}: Props) => {
  const {
    collectiviteId,
    collectiviteNom,
    nbIndicateurs,
    nbPlans,
    etoilesCae,
    etoilesEci,
    contacts,
  } = collectivite;

  return (
    <div className="relative h-full">
      <ContactsDisplay
        contacts={contacts}
        collectiviteName={collectiviteNom}
        buttonClassName="!absolute top-4 right-4"
      />

      <Card
        className={classNames('h-full !border-primary-3 !py-5 !px-6 !gap-3', {
          'hover:!bg-primary-0': canUserClickCard,
        })}
        href={
          canUserClickCard
            ? makeCollectiviteAccueilUrl({
                collectiviteId: collectiviteId,
              })
            : undefined
        }
      >
        <div className="mb-0 text-lg font-bold text-primary-9">
          {collectiviteNom}
        </div>

        <div className="flex justify-between gap-4 sm:gap-6 xl:gap-8">
          {/* Indicateurs / plans */}
          <div className="flex flex-col gap-3 flex-1">
            <div>
              <span className="text-xs text-grey-9 font-normal">
                <Icon icon="line-chart-line" size="sm" className="mr-1.5" />
                <span className="font-bold">{nbIndicateurs}</span>{' '}
                {nbIndicateurs > 1
                  ? 'indicateurs renseignés'
                  : 'indicateur renseigné'}
              </span>
              <div className="text-grey-7 italic text-xs font-normal">
                (open data et indicateurs renseignés par la collectivité)
              </div>
            </div>

            <span className="text-xs text-grey-9 font-normal">
              <Icon icon="folders-line" size="sm" className="mr-1.5" />
              <span className="font-bold">{nbPlans}</span>{' '}
              {nbPlans > 1 ? "plans d'action" : "plan d'action"}
            </span>
          </div>

          {/* Séparateur */}
          <div className="w-[0.5px] mx-auto flex-shrink-0 bg-grey-4" />

          {/* Etoiles */}
          <div className="flex flex-col gap-3 flex-1">
            <span className="text-xs text-grey-9 font-normal">
              <Icon icon="star-line" size="sm" className="mr-1.5" />
              <span className="font-bold">
                {etoilesCae} {etoilesCae > 1 ? 'étoiles' : 'étoile'}
              </span>{' '}
              Climat Air Énergie
            </span>
            <span className="text-xs text-grey-9 font-normal">
              <Icon icon="star-line" size="sm" className="mr-1.5" />
              <span className="font-bold">
                {etoilesEci} {etoilesEci > 1 ? 'étoiles' : 'étoile'}
              </span>{' '}
              Économie Circulaire
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
};
