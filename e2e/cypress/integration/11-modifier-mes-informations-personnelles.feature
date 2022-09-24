# language: fr

Fonctionnalité: Modifier mes informations personnelles
  Scénario: Modifier mon prénom, mon nom et mon email
    Etant donné que les informations des membres sont réinitialisées
    Et que je suis connecté en tant que "yolo"

    Quand je visite la vue "Mon compte"
    Alors un formulaire de modification de compte est affiché
    # et le formulaire vérifie les donnees suivantes

    Quand je modifie le champ "prenom" en "Yolosan"
    Et que je recharge la page
    Alors le champ "prenom" doit contenir "Yolosan"

    Quand je modifie le champ "nom" en "Dodoran"
    Et que je recharge la page
    Alors le champ "nom" doit contenir "Dodoran"

    Et que je modifie le champ "email" en "yolo@doudou.com"
    Alors la modale de modification d'email est affichée

    Quand je clique sur le bouton confirmer de la modale de modification d'email
    Alors ma boite de reception contient un mail adressé à "yolo@doudou.com"

    Quand je suis sur la page "Gestion des membres" de la collectivité "1"
    Alors le tableau des membres doit contenir les informations suivantes
      | nom             | mail          | fonction         | champ_intervention                    | details_fonction                     | acces   |
      | Yolosan Dodoran | yolo@dodo.com | Référent·e       | Climat Air ÉnergieÉconomie Circulaire | Référent YOLO de cette collectivité  | Admin   |

    # Vide la boite à la fin du test pour ne pas caser le `@history`
    Alors je vide ma boite de reception
