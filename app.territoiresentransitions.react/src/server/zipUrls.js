const archiver = require('archiver');
const fetch = require('node-fetch');

console.log(`zip origin override: ${process.env.ZIP_ORIGIN_OVERRIDE}`);

// génère un zip de tous les fichiers donnés en paramètres
const zipUrls = async (req, res) => {
  // URLs des fichiers à télécharger
  let signedUrls;
  if (process.env.ZIP_ORIGIN_OVERRIDE) {
    /** Cas spécial pour la CI : on doit ré-écrire les urls données car elles
     * pointent sur localhost:8000 pour le client mais elles doivent être
     * téléchargées sur kong:8000 depuis le serveur node qui tourne dans le
     * réseau docker */
    const origin = new URL(process.env.ZIP_ORIGIN_OVERRIDE).origin;
    console.log(`files url redirected to: ${origin}`);
    signedUrls = req.body?.signedUrls?.map(({url, ...other}) => ({
      url: url.replace(new URL(url).origin, origin),
      ...other,
    }));
  } else {
    signedUrls = req.body?.signedUrls?.filter(isValidURL);
  }
  if (!signedUrls?.length) {
    return res.sendStatus(404);
  }

  let status = 'running';

  // crée l'archive et les écouteurs d'événements associés
  const archive = archiver('zip');
  // -> quand l'archive est finalisée
  archive.on('end', () => {
    status = 'finalized';
    console.log(archive.pointer() + ' total bytes');
    console.log('archive finalized');
  });
  // -> quand il y a une erreur
  archive.on('error', err => {
    console.error(err);
  });
  // -> à chaque fichier ajouté
  // archive.on('entry', ({name}) => console.log(name + ' archived'));

  // redirige le stream de l'archive vers la réponse au client
  archive.pipe(res);

  // défini le type de la réponse
  res.set('Content-Type', 'application/zip');

  // utilise un contrôleur pour interrompre les fetch en cas d'interruption
  // demandée par le client (clic sur un bouton "Annuler")
  const fetcher = new AbortController();

  // détecte la fin de la réponse renvoyée
  res.on('close', () => {
    // si la requête a été interrompue avant la fin du l'archivage
    if (status !== 'finalized') {
      // arrête les téléchargements et l'archivage
      status = 'canceled';
      fetcher.abort();
      archive.abort();
      console.log('archive aborted');
    }
  });

  // télécharge et ajoute chaque fichier à l'archive
  // le `signal` est passé à la fonction `fetch` pour traiter les interruptions
  const fetchAndAppend = getFetchAndAppend(archive, fetcher.signal);
  await Promise.all(signedUrls.map(fetchAndAppend));

  // finalise le zip (si la requête n'a pas été interrompue)
  if (status === 'running') {
    archive.finalize();
  }
};

// renvoie une fonction qui permet de télécharger et ajouter à l'archive donnée...
const getFetchAndAppend =
  (archive, signal) =>
  // ...un fichier à partir de son url
  async ({filename, url}) => {
    try {
      const response = await fetch(url, {signal});
      const buffer = await response.buffer();
      return archive.append(buffer, {name: filename});
    } catch (err) {
      // on attrape les erreurs mais on ne les affiche dans la console que si
      // c'est autre chose qu'un arrêt volontaire des téléchargements
      if (err.type !== 'aborted') {
        console.error(err);
      }
    }
  };

// vérifie qu'une URL est autorisée à être téléchargée
const isValidURL = ({url}) => {
  const urlObj = new URL(url);
  return urlObj.origin === process.env.REACT_APP_SUPABASE_URL;
};

module.exports = zipUrls;
