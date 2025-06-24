import { useCurrentCollectivite } from '@/api/collectivites';
import { makeCollectivitePlansActionsNouveauUrl } from '@/app/app/paths';
import PictoDashboard from '@/app/ui/pictogrammes/PictoDashboard';
import { EmptyCard } from '@/ui';
import { useRouter } from 'next/navigation';

const TdbVide = () => {
  const { isReadOnly, collectiviteId } = useCurrentCollectivite();

  const router = useRouter();

  return (
    <EmptyCard
      picto={(props) => <PictoDashboard {...props} />}
      title="Vous n'avez pas encore créé de plan d'action !"
      description="Vous pouvez créer votre plan d'action, qu'il soit déjà voté ou encore en cours d'élaboration. Les fiches seront modifiables à tout moment et vous pourrez les piloter depuis ce tableau de bord !"
      isReadonly={isReadOnly}
      actions={[
        {
          children: "Créer un plan d'action",
          onClick: () =>
            router.push(
              makeCollectivitePlansActionsNouveauUrl({
                collectiviteId: collectiviteId,
              })
            ),
        },
      ]}
      className="col-span-full"
    />
  );
};

export default TdbVide;
