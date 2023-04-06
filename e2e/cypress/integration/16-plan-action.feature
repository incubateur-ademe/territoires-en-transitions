# language: fr

Fonctionnalité: Gérer les fiches et les plans d'action

  Scénario: Ajouter, éditer et supprimer une fiche action
    Etant donné que je suis connecté en tant que "yolo"
    Et que je suis sur la page "Plans action" de la collectivité "1"
    # créer une fiche depuis la barre de navigation latérale
    Quand je clique sur le bouton "Créer une fiche action"
    Alors le "Fiche action" est visible
    # modifier le titre en "Fiche test"
    Quand je saisi la valeur "Fiche test" dans le champ "header input"
    Et que je clique en dehors de la boîte de dialogue
    Alors le "header input" contient "Fiche test"
    # créer un tag personne pilote "Michel Sapasse"
    Quand j'ouvre la section "acteurs"
    Et que je crée un tag "Michel Sapasse" avec le sélecteur de tag "PersonnePilote"
    # ajouter un statut "En cours"
    Et que j'ouvre la section "modalites"
    Et que je sélectionne "En cours" dans la liste déroulante "Statut"
    # naviguer vers fiche non classées' et vérifier la présence de la fiche créée
    Quand je suis sur la page "Fiches non classees" de la collectivité "1"
    Alors la carte de la fiche créée est présente et affiche le titre "Fiche test", le pilote "Michel Sapasse" et le statut "En cours"
    # supprimer la fiche créée
    Quand je navigue sur la fiche "Fiche test"
    Et que je supprime la fiche
    Et que je suis sur la page "Fiches non classees" de la collectivité "1"
    Alors la fiche "Fiche test" n'est plus présente

  # scénario désactivé en attendant de trouver la raison des timeouts
  @skip
  Scénario: Ajouter, éditer et supprimer un plan d'action
    Etant donné que je suis connecté en tant que "yolo"
    Et que je suis sur la page "Plans action" de la collectivité "1"

    # créer un plan d'action depuis la barre de navigation latérale
    Quand je clique sur le bouton "Ajouter un plan d'action"
    Alors le "Plan action" est visible

    # lui donner le titre "Plan test"
    Quand je saisi la valeur "Plan test" dans le champ "header input"
    Et que je clique en dehors de la boîte de dialogue
    Alors le nom du plan d'action est changé en "Plan test" dans la navigation

    # ajouter un nouveau titre et lui donner ce contenu "Axe 1: les tests passent"
    Quand j'ajoute un nouveau titre
    Et que je le nomme "Axe 1: les tests passent"
    # ajouter une fiche au nouvel axe créé
    Et que j'ajoute une fiche à "Axe 1: les tests passent"
    Et que je reviens sur le plan d'action "Plan test"
    Alors le "Filtrer les fiches" est visible

    # ajouter un deuxième axe "Axe 2"
    Quand j'ajoute un nouveau titre
    Et que je le nomme "Axe 2"
    # supprimer "Axe 2"
    Et que je veux supprimer le dernier axe
    Alors le texte "Il n'y a aucune fiche dans ce niveau et son arborescence" est visible

    #confirmer et vérifier
    Quand je supprime l'axe depuis la modale
    Alors l'axe "Axe 2" n'est plus visible

    # vérifier le texte de suppression du plan sans fiche
    Quand je veux supprimer le plan
    Alors le texte "Souhaitez-vous supprimer ce plan, son arborescence et les fiches qui y sont liées" est visible

    Quand je clique en dehors de la boîte de dialogue
    # supprimer "Axe 1: les tests passent"
    Et que je veux supprimer le dernier axe
    Alors le texte "Souhaitez-vous supprimer ce niveau et les fiches qui y sont liées ?" est visible

    # confirmer et vérifier
    Quand je supprime l'axe depuis la modale
    Alors l'axe "Axe 1: les tests passent" n'est plus visible

    # supprimer le plan d'action
    Quand je veux supprimer le plan
    Alors le texte "Il n'y a aucune fiche dans ce plan et son arborescence" est visible

    Quand je supprime l'axe depuis la modale
    Alors le plan n'est plus présent dans la navigation

  Scénario: Ranger une fiche action
    Etant donné que je suis connecté en tant que "yolo"
    Et que je suis sur la page "Plans action" de la collectivité "1"
    # ajouter un nouveau plan d'action
    Quand je clique sur le bouton "Ajouter un plan d'action"
    # ajouter un nouveau titre et lui donner ce contenu "Axe 1: les tests passent"
    Quand j'ajoute un nouveau titre
    Et que je le nomme "Axe 1: les tests passent"
    # ajouter une fiche au nouvel axe créé
    Quand j'ajoute une fiche à "Axe 1: les tests passent"
    # ouvrir la modale "Ranger la fiche"
    Quand j'ouvre la modale "Ranger la fiche"
    Alors le "Modale ranger fiche action" est visible
    # enlever la fiche du plan d'action
    # le plan doit apparaitre dans "Sélectionner un nouvel emplacement"
    Quand j'enlève la fiche du plan
    Alors le plan "Sans titre" est visible dans le tableau nouvel emplacement
    # fermer la modale
    # le fil d'ariane de la fiche doit contenir "Fiches non classées"
    Quand je clique en dehors de la boîte de dialogue
    Alors le fil d'ariane de la fiche contient "Fiches non classées"
    # ranger la fiche dans Axe 1: les tests passent du plan "Sans titre"
    Quand j'ouvre la modale "Ranger la fiche"
    Et que je clique sur l'axe "Sans titre" du tableau nouvel emplacement
    Et que je clique sur l'axe "Axe 1: les tests passent" du tableau nouvel emplacement
    Et que je valide cet emplacement
    Alors l'axe "Axe 1: les tests passent" est visible dans les emplacements sélectionnés pour cette fiche
    # fermer la modale
    # le fil d'ariane de la fiche doit contenir "Axe 1"
    Quand je clique en dehors de la boîte de dialogue
    Alors le fil d'ariane de la fiche contient "Axe 1: les tests passent"
