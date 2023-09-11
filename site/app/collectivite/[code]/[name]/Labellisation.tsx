/* eslint-disable react/no-unescaped-entities */
'use client';

import ButtonWithLink from '@components/buttons/ButtonWithLink';
import Section from '@components/sections/Section';
import {useCollectivite} from './useCollectivite';

type LabellisationProps = {
  code: string;
};

const Labellisation = ({code}: LabellisationProps) => {
  const {data} = useCollectivite(code);

  console.log(data);

  if (!data) return null;
  const collectivite = data[0];

  return (
    <Section
      className="flex-col"
      containerClassName="!pt-0"
      customBackground="#fff"
    >
      <h2 className="mb-0">{collectivite.nom}</h2>
      <div className="flex flex-wrap gap-2">
        <span className="fr-tag">{collectivite.region_name}</span>
        <span className="fr-tag">{collectivite.departement_name}</span>
        <span className="fr-tag">
          {collectivite.type_collectivite.charAt(0).toUpperCase() +
            collectivite.type_collectivite.slice(1)}
        </span>
        <span className="fr-tag">
          {collectivite.population_totale
            .toString()
            .replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}{' '}
          habitants
        </span>
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
        collectivite.engage ? (
          <>
            <p className="text-lg">
              Cette collectivité est <strong>activée sur la plateforme</strong>{' '}
              et <strong>engagée dans le programme</strong> Territoire Engagé
              Transition Écologique.
            </p>
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
