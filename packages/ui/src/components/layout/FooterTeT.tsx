import { AdemeLogo } from '../../assets/ademe.logo';
import { RepubliqueFrancaiseLogo } from '../../assets/republique-francaise.logo';
import { Button } from '../../design-system/Button';
import { Footer, LinkObject } from '../../design-system/Footer/Footer';
import { SITE_BASE_URL } from '../../utils/constants';

type FooterTeTProps = {
  id?: string;
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
  id,
  customLinks,
  customLogos,
  className,
}: FooterTeTProps) => {
  return (
    <Footer
      id={id}
      className={className}
      logos={[
        <RepubliqueFrancaiseLogo className="h-full" />,
        <AdemeLogo className="h-full" />,
        ...(customLogos ?? []),
      ]}
      content="Territoires en Transitions est une startup d'État portée par l'Agence de la Transition Écologique (ADEME) avec le soutien de l'Agence Nationale de la Cohésion des Territoires (ANCT)."
      contentLinks={[
        { label: 'ademe.fr', href: 'https://www.ademe.fr/', external: true },
        { label: 'beta.gouv', href: 'https://beta.gouv.fr/', external: true },
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
          label: 'Accessibilité : non conforme',
          href: `${SITE_BASE_URL}/accessibilite`,
        },
        {
          label: 'Mentions légales',
          href: `${SITE_BASE_URL}/legal/mentions-legales`,
        },
        {
          label: 'Politique des cookies',
          href: `${SITE_BASE_URL}/legal/politique-des-cookies`,
        },
        {
          label: 'Politique de confidentialité',
          href: `${SITE_BASE_URL}/legal/politique-de-confidentialite`,
        },
        {
          label: 'Conditions générales d’utilisation',
          href: `${SITE_BASE_URL}/legal/cgu`,
        },
        {
          label: 'Statistiques',
          href: `${SITE_BASE_URL}/stats`,
        },
        {
          label: 'Ressources',
          href: `${SITE_BASE_URL}/ressources`,
        },
        {
          label: 'Code source',
          href: 'https://github.com/incubateur-ademe/territoires-en-transitions',
          external: true,
        },
        {
          label: 'Feuille de route',
          href: 'https://feuille-de-route.territoiresentransitions.fr/fr/roadmap',
          external: true,
        },
        ...(customLinks ?? []),
      ]}
    />
  );
};
