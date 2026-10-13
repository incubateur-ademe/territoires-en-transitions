import { appLabels } from '@/app/labels/catalog';
import type { RecetteDossierDetail } from '../data/use-get-dossier';

type Specificite = RecetteDossierDetail['specificites'][number];

export const toSpecificiteTexte = (
  s: Specificite
): { titre: string; detail: string } => {
  switch (s.code) {
    case 'autre_siren':
      return {
        titre: appLabels.repriseTecSpecificiteAutreSiren,
        detail: appLabels.repriseTecSpecificiteAutreSirenDetail(
          s.sirenTec,
          s.sirenTet
        ),
      };
    case 'copie_fondue':
      return {
        titre: appLabels.repriseTecSpecificiteCopieFondue,
        detail: appLabels.repriseTecSpecificiteCopieFondueDetail(s.copieId),
      };
    case 'sans_etat':
      return {
        titre: appLabels.repriseTecSpecificiteSansEtat,
        detail: appLabels.repriseTecSpecificiteSansEtatDetail,
      };
    case 'elaboration_publie':
      return {
        titre: appLabels.repriseTecSpecificiteElaborationPublie,
        detail: appLabels.repriseTecSpecificiteElaborationPublieDetail(
          s.approbationLe,
          s.lanceLe
        ),
      };
    case 'depot_instruit':
      return {
        titre: appLabels.repriseTecSpecificiteDepotInstruit,
        detail: appLabels.repriseTecSpecificiteDepotInstruitDetail(
          s.approbationLe
        ),
      };
    case 'adoption_suivi':
      return {
        titre: appLabels.repriseTecSpecificiteAdoptionSuivi,
        detail: appLabels.repriseTecSpecificiteAdoptionSuiviDetail(s.adopteLe),
      };
    case 'adoption_repli':
      return {
        titre: appLabels.repriseTecSpecificiteAdoptionRepli,
        detail: appLabels.repriseTecSpecificiteAdoptionRepliDetail(s.adopteLe),
      };
    case 'lancement_corrige':
      return {
        titre: appLabels.repriseTecSpecificiteLancementCorrige(s.saisi),
        detail: appLabels.repriseTecSpecificiteLancementCorrigeDetail(
          s.lanceLe
        ),
      };
    case 'transmission_ramenee':
      return {
        titre: appLabels.repriseTecSpecificiteTransmissionRamenee,
        detail: appLabels.repriseTecSpecificiteTransmissionRameneeDetail(
          s.transmisDansTec,
          s.avisEtatLe,
          s.transmisLe
        ),
      };
    case 'melange':
      return {
        titre: appLabels.repriseTecSpecificiteMelange,
        detail: appLabels.repriseTecSpecificiteMelangeDetail,
      };
    case 'aucun_service':
      return {
        titre: appLabels.repriseTecSpecificiteAucunService,
        detail: appLabels.repriseTecSpecificiteAucunServiceDetail,
      };
  }
};
