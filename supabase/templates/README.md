# Modèles d'emails

Ce répertoire contient les modèles des emails utilisés pour l'authentification.

## Développement

Ces modèles ne servent que pour les développement et doivent être déclarés dans le fichier `supabase/config.toml`. Par exemple de la manière suivante :
```
[auth.email.template.magic_link]
subject = "Connectez-vous à Territoires en Transitions"
content_path = "./supabase/templates/magic_link.html"
```

Pour que la modification du fichier de config ou d'un modèle soit prise en compte il faut arrêter et relancer les containers supabase ainsi :

```
supabase stop
supabase start
```

Pour accéder aux emails "envoyés" en développement il faut ouvrir la webapp Inbucket.
Pour obtenir son url utiliser `supabase status` (donne actuellement la valeur `http://127.0.0.1:54324`). L'url est aussi affichée après avoir redémarré avec `supabase start`.

## Déploiement en production

En production les modèles doivent être recopiés depuis le [dashboard](https://supabase.com/dashboard/projects) de l'instance supabase.
