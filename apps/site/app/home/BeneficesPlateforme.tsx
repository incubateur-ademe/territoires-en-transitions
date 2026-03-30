import Section from '@/site/components/sections/Section';
import Image from 'next/image';

type Item = {
  titre: string;
  sousTitre: string;
  description: string;
  picto: string;
};

const items: Array<Item> = [
  {
    titre: 'Centralisez',
    sousTitre: "Centralisez tous vos plans d'action au même endroit",
    description:
      "Rassemblez vos plans d'actions, transverses ou thématiques, sur une seule plateforme. Fini les tableurs Excel éparpillés.",
    picto: 'fiches-action',
  },
  {
    titre: 'Pilotez',
    sousTitre: 'Pilotez vos actions et leur avancement',
    description:
      "Visualisez l'avancement de vos projets, identifiez les blocages et priorisez ce qui compte vraiment pour votre territoire.",
    picto: 'dashboard',
  },
  {
    titre: 'Mesurez',
    sousTitre: "Mesurez l'atteinte de vos objectifs",
    description:
      "Définissez vos indicateurs, accédez aux données de référence en open data et comparez votre impact à celui d'autres territoires.",
    picto: 'data-visualization',
  },
  {
    titre: 'Mobilisez',
    sousTitre: 'Mobilisez toutes les équipes',
    description:
      'Donnez de la visibilité à vos services, partagez les responsabilités et coordonnez vos efforts.',
    picto: 'equipe',
  },
  {
    titre: 'Priorisez',
    sousTitre: "Priorisez vos efforts sur l'essentiel",
    description:
      'Identifiez les actions à fort impact pour votre territoire et orientez vos ressources vers ce qui compte vraiment.',
    picto: 'formation',
  },
  {
    titre: 'Partagez',
    sousTitre: 'Partagez les informations avec vos partenaires',
    description:
      'Accédez plus facilement aux plans & actions des autres collectivités pour accélérer vos propres actions',
    picto: 'human-cooperation',
  },
];

export const BeneficesPlateforme = () => {
  return (
    <Section containerClassName="bg-primary-1 max-md:!py-6 md:max-lg:!py-12 lg:!py-20">
      <div className="mx-auto grid md:grid-cols-3 gap-12">
        {items.map((item) => (
          <BeneficesPlateformeItem key={item.titre} item={item} />
        ))}
      </div>
    </Section>
  );
};

const BeneficesPlateformeItem = ({ item }: { item: Item }) => {
  const { titre, sousTitre, description, picto } = item;
  return (
    <div className="flex flex-col max-w-md items-center md:items-start">
      <Image src={`/pictogrammes/${picto}.svg`} alt="" width={80} height={80} />
      <h5>{titre}</h5>
      <h6 className="text-grey-8">{sousTitre}</h6>
      <p className="text-primary-10">{description}</p>
    </div>
  );
};
