#!/bin/sh

concatenated_hashes=""

if [ $# -eq 0 ]; then
  echo "Erreur il faut passer des sous-dossiers à la commande"
  echo "Utilisation: $0 <sous-dossier-a> <sous-dossier-b> ... <sous-dossier-x>"
  exit 1
fi

for SUBDIRECTORY in "$@"
do
  if [ ! -d "$SUBDIRECTORY" ]; then
    echo "Erreur: $SUBDIRECTORY n'est pas un dossier"
    exit 1
  fi

  if ! hash=$(git log -1 --pretty=format:"%H" -- "$SUBDIRECTORY")
  then
    echo "Le dossier $SUBDIRECTORY ne fait pas parti d'un dépôt"
    exit 1
  fi
  # echo "$SUBDIRECTORY $hash"
  concatenated_hashes=$(printf "%s%s" "$concatenated_hashes"  "$hash")
done

single_hash=$(printf "%s" "$concatenated_hashes" | openssl dgst -sha256 | cut -d' ' -f2 | head -c 7)
printf "%s\n" "$single_hash"
