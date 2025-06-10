import { Fiche } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/use-get-fiche';
import { Alert } from '@/ui';
import Link from 'next/link';

type SharedFicheActionAlertProps = {
  fiche: Pick<Fiche, 'collectiviteNom' | 'sharedByOtherCollectivite'>;
};

const SharedFicheActionAlert = ({ fiche }: SharedFicheActionAlertProps) => {
  return fiche.sharedByOtherCollectivite ? (
    <Alert
      title={
        <>
          <span>
            Cette fiche action vous a été partagée par la collectivité
            {fiche.collectiviteNom}. Les indicateurs et les données affichées
            correspondent à ceux de cette collectivité.
          </span>
          <span>
            Aidez-nous à comprendre vos vrais besoins d&apos;utilisateur.
            <Link
              href={'https://calendar.app.google/j5uQrkt13xLZRBSDA'}
              target={'_blank'}
              rel={'noopener noreferrer'}
            >
              Prendre rendez-vous
            </Link>
            - Votre avis façonne le produit
          </span>
        </>
      }
    />
  ) : null;
};

export default SharedFicheActionAlert;
