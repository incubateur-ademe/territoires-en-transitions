#!/bin/sh

###
### Génère les types TS à partir de la base de données
###

# Fonction qui exécute une commande un nombre limité de fois jusqu'à ce qu'elle
# renvoie le code de sortie 0
repeat_command() {
  # Récupère le nombre maximal d'essais et la commande à partir des arguments
  # de la fonction
  local MAX_TRIES="${1}"
  shift
  local COMMAND="${@}"

  # Compteur d'essais
  local try_count=0

  # Exécute la commande jusqu'à ce qu'elle renvoie le code de sortie 0
  # ou jusqu'à ce que le nombre maximal d'essais soit atteint
  while [ ${try_count} -lt ${MAX_TRIES} ]; do
    ${COMMAND}
    if [ $? -eq 0 ]; then
      break
    fi

    try_count=$((try_count + 1))
  done

  # Vérifie si la commande a réussi à renvoyer le code de sortie 0 avant
  # d'atteindre le nombre maximal d'essais
  if [ ${try_count} -eq ${MAX_TRIES} ]; then
    echo "La commande n'a pas renvoyé le code de sortie 0 après ${MAX_TRIES} essais" >&2
    return 1
  fi

  echo "La commande a renvoyé le code de sortie 0 après ${try_count} essais"
  return 0
}

echo "Génère les types TS à partir de la base de données"
supabase gen types typescript --db-url postgresql://postgres:${POSTGRES_PASSWORD}@host.docker.internal:${POSTGRES_PORT}/postgres > ./app.territoiresentransitions.react/src/types/database.types.ts

echo "Tri par ordre alphabétique les types générés pour que le git diff soit consistant"
cd ./app.territoiresentransitions.react
# Le tri est fait avec eslint et le plugin `typescript-sort-keys` (cf .eslintrc.json)
# On doit appliquer la commande plusieurs fois pour que toutes les erreurs
# soient corrigées (peut-être à cause de la taille du fichier ?)
repeat_command 5 ./node_modules/.bin/eslint src/types/database.types.ts --fix
cd -

# fait une copie du fichier, ainsi mis à jour, pour les tests de l'API
cp ./app.territoiresentransitions.react/src/types/database.types.ts ./api_tests/lib/database.types.ts 

echo "Terminé"
