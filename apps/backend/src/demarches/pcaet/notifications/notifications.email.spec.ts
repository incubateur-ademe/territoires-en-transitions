import { render } from '@react-email/components';
import { DemarchePcaetTransitionEnum } from '@tet/domain/demarches';
import { describe, expect, it } from 'vitest';
import { NotifyAvisRecuEmail } from './notify-avis-recu/notify-avis-recu.email';
import { NotifyDossierTransmisEmail } from './notify-dossier-transmis/notify-dossier-transmis.email';
import { NotifyInstructionCloseEmail } from './notify-instruction-close/notify-instruction-close.email';

/**
 * Ce que disent les messages, figé ici plutôt que dans les specs d'envoi :
 * `sendPendingNotifications` sert toutes les notifications en attente, donc un
 * spec voisin peut servir les nôtres et emporter le contenu avec lui.
 */
describe('Contenu des emails de démarches PCAET', () => {
  describe('transmission pour avis', () => {
    const props = {
      sendToEmail: 'agent@dreal.gouv.fr',
      subject:
        'Projet de PCAET de Redon Agglomération : transmission pour avis',
      collectiviteNom: 'Redon Agglomération',
      serviceNom: 'DREAL Bretagne',
      dossierUrl: 'https://app.test/collectivite/1/instruction/7',
    };

    it('annonce la saisine et son échéance au service qui rend un avis', async () => {
      const html = await render(
        NotifyDossierTransmisEmail({
          ...props,
          saisiPourAvis: true,
          motifLecture: null,
          echeanceAvis: '15/12/2026',
        })
      );

      expect(html).toContain('est saisi pour avis sur ce dossier');
      expect(html).toContain('Les avis sont attendus avant le 15/12/2026');
      expect(html).toContain(props.dossierUrl);
    });

    it('parle de territoire limitrophe au service que le siège ne concerne pas', async () => {
      const html = await render(
        NotifyDossierTransmisEmail({
          ...props,
          serviceNom: 'Conseil régional voisin',
          saisiPourAvis: false,
          motifLecture: 'territoire',
          echeanceAvis: '15/12/2026',
        })
      );

      expect(html).toContain('est destinataire de ce dossier');
      expect(html).toContain('territoire limitrophe');
      expect(html).not.toContain('Les avis sont attendus');
    });

    it("dit à une DDT que sa famille ne rend pas d'avis, sans invoquer la géographie", async () => {
      const html = await render(
        NotifyDossierTransmisEmail({
          ...props,
          serviceNom: 'DDT du Morbihan',
          saisiPourAvis: false,
          motifLecture: 'famille',
          echeanceAvis: '15/12/2026',
        })
      );

      expect(html).toContain('avis à rendre sur un PCAET');
      // Sur le territoire du siège, « limitrophe » serait faux.
      expect(html).not.toContain('territoire limitrophe');
    });
  });

  describe('avis reçu', () => {
    const props = {
      sendToEmail: 'pilote@collectivite.fr',
      subject: 'Avis rendu sur votre projet de PCAET',
      demarcheTitre: 'PCAET 2024-2030',
      serviceNom: 'DREAL Bretagne',
      documentsUrl:
        'https://app.test/collectivite/1/demarche-pcaet/2/documents',
    };

    it("nomme l'émetteur et le titre au nom duquel il se prononce", async () => {
      const html = await render(
        NotifyAvisRecuEmail({ ...props, auTitreDe: 'Préfet de région' })
      );

      // Le rendu JSX intercale des marqueurs entre les interpolations : on
      // vérifie les fragments, pas la phrase recollée.
      expect(html).toContain('DREAL Bretagne');
      expect(html).toContain('a rendu son avis');
      expect(html).toContain('au titre de préfet de région');
      expect(html).toContain('PCAET 2024-2030');
      expect(html).toContain(props.documentsUrl);
    });

    it('se passe du titre quand il manque', async () => {
      const html = await render(
        NotifyAvisRecuEmail({ ...props, auTitreDe: null })
      );

      expect(html).toContain('a rendu son avis');
      expect(html).not.toContain('au titre de');
    });
  });

  describe('instruction close', () => {
    const props = {
      sendToEmail: 'pilote@collectivite.fr',
      subject: 'Votre projet de PCAET est instruit',
      demarcheTitre: 'PCAET 2024-2030',
      documentsUrl:
        'https://app.test/collectivite/1/demarche-pcaet/2/documents',
    };

    it('dit que tous les avis ont été rendus', async () => {
      const html = await render(
        NotifyInstructionCloseEmail({
          ...props,
          motif: DemarchePcaetTransitionEnum.AVIS_TOUS_RENDUS,
        })
      );

      expect(html).toContain('tous les avis attendus ont été rendus');
      expect(html).toContain('publiez votre démarche');
      // Neutre à dessein : sur un délai échu, il peut n'y avoir aucun avis.
      expect(html).not.toContain('consultez les avis');
      expect(html).toContain(props.documentsUrl);
    });

    it('dit que le délai est échu, sans parler des avis rendus', async () => {
      const html = await render(
        NotifyInstructionCloseEmail({
          ...props,
          motif: DemarchePcaetTransitionEnum.DELAI_AVIS_ECHU,
        })
      );

      expect(html).toContain(
        'le délai imparti aux services consultés est échu'
      );
      expect(html).not.toContain('tous les avis attendus ont été rendus');
    });
  });
});
