/* eslint-disable @next/next/no-img-element */
import { StrapiItem } from '@/site/src/strapi/StrapiItem';
import classNames from 'classnames';

/**
 * Doc : Utiliser srcset pour optimiser le chargement des images
 * https://laconsole.dev/blog/attribut-srcset-optimiser-chargement-images-html
 *
 * La balise <Image /> de Next.js a été écartée car il y a un problème avec le first content paint.
 */

const imagePlaceholder = '/placeholder.svg';

type Props = {
  strapiImage: StrapiItem;
  /**
   * Taille de l'image souhaitée, par rapport au viewport,
   * aux différents breakpoint de la page. Par défaut, c'est 100vw.
   *
   * Ex : `(min-width: 1280px) 450px, (min-width: 576px) 50vw, 100vw`.
   *
   * Attention, l’ordre des descripteurs est important car le navigateur
   * applique la première condition valide qu’il trouve en lisant de gauche à droite.
   **/
  size?: string;
  imgClassName?: string;
  containerClassName?: string;
  displayCaption?: boolean;
};

/** Renvoi une balise img avec les attributs src, srcSet et sizes
 * en se basant sur les formats renvoyés par Strapi */
const ImageStrapi = ({
  strapiImage,
  size = '100vw',
  imgClassName,
  containerClassName,
  displayCaption = false,
}: Props) => {
  const attributes = strapiImage.attributes;
  const { url, formats, alternativeText } = attributes;

  if (!url) {
    return (
      <div className={classNames('relative', containerClassName)}>
        <img
          className={classNames('block bg-grey-1', imgClassName)}
          src={imagePlaceholder}
          alt="Image de remplacement car l'image est manquante"
        />
      </div>
    );
  }

  return (
    <div className={classNames('relative', containerClassName)}>
      <img
        className={classNames('block w-full h-full', imgClassName)}
        src={(formats.small?.url ?? url) as unknown as string}
        srcSet={
          formats &&
          Object.keys(formats)
            .map((key) => `${formats[key].url} ${formats[key].width}w`)
            .join(', ')
        }
        sizes={size}
        alt={`${alternativeText ?? ''}`}
      />

      {displayCaption && !!alternativeText && (
        <div className="text-right text-grey-1 !text-sm !leading-4 py-1 px-2 absolute right-0 bottom-0 bg-grey-8/50 rounded-tl-sm">
          {`${alternativeText}`}
        </div>
      )}
    </div>
  );
};

export default ImageStrapi;
