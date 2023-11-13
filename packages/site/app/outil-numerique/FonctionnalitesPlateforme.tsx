/* eslint-disable react/no-unescaped-entities */
import Section from '@components/sections/Section';

const FonctionnalitesPlateforme = () => {
  return (
    <Section>
      <h2 className="text-center">
        Organisez le travail et atteignez vos objectifs !
      </h2>
      <div>
        <ul className="text-primary-10 text-[21px] leading-[32px] font-[500]">
          <li className="marker:text-primary-6 pb-6">
            Accélérez votre diagnostique grâce aux actions à impact
          </li>
          <li className="marker:text-primary-6 pb-6">
            Centralisez vos données et pilotez vos plans d’actions
          </li>
          <li className="marker:text-primary-6 pb-6">
            Bénéficiez d’une aide précieuse dans la collecte de données grâce à
            l’Open Data
          </li>
          <li className="marker:text-primary-6 pb-6">
            Collaborez avec vos collègues pour le suivi des actions et la mise à
            jour des indicateurs
          </li>
          <li className="marker:text-primary-6 pb-6">
            Evaluez la progression et l'impact de vos actions via vos tableaux
            de bord
          </li>
        </ul>
      </div>
    </Section>
  );
};

export default FonctionnalitesPlateforme;
