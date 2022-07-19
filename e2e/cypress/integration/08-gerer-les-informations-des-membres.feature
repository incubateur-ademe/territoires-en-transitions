# language: fr

Fonctionnalité: Gérer les informations des membres
# Cette fonctionnalité repose sur la gestion des droits
  Scénario: Modifier mes informations en tant que membre de la collectivité
    Etant donné que je suis connecté en tant que "yolo"

    Et que je suis sur la page "Gestion des membres" de la collectivité "2"
    Alors le tableau des membres doit contenir les informations suivantes
      | nom       | mail          | telephone  |
      | Yolo Dodo | yolo@dodo.com | 0123456789 |

