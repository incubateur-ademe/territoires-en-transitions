'use client';

import { appLabels } from '@/app/labels/catalog';
import { saveBlob } from '@/app/referentiels/preuves/Bibliotheque/saveBlob';
import { getTextFormattedDate } from '@/app/utils/formatUtils';
import { useQueryClient } from '@tanstack/react-query';
import type { RouterOutput } from '@tet/api';
import { useTRPC } from '@tet/api';
import { Badge, Button } from '@tet/ui';
import { AVIS_SENS_VARIANTS } from '../instruction.constants';

type Dossier = RouterOutput['demarches']['pcaet']['getDossierInstruction'];
export type AvisDepose = Dossier['avis'][number];

/**
 * Les avis déjà déposés sur le dossier, pour information : l'instructeur voit
 * d'entrée ce qui a déjà été rendu — au titre du préfet de région comme de
 * l'autorité environnementale — avant de reprendre la lecture des étapes.
 */
export const AvisDeposesList = ({
  demandeAvisId,
  avis,
}: {
  demandeAvisId: number;
  avis: AvisDepose[];
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
  const telechargerRapport = async (unAvis: AvisDepose) => {
    const { url, filename } = await queryClient.fetchQuery(
      trpc.demarches.pcaet.getAvisFileUrl.queryOptions(
        { demandeAvisId, avisId: unAvis.id },
        { staleTime: 0 }
      )
    );
    const response = await fetch(url);
    saveBlob(await response.blob(), filename);
  };

  return (
    <section
      className="flex flex-col gap-2"
      data-test="demarches.pcaet.instruction.avis-deposes"
    >
      <h6 className="m-0 text-xs font-bold uppercase text-grey-7">
        {appLabels.instructionDossierAvisDeposesTitre}
      </h6>
      {avis.map((unAvis) => {
        const titre =
          appLabels.demarchePcaetAvisAuTitreDeLabels[unAvis.auTitreDe];

        return (
          <div
            key={unAvis.id}
            data-test={`demarches.pcaet.instruction.avis-${unAvis.auTitreDe}`}
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

            {/* Un avis peut être un brouillon sans pièce jointe : le bouton
                n'apparaît que s'il y a un rapport à télécharger. */}
            {unAvis.fichierRef && (
              <Button
                variant="outlined"
                size="xs"
                icon="download-line"
                className="shrink-0"
                dataTest={`demarches.pcaet.instruction.avis-telecharger-${unAvis.auTitreDe}`}
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
