'use client';

import { DemoLecteur } from '@/site/components/demo-animee/demo-lecteur';
import { useLectureDemo } from '@/site/components/demo-animee/use-lecture-demo';
import { useEffect, useState } from 'react';
import { DemoDepotCompact, SCENE_COMPACTE } from './demo-depot-compact';
import { DemoDepotLarge, SCENE_LARGE } from './demo-depot-large';
import { getEtatDemoDepot } from './demo-depot.etat';
import {
  ECRANS,
  INSTANT_FIXE_SCENE,
  TIMELINE_DEPOT,
} from './demo-depot.scenario';

const DESCRIPTION =
  "Démonstration animée du parcours de dépôt d'un PCAET dans Territoires en Transitions : ajout des documents, saisie du diagnostic par volet, import du programme d'actions depuis un PDF, transmission pour avis, réception des rapports de la DREAL et de la Région, puis adoption du plan.";

const CHAPITRES = ECRANS.map(({ chapitre, debut }) => ({
  libelle: chapitre,
  debut: TIMELINE_DEPOT.versReel(debut),
}));

/** En dessous de `md`, la scène large deviendrait illisible une fois réduite. */
const useEcranEtroit = () => {
  const [etroit, setEtroit] = useState(false);
  useEffect(() => {
    const requete = window.matchMedia('(max-width: 767px)');
    const synchroniser = () => setEtroit(requete.matches);
    synchroniser();
    requete.addEventListener('change', synchroniser);
    return () => requete.removeEventListener('change', synchroniser);
  }, []);
  return etroit;
};

export const DemoDepot = () => {
  const lecture = useLectureDemo({
    duree: TIMELINE_DEPOT.duree,
    instantFixe: TIMELINE_DEPOT.versReel(INSTANT_FIXE_SCENE),
  });
  const compact = useEcranEtroit();
  const tempsScene = TIMELINE_DEPOT.versScene(lecture.temps);
  const etat = getEtatDemoDepot(tempsScene);
  const scene = compact ? SCENE_COMPACTE : SCENE_LARGE;

  return (
    <DemoLecteur
      lecture={lecture}
      largeur={scene.largeur}
      hauteur={scene.hauteur}
      description={DESCRIPTION}
      chapitres={CHAPITRES}
      compact={compact}
    >
      {compact ? (
        <DemoDepotCompact etat={etat} temps={tempsScene} />
      ) : (
        <DemoDepotLarge etat={etat} temps={tempsScene} />
      )}
    </DemoLecteur>
  );
};
