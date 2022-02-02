# language: fr

Fonctionnalité: Accéder au site et se connecter

  Scénario: Se connecter
    Etant donné que j'ouvre le site
    Alors la page vérifie les conditions suivantes :
      | Elément                 | Condition |
      | header                  | visible   |
      | home                    | visible   |
      | formulaire de connexion | absent    |
      | footer                  | visible   |
      | bouton support          | présent   |

    Quand je clique sur le bouton "Se connecter" du "header"
    Alors la page vérifie les conditions suivantes :
      | Elément                 | Condition |
      | header                  | visible   |
      | home                    | absent    |
      | formulaire de connexion | visible   |
      | footer                  | visible   |

    Quand je remplis le "formulaire de connexion" avec les valeurs suivantes :
      | Champ | Valeur        |
      | email | yolo@dodo.com |
      | mdp   | yolododo      |
    Et que je clique sur le bouton "Valider" du "formulaire de connexion"
    Alors la page vérifie les conditions suivantes :
      | Elément                 | Condition |
      | header                  | visible   |
      | home                    | absent    |
      | formulaire de connexion | absent    |
      | mes collectivités       | visible   |
      | footer                  | visible   |

  Scénario: Echouer à se connecter
    Etant donné que j'ouvre le site
    Alors la page vérifie les conditions suivantes :
      | Elément                 | Condition |
      | header                  | visible   |
      | home                    | visible   |
      | formulaire de connexion | absent    |
      | footer                  | visible   |

    Quand je clique sur le bouton "Se connecter" du "header"
    Alors la page vérifie les conditions suivantes :
      | Elément                 | Condition |
      | header                  | visible   |
      | home                    | absent    |
      | formulaire de connexion | visible   |
      | footer                  | visible   |

    Quand je remplis le "formulaire de connexion" avec les valeurs suivantes :
      | Champ | Valeur         |
      | email | yolo@dodo.com  |
      | mdp   | n'importe quoi |
    Et que je clique sur le bouton "Valider" du "formulaire de connexion"
    Alors la page vérifie les conditions suivantes :
      | Elément                 | Condition | Valeur                                          |
      | header                  | visible   |                                                 |
      | home                    | absent    |                                                 |
      | formulaire de connexion | visible   |                                                 |
      | formulaire de connexion | contient  | L'email et le mot de passe ne correspondent pas |
      | mes collectivités       | absent    |                                                 |
      | footer                  | visible   |                                                 |

  Scénario: Demander un lien de réinitialisation du mot de passe
    Etant donné que j'ouvre le site
    Et que je clique sur le bouton "Se connecter" du "header"
    Alors la page vérifie les conditions suivantes :
      | Elément                               | Condition |
      | formulaire de connexion               | visible   |
      | formulaire de réinitialisation du mdp | absent    |

    Quand je clique sur le bouton "Mot de passe oublié" du "formulaire de connexion"
    Alors la page vérifie les conditions suivantes :
      | Elément                               | Condition |
      | formulaire de connexion               | visible   |
      | formulaire de réinitialisation du mdp | visible   |

    Quand je remplis le "formulaire de réinitialisation du mdp" avec les valeurs suivantes :
      | Champ | Valeur        |
      | email | yolo@dodo.com |
    Et que l'appel à "auth.resetPasswordForEmail" va répondre "ok"
    Et que je clique sur le bouton "Valider" du "formulaire de réinitialisation du mdp"
#Alors la page vérifie les conditions suivantes :
#  | Elément                               | Condition |
#  | formulaire de connexion               | visible   |
#  | formulaire de réinitialisation du mdp | absent    |
