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
    sousTitre: "tous vos plans d'actions au même endroit",
    description:
      "Rassemblez vos plans d'actions, transverses ou thématiques, sur une seule plateforme. Fini les tableurs Excel éparpillés.",
    picto: 'fiches-action',
  },
  {
    titre: 'Pilotez',
    sousTitre: 'vos actions et leur avancement',
    description:
      "Visualisez l'avancement de vos projets, identifiez les blocages et concentrez-vous sur les priorités de votre territoire.",
    picto: 'dashboard',
  },
  {
    titre: 'Mesurez',
    sousTitre: "l'atteinte de vos objectifs",
    description:
      "Définissez vos indicateurs, accédez aux données de référence en open data et comparez votre impact à celui d'autres territoires.",
    picto: 'data-visualization',
  },
  {
    titre: 'Mobilisez',
    sousTitre: 'toutes les équipes',
    description:
      'Donnez de la visibilité à vos services, partagez les responsabilités et coordonnez vos efforts.',
    picto: 'equipe',
  },
  {
    titre: 'Priorisez',
    sousTitre: "vos efforts sur l'essentiel",
    description:
      'Identifiez les actions à fort impact pour votre territoire et orientez vos ressources vers ce qui compte vraiment.',
    picto: 'formation',
  },
  {
    titre: 'Partagez',
    sousTitre: 'les informations avec vos partenaires',
    description:
      'Accédez plus facilement aux plans et aux actions des autres collectivités pour accélérer les vôtres.',
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
    <div className="flex flex-col max-w-md">
      <Image src={`/pictogrammes/${picto}.svg`} alt="" width={80} height={80} />
      <h3 className="mb-4">
        <span className="block mb-3 text-2xl">{titre}</span>{' '}
        <span className="block text-grey-8 text-xl leading-7">{sousTitre}</span>
      </h3>
      <p className="text-primary-10">{description}</p>
    </div>
  );
};
