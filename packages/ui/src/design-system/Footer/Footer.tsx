import { Button } from '@/ui/design-system/Button';
import classNames from 'classnames';

export type LinkObject = { label: string; href: string; external?: boolean };

type FooterProps = {
  id?: string;
  /** Liste de logos à afficher à gauche du footer.
   * Utiliser de préférence des composants renvoyant un svg. */
  logos?: React.ReactNode[];
  /** Contenu principal, sous forme de chaine de caractères ou de noeud React. */
  content: React.ReactNode;
  /** Liste de liens affichés sous le contenu principal. */
  contentLinks?: LinkObject[];
  /** Contenu de la partie inférieure, sous forme de chaine de caractères ou de noeud React. */
  bottomContent?: React.ReactNode;
  /** Liste de liens affichés dans la partie inférieure du footer. */
  bottomLinks?: LinkObject[];
  /** Surcharge des classNames. */
  className?: string;
};

/**
 * Composant Footer générique
 */

export const Footer = ({
  id,
  logos,
  content,
  contentLinks,
  bottomContent,
  bottomLinks,
  className,
}: FooterProps) => {
  return (
    <footer
      id={id}
      className={classNames('w-full border-t-2 border-t-primary-8', className)}
    >
      {/* Partie suppérieure du footer */}
      <div className="w-full mx-auto px-4 lg:px-6 xl:max-w-7xl 2xl:max-w-8xl xl:px-2 py-8 flex max-md:flex-wrap justify-between md:gap-x-16 lg:gap-x-32 gap-y-6 md:flex-row">
        {/* Logos */}
        {!!logos && (
          <div className="flex h-28 gap-x-1">
            {logos.map((logo, i) => (
              <div key={i} className="h-full">
                {logo}
              </div>
            ))}
          </div>
        )}

        {/* Contenu principal */}
        <div>
          {/* Description */}
          <p className="text-sm leading-6 text-grey-9">{content}</p>

          {/* Liste de liens */}
          {!!contentLinks && (
            <ul className="!list-none flex flex-wrap gap-4 divide-x divide-grey-4 mb-0">
              {contentLinks.map((link) => (
                <li key={link.label} className="pl-4 first-of-type:pl-0 pb-0">
                  <Button
                    variant="underlined"
                    size="sm"
                    href={link.href}
                    external={link.external}
                    className="!text-primary-8 border-b-transparent hover:border-b-primary-8 hover:!border-b"
                  >
                    {link.label}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Partie inférieure du footer */}
      {(!!bottomLinks || !!bottomContent) && (
        <div className="w-full border-t border-t-primary-4">
          <div className="w-full mx-auto px-4 lg:px-6 xl:max-w-7xl 2xl:max-w-8xl xl:px-2 py-6">
            {/* Liste de liens */}
            {!!bottomLinks && (
              <ul className="!list-none flex flex-wrap gap-2 divide-x divide-grey-4">
                {bottomLinks.map((link) => (
                  <li key={link.label} className="pl-2 first-of-type:pl-0 pb-0">
                    <Button
                      variant="underlined"
                      size="xs"
                      href={link.href}
                      external={link.external}
                      className="!text-grey-8 border-b-transparent hover:border-b-grey-8 hover:!border-b !font-normal"
                    >
                      {link.label}
                    </Button>
                  </li>
                ))}
              </ul>
            )}

            {/* Description */}
            {!!bottomContent && bottomContent}
          </div>
        </div>
      )}
    </footer>
  );
};
