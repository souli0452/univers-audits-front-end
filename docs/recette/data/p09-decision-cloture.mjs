export default {
  id: 'P09',
  title: 'Décision et clôture',
  access: 'Agents connectés selon le rôle (investigation et détail du dossier)',
  intro: 'Fin du cycle : rapport produit, décision finale du CGE (statut résultant DÉCISION RENDUE ou CLASSÉ selon l’issue choisie à la soumission du rapport), suites (judiciaires, sanctions, transmission à l’autorité), puis clôture. Un dossier clôturé ne conserve que l’exportation PDF ; un dossier classé est archivé définitivement.',
  cases: [
    {
      id: 'P09-01',
      title: 'Dossier « Rapport produit » : rapport consultable, statut cohérent',
      priority: 'Critique',
      type: 'nominal',
      role: 'CGE',
      preconditions: ['Rapport final soumis (voir P08-09)', 'Session ouverte avec le compte CGE'],
      steps: [
        'Ouvrir le dossier D-B dans « Tous les dossiers »',
        'Lire le statut et le panneau d’investigation',
        'Ouvrir « Accéder à l\'investigation » et consulter « Rapport d\'enquête officiel » et « Note de recommandations »'
      ],
      data: [],
      expected: [
        'Le dossier est au statut « Rapport produit »',
        'Le rapport et la note de recommandations soumis sont consultables en lecture',
        'Le suivi public affiche « Rapport en validation »'
      ],
      ui: ['Accéder à l\'investigation', 'Rapport d\'enquête officiel', 'Note de recommandations']
    },
    {
      id: 'P09-02',
      title: 'Décision finale du CGE : DÉCISION RENDUE',
      priority: 'Critique',
      type: 'nominal',
      role: 'CGE',
      preconditions: ['Approbations DEI et juridique faites (voir P08-12)', 'Issue du rapport : Sanctions administratives ou Saisine judiciaire'],
      steps: [
        'Ouvrir l’investigation et cliquer sur « Décision CGE »',
        'Lire la fenêtre « Décision finale CGE » : résultat, description et « Statut résultant »',
        'Confirmer la décision',
        'Revenir sur le dossier et lire le bandeau'
      ],
      data: [],
      expected: [
        'La fenêtre affiche le résultat choisi (par exemple « Sanctions administratives ») et « Statut résultant : DÉCISION RENDUE »',
        'Le dossier passe à « Décision rendue » avec le bandeau « Décision finale rendue »',
        'Le suivi public affiche « Décision rendue »',
        'Le bouton « Clôturer le dossier » apparaît pour CGE, CGEA et ADMIN_DDIC'
      ],
      ui: ['Décision CGE', 'Décision finale CGE', 'Décision finale rendue', 'Clôturer le dossier']
    },
    {
      id: 'P09-03',
      title: 'Suites judiciaires : requête au Parquet, procédure pénale, partie civile',
      priority: 'Majeur',
      type: 'nominal',
      role: 'CONSEILLER_JURIDIQUE',
      preconditions: ['Investigation dont l’issue est « Saisine judiciaire » avec décision du CGE'],
      steps: [
        'Bloc « Requête au Parquet » : rédiger le contenu et cliquer sur « Enregistrer »',
        'Bloc « Suivi de procédure pénale » : cliquer sur « Ajouter une étape de procédure pénale » et enregistrer',
        'Avec CGE, dans « Constitution de partie civile », cliquer sur « Se constituer », saisir la justification et le montant réclamé'
      ],
      data: ['Requête : Texte de test de la recette', 'Montant réclamé : 1000000 FCFA'],
      expected: [
        'La requête, l’étape de procédure et la constitution de partie civile apparaissent chacune dans leur bloc avec l’auteur et la date',
        'La justification de la partie civile est obligatoire (champ marqué d’un astérisque)',
        'Seuls CONSEILLER_JURIDIQUE, CGE et ADMIN_DDIC voient les actions de ces blocs'
      ],
      ui: ['Requête au Parquet', 'Suivi de procédure pénale', 'Ajouter une étape de procédure pénale', 'Constitution de partie civile', 'Se constituer']
    },
    {
      id: 'P09-04',
      title: 'Sanctions administratives : plan d’actions et missions de suivi',
      priority: 'Majeur',
      type: 'nominal',
      role: 'CGEA',
      preconditions: ['Investigation dont l’issue est « Sanctions administratives » avec décision du CGE'],
      steps: [
        'Bloc « Plan d\'actions » : cliquer sur « Déposer le plan d\'actions » et l’enregistrer',
        'Ajouter une note avec « Ajouter une note d\'avancement »',
        'Avec CONTROLEUR_ETAT, dans « Missions de suivi », cliquer sur « Ajouter une mission de suivi » et enregistrer'
      ],
      data: ['Plan : Actions correctives de test'],
      expected: [
        'Le plan, la note d’avancement et la mission de suivi sont listés avec leur auteur et leur date',
        'Le plan déposé n’est plus déposable une seconde fois (le bouton disparaît)'
      ],
      ui: ['Plan d\'actions', 'Déposer le plan d\'actions', 'Ajouter une note d\'avancement', 'Missions de suivi', 'Ajouter une mission de suivi']
    },
    {
      id: 'P09-05',
      title: 'Transmission à l’autorité et relance',
      priority: 'Majeur',
      type: 'nominal',
      role: 'CGE',
      preconditions: ['Décision CGE rendue (statut DÉCISION_RENDUE)'],
      steps: [
        'Bloc « Transmission à l\'autorité » : cliquer sur « Transmettre »',
        'Saisir l’autorité destinataire dans « Transmettre à l\'autorité » puis valider',
        'Cliquer sur « Ajouter une relance », saisir le contenu et valider'
      ],
      data: ['Autorité destinataire : Autorité partenaire de test'],
      expected: [
        'La transmission est enregistrée avec l’autorité destinataire et la date',
        'Le bouton « Transmettre » reste désactivé tant que l’autorité destinataire est vide',
        'La relance apparaît dans l’historique de la transmission'
      ],
      ui: ['Transmission à l\'autorité', 'Transmettre', 'Transmettre à l\'autorité', 'Ajouter une relance']
    },
    {
      id: 'P09-06',
      title: 'Clôture du dossier : statut CLOS',
      priority: 'Critique',
      type: 'nominal',
      role: 'CGE',
      preconditions: ['Dossier au statut DECISION_RENDUE (dossier D-C)'],
      steps: [
        'Ouvrir le dossier D-C',
        'Cliquer sur « Clôturer le dossier »',
        'Lire le message de clôture définitive, saisir le motif puis confirmer',
        'Lire le bandeau et les boutons restants'
      ],
      data: ['Motif : Suites transmises aux autorités'],
      expected: [
        'Le dossier passe à « Dossier clôturé » (CLOS) avec le bandeau « Ce dossier a été traité et officiellement clôturé »',
        'Seule l’exportation PDF reste disponible, plus aucun bouton d’ajout ni de transition',
        'Le suivi public affiche « Dossier clôturé »'
      ],
      ui: ['Clôturer le dossier', 'Dossier clôturé']
    },
    {
      id: 'P09-07',
      title: 'Classement sans suite : statut CLASSE',
      priority: 'Majeur',
      type: 'nominal',
      role: 'CGE',
      preconditions: ['Investigation soumise avec l’issue « Classé sans suite » (ARCHIVED) et approbations DEI et juridique faites'],
      steps: [
        'Cliquer sur « Décision CGE »',
        'Lire « Résultat » et « Statut résultant » dans « Décision finale CGE »',
        'Confirmer',
        'Ouvrir le dossier et lire le bandeau'
      ],
      data: [],
      expected: [
        'La fenêtre affiche « Classé sans suite » et « Statut résultant : CLASSÉ »',
        'Le dossier passe à « Classé » avec le bandeau « Dossier classé sans suite » et « Ce dossier est archivé définitivement. Aucune action n\'est possible. »',
        'Seul l’export « Exporter PDF » reste disponible',
        'Le suivi public affiche « Dossier classé »'
      ],
      ui: ['Décision finale CGE', 'Dossier classé sans suite', 'Exporter PDF']
    },
    {
      id: 'P09-08',
      title: 'PDF officiels : récépissé, accusé, réponse motivée, résumé de clôture',
      priority: 'Majeur',
      type: 'nominal',
      role: 'CGE',
      preconditions: ['Un dossier CLOS ou CLASSE'],
      steps: [
        'Ouvrir le dossier clôturé ou classé',
        'Cliquer successivement sur « Récépissé », « Accusé de réception », « Réponse motivée » et « Résumé de clôture »',
        'Ouvrir chaque fichier téléchargé',
        'Cliquer sur « Export officiel » sur un dossier ouvert'
      ],
      data: [],
      expected: [
        'Chaque document se télécharge en PDF lisible et mentionne le numéro du dossier',
        'Le « Résumé de clôture » n’est proposé que pour un dossier clôturé ou classé',
        'Aucun PDF ne contient d’identité de déclarant pour un dossier anonyme'
      ],
      ui: ['Récépissé', 'Accusé de réception', 'Réponse motivée', 'Résumé de clôture', 'Export officiel'],
      aConfirmer: 'Le back de la branche feature/workflow-denociation-asce-fix ajoute les endpoints « Résumé de clôture » et « Réponse motivée » : vérifier que la VM déploie bien cette version du back'
    },
    {
      id: 'P09-09',
      title: 'Clôture interdite : rôle non autorisé ou statut non éligible',
      priority: 'Majeur',
      type: 'securite',
      role: 'AGENT_BRPD',
      preconditions: ['Un dossier au statut DECISION_RENDUE et un dossier au statut EN_INVESTIGATION', 'Session ouverte avec le compte AGENT_BRPD'],
      steps: [
        'Ouvrir le dossier DECISION_RENDUE et chercher « Clôturer le dossier »',
        'Se reconnecter avec CGE, ouvrir le dossier EN_INVESTIGATION et chercher « Clôturer le dossier »',
        'Avec CGE, ouvrir un dossier déjà CLOS et chercher un bouton de transition'
      ],
      data: [],
      expected: [
        'AGENT_BRPD ne voit pas « Clôturer le dossier » sur un dossier « Décision rendue »',
        'Le bouton n’existe pas non plus sur un dossier en investigation, même pour CGE',
        'Un dossier clôturé n’offre plus aucune transition à aucun rôle'
      ],
      ui: ['Clôturer le dossier']
    }
  ]
};
