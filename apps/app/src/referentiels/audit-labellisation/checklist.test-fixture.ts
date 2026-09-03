import {
  EtoileEnum,
  LabellisationAudit,
  ParcoursLabellisation,
} from '@tet/domain/referentiels';
import { TCycleLabellisation } from '../labellisations/useCycleLabellisation';

export const EMPTY_CYCLE: TCycleLabellisation = {
  parcours: null,
  isLoading: false,
  isError: false,
  status: 'non_demandee',
  isAuditeur: false,
  isConductingAudit: false,
  viewerRole: 'auditee',
  isCOT: false,
  maximumRequestableStar: null,
  canStartAudit: false,
  canAskFirstStar: false,
};

export const toAudit = ({ valide }: { valide: boolean }): LabellisationAudit => ({
  id: 1,
  collectiviteId: 1,
  referentielId: 'cae',
  demandeId: 42,
  dateDebut: null,
  dateFin: null,
  valide,
  dateCnl: null,
  valideLabellisation: null,
  clos: false,
});

export const toParcoursLabellisation = ({
  audit,
}: {
  audit: LabellisationAudit | null;
}): ParcoursLabellisation => ({
  collectiviteId: 1,
  referentiel: 'cae',
  status: 'non_demandee',
  etoiles: EtoileEnum.PREMIERE_ETOILE,
  completudeOk: false,
  critereScore: {
    scoreARealiser: 0,
    scoreFait: 0,
    atteint: false,
    etoiles: EtoileEnum.PREMIERE_ETOILE,
  },
  criteresAction: [],
  labellisation: null,
  demande: null,
  audit,
  isCot: false,
  referentRolesDefined: { eluReferent: false, referentTechnique: false },
  conditionFichiers: { referentiel: 'cae', preuveNombre: 0 },
  preuvesObjets: [],
  score: {} as ParcoursLabellisation['score'],
  auditeurs: [],
});
