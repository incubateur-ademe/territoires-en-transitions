'use server';

import Section from '@tet/site/components/sections/Section';
import { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Mentions Légales',
  };
}

export default async function Home() {
  return (
    <Section>
      <h1 className="fr-header__body">Mentions légales</h1>
      <h2>Informations légales</h2>
      <p>
        Territoires en transitions{' '}
        <a href="/">(https://territoiresentransitions.fr)</a> est un service
        édité par{' '}
        <a href="https://www.ademe.fr/" rel="external">
          l’ADEME
        </a>{' '}
        en partenariat avec{' '}
        <a href="https://beta.gouv.fr/" rel="external">
          beta.gouv.fr
        </a>
        .
      </p>
      <p>
        Le site constitué par l’ensemble des pages rattachées au nom Territoires
        en Transitions est la propriété de l’Agence de l’Environnement et de la
        Maîtrise de l’Energie (ADEME),
        <br />
        Établissement Public à caractère Industriel et Commercial (EPIC) régi
        par les articles L131-3 à L131-7 et R131-1 à R131-26 du Code de
        l’environnement, inscrit au registre du commerce d’Angers sous le n° 385
        290 309 et ayant son siège social au :
        <br />
        20, avenue du Grésillé - BP 90406 - 49004 Angers Cedex 01
        <br />
        Tél. 02 41 20 41 20
      </p>
      <h2>Direction de publication</h2>
      <p>
        Le directeur de la publication est Monsieur Sylvain WASERMAN, en qualité
        de représentant légal de l’ADEME.
      </p>
      <p>
        La personne responsable de l’accès aux documents administratifs et des
        questions relatives à la réutilisation des informations est Monsieur Luc
        MORINIÈRE en qualité de Chef du service des affaires juridiques.
      </p>
      <h2>Hébergement du site</h2>
      <p>
        Koyeb
        <br />
        société par actions simplifiée au capital social de 37 518,80 euros,
        immatriculée en France au Registre du Commerce de Nanterre sous le
        numéro 850 183 948, ayant son siège social au :
        <br />
        9, Rue des longsprès – 92100 Boulogne-Billancourt, France
      </p>
      <h2>Attribution</h2>
      <p>
        Certaines illustrations sont réalisées par Storyset de www.flaticon.com
      </p>
      <h2>Modification des mentions légales</h2>
      <p>
        L’ADEME se réserve le droit de modifier les présentes mentions légales à
        tout moment. L’utilisateur est lié par les conditions en vigueur lors de
        sa visite.
      </p>
    </Section>
  );
}
