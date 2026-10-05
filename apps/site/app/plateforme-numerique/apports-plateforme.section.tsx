import Section from '@/site/components/sections/Section';
import collaboration from '@/site/public/plateforme-numerique/collaboration.png';
import graphiquesDonnees from '@/site/public/plateforme-numerique/graphiques-donnees.png';
import suiviBilans from '@/site/public/plateforme-numerique/suivi-bilans.png';
import trajectoireLeviers from '@/site/public/plateforme-numerique/trajectoire-leviers.png';
import Image, { StaticImageData } from 'next/image';

const List = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="[&_p]:mb-2 [&_ul]:mb-0 [&_ul]:list-disc [&_ul]:list-inside">
      {children}
    </div>
  );
};

const items: Item[] = [
  {
    image: suiviBilans,
    imageAlt: 'Suivi des actions et préparation des bilans',
    title: 'Gagnez du temps sur le suivi et les bilans',
    subtitle:
      'Fini les tableurs Excel éparpillés. Centralisez vos actions, vos indicateurs et vos documents pour faciliter leur suivi et préparer rapidement rapports et restitutions.',
    description: (
      <List>
        <p className="font-bold">Ce que vous pouvez faire :</p>
        <ul>
          <li>Importer vos plans existants en quelques clics</li>
          <li>Générer des tableaux de bord automatiquement</li>
          <li>Exporter vos bilans pour vos rapports annuels</li>
        </ul>
      </List>
    ),
  },
  {
    image: collaboration,
    imageAlt: "Travail collaboratif sur un plan d'actions",
    title: 'Renforcez la collaboration et la transversalité',
    description: (
      <List>
        <ul>
          <li>
            <b>Centraliser les différents plans d’action</b> de votre
            collectivité (PCAET, PAT, projet de territoires etc.)
          </li>
          <li>
            <b>Faire le suivi opérationnel</b> action par action mais aussi{' '}
            <b>avoir une vision d’ensemble</b> utile pour piloter en
            transversalité grâce à <b>un tableau de bord collectif</b>
          </li>
          <li>
            <b>Collaborer avec les services</b> pour mettre à jour les
            informations, qui pourront intervenir facilement grâce à{' '}
            <b>des vues personnalisées</b>
          </li>
        </ul>
      </List>
    ),
  },
  {
    image: graphiquesDonnees,
    imageAlt: 'Graphiques et tableaux de bord des indicateurs',
    title: 'Décidez grâce à la donnée',
    subtitle:
      'Indicateurs open-data déjà pré-remplis, trajectoires SNBC territorialisées et comparaisons entre collectivités pour prioriser vos actions et fixer des objectifs réalistes.',
    description: (
      <List>
        <p className="font-bold">Ce que vous pouvez faire :</p>
        <ul>
          <li>
            Consulter vos principaux indicateurs (GES, déchets, énergie...) déjà
            renseignés
          </li>
          <li>
            Calculer votre trajectoire SNBC pour identifier les efforts secteur
            par secteur
          </li>
          <li>Comparer votre progression avec des territoires similaires</li>
        </ul>
      </List>
    ),
  },
  {
    image: trajectoireLeviers,
    imageAlt: "Trajectoire et leviers de transition d'une collectivité",
    title: 'Trajectoires & Leviers de priorisation des actions',
    subtitle: 'Quantifiez vos objectifs climat secteur par secteur',
    description: (
      <List>
        <p>
          La trajectoire SNBC territorialisée et les leviers de la planification
          écologique sont des outils d&apos;aide à la décision pour :
        </p>
        <ul>
          <li>
            Définir vos objectifs ou les interroger lors de vos bilans PCAET
          </li>
          <li>
            Quantifier les efforts à réaliser par secteur (transport,
            résidentiel, agriculture...)
          </li>
          <li>
            Identifier votre contribution à la Stratégie Nationale Bas Carbone
          </li>
        </ul>
      </List>
    ),
  },
];

type Item = {
  number?: number;
  title: string;
  subtitle?: string;
  description: React.ReactNode;
  image: StaticImageData;
  imageAlt: string;
};

const Item = ({
  number,
  title,
  subtitle,
  description,
  image,
  imageAlt,
}: Item) => {
  return (
    <div className="group grid grid-cols-1 lg:grid-cols-[3fr_2fr] odd:lg:grid-cols-[2fr_3fr] gap-6 xl:gap-12 text-primary-10">
      <div className="flex flex-col justify-center group-odd:lg:order-2">
        <h3>
          {number}. {title}
        </h3>
        {subtitle && <p className="text-lg font-semibold">{subtitle}</p>}
        {description}
      </div>
      <Image
        src={image}
        alt={imageAlt}
        className="w-full h-auto"
        sizes="(min-width: 1024px) 40vw, 100vw"
      />
    </div>
  );
};

export const ApportsPlateformeSection = () => {
  return (
    <Section className="flex flex-col !gap-16" containerClassName="pt-0">
      <h2 className="text-center">
        Ce qu&apos;apporte Territoires en Transitions
      </h2>
      {items.map((item, i) => (
        <Item key={i} number={i + 1} {...item} />
      ))}
    </Section>
  );
};
