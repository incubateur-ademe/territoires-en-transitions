import { EmptyCard } from '@/ui';
import PageContainer from '@/ui/components/layout/page-container';
import { PictoPadlock } from '@/ui/design-system/Picto/PictoPadlock';

export function FicheNoAccessPage() {
  return (
    <PageContainer containerClassName="grow flex flex-col justify-center">
      <EmptyCard
        picto={(props) => <PictoPadlock {...props} />}
        title="L’accès à cette fiche vous est restreint."
        description={`Pour en consulter le contenu, vous pouvez faire une demande d’adhésion depuis votre profil, onglet « Rejoindre une collectivité » ou demander à la collectivité de partager cette fiche action avec votre collectivité.`}
      />
    </PageContainer>
  );
}
