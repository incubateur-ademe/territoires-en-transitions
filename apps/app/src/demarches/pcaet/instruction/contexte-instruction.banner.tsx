'use client';

import {
  makeDemandesAvisUrl,
  makeDossierInstructionUrl,
} from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
import { useCollectiviteContext } from '@tet/api/collectivites';
import { PcaetPerimetreSaisineEnum } from '@tet/domain/demarches';
import { Button, Icon } from '@tet/ui';
import { usePathname } from 'next/navigation';

/**
 * Rappelle à l'agent d'un service qu'il n'est pas chez lui, et lui rend deux
 * chemins : le dossier qu'il instruit, et sa liste de dossiers.
 *
 * Montée dans `app-layout`, au-dessus du conteneur de contenu : c'est ce qui lui
 * donne un fond d'un bord à l'autre de l'écran, là où le conteneur est centré et
 * borné. Son conteneur intérieur reprend la gouttière des pages — la même que
 * celle du header — pour que le texte tombe sous le logo et la navigation.
 *
 * Elle lit le contexte dans le store de collectivité, alimenté par le layout de
 * collectivité — même chemin que le header, qui vit au même niveau. Le contexte
 * est déduit de la saisine à chaque rendu, sans état de session : la bannière
 * survit donc à un rechargement comme à un lien partagé, et disparaît d'elle-même
 * hors des collectivités instruites.
 */
export const ContexteInstructionBanner = () => {
  const { collectivite } = useCollectiviteContext();
  const pathname = usePathname();

  const contexte = collectivite?.contexteInstruction;
  if (!collectivite || !contexte) {
    return null;
  }

  const dossierUrl = makeDossierInstructionUrl({
    collectiviteInstruiteId: collectivite.collectiviteId,
    demandeAvisId: contexte.demandeAvisId,
  });

  return (
    <div
      role="status"
      data-test="demarches.pcaet.instruction.contexte-banniere"
      className="border-b border-primary-3 bg-primary-1 text-sm text-primary-9"
    >
      <div className="w-full max-w-8xl mx-auto px-2 md:px-4 lg:px-6 py-2 flex flex-wrap items-center gap-x-3 gap-y-2">
        <Icon icon="information-line" size="sm" className="shrink-0" />
        <span className="min-w-0">
          {appLabels.contexteInstructionTitre({
            instructeurNom: contexte.instructeur.nom,
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
