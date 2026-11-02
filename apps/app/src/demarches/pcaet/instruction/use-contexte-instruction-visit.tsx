'use client';

import {
  makeDemandesAvisUrl,
  makeDemarcheInstructionUrl,
  makeDossierInstructionUrl,
} from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
import type { VisitMode } from '@/app/ui/layout/visit-mode/visit-mode';
import { useCollectiviteContext } from '@tet/api/collectivites';
import {
  PcaetPerimetreSaisineEnum,
  peutDeposerAvisSaisine,
} from '@tet/domain/demarches';
import { Button } from '@tet/ui';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import {
  clearDossierInstructionCookie,
  serializeDossierInstructionCookie,
  writeDossierInstructionCookie,
} from './dossier-instruction-cookie';
import { extractDossierInstructionRefFromPath } from './dossier-instruction-path';

/**
 * L'agent d'un service qui consulte une collectivité qu'il instruit la visite :
 * le cadre lui rappelle qu'il n'est pas chez lui et lui rend deux chemins, le
 * dossier qu'il instruit et sa liste de dossiers.
 *
 * Le contexte vient du store de collectivité, alimenté par le layout de
 * collectivité. Il est déduit de la saisine à chaque rendu : la visite survit
 * donc à un rechargement comme à un lien partagé, et disparaît d'elle-même hors
 * des collectivités instruites.
 *
 * Sur la route du dossier, le hook mémorise celui-ci dans un cookie de session,
 * que le layout de collectivité relit ailleurs dans la collectivité ; le retour
 * à la liste des dossiers l'efface (cf. `dossier-instruction-cookie.ts`).
 */
export const useContexteInstructionVisit = (): VisitMode | null => {
  const { collectivite } = useCollectiviteContext();
  const pathname = usePathname();

  const contexte = collectivite?.contexteInstruction;
  const collectiviteId = collectivite?.collectiviteId;
  const isOnDossier =
    extractDossierInstructionRefFromPath(pathname) !== null;

  // Sur toute route de dossier — y compris celle d'une démarche dont le
  // contexte porte déjà une saisine —, c'est le dossier résolu qu'on mémorise.
  // Une chaîne en dépendance plutôt que l'objet : le store renouvelle le
  // contexte à chaque navigation sans qu'il change.
  const dossierToRemember =
    contexte && isOnDossier
      ? serializeDossierInstructionCookie(
          contexte.demandeAvisId !== null
            ? { demandeAvisId: contexte.demandeAvisId }
            : { demarcheId: contexte.demarcheId }
        )
      : null;
  useEffect(() => {
    if (collectiviteId !== undefined && dossierToRemember) {
      writeDossierInstructionCookie(collectiviteId, dossierToRemember);
    }
  }, [collectiviteId, dossierToRemember]);

  if (!collectivite || !contexte) {
    return null;
  }

  // Le dossier s'adresse par sa saisine, ou par sa démarche tant qu'il est en
  // élaboration et n'a saisi personne.
  const dossierUrl =
    contexte.demandeAvisId !== null
      ? makeDossierInstructionUrl({
          collectiviteInstruiteId: collectivite.collectiviteId,
          demandeAvisId: contexte.demandeAvisId,
        })
      : makeDemarcheInstructionUrl({
          collectiviteInstruiteId: collectivite.collectiviteId,
          demarcheId: contexte.demarcheId,
        });

  return {
    dataTest: 'demarches.pcaet.instruction.contexte-banniere',
    collectiviteNom: collectivite.nom ?? '',
    // Le dossier est le seul endroit où l'agent écrit, et seulement s'il est
    // saisi pour avis : ni en élaboration, ni en périmètre limitrophe, ni pour
    // une DDT, qui ne rend jamais d'avis.
    isReadOnly: !(
      isOnDossier &&
      contexte.demandeAvisId !== null &&
      peutDeposerAvisSaisine(contexte.instructeur.type, contexte.perimetre)
    ),
    // Un dossier qui n'arrive que par un territoire limitrophe se lit sans se
    // conclure : le dire ici, où l'agent lit déjà chez qui il est, plutôt que
    // de le laisser déduire d'un bouton absent.
    //
    // Le test porte sur le périmètre et non sur le droit de déposer : une DDT
    // ne dépose jamais, sur son propre département comme ailleurs, et lui dire
    // que ce dossier vient d'un territoire limitrophe serait faux neuf fois sur
    // dix.
    notice: contexte.perimetre === PcaetPerimetreSaisineEnum.SECONDAIRE && (
      <span
        className="font-medium"
        data-test="demarches.pcaet.instruction.contexte-banniere.lecture-seule"
      >
        {appLabels.contexteInstructionLectureSeule}
      </span>
    ),
    backLink: {
      label: appLabels.contexteInstructionRetour,
      href: makeDemandesAvisUrl({
        collectiviteId: contexte.instructeur.collectiviteId,
      }),
      onClick: () => clearDossierInstructionCookie(collectivite.collectiviteId),
      dataTest: 'demarches.pcaet.instruction.contexte-banniere.retour',
    },
    // Inutile de proposer le dossier quand on y est déjà.
    actions: pathname !== dossierUrl && (
      <Button
        size="xs"
        variant="white"
        icon="file-text-line"
        dataTest="demarches.pcaet.instruction.contexte-banniere.dossier"
        href={dossierUrl}
      >
        {appLabels.contexteInstructionRetourDossier}
      </Button>
    ),
  };
};
