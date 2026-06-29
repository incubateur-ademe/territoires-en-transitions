import nodemailer from 'nodemailer';

type Email = {
  to: string;
  subject: string;
  html: string;
};

/**
 * Envoi un email HTML
 * TODO: use backend instead toi avoid hard coded from email
 */
export const sendEmail = (email: Email) => {
  const transporter = getTransport();
  return transporter.sendMail({
    ...email,
    from: 'Plateforme TET <notifications@territoiresentransitions.fr>',
  });
};

/**
 * Fourni le transporteur de mails approprié en fonction de l'env.
 */
const getTransport = () => {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_KEY;

  if (!pass || !user) {
    // renvoi le transporteur Mailpit (pour le dev ou les tests)
    return nodemailer.createTransport({
      host: '127.0.0.1',
      port: 54325,
      secure: false,
    });
  }

  // renvoi le transporteur pour brevo
  return nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false,
    auth: { user, pass },
  });
};
