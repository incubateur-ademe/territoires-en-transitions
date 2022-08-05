# language: fr

Fonctionnalité: Gérer les informations des membres

  Scénario: Modifier mon accès en tant qu'Admin
    Etant donné que les droits utilisateur sont réinitialisés
    Et que les informations des membres sont réinitialisées
    Et que je suis connecté en tant que "yolo"

    Quand je suis sur la page "Gestion des membres" de la collectivité "1"
    Alors le tableau des membres doit contenir les informations suivantes
      | nom       | mail          | telephone  | fonction         | champ_intervention                    | details_fonction                     | acces   |
      | Yolo Dodo | yolo@dodo.com | 0123456789 | Référent·e       | Climat Air ÉnergieÉconomie Circulaire | Référent YOLO de cette collectivité  | Admin   |

    Quand je modifie le champ "acces" de "yolo@dodo.com" en "Édition"
    Alors je vois une modale intitulée "Modifier mes droits d’accès la collectivité"
    Et que je clique sur le bouton "Confirmer" de la modale

    Alors le tableau des membres doit contenir les informations suivantes
      | nom       | mail          | telephone  | fonction         | champ_intervention                    | details_fonction                     | acces   |
      | Yolo Dodo | yolo@dodo.com | 0123456789 | Référent·e       | Climat Air ÉnergieÉconomie Circulaire | Référent YOLO de cette collectivité  | Édition   |


  Scénario: Retirer un accès en tant qu'Admin
    Etant donné que les droits utilisateur sont réinitialisés
    Et que les informations des membres sont réinitialisées
    Et que je suis connecté en tant que "yolo"

    Quand je suis sur la page "Gestion des membres" de la collectivité "1"
    Alors le tableau des membres doit contenir les informations suivantes
      | nom       | mail          | telephone  | fonction         | champ_intervention                    | details_fonction                     | acces   |
      | Yolo Dodo | yolo@dodo.com | 0123456789 | Référent·e       | Climat Air ÉnergieÉconomie Circulaire | Référent YOLO de cette collectivité  | Admin   |
      | Yili Didi | yili@didi.com |            | Équipe politique | Climat Air ÉnergieÉconomie Circulaire | Politique YILI de cette collectivité | Édition |
      | Yala Dada | yala@dada.com |            |                  |                                       |                                      | Lecture |

    Quand je modifie le champ "acces" de "yili@didi.com" en "retirer l'acces"
    Alors je vois une modale intitulée "Retirer ce membre de la collectivité"
    Et que je clique sur le bouton "Confirmer" de la modale

    Alors le tableau des membres ne doit pas contenir l'utilisateur "yili@didi.com"


  Scénario: Modifier mes informations en tant que membre de la collectivité
    Etant donné que les droits utilisateur sont réinitialisés
    Et que les informations des membres sont réinitialisées
    Et que je suis connecté en tant que "yolo"

    Quand je suis sur la page "Gestion des membres" de la collectivité "1"
    Et le tableau des membres doit contenir les informations suivantes
      | nom       | mail          | telephone  | fonction         | champ_intervention                    | details_fonction                     | acces   |
      | Yolo Dodo | yolo@dodo.com | 0123456789 | Référent·e       | Climat Air ÉnergieÉconomie Circulaire | Référent YOLO de cette collectivité  | Admin   |
      | Yili Didi | yili@didi.com |            | Équipe politique | Climat Air ÉnergieÉconomie Circulaire | Politique YILI de cette collectivité | Édition |
      | Yala Dada | yala@dada.com |            |                  |                                       |                                      | Lecture |

    Quand je modifie le champ "fonction" de "yolo@dodo.com" en "Équipe technique"
    Alors le tableau des membres doit contenir les informations suivantes
      | nom       | mail          | telephone  | fonction         | champ_intervention | details_fonction | acces   |
      | Yolo Dodo | yolo@dodo.com | 0123456789 | Équipe technique |                    |                  | Admin |

    Quand je clique sur la valeur "Économie Circulaire" du champ "champ_intervention" de "yolo@dodo.com"
    Alors le tableau des membres doit contenir les informations suivantes
      | nom       | mail          | telephone  | fonction         | champ_intervention  | details_fonction | acces   |
      | Yolo Dodo | yolo@dodo.com | 0123456789 | Équipe technique | Climat Air Énergie |                  | Admin |

    Quand je modifie le champ "details_fonction" de "yolo@dodo.com" en "Yolo est dans l'équipe technique ECI"
    Alors le tableau des membres doit contenir les informations suivantes
      | nom       | mail          | telephone  | fonction         | champ_intervention  | details_fonction                     | acces   |
      | Yolo Dodo | yolo@dodo.com | 0123456789 | Équipe technique | Climat Air Énergie| Yolo est dans l'équipe technique ECI | Admin |


  Scénario: Modifier les informations d'autres membres en tant qu'administrateur
    Etant donné que les droits utilisateur sont réinitialisés
    Et que les informations des membres sont réinitialisées
    Et que je suis connecté en tant que "yolo"

    Quand je suis sur la page "Gestion des membres" de la collectivité "1"
    Et le tableau des membres doit contenir les informations suivantes
      | nom       | mail          | telephone  | fonction         | champ_intervention                    | details_fonction                     | acces   |
      | Yolo Dodo | yolo@dodo.com | 0123456789 | Référent·e       | Climat Air ÉnergieÉconomie Circulaire | Référent YOLO de cette collectivité  | Admin   |
      | Yili Didi | yili@didi.com |            | Équipe politique | Climat Air ÉnergieÉconomie Circulaire | Politique YILI de cette collectivité | Édition |
      | Yala Dada | yala@dada.com |            |                  |                                       |                                      | Lecture |

    Quand je modifie le champ "fonction" de "yili@didi.com" en "Équipe technique"
    Alors le tableau des membres doit contenir les informations suivantes
      | nom       | mail          | telephone  | fonction         | champ_intervention                    | details_fonction                     | acces   |
      | Yolo Dodo | yolo@dodo.com | 0123456789 | Référent·e       | Climat Air ÉnergieÉconomie Circulaire | Référent YOLO de cette collectivité  | Admin   |
      | Yili Didi | yili@didi.com |            | Équipe technique | Climat Air ÉnergieÉconomie Circulaire | Politique YILI de cette collectivité | Édition |

    Quand je modifie le champ "champ_intervention" de "yili@didi.com" en "Économie Circulaire"
    Alors le tableau des membres doit contenir les informations suivantes
      | nom       | mail          | telephone  | fonction         | champ_intervention                    | details_fonction                     | acces   |
      | Yolo Dodo | yolo@dodo.com | 0123456789 | Référent·e       | Climat Air ÉnergieÉconomie Circulaire | Référent YOLO de cette collectivité  | Admin   |
      | Yili Didi | yili@didi.com |            | Équipe technique | Climat Air Énergie                    | Politique YILI de cette collectivité | Édition |

    Quand je modifie le champ "details_fonction" de "yili@didi.com" en "Yili est maintenant dans l'équipe technique ECI"
    Alors le tableau des membres doit contenir les informations suivantes
      | nom       | mail          | telephone  | fonction         | champ_intervention                    | details_fonction                                | acces   |
      | Yolo Dodo | yolo@dodo.com | 0123456789 | Référent·e       | Climat Air ÉnergieÉconomie Circulaire | Référent YOLO de cette collectivité             | Admin   |
      | Yili Didi | yili@didi.com |            | Équipe technique | Climat Air Énergie                    | Yili est maintenant dans l'équipe technique ECI | Édition |

    Quand je modifie le champ "acces" de "yili@didi.com" en "Admin"
    Alors le tableau des membres doit contenir les informations suivantes
      | nom       | mail          | telephone  | fonction         | champ_intervention                    | details_fonction                                | acces |
      | Yolo Dodo | yolo@dodo.com | 0123456789 | Référent·e       | Climat Air ÉnergieÉconomie Circulaire | Référent YOLO de cette collectivité             | Admin |
      | Yili Didi | yili@didi.com |            | Équipe technique | Climat Air Énergie                    | Yili est maintenant dans l'équipe technique ECI | Admin |
