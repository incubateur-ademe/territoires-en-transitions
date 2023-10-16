/* eslint-disable react/no-unescaped-entities */
'use client';

import ButtonWithLink from '@components/buttons/ButtonWithLink';
import Section from '@components/sections/Section';
import LabellisationCarte from './LabellisationCarte';
import {useCollectivite} from './useCollectivite';

type LabellisationProps = {
  code: string;
};

const Labellisation = ({code}: LabellisationProps) => {
  const {data} = useCollectivite(code);

  if (!data) return null;
  const collectivite = data[0];

  return (
    <Section containerClassName="!pt-0">
      <h1 className="mb-0">{collectivite.nom}</h1>
      <div className="flex flex-wrap gap-2">
        <span className="fr-tag">{collectivite.region_name}</span>
        <span className="fr-tag">{collectivite.departement_name}</span>
        {collectivite.type_collectivite && (
          <span className="fr-tag">
            {collectivite.type_collectivite.charAt(0).toUpperCase() +
              collectivite.type_collectivite.slice(1)}
          </span>
        )}
        {collectivite.population_totale && (
          <span className="fr-tag">
            {collectivite.population_totale
              .toString()
              .replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}{' '}
            habitants
          </span>
        )}
      </div>
      <p className="text-sm">
        Vous êtes membre de cette collectivité ?{' '}
        <a
          className="fr-link ml-2 text-sm"
          href="https://app.territoiresentransitions.fr/auth/signin"
        >
          Se connecter
        </a>
      </p>

      {collectivite.active ? (
        collectivite.engagee ? (
          <>
            <p className="text-lg">
              Cette collectivité est <strong>activée sur la plateforme</strong>{' '}
              et <strong>engagée dans le programme</strong> Territoire Engagé
              Transition Écologique.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <LabellisationCarte
                titre="Climat Air Énergie"
                etoiles={collectivite.cae_etoiles}
                score={collectivite.cae_score_realise}
                dateLabel={collectivite.cae_obtenue_le}
              />
              <LabellisationCarte
                titre="Économie Circulaire"
                etoiles={collectivite.eci_etoiles}
                score={collectivite.eci_score_realise}
                dateLabel={collectivite.eci_obtenue_le}
              />
            </div>
          </>
        ) : (
          <>
            <p className="text-lg">
              Cette collectivité est <strong>activée sur la plateforme</strong>{' '}
              mais <strong>pas encore engagée dans le programme</strong>{' '}
              Territoire Engagé Transition Écologique.
            </p>
            <ButtonWithLink href="/programme">
              Je découvre l'offre du programme Territoire Engagé
            </ButtonWithLink>
          </>
        )
      ) : (
        <>
          <p className="text-lg">
            Cette collectivité n'est{' '}
            <strong>
              pas activée sur la plateforme ni engagée dans le programme
            </strong>{' '}
            Territoire Engagé Transition Écologique.
          </p>
          <div className="flex flex-wrap gap-x-8 gap-y-4">
            <ButtonWithLink
              href="https://app.territoiresentransitions.fr/auth/signup"
              className="grow md:grow-0"
            >
              Je suis agent, j’active ma collectivité{' '}
            </ButtonWithLink>
            <ButtonWithLink
              href="/programme"
              className="grow md:grow-0"
              secondary
            >
              Je découvre l'offre du programme Territoire Engagé
            </ButtonWithLink>
          </div>
        </>
      )}
    </Section>
  );
};

export default Labellisation;
