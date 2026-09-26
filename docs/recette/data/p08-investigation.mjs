export default {
  id: 'P08',
  title: 'Investigation',
  access: 'Agents connectés selon le rôle (écran /app/investigations)',
  intro: 'Écran de l’investigation, ouvert depuis un dossier Recevable. Statuts : INITIATED, IN_PROGRESS, SUSPENDED, COMPLETED. Le rapport final est soumis par CONTROLEUR_ETAT (ou ADMIN_DDIC), puis validé dans le « Circuit de validation » : Approbation DEI (CGEA), Conseiller juridique, Décision finale CGE.',
  cases: [
    {
      id: 'P08-01',
      title: 'Ouverture et démarrage d’une investigation depuis un dossier recevable',
      priority: 'Critique',
      type: 'nominal',
      role: 'CGEA',
      preconditions: ['Dossier au statut RECEVABLE (voir P07-06)', 'Session ouverte avec le compte CGEA'],
      steps: [
        'Ouvrir le dossier RECEVABLE',
        'Dans le panneau d’investigation, choisir la durée (90, 120 ou 180 jours) puis cliquer sur « Ouvrir l\'investigation »',
        'Sur l’écran de l’investigation (statut INITIATED), cliquer sur « Démarrer »',
        'Revenir sur le dossier et lire son statut'
      ],
      data: ['Durée : 90 jours'],
      expected: [
        'L’investigation est créée avec la durée choisie puis passe à IN_PROGRESS après « Démarrer »',
        'Le dossier passe au statut « En investigation »',
        'Le suivi public affiche « Enquête en cours »',
        'Le bouton « Accéder à l\'investigation » remplace « Ouvrir l\'investigation »'
      ],
      ui: ['Ouvrir l\'investigation', 'Démarrer', 'Accéder à l\'investigation']
    },
    {
      id: 'P08-02',
      title: 'Constitution de l’équipe : chef de mission et investigateurs',
      priority: 'Majeur',
      type: 'nominal',
      role: 'CGEA',
      preconditions: ['Investigation ouverte', 'Comptes TEAM_LEADER et CONTROLEUR_ETAT existants dans la liste des agents'],
      steps: [
        'Dans le bloc « Équipe », cliquer pour ajouter un membre',
        'Dans « Ajouter un membre à l\'équipe », choisir un agent et le rôle « Chef de mission »',
        'Ajouter un second agent avec le rôle « Investigateur »',
        'Relire la liste de l’équipe'
      ],
      data: ['Agents : TEAM_LEADER de test, CONTROLEUR_ETAT de test'],
      expected: [
        'Les deux membres apparaissent dans « Équipe » avec leur rôle',
        'Le nombre de membres est mis à jour sur la fiche de l’investigation'
      ],
      ui: ['Équipe', 'Ajouter un membre à l\'équipe', 'Chef de mission', 'Investigateur']
    },
    {
      id: 'P08-03',
      title: 'Cadrage : mandat, engagement préalable et plan d’investigation',
      priority: 'Majeur',
      type: 'nominal',
      role: 'CGE',
      preconditions: ['Investigation IN_PROGRESS avec une équipe'],
      steps: [
        'Bloc « Mandat » : cliquer sur « Délivrer le mandat » (session CGE)',
        'Bloc « Mon engagement préalable » : déclarer l’engagement avec le compte CONTROLEUR_ETAT membre',
        'Bloc « Plan d\'investigation » : déclarer le plan avec CONTROLEUR_ETAT puis le valider avec CGEA'
      ],
      data: [],
      expected: [
        'Le mandat est daté et attribué, l’engagement préalable est enregistré',
        'Le plan d’investigation porte la mention de validation après l’action du CGEA',
        'Les blocs ne sont éditables que par les rôles indiqués'
      ],
      ui: ['Mandat', 'Délivrer le mandat', 'Mon engagement préalable', 'Plan d\'investigation'],
      aConfirmer: 'Ordre obligatoire et blocages entre mandat, engagement préalable et plan (ex. audition impossible sans mandat) à confirmer côté back'
    },
    {
      id: 'P08-04',
      title: 'Visite terrain : planifier, tenir, procès-verbal de constat',
      priority: 'Majeur',
      type: 'nominal',
      role: 'CONTROLEUR_ETAT',
      preconditions: ['Investigation IN_PROGRESS', 'Session ouverte avec le compte CONTROLEUR_ETAT'],
      steps: [
        'Bloc « Visites terrain » : cliquer sur « Planifier une visite »',
        'Renseigner lieu et date puis enregistrer dans « Planifier une visite terrain »',
        'Sur la visite planifiée, cliquer sur « Tenir » puis confirmer',
        'Cliquer sur « Rédiger le PV de constat » et enregistrer le procès-verbal',
        'Planifier une seconde visite et utiliser « Carence » ou « Annuler »'
      ],
      data: ['Lieu : Mairie de test', 'Constat : Texte de test de la recette'],
      expected: [
        'La visite passe de planifiée à tenue et le procès-verbal de constat lui est rattaché',
        'Une visite annulée ou en carence ne permet pas de PV de constat',
        'Les boutons « Tenir », « Annuler » et « Carence » disparaissent pour les rôles non autorisés'
      ],
      ui: ['Visites terrain', 'Planifier une visite', 'Planifier une visite terrain', 'Rédiger le PV de constat', 'Carence']
    },
    {
      id: 'P08-05',
      title: 'Demandes de documents : émission, réception, escalade',
      priority: 'Majeur',
      type: 'nominal',
      role: 'CONTROLEUR_ETAT',
      preconditions: ['Investigation IN_PROGRESS'],
      steps: [
        'Bloc « Demandes de documents » : cliquer sur « Nouvelle demande »',
        'Renseigner le destinataire et les documents demandés dans « Nouvelle demande de documents »',
        'Cliquer sur « Marquer reçue » sur une demande',
        'Sur une autre demande dont l’échéance est dépassée, cliquer sur « Escalader »',
        'Utiliser « Adresse erronée » puis corriger l’adresse du destinataire'
      ],
      data: ['Destinataire : Service de test, adresse fictive'],
      expected: [
        'La demande apparaît avec son échéance et passe à « reçue » avec « Marquer reçue »',
        '« Escalader » n’est proposé que pour une demande en dépassement d’échéance',
        'La correction d’adresse met à jour le destinataire de la demande'
      ],
      ui: ['Demandes de documents', 'Nouvelle demande', 'Marquer reçue', 'Escalader', 'Adresse erronée'],
      aConfirmer: 'Délai de réponse standard et règle de dépassement d’échéance à confirmer (paramètres métier)'
    },
    {
      id: 'P08-06',
      title: 'Inventaire des pièces',
      priority: 'Majeur',
      type: 'nominal',
      role: 'CONTROLEUR_ETAT',
      preconditions: ['Investigation IN_PROGRESS', 'Deux pièces jointes ajoutées au dossier (onglet « Pièces jointes », voir P07-10)'],
      steps: [
        'Dans le dossier, onglet « Pièces jointes », ajouter document.pdf puis photo.jpg',
        'Ouvrir l’investigation et lire le bloc « Inventaire des pièces »',
        'Relire le compteur affiché entre parenthèses dans le titre du bloc',
        'Sur un dossier sans aucune pièce jointe, lire le même bloc'
      ],
      data: ['Fichiers : document.pdf, photo.jpg'],
      expected: [
        'Le compteur du titre « Inventaire des pièces (2) » correspond au nombre de pièces du dossier',
        'Chaque pièce affiche son code, sa description, sa source, son mode d’obtention (volontaire ou réquisition), sa date et son statut',
        'Sans pièce, le message « Aucune pièce dans le dossier. » s’affiche'
      ],
      ui: ['Inventaire des pièces', 'Aucune pièce dans le dossier.'],
      aConfirmer: 'Le bloc est en lecture seule dans l’écran : la source et le mode d’obtention d’une pièce (volontaire ou réquisition) se renseignent-ils à l’ajout de la pièce jointe, et par qui ?'
    },
    {
      id: 'P08-07',
      title: 'Auditions : planifier, tenir, procès-verbal signé',
      priority: 'Majeur',
      type: 'nominal',
      role: 'CONTROLEUR_ETAT',
      preconditions: ['Investigation IN_PROGRESS', 'Une personne à auditionner enregistrée (témoin ou partie visée)'],
      steps: [
        'Bloc « Auditions » : cliquer sur « Planifier une audition » et renseigner la fenêtre « Planifier une audition »',
        'Sur l’audition, cliquer sur « Tenir » puis confirmer dans « Tenir l\'audition »',
        'Cliquer sur « Rédiger le PV », saisir le procès-verbal',
        'Cliquer sur « Marquer relu » puis « Finaliser (signature) »',
        'Planifier une autre audition et utiliser « Annuler » puis « Absence »'
      ],
      data: ['Personne : témoin de test', 'PV : texte de test de la recette'],
      expected: [
        'L’audition passe à tenue, le PV est créé puis marqué relu puis finalisé',
        'Un PV finalisé n’est plus modifiable sauf par « Corriger » avec motif',
        'Les auditions annulées ou en absence n’autorisent pas de procès-verbal',
        'L’audition finalisée apparaît dans le registre des auditions (voir P11-06)'
      ],
      ui: ['Auditions', 'Planifier une audition', 'Tenir l\'audition', 'Rédiger le PV', 'Marquer relu', 'Finaliser (signature)', 'Absence']
    },
    {
      id: 'P08-08',
      title: 'Check-list du dossier de travail',
      priority: 'Majeur',
      type: 'nominal',
      role: 'CONTROLEUR_ETAT',
      preconditions: ['Investigation IN_PROGRESS'],
      steps: [
        'Bloc « Check-list du dossier de travail » : cocher un premier point',
        'Ajouter le commentaire d’un point de contrôle (« Commentaire du point de contrôle »)',
        'Cocher tous les points de la liste',
        'Recharger la page et relire l’état des cases'
      ],
      data: [],
      expected: [
        'Chaque case cochée est enregistrée et reste cochée après rechargement',
        'Le compteur « x/y » de la check-list progresse à chaque case',
        'Les cases ne sont modifiables que par CONTROLEUR_ETAT et ADMIN_DDIC quand l’investigation est IN_PROGRESS'
      ],
      ui: ['Check-list du dossier de travail', 'Commentaire du point de contrôle']
    },
    {
      id: 'P08-09',
      title: 'Soumission réussie du rapport final',
      priority: 'Critique',
      type: 'nominal',
      role: 'CONTROLEUR_ETAT',
      regression: true,
      preconditions: [
        'Investigation IN_PROGRESS',
        'Bloc « Rapport d\'enquête officiel » complet et « Note de recommandations » complète',
        'Check-list du dossier de travail entièrement cochée'
      ],
      steps: [
        'Vérifier que « Rapport d\'enquête officiel » et « Note de recommandations » portent la mention complète',
        'Cliquer sur « Soumettre rapport » en haut de l’écran',
        'Dans « Soumettre le rapport final », choisir « Rédiger en ligne », saisir le rapport et le résumé des conclusions',
        'Choisir « Issue / Résultat » : « Sanctions administratives »',
        'Cliquer pour soumettre le rapport'
      ],
      data: ['Conclusions : Résumé de conclusion de test', 'Issue : Sanctions administratives'],
      expected: [
        'Le bouton de soumission est actif seulement quand toutes les conditions sont remplies',
        'L’investigation passe au statut COMPLETED avec l’issue choisie',
        'Le dossier passe au statut « Rapport produit » et le suivi public affiche « Rapport en validation »',
        'Le bouton « Approuver DEI » apparaît pour CGEA'
      ],
      ui: ['Soumettre rapport', 'Soumettre le rapport final', 'Rédiger en ligne', 'Rapport d\'enquête officiel', 'Note de recommandations', 'Issue / Résultat', 'Sanctions administratives']
    },
    {
      id: 'P08-10',
      title: 'Rapport incomplet : soumission bloquée avec explication (pas de blocage silencieux)',
      priority: 'Critique',
      type: 'negatif',
      role: 'CONTROLEUR_ETAT',
      regression: true,
      preconditions: [
        'Investigation IN_PROGRESS',
        'Rapport d’enquête, note de recommandations ou check-list volontairement incomplets'
      ],
      steps: [
        'Cliquer sur « Soumettre rapport »',
        'Lire le bandeau d’avertissement en haut de la fenêtre « Soumettre le rapport final »',
        'Remplir tous les champs de la fenêtre et observer le bouton de soumission',
        'Compléter le rapport, la note et la check-list, puis rouvrir la fenêtre'
      ],
      data: [],
      expected: [
        'Le bandeau indique que la soumission exige le Rapport d’enquête officiel et la Note de recommandations complets et tous les points de la check-list cochés, avec le compteur « x/y actuellement »',
        'Le bouton de soumission reste désactivé tant qu’une condition manque, même si tous les champs de la fenêtre sont remplis',
        'Une fois les trois conditions remplies, le bandeau disparaît et la soumission aboutit (voir P08-09)',
        'Aucun clic ne reste sans réaction ni sans message'
      ],
      ui: ['Soumettre le rapport final', 'Check-list du dossier de travail']
    },
    {
      id: 'P08-11',
      title: 'Prolongation du délai d’investigation',
      priority: 'Majeur',
      type: 'nominal',
      role: 'CGEA',
      preconditions: ['Investigation IN_PROGRESS ou SUSPENDED', 'Accords DEI, CGEA et CGE obtenus hors application'],
      steps: [
        'Cliquer sur « Prolonger »',
        'Lire la fenêtre « Prolonger l\'investigation » (durée normale 90 jours, échéance actuelle)',
        'Choisir 90, 120 ou 180 jours ou saisir une durée puis valider',
        'Relire l’échéance sur la fiche de l’investigation'
      ],
      data: ['Durée supplémentaire : 30 jours'],
      expected: [
        'La nouvelle échéance calculée s’affiche avant validation',
        'L’échéance de la fiche est mise à jour après validation',
        'Le bouton « Prolonger » n’est visible qu’à CGEA et ADMIN_DDIC'
      ],
      ui: ['Prolonger', 'Prolonger l\'investigation'],
      aConfirmer: 'Le front n’impose pas les accords DEI, CGEA et CGE (simple rappel dans la fenêtre) : contrôle réel par le back à confirmer'
    },
    {
      id: 'P08-12',
      title: 'Circuit de validation : approbation DEI puis conseiller juridique',
      priority: 'Majeur',
      type: 'nominal',
      role: 'CGEA',
      preconditions: ['Investigation COMPLETED (voir P08-09)'],
      steps: [
        'Avec CGEA, ouvrir l’investigation et cliquer sur « Approuver DEI »',
        'Lire le « Circuit de validation »',
        'Se reconnecter avec CONSEILLER_JURIDIQUE et cliquer sur « Approuver Juridique »',
        'Relire le « Circuit de validation »'
      ],
      data: [],
      expected: [
        'Le circuit affiche « Approbation DEI » puis « Conseiller Juridique » validés à tour de rôle avec la date',
        'Chaque bouton n’apparaît qu’après l’étape précédente et pour le rôle prévu',
        'Le bouton « Décision CGE » apparaît pour CGE après l’étape juridique'
      ],
      ui: ['Approuver DEI', 'Approuver Juridique', 'Circuit de validation', 'Décision CGE']
    },
    {
      id: 'P08-13',
      title: 'Procédure d’urgence : demande puis rejet par le CGE',
      priority: 'Majeur',
      type: 'negatif',
      role: 'CGE',
      preconditions: ['Investigation IN_PROGRESS', 'Une demande de procédure d’urgence en attente'],
      steps: [
        'Avec CONTROLEUR_ETAT, dans « Procédures d\'urgence », utiliser « Demander une procédure d\'urgence » et renseigner la justification',
        'Avec CGE, dans « Procédures d\'urgence », cliquer sur « Rejeter » sur la demande en attente',
        'Saisir un motif dans « Décision sur la procédure d\'urgence » et valider'
      ],
      data: ['Justification : Risque de disparition de pièces (test)'],
      expected: [
        'La demande apparaît « En attente » avec la personne demandeuse et la date',
        'Après le rejet, son état devient « Rejetée » avec le décideur et la date',
        'Les boutons Approuver et Rejeter ne sont visibles que de CGE et ADMIN_DDIC et seulement pour une demande en attente'
      ],
      ui: ['Procédures d\'urgence', 'Demander une procédure d\'urgence', 'Décision sur la procédure d\'urgence']
    },
    {
      id: 'P08-14',
      title: 'Alerte de dépassement d’échéance',
      priority: 'Majeur',
      type: 'nominal',
      role: 'CGEA',
      preconditions: ['Une investigation dont l’échéance est dépassée (à préparer avec un technicien)'],
      steps: [
        'Ouvrir la liste des investigations puis l’investigation en dépassement',
        'Lire l’échéance, les jours restants et la mention de dépassement',
        'Menu « Statistiques » puis « Dépassements par acteur »'
      ],
      data: [],
      expected: [
        'L’échéance s’affiche en rouge avec la mention « (dépassée) »',
        'L’investigation figure dans « Dépassements par acteur » avec l’acteur en cause'
      ],
      ui: ['Dépassements par acteur', 'Progression de l\'enquête'],
      aConfirmer: 'Méthode pour obtenir une investigation en dépassement sur la VM de recette (données préparées ou date système) et règle de calcul des jours ouvrés à confirmer'
    },
    {
      id: 'P08-15',
      title: 'Actions d’investigation refusées aux rôles non autorisés',
      priority: 'Majeur',
      type: 'securite',
      role: 'AGENT_BRPD',
      preconditions: ['Investigation IN_PROGRESS', 'Comptes AGENT_BRPD et CONTROLEUR_ETAT non membre de l’équipe'],
      steps: [
        'Avec AGENT_BRPD, ouvrir /#/app/investigations puis l’investigation',
        'Chercher « Soumettre rapport », « Démarrer », « Suspendre » et « Prolonger »',
        'Avec un CONTROLEUR_ETAT qui n’est pas membre de l’équipe, chercher « Soumettre rapport » et tenter la soumission'
      ],
      data: [],
      expected: [
        'AGENT_BRPD ne voit aucun bouton d’action de l’investigation',
        'Un CONTROLEUR_ETAT hors équipe ne peut pas soumettre le rapport final'
      ],
      ui: ['Soumettre rapport', 'Suspendre', 'Prolonger'],
      aConfirmer: 'Le front ne teste que le rôle, pas l’appartenance à l’équipe : le refus pour un agent hors équipe dépend du back, à confirmer'
    }
  ]
};
