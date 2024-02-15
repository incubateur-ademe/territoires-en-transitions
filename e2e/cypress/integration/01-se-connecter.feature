# language: fr

Fonctionnalité: Accéder au site et se connecter

  Scénario: Se connecter en tant que Yolo (utilisateur déjà rattaché)
    Etant donné que j'ouvre le site
    Alors la page vérifie les conditions suivantes :
      | Elément                 | Condition |
      | header                  | visible   |
      | home                    | visible   |
      | formulaire de connexion | absent    |
      | footer                  | présent   |

    Quand je clique sur le bouton "Se connecter" du "header"
    Alors la page vérifie les conditions suivantes :
      | Elément                 | Condition |
      | header                  | visible   |
      | home                    | absent    |
      | formulaire de connexion | visible   |
      | footer                  | présent   |

    Quand je clique sur le bouton "Connexion avec mot de passe"
    Et que je remplis le "formulaire de connexion" avec les valeurs suivantes :
      | Champ | Valeur        |
      | email | YoLO@dodo.com |
      | mdp | yolododo |
    Et que je clique sur le bouton "Valider" du "formulaire de connexion"
    Alors la page vérifie les conditions suivantes :
      | Elément                               | Condition |
      | header                                | visible   |
      | home                                  | absent    |
      | formulaire de connexion               | absent    |
      | le tableau de bord de la collectivité | visible |

  Scénario: Se connecter en tant que Yulu (utilisateur non encore rattaché)
    Etant donné que j'ouvre le site
    Alors la page vérifie les conditions suivantes :
      | Elément                 | Condition |
      | header                  | visible   |
      | home                    | visible   |
      | formulaire de connexion | absent    |
      | footer                  | présent   |

    Quand je clique sur le bouton "Se connecter" du "header"
    Alors la page vérifie les conditions suivantes :
      | Elément                 | Condition |
      | header                  | visible   |
      | home                    | absent    |
      | formulaire de connexion | visible   |
      | footer                  | présent   |

    Quand je clique sur le bouton "Connexion avec mot de passe"
    Et que je remplis le "formulaire de connexion" avec les valeurs suivantes :
      | Champ | Valeur        |
      | email | YuLu@DUDU.COM |
      | mdp   | yulududu      |
    Et que je clique sur le bouton "Valider" du "formulaire de connexion"
    Alors la page vérifie les conditions suivantes :
      | Elément                  | Condition |
      | header                   | visible   |
      | home                     | absent    |
      | formulaire de connexion  | absent    |
      | toutes les collectivités | visible   |
      | footer                   | présent   |

  Scénario: Echouer à se connecter
    Etant donné que j'ouvre le site
    Alors la page vérifie les conditions suivantes :
      | Elément                 | Condition |
      | header                  | visible   |
      | home                    | visible   |
      | formulaire de connexion | absent    |
      | footer                  | présent   |

    Quand je clique sur le bouton "Se connecter" du "header"
    Alors la page vérifie les conditions suivantes :
      | Elément                 | Condition |
      | header                  | visible   |
      | home                    | absent    |
      | formulaire de connexion | visible   |
      | footer                  | présent   |

    Quand je clique sur le bouton "Connexion avec mot de passe"
    Et que je remplis le "formulaire de connexion" avec les valeurs suivantes :
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
      | footer                  | présent   |                                                 |

  Scénario: Demander un lien de réinitialisation du mot de passe
    Etant donné que j'ouvre le site
    Et que je clique sur le bouton "Se connecter" du "header"
    Et que je clique sur le bouton "Connexion avec mot de passe"
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
      | email | YoLO@dodo.cOm |
    Et que l'appel à "auth.resetPasswordForEmail" va répondre "ok"
    Et que je clique sur le bouton "Valider" du "demande de lien de réinitialisation du mdp"
    Alors la page vérifie les conditions suivantes :
      | Elément                                    | Condition | Valeur |
      | formulaire de connexion                    | visible   |        |
      | message lien envoyé                        | visible   |        |
      | demande de lien de réinitialisation du mdp | absent    |        |

  Scénario: Demander un lien de réinitialisation du mot de passe et visualiser une erreur
    Etant donné que j'ouvre le site
    Et que je clique sur le bouton "Se connecter" du "header"
    Et que je clique sur le bouton "Connexion avec mot de passe"
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
      | formulaire de connexion OTP           | visible   |
      | formulaire de réinitialisation du mdp | absent    |

    Quand je remplis le "formulaire de connexion OTP" avec les valeurs suivantes :
      | Champ | Valeur        |
      | email | Yolo@DoDO.com |
    Et que je clique sur le bouton "Valider" du "formulaire de connexion OTP"
    Alors le "formulaire de réinitialisation du mdp" est visible

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
      | formulaire de connexion OTP           | visible   |
      | formulaire de réinitialisation du mdp | absent    |

    Quand je remplis le "formulaire de connexion OTP" avec les valeurs suivantes :
      | Champ | Valeur        |
      | email | yolo@dodo.com |
    Et que je clique sur le bouton "Valider" du "formulaire de connexion OTP"
    Alors le "formulaire de réinitialisation du mdp" est visible

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

  Scénario: Se connecter et accepter les CGU
    Etant donné que je suis connecté en tant qu'utilisateur de la collectivité 1 n'ayant pas encore accepté les CGU
    Alors le "dialogue de validation des CGU" est visible
    Et le bouton "Fermer" du "dialogue de validation des CGU" est absent

    # on vérifie qu'on ne peut pas fermer la modale en cliquant en dehors
    Quand je clique en dehors de la boîte de dialogue
    Alors le "dialogue de validation des CGU" est visible

    # et quelle est toujours affichée si on recharge la page
    Quand je recharge la page
    Alors le "dialogue de validation des CGU" est visible

    # puis on accepte les CGU
    Quand je clique sur le bouton "Valider les CGU"
    Alors le "dialogue de validation des CGU" est absent
