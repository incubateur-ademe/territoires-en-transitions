import { EmptyCard, PictoPadlock } from '@/ui';

export function FicheNoAccessPage() {
  return (
    <EmptyCard
      picto={(props) => <PictoPadlock {...props} />}
      title="L’accès à cette fiche vous est restreint."
      description={`Pour en consulter le contenu, vous pouvez faire une demande d’adhésion depuis votre profil, onglet « Rejoindre une collectivité » ou demander à la collectivité de partager cette fiche action avec votre collectivité.`}
    />
  );
}
