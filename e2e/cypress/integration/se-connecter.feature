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
      | Elément                                    | Condition |
      | formulaire de connexion                    | visible   |
      | demande de lien de réinitialisation du mdp | absent    |

    Quand je clique sur le bouton "Mot de passe oublié" du "formulaire de connexion"
    Alors la page vérifie les conditions suivantes :
      | Elément                                    | Condition |
      | formulaire de connexion                    | visible   |
      | demande de lien de réinitialisation du mdp | visible   |

    Quand je remplis le "demande de lien de réinitialisation du mdp" avec les valeurs suivantes :
      | Champ | Valeur        |
      | email | yolo@dodo.com |
    Et que l'appel à "auth.resetPasswordForEmail" va répondre "ok"
    Et que je clique sur le bouton "Valider" du "demande de lien de réinitialisation du mdp"
    Alors la page vérifie les conditions suivantes :
      | Elément                                    | Condition | Valeur        |
      | formulaire de connexion                    | visible   |               |
      | message lien envoyé                        | visible   |               |
      | message lien envoyé                        | contient  | yolo@dodo.com |
      | demande de lien de réinitialisation du mdp | absent    |               |

    Quand je clique sur le bouton "Retour à la connexion" du "message lien envoyé"
    Alors la page vérifie les conditions suivantes :
      | Elément                                    | Condition |
      | formulaire de connexion                    | visible   |
      | message lien envoyé                        | absent    |
      | demande de lien de réinitialisation du mdp | absent    |

  Scénario: Demander un lien de réinitialisation du mot de passe et visualiser une erreur
    Etant donné que j'ouvre le site
    Et que je clique sur le bouton "Se connecter" du "header"
    Alors la page vérifie les conditions suivantes :
      | Elément                                    | Condition |
      | formulaire de connexion                    | visible   |
      | demande de lien de réinitialisation du mdp | absent    |

    Quand je clique sur le bouton "Mot de passe oublié" du "formulaire de connexion"
    Alors la page vérifie les conditions suivantes :
      | Elément                                    | Condition |
      | formulaire de connexion                    | visible   |
      | demande de lien de réinitialisation du mdp | visible   |

    Quand je remplis le "demande de lien de réinitialisation du mdp" avec les valeurs suivantes :
      | Champ | Valeur        |
      | email | yolo@dodo.com |
    Et que l'appel à "auth.resetPasswordForEmail" va répondre "error"
    Et que je clique sur le bouton "Valider" du "demande de lien de réinitialisation du mdp"
    Alors la page vérifie les conditions suivantes :
      | Elément                                    | Condition | Valeur                                       |
      | formulaire de connexion                    | visible   |                                              |
      | message lien envoyé                        | absent    |                                              |
      | demande de lien de réinitialisation du mdp | visible   |                                              |
      | demande de lien de réinitialisation du mdp | contient  | L'envoi du lien de réinitialisation a échoué |

  Scénario: Réinitialiser son mot de passe depuis un lien reçu par mail
    Etant donné que j'ouvre le site depuis un lien de réinitialisation du mot de passe
    Alors la page vérifie les conditions suivantes :
      | Elément                               | Condition |
      | formulaire de connexion               | absent    |
      | formulaire de réinitialisation du mdp | visible   |

    Quand je remplis le "formulaire de réinitialisation du mdp" avec les valeurs suivantes :
      | Champ | Valeur                |
      | mdp   | monmotdepassesécurisé |
    Et que l'appel à "auth.updateUserPassword" va répondre "ok"
    Et que je clique sur le bouton "Valider" du "formulaire de réinitialisation du mdp"
    Alors la page vérifie les conditions suivantes :
      | Elément                                  | Condition |
      | formulaire de connexion                  | absent    |
      | formulaire de réinitialisation du mdp    | absent    |
      | réinitialisation du mot de passe réussie | visible   |

  Scénario: Réinitialiser son mot de passe depuis un lien reçu par mail et visualiser une erreur
    Etant donné que j'ouvre le site depuis un lien de réinitialisation du mot de passe
    Alors la page vérifie les conditions suivantes :
      | Elément                               | Condition |
      | formulaire de connexion               | absent    |
      | formulaire de réinitialisation du mdp | visible   |

    Quand je remplis le "formulaire de réinitialisation du mdp" avec les valeurs suivantes :
      | Champ | Valeur                |
      | mdp   | monmotdepassesécurisé |
    Et que l'appel à "auth.updateUserPassword" va répondre "error"
    Et que je clique sur le bouton "Valider" du "formulaire de réinitialisation du mdp"
    Alors la page vérifie les conditions suivantes :
      | Elément                                    | Condition |
      | formulaire de connexion                    | absent    |
      | formulaire de réinitialisation du mdp      | absent    |
      | réinitialisation du mot de passe en erreur | visible   |