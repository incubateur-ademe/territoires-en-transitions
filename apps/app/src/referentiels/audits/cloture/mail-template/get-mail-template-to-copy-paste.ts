import { appLabels } from '@/app/labels/catalog';

export type MailTemplate = {
  subject: string;
  body: string;
};

export const getMailTemplateToCopyPaste = ({
  referentielNom,
  collectiviteNom,
}: {
  referentielNom: string;
  collectiviteNom: string;
}): MailTemplate => ({
  subject: appLabels.mailClotureAuditObjet(collectiviteNom),
  body: appLabels.mailClotureAuditContenu({
    referentielNom,
    collectiviteNom,
  }),
});
