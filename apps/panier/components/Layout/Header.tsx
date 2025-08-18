'use client';
import { useCollectiviteInfo } from '@/panier/components/Landing/useCollectiviteInfo';
import { AccesRapide } from '@/panier/components/Layout/AccesRapide';
import useLandingPathname from '@/panier/hooks/useLandingPathname';
import { usePanierContext } from '@/panier/providers';
import { HeaderTeT } from '@/ui';

const Header = () => {
  const landingPathname = useLandingPathname();
  const { panier } = usePanierContext();
  const { data: collectiviteInfo } = useCollectiviteInfo(
    panier?.collectivite_id ?? panier?.collectivite_preset ?? null
  );

  return (
    <HeaderTeT customRootUrl={landingPathname} AccesRapide={AccesRapide} />
  );
};

export default Header;
