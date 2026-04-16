import { AdemeLogo } from '../../assets/ademe.logo';
import { uiLabels } from '@tet/ui/labels/catalog';
import { RepubliqueFrancaiseLogo } from '../../assets/republique-francaise.logo';
import { Button } from '../../design-system/Button';
import { Footer, LinkObject } from '../../design-system/Footer/Footer';
import { SITE_BASE_URL } from '../../utils/constants';

type FooterTeTProps = {
  /** Liens supplémentaires à afficher en fonction de la page visitée */
  customLinks?: LinkObject[];
  /** Logos supplémentaires à afficher en fonction de la page visitée */
  customLogos?: React.ReactNode[];
  /** Surcharge des classNames. */
  className?: string;
};

/**
 * Footer par défaut des applications Territoires en Transitions
 */

export const FooterTeT = ({
  customLinks,
  customLogos,
  className,
}: FooterTeTProps) => {
  return (
    <Footer
      id="footer"
      className={className}
      logos={[
        <RepubliqueFrancaiseLogo key="republique" className="h-full" />,
        <AdemeLogo key="ademe" className="h-full" />,
        ...(customLogos ?? []),
      ]}
      content="Territoires en Transitions est une startup d'État portée par l'Agence de la Transition Écologique (ADEME) avec le soutien de l'Agence Nationale de la Cohésion des Territoires (ANCT)."
      contentLinks={[
        { label: uiLabels.ademeFr, href: 'https://www.ademe.fr/', external: true },
        { label: uiLabels.betaGouv, href: 'https://beta.gouv.fr/', external: true },
      ]}
      bottomContent={
        <div className="flex flex-wrap gap-x-1 mb-0 text-xs leading-5 text-grey-8">
          Sauf mention contraire, tous les contenus de ce site sont sous
          <Button
            variant="underlined"
            size="xs"
            href="https://github.com/incubateur-ademe/territoires-en-transitions/blob/248410dbd53f1e8f26ddbd9c9ac1f4dc2cf2d899/LICENSE"
            external
            className="!text-grey-8 !font-normal !border-b-grey-8"
          >
            MIT License
          </Button>
        </div>
      }
      bottomLinks={[
        {
          label: uiLabels.accessibiliteNonConforme,
          href: `${SITE_BASE_URL}/accessibilite`,
        },
        {
          label: uiLabels.mentionsLegales,
          href: `${SITE_BASE_URL}/legal/mentions-legales`,
        },
        {
          label: uiLabels.politiqueDesCookies,
          href: `${SITE_BASE_URL}/legal/politique-des-cookies`,
        },
        {
          label: uiLabels.politiqueDeConfidentialite,
          href: `${SITE_BASE_URL}/legal/politique-de-confidentialite`,
        },
        {
          label: uiLabels.conditionsGeneralesUtilisation,
          href: `${SITE_BASE_URL}/legal/cgu`,
        },
        {
          label: uiLabels.statistiques,
          href: `${SITE_BASE_URL}/stats`,
        },
        {
          label: uiLabels.ressources,
          href: `${SITE_BASE_URL}/ressources`,
        },
        {
          label: uiLabels.codeSource,
          href: 'https://github.com/incubateur-ademe/territoires-en-transitions',
          external: true,
        },
        {
          label: uiLabels.feuilleDeRoute,
          href: 'https://feuille-de-route.territoiresentransitions.fr/fr/roadmap',
          external: true,
        },
        ...(customLinks ?? []),
      ]}
    />
  );
};
