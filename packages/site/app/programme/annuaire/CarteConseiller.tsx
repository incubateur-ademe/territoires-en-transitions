'use client';

import { DEPRECATED_StrapiImage } from '@/site/components/strapiImage/StrapiImage';
import { StrapiItem } from '@/site/src/strapi/StrapiItem';
import { Icon, Tooltip, useCopyToClipboard } from '@/ui';
import { useState } from 'react';

type CarteConseillerProps = {
  prenom: string;
  nom: string;
  structure: string;
  region: string;
  ville: string;
  email: string;
  linkedin?: string;
  site?: string;
  photo?: StrapiItem;
};

const CarteConseiller = ({
  prenom,
  nom,
  structure,
  region,
  ville,
  email,
  linkedin,
  site,
  photo,
}: CarteConseillerProps) => {
  const [displayCopyMsg, setDisplayCopyMsg] = useState(false);
  const { copy } = useCopyToClipboard();

  return (
    <div className="bg-white px-3 py-5 rounded-xl border border-primary-4 flex justify-between items-center gap-4">
      {/* Image */}
      {photo !== undefined ? (
        <DEPRECATED_StrapiImage
          data={photo}
          className="w-20 h-20 min-w-20 min-h-20 object-cover rounded-full border-primary-2 border-4 shrink-0 grow-0"
          displayCaption={false}
        />
      ) : (
        <div className="w-20 h-20 rounded-full bg-primary-4 border-4 border-primary-2 shrink-0 grow-0 flex">
          <span className="m-auto text-grey-1 text-3xl font-bold uppercase">
            {prenom.slice(0, 1)}
            {nom.slice(0, 1)}
          </span>
        </div>
      )}

      {/* Contenu */}
      <div className="flex flex-col justify-start gap-1 h-full grow">
        {/* En-tête */}
        <div className="flex justify-between items-start">
          {/* Nom */}
          <div className="text-primary-9 text-lg font-bold">
            {prenom} {nom}
          </div>

          {/* Liens */}
          <div className="flex gap-1 pt-0.5">
            {!!linkedin && (
              <a
                href={
                  linkedin.startsWith('http') ? linkedin : `https://${linkedin}`
                }
                target="_blank"
                rel="noreferrer noopener"
                className="bg-none after:hidden text-primary-5 hover:text-primary-7 transition-colors"
              >
                <Icon icon="linkedin-box-fill" />
              </a>
            )}
            {!!site && (
              <a
                href={site.startsWith('http') ? site : `https://${site}`}
                target="_blank"
                rel="noreferrer noopener"
                className="bg-none after:hidden text-primary-5 hover:text-primary-7 transition-colors"
              >
                <Icon icon="pages-line" />
              </a>
            )}
          </div>
        </div>

        {/* Détails */}
        <div className="flex flex-col gap-1">
          {/* Structure */}
          <p className="text-primary-7 text-sm font-bold mb-0">{structure}</p>

          {/* Région - Ville */}
          <p className="text-grey-7 text-xs font-medium mb-0">
            {region} - {ville}
          </p>

          {/* Email */}
          <div className="flex gap-1 items-center">
            <Tooltip
              label={displayCopyMsg ? 'Copié !' : "Copier l'email"}
              openingDelay={0}
            >
              <Icon
                icon="file-copy-line"
                size="xs"
                className="cursor-pointer text-grey-6 hover:text-primary-7 transition-colors"
                onClick={() => {
                  copy(email);
                  setDisplayCopyMsg(true);
                }}
                onMouseLeave={() => setDisplayCopyMsg(false)}
              />
            </Tooltip>
            <a
              href={`mailto:${email}`}
              className="text-primary-7 text-xs font-medium w-fit bg-none"
            >
              {email}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarteConseiller;
