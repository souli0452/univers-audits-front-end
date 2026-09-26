export default {
  id: 'P03',
  title: 'Dépôt vocal',
  access: 'Public (sans connexion)',
  intro: 'Témoignage enregistré à la voix sur /portail/vocal, en 3 étapes : enregistrement, coordonnées facultatives, envoi. Le dépôt est toujours de type Dénonciation (témoin). L’anonymat est déduit : sans téléphone ni e-mail, le dépôt est anonyme.',
  cases: [
    {
      id: 'P03-01',
      title: 'Parcours vocal complet jusqu’au code de suivi',
      priority: 'Critique',
      type: 'nominal',
      role: 'PUBLIC',
      preconditions: ['Microphone disponible', 'Autorisation du micro accordée au site', 'Onglet Réseau (F12) ouvert'],
      steps: [
        'Ouvrir /portail/vocal (page « Parlez, nous écoutons »)',
        'Étape 1 : cliquer sur « COMMENCER À PARLER » et parler quelques secondes',
        'Cliquer sur « ARRÊTER »',
        'Cliquer sur « Continuer »',
        'Étape 2 : renseigner un numéro de téléphone puis cliquer sur « Continuer »',
        'Étape 3 : cliquer sur « ENVOYER MON TÉMOIGNAGE »'
      ],
      data: ['Téléphone : +226 70 00 00 00'],
      expected: [
        'Pendant l’enregistrement, l’indicateur « REC » et la durée s’affichent',
        'La fenêtre de succès s’affiche avec un code de suivi de 8 caractères',
        'Côté agent, un dossier de mode « AUDIO_COUNTER » existe avec l’objet « Témoignage vocal en attente de traitement » et un fichier temoignage_vocal_*.webm en pièce jointe'
      ],
      ui: ['Parlez, nous écoutons', 'COMMENCER À PARLER', 'ARRÊTER', 'Continuer', 'ENVOYER MON TÉMOIGNAGE']
    },
    {
      id: 'P03-02',
      title: 'Ré-enregistrement avec « Recommencer »',
      priority: 'Majeur',
      type: 'nominal',
      role: 'PUBLIC',
      preconditions: ['Un premier enregistrement vient d’être terminé (étape 1)'],
      steps: [
        'Écouter l’enregistrement obtenu',
        'Cliquer sur « Recommencer »',
        'Vérifier l’écran puis refaire un enregistrement avec « COMMENCER À PARLER »'
      ],
      data: [],
      expected: [
        'L’ancien enregistrement est supprimé et l’écran revient à « Appuyez pour parler »',
        'Le nouvel enregistrement remplace l’ancien à l’envoi'
      ],
      ui: ['Recommencer', 'Appuyez pour parler']
    },
    {
      id: 'P03-03',
      title: 'Ajout et suppression de photos',
      priority: 'Majeur',
      type: 'nominal',
      role: 'PUBLIC',
      preconditions: ['Étape 1 avec un enregistrement terminé', 'Fichier photo.jpg disponible'],
      steps: [
        'Sur l’étape 1, ajouter photo.jpg par la galerie (ou l’appareil photo sur téléphone)',
        'Vérifier l’aperçu',
        'Cliquer sur la croix « × » de la photo',
        'Rajouter la photo puis terminer l’envoi',
        'Côté agent, ouvrir les pièces jointes du dossier'
      ],
      data: ['Fichier : photo.jpg'],
      expected: [
        'Un aperçu de la photo s’affiche, la croix la retire de la liste',
        'La photo conservée est jointe au dossier côté agent, avec l’audio'
      ]
    },
    {
      id: 'P03-04',
      title: 'Coordonnées facultatives : bouton « Passer » et anonymat',
      priority: 'Majeur',
      type: 'nominal',
      role: 'PUBLIC',
      preconditions: ['Étape 2 atteinte avec un enregistrement', 'Onglet Réseau (F12) ouvert'],
      steps: [
        'Ne saisir ni téléphone ni e-mail',
        'Cliquer sur « Passer »',
        'À l’étape 3, cliquer sur « ENVOYER MON TÉMOIGNAGE »',
        'Ouvrir la requête POST de création du dossier dans l’onglet Réseau'
      ],
      data: [],
      expected: [
        'Le passage à l’étape 3 se fait sans erreur',
        'Le corps de la requête contient anonymous: true à la racine et typeDeclarant: ANONYMOUS',
        'Aucun téléphone ni e-mail n’est envoyé'
      ],
      ui: ['Passer', 'ENVOYER MON TÉMOIGNAGE']
    },
    {
      id: 'P03-05',
      title: 'Protection lanceur d’alerte : confirmation sur l’honneur',
      priority: 'Majeur',
      type: 'nominal',
      role: 'PUBLIC',
      preconditions: ['Étape 2 atteinte avec un enregistrement et un e-mail saisi'],
      steps: [
        'Demander la protection lanceur d’alerte',
        'Cocher les 3 conditions',
        'Cliquer sur « Je confirme sur l\'honneur »',
        'Cliquer sur « Continuer » puis envoyer le témoignage'
      ],
      data: ['E-mail : recette@example.com'],
      expected: [
        'Le bouton « Je confirme sur l\'honneur » n’est actif qu’avec les 3 conditions cochées',
        'Le passage à l’étape 3 est autorisé après confirmation',
        'Le dossier est créé avec la protection demandée et confirmée (visible côté agent)'
      ],
      ui: ['Je confirme sur l\'honneur', 'Continuer']
    },
    {
      id: 'P03-06',
      title: 'Micro refusé par le navigateur',
      priority: 'Majeur',
      type: 'negatif',
      role: 'PUBLIC',
      preconditions: ['Autorisation du micro bloquée pour le site dans le navigateur'],
      steps: [
        'Ouvrir /portail/vocal',
        'Cliquer sur « COMMENCER À PARLER »',
        'Lire le message affiché'
      ],
      data: [],
      expected: [
        'Le message « Microphone » avec « Veuillez autoriser l\'accès au microphone » s’affiche',
        'L’écran reste utilisable et aucun enregistrement ne démarre'
      ],
      ui: ['Veuillez autoriser l\'accès au microphone']
    },
    {
      id: 'P03-07',
      title: 'Passage à l’étape suivante impossible sans audio',
      priority: 'Majeur',
      type: 'negatif',
      role: 'PUBLIC',
      preconditions: ['Étape 1, aucun enregistrement'],
      steps: [
        'Cliquer sur « Continuer » sans avoir enregistré',
        'Lire le message affiché'
      ],
      data: [],
      expected: [
        'Le message « Audio requis » (Veuillez enregistrer votre témoignage avant de continuer.) s’affiche',
        'L’écran reste à l’étape 1 et la zone d’enregistrement est signalée en erreur'
      ],
      ui: ['Audio requis', 'Veuillez enregistrer votre témoignage avant de continuer.']
    },
    {
      id: 'P03-08',
      title: 'Durée maximale d’un enregistrement',
      priority: 'Mineur',
      type: 'negatif',
      role: 'PUBLIC',
      preconditions: ['Micro autorisé'],
      steps: [
        'Démarrer un enregistrement avec « COMMENCER À PARLER »',
        'Laisser l’enregistrement se poursuivre au-delà de 5 minutes',
        'Arrêter et envoyer le témoignage'
      ],
      data: [],
      expected: [
        'Le comportement à la limite de durée est clair (arrêt automatique avec message, ou enregistrement accepté)',
        'Le fichier audio envoyé est lisible côté agent dans tous les cas'
      ],
      ui: ['COMMENCER À PARLER'],
      aConfirmer: 'Aucune durée maximale n’est codée côté écran : limite attendue et taille de fichier acceptée par l’API à définir'
    },
    {
      id: 'P03-09',
      title: 'Ajout d’un fichier non image parmi les photos',
      priority: 'Majeur',
      type: 'securite',
      role: 'PUBLIC',
      preconditions: ['Étape 1 avec un enregistrement', 'Fichier script.html disponible'],
      steps: [
        'Glisser-déposer ou ajouter script.html dans la zone des photos',
        'Terminer l’envoi',
        'Côté agent, ouvrir les pièces jointes du dossier'
      ],
      data: ['Fichier : script.html'],
      expected: [
        'Le fichier de type non autorisé est refusé avec un message, ou refusé à l’envoi par l’API',
        'Aucun fichier .html ne se retrouve dans les pièces jointes du dossier'
      ],
      aConfirmer: 'Le code n’effectue aucun contrôle de type ni de taille sur les photos (limite de 10 fichiers seulement) : le refus attendu est à confirmer avec l’API'
    }
  ]
};
