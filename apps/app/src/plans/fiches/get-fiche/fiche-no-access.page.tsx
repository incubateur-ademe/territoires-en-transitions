import { EmptyCard, PictoPadlock } from '@tet/ui';

export function FicheNoAccessPage() {
  return (
    <EmptyCard
      picto={(props) => <PictoPadlock {...props} />}
      title="L’accès à cette action vous est restreint."
      description={`Pour en consulter le contenu, vous pouvez faire une demande d’adhésion depuis votre profil, onglet « Rejoindre une collectivité » ou demander à la collectivité de partager cette action avec votre collectivité.`}
    />
  );
}
