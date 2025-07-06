# language: fr

Fonctionnalité: Accéder au site et se connecter

  Scénario: Se connecter en tant qu'utilisateur déjà rattaché
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

    Quand je clique sur le bouton "Connexion avec mot de passe"
    Et que je remplis le "formulaire de connexion" avec les valeurs suivantes :
      | Champ | Valeur        |
      | email | YoLO@dodo.com |
      | mdp   | yolododo      |
    Et que je clique sur le bouton "Valider" du "formulaire de connexion"
    Alors la page vérifie les conditions suivantes :
      | Elément                      | Condition |
      | header                       | visible   |
      | home                         | absent    |
      | formulaire de connexion      | absent    |
      | le tableau de bord personnel | visible   |

  Scénario: Se connecter par lien unique en tant qu'utilisateur déjà rattaché
    Etant donné que j'ouvre le site
    Alors la page vérifie les conditions suivantes :
      | Elément                 | Condition |
      | header                  | visible   |
      | home                    | visible   |
      | formulaire de connexion | absent    |
      | footer                  | présent   |

    Quand je clique sur le bouton "Se connecter" du "header"
    Alors je suis redirigé sur l'authentification

    Quand je clique sur le bouton "Connexion sans mot de passe"
    Et que je remplis le "formulaire de connexion" avec les valeurs suivantes :
      | Champ | Valeur        |
      | email | YoLO@dodo.com |
    Et que je clique sur le bouton "Valider" du "formulaire de connexion"
    Alors la page vérifie les conditions suivantes :
      | Elément                     | Condition |
      | home                        | absent    |
      | message de connexion envoyé | visible   |

    Quand je visite le lien contenu dans le dernier message de la mailbox de "yolo"
    Alors le champ de saisie du code est pré-rempli avec celui reçu dans la mailbox de "yolo"

    Quand je clique sur le bouton "Valider" du "formulaire de connexion"
    Alors je suis redirigé sur l'app
    Et la page vérifie les conditions suivantes :
      | Elément                      | Condition |
      | header                       | visible   |
      | home                         | absent    |
      | formulaire de connexion      | absent    |
      | le tableau de bord personnel | visible   |

  Scénario: Se connecter en tant qu'utilisateur non encore rattaché
    Etant donné que j'ouvre le site
    Alors la page vérifie les conditions suivantes :
      | Elément                 | Condition |
      | header                  | visible   |
      | home                    | visible   |
      | formulaire de connexion | absent    |
      | footer                  | présent   |

    Quand je clique sur le bouton "Se connecter" du "header"
    Alors je suis redirigé sur l'authentification
    Et la page vérifie les conditions suivantes :
      | Elément                 | Condition |
      | header                  | visible   |
      | home                    | absent    |
      | formulaire de connexion | visible   |
      | footer                  | absent    |

    Quand je clique sur le bouton "Connexion avec mot de passe"
    Et que je remplis le "formulaire de connexion" avec les valeurs suivantes :
      | Champ | Valeur        |
      | email | YuLu@DUDU.COM |
      | mdp   | yulududu      |
    Et que je clique sur le bouton "Valider" du "formulaire de connexion"
    Alors je suis redirigé sur l'app
    Et la page vérifie les conditions suivantes :
      | Elément                   | Condition |
      | header                    | visible   |
      | home                      | absent    |
      | formulaire de connexion   | absent    |
      | toutes les collectivités  | absent    |
      | finaliser mon inscription | visible   |
      | footer                    | présent   |

  Scénario: Se connecter par lien unique en tant qu'utilisateur non encore rattaché
    Etant donné que j'ouvre le site
    Alors la page vérifie les conditions suivantes :
      | Elément                 | Condition |
      | header                  | visible   |
      | home                    | visible   |
      | formulaire de connexion | absent    |
      | footer                  | présent   |

    Quand je clique sur le bouton "Se connecter" du "header"
    Et que je clique sur le bouton "Connexion sans mot de passe"
    Et que je remplis le "formulaire de connexion" avec les valeurs suivantes :
      | Champ | Valeur        |
      | email | YuLu@DUDU.COM |
    Et que je clique sur le bouton "Valider" du "formulaire de connexion"
    Alors la page vérifie les conditions suivantes :
      | Elément                     | Condition |
      | home                        | absent    |
      | message de connexion envoyé | visible   |

    Quand je visite le lien contenu dans le dernier message de la mailbox de "yulu"
    Alors le champ de saisie du code est pré-rempli avec celui reçu dans la mailbox de "yulu"

    Quand je clique sur le bouton "Valider" du "formulaire de connexion"
    Alors la page vérifie les conditions suivantes :
      | Elément                   | Condition |
      | header                    | visible   |
      | home                      | absent    |
      | formulaire de connexion   | absent    |
      | toutes les collectivités  | absent    |
      | finaliser mon inscription | visible   |
      | footer                    | présent   |

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
      | footer                  | absent    |

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
      | formulaire de connexion | contient  | L'email ou le mot de passe ne correspondent pas |
      | footer                  | absent    |                                                 |

  Scénario: Demander un lien de réinitialisation et réinitialiser le mot de passe
    Etant donné que la mailbox de "yolo" est vidée
    Alors la mailbox de "yolo" contient 0 message

    Quand j'ouvre le site
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

    # étape 1 : demande la réinit.
    Quand je remplis le "demande de lien de réinitialisation du mdp" avec les valeurs suivantes :
      | Champ | Valeur        |
      | email | YoLO@dodo.cOm |
    Et que je clique sur le bouton "Valider" du "demande de lien de réinitialisation du mdp"
    Alors la page vérifie les conditions suivantes :
      | Elément                                    | Condition | Valeur |
      | formulaire de connexion                    | visible   |        |
      | message de réinitialisation envoyé         | visible   |        |
      | demande de lien de réinitialisation du mdp | absent    |        |

    # étape 2 : saisie code OTP
    Quand je visite le lien contenu dans le dernier message de la mailbox de "yolo"
    Alors le champ de saisie du code est pré-rempli avec celui reçu dans la mailbox de "yolo"

    Quand je clique sur le bouton "Valider" du "formulaire de connexion"
    Alors le "formulaire de réinitialisation du mdp" est visible

    Quand je remplis le "formulaire de réinitialisation du mdp" avec les valeurs suivantes :
      | Champ | Valeur                |
      | mdp   | monmotdepassesécurisé |
    Et que je clique sur le bouton "Valider" du "formulaire de réinitialisation du mdp"

    Alors la page vérifie les conditions suivantes :
      | Elément                               | Condition |
      | formulaire de connexion               | absent    |
      | formulaire de réinitialisation du mdp | absent    |
      | le tableau de bord personnel          | visible   |

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
      | message de réinitialisation envoyé         | absent    |                                              |
      | demande de lien de réinitialisation du mdp | visible   |                                              |
      | demande de lien de réinitialisation du mdp | contient  | L'envoi du lien de réinitialisation a échoué |

  Scénario: Se connecter sans mot de passe
    Etant donné que la mailbox de "yolo" est vidée
    Alors la mailbox de "yolo" contient 0 message

    Quand j'ouvre le site
    Et que je clique sur le bouton "Se connecter" du "header"
    Alors le "formulaire de connexion" est visible

    # étape 1 : saisie email/mdp
    Quand je clique sur le bouton "Connexion sans mot de passe"
    Et que je remplis le "formulaire de connexion" avec les valeurs suivantes :
      | Champ | Valeur        |
      | email | yolo@dodo.com |
    Et que je clique sur le bouton "Valider" du "formulaire de connexion"
    Alors la page vérifie les conditions suivantes :
      | Elément                     | Condition |
      | header                      | visible   |
      | home                        | absent    |
      | message de connexion envoyé | visible   |
    Et la mailbox de "yolo" contient 1 message
    Et le dernier message dans la mailbox de "yolo" contient le texte "Me connecter"

    # étape 2 : saisie code OTP
    Quand je visite le lien contenu dans le dernier message de la mailbox de "yolo"
    Alors le champ de saisie du code est pré-rempli avec celui reçu dans la mailbox de "yolo"

    Quand je clique sur le bouton "Valider" du "formulaire de connexion"
    Alors la page vérifie les conditions suivantes :
      | Elément                          | Condition |
      | header                           | visible   |
      | home                             | absent    |
      | formulaire de connexion          | absent    |
      | formulaire de création de compte | absent    |
      | toutes les collectivités         | absent    |
      | le tableau de bord personnel     | visible   |
      | footer                           | présent   |

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
