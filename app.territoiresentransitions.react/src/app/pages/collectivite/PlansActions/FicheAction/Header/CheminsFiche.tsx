import { Fiche } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/use-get-fiche';
import { makeCollectiviteFichesNonClasseesUrl } from '@/app/app/paths';
import { Breadcrumbs, Button } from '@/ui';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import CheminFiche from './CheminFiche';

type Axe = Pick<
  NonNullable<Fiche['axes']>[number],
  'id' | 'planId' | 'collectiviteId'
>;

type CheminsFicheProps = {
  titre: string | null;
  collectiviteId: number;
  axes?: Axe[] | null;
};

const CheminsFiche = ({ titre, collectiviteId, axes }: CheminsFicheProps) => {
  const router = useRouter();

  // Plan actuellement consulté
  const { planUid: unsafePlanUid } = useParams<{ planUid?: string }>();
  const planId = unsafePlanUid ? parseInt(unsafePlanUid) : undefined;

  // Si plusieurs emplacements, on récupère l'axe qui correpond
  // au plan actuellement consulté
  const axeId = axes
    ? axes.length === 1 && axes[0].collectiviteId === collectiviteId
      ? axes[0].id
      : axes.find((a) => a.planId === planId)?.id
    : null;

  // Autres axes qui contiennent la fiche
  const otherAxes = (axes ?? []).filter(
    (axe) => axe.id !== axeId && axe.collectiviteId === collectiviteId
  );

  // Ouverture / fermeture de la liste des autres axes
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Fil d'ariane avec emplacement actuellement consulté de la fiche action */}
      {axeId ? (
        <CheminFiche
          titre={titre ?? 'Sans titre'}
          axeId={axeId}
          collectiviteId={collectiviteId}
        />
      ) : (
        <Breadcrumbs
          items={[
            {
              label: 'Fiches non classées',
              onClick: () => {
                router.push(
                  makeCollectiviteFichesNonClasseesUrl({ collectiviteId })
                );
              },
            },
            {
              label: titre || 'Sans titre',
            },
          ]}
        />
      )}

      {/* Autes chemins possibles de la fiche */}
      {otherAxes.length !== 0 && (
        <div className="mt-4 flex flex-col gap-2">
          <Button
            variant="underlined"
            size="sm"
            icon={isOpen ? 'arrow-up-s-line' : 'arrow-down-s-line'}
            iconPosition="right"
            onClick={() => setIsOpen((prevState) => !prevState)}
          >
            Autre{otherAxes.length > 1 ? 's' : ''} emplacement
            {otherAxes.length > 1 ? 's' : ''} pour cette fiche
          </Button>

          {isOpen && (
            <div>
              {otherAxes.map(
                (axe, index) =>
                  axe.id && (
                    <CheminFiche
                      key={index}
                      titre={titre ?? 'Sans titre'}
                      axeId={axe.id}
                      collectiviteId={collectiviteId}
                    />
                  )
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default CheminsFiche;
