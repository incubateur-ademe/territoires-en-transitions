import Section from '@/site/components/sections/Section';
import { ConstructionPlateformeItem } from '../home/ConstructionPlateforme';

const items = [
  {
    titre: 'Un service public gratuit',
    sousTitre:
      "La plateforme nationale de référence pour accélérer la mise en œuvre des actions des collectivités. Portée par l'ADEME, aucun frais caché.",
    picto: 'france',
  },
  {
    titre: 'Sécurisée et pérenne',
    sousTitre:
      'Hébergement sécurisé en France, conformité RGPD garantie, données sous votre contrôle. Gouvernance publique, pas de risque de fermeture ou de changement de modèle économique.',
    picto: 'locker',
  },
  {
    titre: 'Un outil complet et opérationnel',
    sousTitre:
      "Plans d'actions, indicateurs, tableaux de bord, exports, trajectoires SNBC et comparaisons territoriales réunis en un seul endroit. Plus besoin de jongler entre plusieurs outils.",
    picto: 'data-visualization',
  },
  {
    titre: 'Co-construite avec les collectivités',
    sousTitre:
      'Fonctionnalités développées à partir des besoins terrain et des retours utilisateurs. Évolutions régulières basées sur vos suggestions.',
    picto: 'gouvernance',
  },
];

export const DistingueSection = async () => {
  return (
    <Section className="flex flex-col !gap-16">
      <h2 className="text-center">
        Ce qui distingue Territoires en Transitions de ses concurrents
      </h2>
      <div className="mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
        {items.map((item) => (
          <ConstructionPlateformeItem key={item.titre} item={item} />
        ))}
      </div>
    </Section>
  );
};
