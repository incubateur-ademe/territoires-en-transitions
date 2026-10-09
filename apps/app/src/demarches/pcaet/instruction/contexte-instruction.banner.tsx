'use client';

import {
  makeDemandesAvisUrl,
  makeDemarcheInstructionUrl,
  makeDossierInstructionUrl,
} from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
import { useCollectiviteContext } from '@tet/api/collectivites';
import { PcaetPerimetreSaisineEnum } from '@tet/domain/demarches';
import { Button, Icon } from '@tet/ui';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import {
  clearDossierInstructionCookie,
  serializeDossierInstructionCookie,
  writeDossierInstructionCookie,
} from './dossier-instruction-cookie';
import { extractDossierInstructionRefFromPath } from './dossier-instruction-path';

/**
 * Rappelle à l'agent d'un service qu'il n'est pas chez lui, et lui rend deux
 * chemins : le dossier qu'il instruit, et sa liste de dossiers.
 *
 * Montée dans `app-layout` au-dessus du header et collée en haut de l'écran,
 * comme le bandeau du mode super-admin : ce qui prévient qu'on agit au nom d'un
 * autre doit rester sous les yeux, pas défiler avec la page. Elle tient toute la
 * largeur de l'écran ; son conteneur intérieur reprend la gouttière des pages —
 * la même que celle du header — pour que le texte tombe sous le logo et la
 * navigation.
 *
 * Elle lit le contexte dans le store de collectivité, alimenté par le layout de
 * collectivité — même chemin que le header, qui vit au même niveau. Le contexte
 * est déduit de la saisine à chaque rendu : la bannière survit donc à un
 * rechargement comme à un lien partagé, et disparaît d'elle-même hors des
 * collectivités instruites.
 *
 * Sur la route du dossier, elle mémorise celui-ci dans un cookie de session, que
 * le layout de collectivité relit ailleurs dans la collectivité ; le retour à la
 * liste des dossiers l'efface (cf. `dossier-instruction-cookie.ts`).
 */
export const ContexteInstructionBanner = () => {
  const { collectivite } = useCollectiviteContext();
  const pathname = usePathname();

  const contexte = collectivite?.contexteInstruction;
  const collectiviteId = collectivite?.collectiviteId;

  // Sur toute route de dossier — y compris celle d'une démarche dont le
  // contexte porte déjà une saisine —, c'est le dossier résolu qu'on mémorise.
  // Une chaîne en dépendance plutôt que l'objet : le store renouvelle le
  // contexte à chaque navigation sans qu'il change.
  const dossierToRemember =
    contexte && extractDossierInstructionRefFromPath(pathname)
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

  return (
    <div
      role="status"
      data-test="demarches.pcaet.instruction.contexte-banniere"
      className="sticky top-0 z-tooltip border-b border-primary-3 bg-primary-1 text-sm text-primary-9"
    >
      <div className="w-full max-w-8xl mx-auto px-2 md:px-4 lg:px-6 py-2 flex flex-wrap items-center gap-x-3 gap-y-2">
        <Icon icon="information-line" size="sm" className="shrink-0" />
        <span className="min-w-0">
          {appLabels.contexteInstructionTitre({
            instructeur:
              appLabels.contexteInstructionCasquette[
                contexte.instructeur.type
              ] ?? contexte.instructeur.nom,
          })}
          {/* Un dossier qui n'arrive que par un territoire limitrophe se lit
              sans se conclure : le dire ici, où l'agent lit déjà à quel titre
              il est là, plutôt que de le laisser déduire d'un bouton absent.

              Le test porte sur le périmètre et non sur le droit de déposer :
              une DDT ne dépose jamais, sur son propre département comme
              ailleurs, et lui dire que ce dossier vient d'un territoire
              limitrophe serait faux neuf fois sur dix. */}
          {contexte.perimetre === PcaetPerimetreSaisineEnum.SECONDAIRE && (
            <>
              {' '}
              <span
                className="font-medium"
                data-test="demarches.pcaet.instruction.contexte-banniere.lecture-seule"
              >
                {appLabels.contexteInstructionLectureSeule}
              </span>
            </>
          )}
        </span>
        <div className="ml-auto flex items-center gap-2">
          {/* Inutile de proposer le dossier quand on y est déjà. */}
          {pathname !== dossierUrl && (
            <Button
              size="xs"
              variant="outlined"
              icon="file-text-line"
              dataTest="demarches.pcaet.instruction.contexte-banniere.dossier"
              href={dossierUrl}
            >
              {appLabels.contexteInstructionRetourDossier}
            </Button>
          )}
          <Button
            size="xs"
            variant="outlined"
            icon="arrow-left-line"
            dataTest="demarches.pcaet.instruction.contexte-banniere.retour"
            onClick={() =>
              clearDossierInstructionCookie(collectivite.collectiviteId)
            }
            href={makeDemandesAvisUrl({
              collectiviteId: contexte.instructeur.collectiviteId,
            })}
          >
            {appLabels.contexteInstructionRetour}
          </Button>
        </div>
      </div>
    </div>
  );
};
