const archiver = require('archiver');
const fetch = require('node-fetch');

// génère un zip de tous les fichiers donnés en paramètres
const zipUrls = async (req, res) => {
  // URLs des fichiers à télécharger
  const signedUrls = req.body?.signedUrls;
  if (!signedUrls?.length) {
    return res.sendStatus(404);
  }

  let archiveFinalized = false;

  // crée l'archive et les écouteurs d'événements associés
  const archive = archiver('zip');
  // -> quand l'archive est finalisée
  archive.on('end', () => {
    archiveFinalized = true;
    console.log(archive.pointer() + ' total bytes');
    console.log('archive finalized');
  });
  // -> quand il y a une erreur
  archive.on('error', err => {
    console.error(err);
  });
  // -> à chaque fichier ajouté
  archive.on('entry', ({name}) => console.log(name + ' archived'));

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
    if (!archiveFinalized) {
      // arrête les téléchargements et l'archivage
      fetcher.abort();
      archive.abort();
      console.log('archive aborted');
    }
  });

  // télécharge et ajoute chaque fichier à l'archive
  // le `signal` est passé à la fonction `fetch` pour traiter les interruptions
  const fetchAndAppend = getFetchAndAppend(archive, fetcher.signal);
  await Promise.all(signedUrls.map(fetchAndAppend));

  // finalise le zip
  archive.finalize();
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
      console.error(err);
    }
  };
module.exports = zipUrls;
