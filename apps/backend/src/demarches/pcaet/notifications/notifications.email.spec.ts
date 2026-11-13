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
        'Déposez votre avis pour le projet de PCAET de Redon Agglomération',
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
      expect(html).toContain(
        'La date limite de dépôt de l’avis est le 15/12/2026'
      );
      expect(html).toContain(
        'le diagnostic, les objectifs et le programme d&#x27;actions'
      );
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
      subject: "Consultez l'avis rendu sur votre projet de PCAET",
      demarcheTitre: 'PCAET 2024-2030',
      serviceNom: 'DREAL Bretagne',
      copie: null,
      couverture: null,
      url: 'https://app.test/collectivite/1/demarche-pcaet/2/documents',
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
      expect(html).toContain('votre');
      expect(html).toContain(props.url);
    });

    it('se passe du titre quand il manque', async () => {
      const html = await render(
        NotifyAvisRecuEmail({ ...props, auTitreDe: null })
      );

      expect(html).toContain('a rendu son avis');
      expect(html).not.toContain('au titre de');
    });

    it('parle du projet de la collectivité au service en copie', async () => {
      const html = await render(
        NotifyAvisRecuEmail({
          ...props,
          sendToEmail: 'agent@dgec.gouv.fr',
          serviceNom: 'Région Bretagne',
          auTitreDe: 'Président du conseil régional',
          copie: {
            collectiviteNom: 'Redon Agglomération',
            destinataireServiceNom: 'DGEC',
          },
          url: 'https://app.test/collectivite/1/instruction/7',
        })
      );

      expect(html).toContain('sur le projet de PCAET');
      expect(html).toContain('Redon Agglomération');
      expect(html).toContain('Consulter le dossier');
      expect(html).toContain('vous êtes membre de DGEC');
      expect(html).toContain('https://app.test/collectivite/1/instruction/7');
      expect(html).not.toContain('votre');
    });

    it("nomme le porteur à l'EPCI couvert et le mène au dépôt en lecture seule", async () => {
      const html = await render(
        NotifyAvisRecuEmail({
          ...props,
          sendToEmail: 'admin@epci.fr',
          auTitreDe: 'Préfet de région',
          couverture: {
            porteurNom: 'PETR du Pays de Redon',
            collectiviteCouverteNom: 'Redon Agglomération',
          },
        })
      );

      expect(html).toContain('PETR du Pays de Redon');
      expect(html).toContain('pour le territoire de');
      expect(html).toContain('Redon Agglomération');
      expect(html).toContain('en lecture seule');
      expect(html).toContain('Consulter l&#x27;avis');
      expect(html).toContain('dont le territoire est couvert par ce PCAET');
      expect(html).toContain(props.url);
      expect(html).not.toContain('votre');
    });
  });

  describe('instruction close', () => {
    const props = {
      sendToEmail: 'pilote@collectivite.fr',
      subject: 'Finalisez votre dépôt de PCAET',
      demarcheTitre: 'PCAET 2024-2030',
      copie: null,
      couverture: null,
      url: 'https://app.test/collectivite/1/demarche-pcaet/2/documents',
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
      expect(html).not.toContain('réputé favorable');
      // Neutre à dessein : sur un délai échu, il peut n'y avoir aucun avis.
      expect(html).not.toContain('consultez les avis');
      expect(html).toContain(props.url);
    });

    it('dit que le délai est échu et le projet réputé favorable', async () => {
      const html = await render(
        NotifyInstructionCloseEmail({
          ...props,
          motif: DemarchePcaetTransitionEnum.DELAI_AVIS_ECHU,
        })
      );

      expect(html).toContain('pour déposer des avis sur votre projet');
      expect(html).toContain('est réputé favorable');
      expect(html).toContain('publiez votre démarche');
      expect(html).not.toContain('tous les avis attendus ont été rendus');
    });

    describe('en copie à la DREAL', () => {
      const copie = {
        ...props,
        sendToEmail: 'agent@dreal.gouv.fr',
        copie: {
          collectiviteNom: 'Redon Agglomération',
          destinataireServiceNom: 'DREAL Bretagne',
        },
        url: 'https://app.test/collectivite/1/instruction/7',
      };

      it('dit que la collectivité a été prévenue, sans lui donner d’ordre', async () => {
        const html = await render(
          NotifyInstructionCloseEmail({
            ...copie,
            motif: DemarchePcaetTransitionEnum.AVIS_TOUS_RENDUS,
          })
        );

        expect(html).toContain('tous les avis attendus ont été rendus');
        expect(html).toContain('Redon Agglomération');
        expect(html).toContain('La collectivité en a été informée');
        expect(html).toContain('Consulter le dossier');
        expect(html).toContain('vous êtes membre de DREAL Bretagne');
        expect(html).toContain(copie.url);
        expect(html).not.toContain('votre');
      });

      it('dit que le délai est échu', async () => {
        const html = await render(
          NotifyInstructionCloseEmail({
            ...copie,
            motif: DemarchePcaetTransitionEnum.DELAI_AVIS_ECHU,
          })
        );

        expect(html).toContain('est terminé');
        expect(html).toContain('réputé favorable');
        expect(html).not.toContain('votre');
      });
    });

    describe('à un EPCI couvert par le dépôt d’un Supra', () => {
      const couvert = {
        ...props,
        sendToEmail: 'admin@epci.fr',
        couverture: {
          porteurNom: 'PETR du Pays de Redon',
          collectiviteCouverteNom: 'Redon Agglomération',
        },
        url: 'https://app.test/collectivite/1/demarche-pcaet/2',
      };

      it('dit que la suite revient au porteur, sans lui proposer de finaliser', async () => {
        const html = await render(
          NotifyInstructionCloseEmail({
            ...couvert,
            motif: DemarchePcaetTransitionEnum.AVIS_TOUS_RENDUS,
          })
        );

        expect(html).toContain('tous les avis attendus ont été rendus');
        expect(html).toContain('Redon Agglomération');
        expect(html).toContain('Il revient maintenant à');
        expect(html).toContain('PETR du Pays de Redon');
        expect(html).toContain('Consulter le dépôt');
        expect(html).toContain('dont le territoire est couvert par ce PCAET');
        expect(html).toContain(couvert.url);
        expect(html).not.toContain('Finaliser');
        expect(html).not.toContain('votre');
      });

      it('dit que le délai est échu', async () => {
        const html = await render(
          NotifyInstructionCloseEmail({
            ...couvert,
            motif: DemarchePcaetTransitionEnum.DELAI_AVIS_ECHU,
          })
        );

        expect(html).toContain('est terminé');
        expect(html).toContain('réputé favorable');
        expect(html).not.toContain('votre');
      });
    });
  });
});
