import Section from '@/site/components/sections/Section';
import { TitreSection } from '@/site/components/sections/TitreSection';
import Image from 'next/image';

type Item = {
  titre: string;
  sousTitre: string;
  picto: string;
};

const items: Array<Item> = [
  {
    titre: 'Service public',
    sousTitre:
      "Portée par l'ADEME et soutenue par l'ANCT, la DINUM et le SGPE.",
    picto: 'france',
  },
  {
    titre: 'Open source et gratuit',
    sousTitre:
      'Code accessible, données sous votre contrôle, pas de frais cachés.',
    picto: 'data',
  },
  {
    titre: 'Amélioration continue',
    sousTitre:
      'Évolutions régulières basées sur vos retours, équipe dédiée et réactive.',
    picto: 'code',
  },
  {
    titre: 'Un support humain et réactif',
    sousTitre:
      'Accompagnement à la prise en main, sessions de démo et aide à la mise en ligne de vos plans.',
    picto: 'support',
  },
];

export const ConstructionPlateforme = () => {
  return (
    <Section
      className="flex items-center gap-16"
      containerClassName="bg-primary-0 max-md:!py-6 md:max-lg:!py-12 lg:!py-20"
    >
      <TitreSection>
        Une plateforme pensée avec et pour les utilisateurs en collectivités
      </TitreSection>
      <div className="mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
        {items.map((item) => (
          <ConstructionPlateformeItem key={item.titre} item={item} />
        ))}
      </div>
    </Section>
  );
};

const ConstructionPlateformeItem = ({ item }: { item: Item }) => {
  const { titre, sousTitre, picto } = item;
  return (
    <div className="flex flex-col max-w-md items-center md:items-start">
      <Image src={`/pictogrammes/${picto}.svg`} alt="" width={80} height={80} />
      <h6>{titre}</h6>
      <p className="text-primary-10">{sousTitre}</p>
    </div>
  );
};
