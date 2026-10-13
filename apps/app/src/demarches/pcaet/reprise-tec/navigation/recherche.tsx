'use client';

import {
  makeRepriseTecCollectiviteUrl,
  makeRepriseTecCollectivitesUrl,
} from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
import { Badge, Icon } from '@tet/ui';
import { cn } from '@tet/ui/utils/cn';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { RecetteCollectivite } from '../data/use-list-collectivites';
import { rechercher, type Suggestion } from './rechercher';

const toUrl = (s: Suggestion) => {
  switch (s.type) {
    case 'region':
      return makeRepriseTecCollectivitesUrl({ region: s.region });
    case 'departement':
      return makeRepriseTecCollectivitesUrl({
        region: s.region,
        departement: s.departement,
      });
    case 'collectivite':
    case 'dossier':
      return s.collectivite.collectiviteId === null
        ? null
        : makeRepriseTecCollectiviteUrl({
            collectiviteId: s.collectivite.collectiviteId,
            tecDossierId: s.type === 'dossier' ? s.tecDossierId : undefined,
          });
  }
};

const toLignes = (s: Suggestion) => {
  switch (s.type) {
    case 'region':
      return {
        type: appLabels.repriseTecTypeRegion,
        libelle: s.region,
        detail: '',
      };
    case 'departement':
      return {
        type: appLabels.repriseTecTypeDepartement,
        libelle: s.departement,
        detail: s.region ?? '',
      };
    case 'collectivite':
      return {
        type: appLabels.repriseTecTypeCollectivite,
        libelle: s.collectivite.nom,
        detail: appLabels.repriseTecDetailCollectivite(
          s.collectivite.siren,
          s.collectivite.collectiviteId
        ),
      };
    case 'dossier':
      return {
        type: appLabels.repriseTecTypeDossier,
        libelle: appLabels.repriseTecOngletDossier(
          s.tecDossierId,
          s.demarcheId
        ),
        detail: s.collectivite.nom,
      };
  }
};

export const Recherche = ({
  collectivites,
}: {
  collectivites: RecetteCollectivite[];
}) => {
  const router = useRouter();
  const [saisie, setSaisie] = useState('');
  const [selection, setSelection] = useState(0);
  const suggestions = rechercher(collectivites, saisie).filter(
    (s) => toUrl(s) !== null
  );
  const choisir = (s: Suggestion) => {
    const url = toUrl(s);
    if (url) router.push(url);
    setSaisie('');
  };

  return (
    <div className="relative w-full max-w-[760px]">
      <label htmlFor="reprise-tec-recherche" className="sr-only">
        {appLabels.repriseTecChercher}
      </label>
      <div className="flex h-11 items-center gap-2 rounded-lg border border-grey-4 bg-white px-3 focus-within:border-primary-7 focus-within:ring-1 focus-within:ring-primary-7">
        <Icon icon="search-line" size="sm" className="text-grey-8" />
        <input
          id="reprise-tec-recherche"
          data-test="admin.reprise-tec.recherche-globale"
          type="search"
          autoComplete="off"
          value={saisie}
          onChange={(e) => {
            setSaisie(e.target.value);
            setSelection(0);
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              setSelection((i) => Math.min(i + 1, suggestions.length - 1));
              e.preventDefault();
            }
            if (e.key === 'ArrowUp') {
              setSelection((i) => Math.max(i - 1, 0));
              e.preventDefault();
            }
            if (e.key === 'Enter' && suggestions[selection]) {
              choisir(suggestions[selection]);
            }
            if (e.key === 'Escape') setSaisie('');
          }}
          placeholder={appLabels.repriseTecRechercheGlobale}
          className="h-full w-full bg-transparent text-sm text-grey-10 outline-none placeholder:text-grey-6"
        />
      </div>
      {suggestions.length > 0 && (
        <ul
          role="listbox"
          className="absolute z-dropdown mt-1 w-full overflow-hidden rounded-lg border border-grey-3 bg-white shadow-card"
        >
          {suggestions.map((s, i) => {
            const { type, libelle, detail } = toLignes(s);
            return (
              <li
                key={`${s.type}-${libelle}-${i}`}
                role="option"
                aria-selected={i === selection}
              >
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    choisir(s);
                  }}
                  className={cn(
                    'flex w-full items-center gap-3 px-3 py-2 text-left text-sm',
                    i === selection ? 'bg-primary-1' : 'hover:bg-grey-2'
                  )}
                >
                  <Badge size="sm" type="solid" variant="grey" title={type} />
                  <span className="font-medium text-primary-9">{libelle}</span>
                  <span className="truncate text-xs text-grey-8">{detail}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {saisie.trim().length >= 2 && suggestions.length === 0 && (
        <div className="absolute z-dropdown mt-1 w-full rounded-lg border border-grey-3 bg-white px-3 py-2 text-sm text-grey-8 shadow-card">
          {appLabels.repriseTecAucunResultatRecherche}
        </div>
      )}
    </div>
  );
};
