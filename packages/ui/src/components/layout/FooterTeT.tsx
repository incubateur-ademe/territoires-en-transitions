import AdemeLogo from '@/ui/assets/AdemeLogo';
import RepubliqueFrancaiseLogo from '@/ui/assets/RepubliqueFrancaiseLogo';
import { Button } from '@/ui/design-system/Button';
import { SITE_BASE_URL } from '@/ui/utils/constants';
import { Footer, LinkObject } from '../../design-system/Footer/Footer';

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
        <div className="flex flex-wrap gap-x-1 mb-0">
          Sauf mention contraire, tous les contenus de ce site sont sous
          <Button
            variant="underlined"
            size="xs"
            href="https://github.com/etalab/licence-ouverte/blob/master/LO.md"
            external
            className="!text-grey-8 !font-normal !border-b-grey-8"
          >
            licence etalab-2.0
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
          href: `${SITE_BASE_URL}/mentions-legales`,
        },
        {
          label: 'Données personnelles',
          href: 'https://www.ademe.fr/donnees-personnelles/',
          external: true,
        },
        {
          label: 'Politique des cookies',
          href: `${SITE_BASE_URL}/politique-des-cookies`,
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
        {
          label: 'Conditions générales d’utilisation',
          href: `${SITE_BASE_URL}/cgu`,
        },
        ...(customLinks ?? []),
      ]}
    />
  );
};
