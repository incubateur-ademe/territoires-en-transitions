import { Section, Text } from '@react-email/components';
import { CTAButton } from '@tet/backend/utils/notifications/components/cta.button';
import { EmailContainer } from '@tet/backend/utils/notifications/components/email-container';
import { Footer } from '@tet/backend/utils/notifications/components/footer';
import { DemarchePcaetTransitionEnum } from '@tet/domain/demarches';
import * as React from 'react';
import { NotifyInstructionCloseProps } from './notify-instruction-close.props';

/**
 * La clôture de l'instruction, annoncée à la collectivité, aux EPCI que couvre
 * le dépôt d'un Supra, et en copie à la DREAL : les DREAL tiennent à s'assurer
 * que la collectivité a été prévenue.
 *
 * Le message dit pourquoi : « tous les avis rendus » laisse des avis à traiter
 * dans le mémoire de réponse, « délai échu » veut dire que des services n'ont
 * pas répondu et que le projet est réputé favorable à leur égard. Sans la
 * raison, le destinataire ne sait pas ce qui l'attend.
 */
export const NotifyInstructionCloseEmail = (
  props: NotifyInstructionCloseProps
): React.ReactNode => {
  const { demarcheTitre, motif, copie, couverture, url, sendToEmail } = props;

  if (couverture) {
    const porte = `porté par ${couverture.porteurNom} pour le territoire de ${couverture.collectiviteCouverteNom}`;
    return (
      <EmailContainer>
        <Text>Bonjour,</Text>

        {motif === DemarchePcaetTransitionEnum.AVIS_TOUS_RENDUS ? (
          <Text>
            L&apos;instruction du projet de PCAET <b>{demarcheTitre}</b>,{' '}
            {porte}, est close : tous les avis attendus ont été rendus.
          </Text>
        ) : (
          <Text>
            Le délai réglementaire pour déposer des avis sur le projet de PCAET{' '}
            <b>{demarcheTitre}</b>, {porte}, est terminé. Un avis qui n&apos;a
            pas été rendu est réputé favorable.
          </Text>
        )}

        <Text>
          Il revient maintenant à {couverture.porteurNom} de déposer le mémoire
          de réponse et la délibération d&apos;adoption, puis de publier la
          démarche.
        </Text>

        <Section className="my-8 text-center">
          <CTAButton href={url}>Consulter le dépôt →</CTAButton>
        </Section>

        <Footer
          toEmail={sendToEmail}
          raison={`Vous recevez ce message car vous administrez ${couverture.collectiviteCouverteNom}, dont le territoire est couvert par ce PCAET, sur Territoiresentransitions.fr`}
        />
      </EmailContainer>
    );
  }

  if (copie) {
    return (
      <EmailContainer>
        <Text>Bonjour,</Text>

        {motif === DemarchePcaetTransitionEnum.AVIS_TOUS_RENDUS ? (
          <Text>
            L&apos;instruction du projet de PCAET <b>{demarcheTitre}</b> de{' '}
            {copie.collectiviteNom} est close : tous les avis attendus ont été
            rendus.
          </Text>
        ) : (
          <Text>
            Le délai réglementaire pour déposer des avis sur le projet de PCAET{' '}
            <b>{demarcheTitre}</b> de {copie.collectiviteNom} est terminé. Un
            avis qui n&apos;a pas été rendu est réputé favorable.
          </Text>
        )}

        <Text>
          La collectivité en a été informée : il lui revient maintenant de
          déposer le mémoire de réponse et la délibération d&apos;adoption, puis
          de publier sa démarche.
        </Text>

        <Section className="my-8 text-center">
          <CTAButton href={url}>Consulter le dossier →</CTAButton>
        </Section>

        <Footer
          toEmail={sendToEmail}
          raison={`Vous recevez ce message car vous êtes membre de ${copie.destinataireServiceNom} sur Territoiresentransitions.fr`}
        />
      </EmailContainer>
    );
  }

  return (
    <EmailContainer>
      <Text>Bonjour,</Text>

      {motif === DemarchePcaetTransitionEnum.AVIS_TOUS_RENDUS ? (
        <Text>
          L&apos;instruction de votre projet de PCAET <b>{demarcheTitre}</b> est
          close : tous les avis attendus ont été rendus.
        </Text>
      ) : (
        <Text>
          Le délai réglementaire pour déposer des avis sur votre projet de PCAET{' '}
          <b>{demarcheTitre}</b> est terminé. Si vous n&apos;avez pas reçu
          d&apos;avis sur la plateforme, ni par d&apos;autres canaux, votre
          PCAET est réputé favorable.
        </Text>
      )}

      {/* Sans détailler les avis : sur un délai échu, il peut n'y en avoir
          aucun à consulter. */}
      <Text>
        Vous devez maintenant finaliser la démarche : déposez le mémoire de
        réponse et la délibération d&apos;adoption, puis publiez votre démarche.
      </Text>

      <Section className="my-8 text-center">
        <CTAButton href={url}>Finaliser la démarche →</CTAButton>
      </Section>

      <Footer
        toEmail={sendToEmail}
        raison="Vous recevez ce message car vous pilotez cette démarche ou administrez la collectivité sur Territoiresentransitions.fr"
      />
    </EmailContainer>
  );
};

// exemple pour react-email-preview (en dev)
NotifyInstructionCloseEmail.PreviewProps = {
  demarcheTitre: 'PCAET 2024-2030',
  motif: DemarchePcaetTransitionEnum.DELAI_AVIS_ECHU,
  copie: null,
  couverture: null,
  url: 'https://app.territoiresentransitions.fr',
  sendToEmail: 'pilote@collectivite.fr',
};

export default NotifyInstructionCloseEmail;
