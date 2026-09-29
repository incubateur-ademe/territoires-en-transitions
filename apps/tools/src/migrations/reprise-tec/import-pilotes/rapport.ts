/** Le rapport : ce que l'import a écrit. */

/** Affiche les personne_tag créés et réutilisés, et les pilotes écrits. */
export const printRapport = ({
  personneTags,
  pilotesDossiers,
  pilotesFiches,
  isConfirmed,
}: {
  personneTags: { creees: number; reutilisees: number };
  pilotesDossiers: { pilotes: number; demarches: number };
  pilotesFiches: { pilotes: number; fiches: number };
  isConfirmed: boolean;
}) => {
  console.log(
    `${personneTags.creees + personneTags.reutilisees} personne_tag : ${
      personneTags.creees
    } créés, ${personneTags.reutilisees} réutilisés (déjà là sous le même nom)`
  );
  console.log(
    `${pilotesDossiers.pilotes} pilotes de dossier, sur ${pilotesDossiers.demarches} démarches`
  );
  console.log(
    `${pilotesFiches.pilotes} pilotes de fiche, sur ${pilotesFiches.fiches} fiches`
  );
  console.log(
    isConfirmed
      ? '\nImport terminé.'
      : '\nSimulation : tout a été annulé. Relancer avec --confirm pour importer.'
  );
};
