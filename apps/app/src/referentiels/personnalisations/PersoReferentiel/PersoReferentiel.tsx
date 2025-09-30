'use client';

import Link from 'next/link';

import { useCurrentCollectivite } from '@/api/collectivites';
import { referentielToName } from '@/app/app/labels';
import { makeCollectivitePersoRefThematiqueUrl } from '@/app/app/paths';
import { BadgeACompleter } from '@/app/ui/shared/Badge/BadgeACompleter';
import { ReferentielId } from '@/domain/referentiels';
import { Checkbox } from '@/ui';

import { usePersonnalisationReferentiels } from '../personnalisation-referentiel.context';
import { useQuestionThematiqueCompletude } from './useQuestionThematiqueCompletude';

const PersoReferentiel = () => {
  const { collectiviteId, nom } = useCurrentCollectivite();

  const { referentiels, setReferentiels } = usePersonnalisationReferentiels();

  const referentielOptions: ReferentielId[] = ['cae', 'eci'];

  const thematiques = useQuestionThematiqueCompletude(
    collectiviteId,
    referentiels
  );

  return (
    <div data-test="personnalisation">
      <div className="flex flex-col items-center">
        <h1>Personnalisation des référentiels</h1>
        <h3>{nom}</h3>
      </div>
      <p className="text-lg mb-7">
        Les actions proposées dans les référentiels Climat Air Énergie et
        Économie circulaire dépendent des compétences et caractéristiques de
        chaque collectivité.
      </p>
      <p>
        Vos réponses aux questions permettront d&apos;identifier les actions qui
        ne concernent pas votre collectivité et d&apos;adapter les points des
        actions des référentiels à votre contexte.
      </p>
      {/** Choix des référentiels */}
      <p className="font-semibold mb-3">Référentiels à personnaliser</p>
      <div className="flex gap-4">
        {referentielOptions.map((referentiel) => (
          <Checkbox
            key={referentiel}
            name={referentiel}
            id={referentiel}
            className="py-0"
            checked={referentiels.includes(referentiel)}
            onChange={(e) =>
              setReferentiels(
                e.currentTarget.checked
                  ? [...referentiels, referentiel]
                  : referentiels.filter((r) => r !== referentiel)
              )
            }
            label={referentielToName[referentiel]}
          />
        ))}
      </div>
      {/** Liste des thématiques */}
      {thematiques?.length > 0 && (
        <ul className="w-full border pl-0 mt-8">
          {thematiques.map((item) => (
            <li
              key={item.id}
              className="list-none py-0 border-b last:border-none bg-white hover:bg-primary-1"
            >
              <Link
                className="flex justify-between items-center px-2 py-3 bg-none"
                href={makeCollectivitePersoRefThematiqueUrl({
                  collectiviteId,
                  thematiqueId: item.id,
                })}
              >
                {item.nom}
                <BadgeACompleter
                  a_completer={item.completude === 'a_completer'}
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PersoReferentiel;
