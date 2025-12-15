import { makeCollectivitePlansActionsNouveauUrl } from '@/app/app/paths';
import PictoDashboard from '@/app/ui/pictogrammes/PictoDashboard';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { EmptyCard } from '@tet/ui';
import { useRouter } from 'next/navigation';

/** Carte représentant l'état des tableaux de bord lorsque
 * la collectivité n'a pas encore de plan */
export const SansPlanPlaceholder = () => {
  const { isReadOnly, collectiviteId } = useCurrentCollectivite();

  const router = useRouter();

  return (
    <EmptyCard
      picto={(props) => <PictoDashboard {...props} />}
      title="Vous n'avez pas encore créé de plan !"
      description="Vous pouvez créer votre plan, qu'il soit déjà voté ou encore en cours d'élaboration. Les actions seront modifiables à tout moment et vous pourrez les piloter depuis ce tableau de bord !"
      isReadonly={isReadOnly}
      actions={[
        {
          children: 'Créer un plan',
          onClick: () =>
            router.push(
              makeCollectivitePlansActionsNouveauUrl({ collectiviteId })
            ),
        },
      ]}
      className="col-span-full"
    />
  );
};
