import nodemailer from 'nodemailer';

type Email = {
  to: string;
  subject: string;
  html: string;
};

/**
 * Envoi un email HTML
 */
export const sendEmail = (email: Email) => {
  const transporter = getTransport();
  return transporter.sendMail({
    ...email,
    from: 'Territoires en Transitions <contact@territoiresentransitions.fr>',
  });
};

/**
 * Fourni le transporteur de mails approprié en fonction de l'env.
 */
const getTransport = () => {
  // pour la prod.
  if (process.env.NODE_ENV === 'production') {
    // vérifie l'env.
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_KEY;
    if (!pass || !user) {
      throw Error('Config brevo manquante');
    }

    // renvoi le transporteur pour brevo
    return nodemailer.createTransport({
      host: 'smtp-relay.brevo.com',
      port: 587,
      secure: false,
      auth: {user, pass},
    });
  }

  // renvoi le transporteur inbucket (pour le dev ou les tests)
  return nodemailer.createTransport({
    host: '127.0.0.1',
    port: 54325,
    secure: false,
  });
};
