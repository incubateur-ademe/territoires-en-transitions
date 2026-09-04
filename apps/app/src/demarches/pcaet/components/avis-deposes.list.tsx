'use client';

import { AVIS_SENS_VARIANTS } from '@/app/demarches/pcaet/constants';
import { appLabels } from '@/app/labels/catalog';
import { saveBlob } from '@/app/referentiels/preuves/Bibliotheque/saveBlob';
import { getTextFormattedDate } from '@/app/utils/formatUtils';
import { useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import type { PcaetAvisAuTitreDe, PcaetAvisSens } from '@tet/domain/demarches';
import { Badge, Button, cn } from '@tet/ui';

/**
 * Un avis, tel que cette liste a besoin de le connaître.
 *
 * Volontairement détaché des deux routes qui l'alimentent : l'instructeur lit
 * ses avis par le dossier d'instruction et voit ses propres brouillons, la
 * collectivité déposante les lit par `listAvisRecus` et n'en voit que les
 * validés. Chaque appelant projette vers cette forme.
 */
export type AvisAffiche = {
  id: string;
  demandeAvisId: number;
  auTitreDe: PcaetAvisAuTitreDe;
  sens: PcaetAvisSens;
  /** Un rapport est-il joint, donc téléchargeable ? */
  aUnRapport: boolean;
  /** Date de validation ; nulle tant que l'avis est un brouillon. */
  valideLe: string | null;
  /** Date de dépôt, qui datera le brouillon faute de validation. */
  deposeLe: string;
};

/**
 * Les avis rendus sur le dossier, avec leur rapport au téléchargement.
 *
 * Sert les deux côtés du circuit : l'instructeur, qui voit d'entrée ce qu'il a
 * déjà rendu, et la collectivité, qui découvre ici ce qu'on lui a répondu.
 */
export const AvisDeposesList = ({
  demandeAvisId,
  avis,
  titre,
  className,
}: {
  /**
   * Demande d'avis par défaut pour le téléchargement. Chaque avis porte la
   * sienne : cette valeur ne sert que d'appui pour les appelants qui n'en ont
   * qu'une, elle n'est jamais préférée à celle de l'avis.
   */
  demandeAvisId?: number;
  avis: AvisAffiche[];
  /**
   * Intitulé de la section, quand le contexte ne le donne pas déjà. Optionnel :
   * l'étape aval de la collectivité présente la liste sous son propre titre.
   */
  titre?: string;
  className?: string;
}) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  if (avis.length === 0) {
    return null;
  }

  /**
   * L'URL signée est courte : on la demande au clic plutôt que de la charger
   * avec la liste, où elle aurait expiré avant d'avoir servi. D'où le
   * `staleTime: 0`, qui interdit d'en resservir une du cache.
   */
  const telechargerRapport = async (unAvis: AvisAffiche) => {
    const { url, filename } = await queryClient.fetchQuery(
      trpc.demarches.pcaet.getAvisFileUrl.queryOptions(
        {
          demandeAvisId: unAvis.demandeAvisId ?? demandeAvisId,
          avisId: unAvis.id,
        },
        { staleTime: 0 }
      )
    );
    const response = await fetch(url);
    saveBlob(await response.blob(), filename);
  };

  return (
    <section
      className={cn('flex flex-col gap-2', className)}
      data-test="demarches.pcaet.avis-deposes"
    >
      {titre && (
        <h3 className="m-0 text-sm font-bold text-primary-9">{titre}</h3>
      )}

      {avis.map((unAvis) => {
        const titre =
          appLabels.demarchePcaetAvisAuTitreDeLabels[unAvis.auTitreDe];

        return (
          <div
            key={unAvis.id}
            data-test={`demarches.pcaet.avis-${unAvis.auTitreDe}`}
            className="flex items-start gap-3 rounded-lg border border-grey-3 bg-grey-1 p-3 text-sm"
          >
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-primary-9">{titre}</span>
                <Badge
                  title={appLabels.demarchePcaetAvisSensLabels[unAvis.sens]}
                  variant={AVIS_SENS_VARIANTS[unAvis.sens]}
                  size="xs"
                />
              </div>
              <span className="text-grey-7">
                {unAvis.valideLe
                  ? appLabels.instructionDossierAvisRenduLe({
                      date: getTextFormattedDate({ date: unAvis.valideLe }),
                    })
                  : appLabels.instructionDossierAvisBrouillonDepuis({
                      date: getTextFormattedDate({ date: unAvis.deposeLe }),
                    })}
              </span>
            </div>

            {/* Un brouillon peut n'avoir aucune pièce : le bouton n'apparaît
                que s'il y a un rapport à télécharger. */}
            {unAvis.aUnRapport && (
              <Button
                variant="outlined"
                size="xs"
                icon="download-line"
                className="shrink-0"
                dataTest={`demarches.pcaet.avis-telecharger-${unAvis.auTitreDe}`}
                aria-label={appLabels.instructionDossierAvisTelechargerAria({
                  titre,
                })}
                onClick={() => telechargerRapport(unAvis)}
              >
                {appLabels.instructionDossierAvisTelecharger}
              </Button>
            )}
          </div>
        );
      })}
    </section>
  );
};
