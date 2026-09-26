export default {
  id: 'P02',
  title: 'Dépôt de plainte public',
  access: 'Public (sans connexion)',
  intro: 'Formulaire en 3 étapes sur /portail/deposer : « Les faits », « Coordonnées », « Confirmation ». Limites du code : 5 pièces jointes maximum, 25 Mo par fichier, objet de 10 caractères minimum.',
  cases: [
    {
      id: 'P02-01',
      title: 'Dépôt nominatif complet par un citoyen',
      priority: 'Critique',
      type: 'nominal',
      role: 'PUBLIC',
      regression: true,
      preconditions: ['Aucune session ouverte', 'Onglet Réseau (F12) ouvert'],
      steps: [
        'Ouvrir /portail/deposer',
        'Étape « Les faits » : choisir le type « Plainte », puis « Je suis la victime »',
        'Renseigner le résumé, la description détaillée, le lieu, la période et le montant estimé',
        'Cliquer sur « Continuer »',
        'Étape « Coordonnées » : choisir « Je fournis mes coordonnées », catégorie Citoyen, renseigner prénom, nom, téléphone, e-mail, commune, province',
        'Cocher « J\'accepte le traitement de mes données personnelles par l\'ASCE-LC. » puis « Continuer »',
        'Étape « Confirmation » : relire le récapitulatif puis cliquer sur « Soumettre mon signalement »'
      ],
      data: [
        'Résumé : Détournement de fonds à la mairie de test',
        'Description : Faits fictifs de recette, à ne pas traiter',
        'Lieu : Ouagadougou ; période : Janvier 2026 ; montant : 500000',
        'Prénom : Test ; nom : Recette ; téléphone : +226 70 00 00 00 ; e-mail : recette@example.com'
      ],
      expected: [
        'La fenêtre « Merci pour votre signalement ! » s’affiche avec un code de suivi de 8 caractères',
        'Dans l’onglet Réseau, la requête de création du dossier répond 200 ou 201',
        'Le dossier apparaît côté agent (liste des dossiers) avec le statut SOUMIS et les données saisies'
      ],
      ui: ['Les faits', 'Coordonnées', 'Confirmation', 'Plainte', 'Je suis la victime', 'Continuer', 'Je fournis mes coordonnées', 'Soumettre mon signalement', 'Merci pour votre signalement !'],
      aConfirmer: 'L’intitulé affiché dans la fenêtre de succès est « Votre code de suivi (B4) » : la mention « (B4) » est-elle voulue ?'
    },
    {
      id: 'P02-02',
      title: 'Dépôt anonyme : aucune donnée d’identité demandée ni envoyée',
      priority: 'Critique',
      type: 'nominal',
      role: 'PUBLIC',
      regression: true,
      preconditions: ['Navigation privée', 'Onglet Réseau (F12) ouvert'],
      steps: [
        'Ouvrir /portail/deposer',
        'Étape « Les faits » : choisir « Plainte » puis renseigner résumé et description',
        'Cliquer sur « Continuer »',
        'Étape « Coordonnées » : cliquer sur « Je reste anonyme »',
        'Lire le message d’information qui apparaît',
        'Cocher l’acceptation du traitement des données puis « Continuer »',
        'À l’étape « Confirmation », lire le bloc Déclarant puis cliquer sur « Soumettre mon signalement »',
        'Dans l’onglet Réseau, ouvrir la requête POST de création du dossier et lire son corps'
      ],
      data: ['Résumé : Test recette anonyme complet', 'Description : Faits fictifs de test'],
      expected: [
        'Le choix « Je reste anonyme » bascule le type en « Dénonciation » et affiche « Signalement basculé en dénonciation » (anonymat possible uniquement comme témoin)',
        'Le récapitulatif indique « Anonyme » et ne montre ni identité, ni téléphone, ni e-mail',
        'Le corps de la requête contient anonymous: true à la racine et typeDeclarant: ANONYMOUS',
        'Aucun nom, e-mail ni téléphone n’est présent dans le corps de la requête',
        'Le code de suivi de 8 caractères s’affiche'
      ],
      ui: ['Je reste anonyme', 'Signalement basculé en dénonciation', 'Anonyme', 'Continuer', 'Soumettre mon signalement']
    },
    {
      id: 'P02-03',
      title: 'Dépôt par une entreprise ou une association',
      priority: 'Critique',
      type: 'nominal',
      role: 'PUBLIC',
      preconditions: ['Aucune session ouverte'],
      steps: [
        'Ouvrir /portail/deposer et remplir l’étape « Les faits » (type « Dénonciation »)',
        'Étape « Coordonnées » : choisir « Je fournis mes coordonnées »',
        'Choisir la catégorie « Entreprise » puis renseigner « Nom de l\'organisation »',
        'Accepter le traitement des données, cliquer sur « Continuer » puis « Soumettre mon signalement »',
        'Refaire le dépôt avec la catégorie « Association / ONG »'
      ],
      data: ['Nom de l’organisation : Société Test Recette SARL', 'Résumé : Dénonciation entreprise test'],
      expected: [
        'Chaque dépôt aboutit à la fenêtre de succès avec un code de suivi',
        'Côté agent, le déclarant est affiché avec la raison sociale saisie et le type COMPANY ou ASSOCIATION'
      ],
      ui: ['Dénonciation', 'Entreprise', 'Association / ONG', 'Nom de l\'organisation']
    },
    {
      id: 'P02-04',
      title: 'Dépôt avec pièces jointes',
      priority: 'Majeur',
      type: 'nominal',
      role: 'PUBLIC',
      preconditions: ['Fichiers de test disponibles : document.pdf et photo.jpg'],
      steps: [
        'Ouvrir /portail/deposer et remplir l’étape « Les faits »',
        'Dans la zone des pièces jointes, ajouter document.pdf puis photo.jpg (sélection ou glisser-déposer)',
        'Vérifier la liste des fichiers avec leur taille',
        'Terminer le dépôt jusqu’à la fenêtre de succès',
        'Côté agent, ouvrir le dossier créé et consulter l’onglet « Pièces jointes »'
      ],
      data: ['Fichiers : document.pdf, photo.jpg'],
      expected: [
        'Les deux fichiers sont listés avec leur nom et leur taille avant l’envoi',
        'Les deux fichiers sont présents et téléchargeables dans le dossier côté agent'
      ],
      ui: ['Pièces jointes'],
      aConfirmer: 'Dans le code, si l’envoi des pièces jointes échoue, la fenêtre de succès s’affiche quand même sans avertissement : vérifier que les fichiers sont bien reçus'
    },
    {
      id: 'P02-05',
      title: 'Dépôt avec témoignage audio intégré',
      priority: 'Majeur',
      type: 'nominal',
      role: 'PUBLIC',
      preconditions: ['Microphone disponible', 'Autorisation du micro accordée au site'],
      steps: [
        'Ouvrir /portail/deposer et remplir résumé et description',
        'Dans « Témoignage audio », cliquer sur « Démarrer l\'enregistrement »',
        'Parler quelques secondes puis cliquer sur « Arrêter »',
        'Écouter l’enregistrement, terminer le dépôt',
        'Côté agent, ouvrir les pièces jointes du dossier'
      ],
      data: [],
      expected: [
        'Pendant l’enregistrement, une durée s’affiche et le bouton « Arrêter » est disponible',
        'Après l’arrêt, l’enregistrement peut être écouté',
        'Un fichier temoignage_audio_*.webm est joint au dossier et se lit côté agent'
      ],
      ui: ['Démarrer l\'enregistrement', 'Arrêter']
    },
    {
      id: 'P02-06',
      title: 'Depuis l’écran de succès, accès au suivi avec le code',
      priority: 'Majeur',
      type: 'nominal',
      role: 'PUBLIC',
      preconditions: ['Un dépôt vient d’être réalisé (fenêtre de succès ouverte)'],
      steps: [
        'Noter le code de suivi affiché dans la fenêtre de succès',
        'Cliquer sur « Suivre mon dossier »',
        'Sur la page de suivi, saisir le code noté puis cliquer sur « Rechercher »'
      ],
      data: [],
      expected: [
        'La page /portail/suivi s’ouvre',
        'Le code saisi affiche le statut « Dossier déposé » avec l’étape 1 sur 10',
        'Le bouton « Accueil » de la fenêtre de succès ramène à la page d’accueil'
      ],
      ui: ['Suivre mon dossier', 'Accueil', 'Rechercher', 'Dossier déposé']
    },
    {
      id: 'P02-07',
      title: 'Champs obligatoires vides : passage à l’étape suivante bloqué',
      priority: 'Majeur',
      type: 'negatif',
      role: 'PUBLIC',
      preconditions: ['Formulaire /portail/deposer vierge'],
      steps: [
        'Ne rien saisir puis cliquer sur « Continuer »',
        'Saisir un résumé de 5 caractères seulement et une description, puis cliquer sur « Continuer »',
        'Corriger avec un résumé de 10 caractères ou plus, passer à l’étape « Coordonnées »',
        'Cliquer sur « Continuer » sans cocher l’acceptation du traitement des données'
      ],
      data: ['Résumé trop court : Test'],
      expected: [
        'Le message « Champs requis » (Veuillez remplir tous les champs obligatoires) s’affiche et le formulaire reste à l’étape « Les faits »',
        '« Ce champ est obligatoire » est affiché sous les champs vides',
        'Un résumé de moins de 10 caractères est refusé',
        'Sans consentement, « Consentement requis » et « Vous devez accepter pour continuer » s’affichent et l’étape « Confirmation » n’est pas atteinte'
      ],
      ui: ['Champs requis', 'Ce champ est obligatoire', 'Consentement requis', 'Vous devez accepter pour continuer']
    },
    {
      id: 'P02-08',
      title: 'Adresse e-mail invalide',
      priority: 'Majeur',
      type: 'negatif',
      role: 'PUBLIC',
      preconditions: ['Étape « Coordonnées » atteinte, « Je fournis mes coordonnées » choisi'],
      steps: [
        'Saisir « pas-un-email » dans le champ Email',
        'Accepter le traitement des données puis cliquer sur « Continuer »',
        'Soumettre le signalement et noter le résultat'
      ],
      data: ['E-mail : pas-un-email'],
      expected: [
        'Une adresse invalide est refusée avec un message explicite (à l’écran ou par l’API) et aucun dossier n’est créé avec cette adresse'
      ],
      ui: ['Continuer'],
      aConfirmer: 'Aucune validation de format n’apparaît dans le code du formulaire pour l’e-mail : le comportement attendu (refus à l’écran, refus par l’API ou acceptation) est à définir'
    },
    {
      id: 'P02-09',
      title: 'Numéro de téléphone invalide',
      priority: 'Majeur',
      type: 'negatif',
      role: 'PUBLIC',
      preconditions: ['Étape « Coordonnées » atteinte, « Je fournis mes coordonnées » choisi'],
      steps: [
        'Saisir « abc » dans le champ Téléphone',
        'Accepter le traitement des données puis cliquer sur « Continuer »',
        'Soumettre le signalement et noter le résultat'
      ],
      data: ['Téléphone : abc'],
      expected: [
        'Un numéro invalide est refusé avec un message explicite et aucun dossier n’est créé avec ce numéro'
      ],
      ui: ['Continuer'],
      aConfirmer: 'Aucune validation de format du téléphone dans le code du formulaire : règle attendue à confirmer (format +226, longueur)'
    },
    {
      id: 'P02-10',
      title: 'Fichiers trop volumineux ou trop nombreux',
      priority: 'Majeur',
      type: 'negatif',
      role: 'PUBLIC',
      preconditions: ['Fichier gros-fichier.pdf de plus de 25 Mo', 'Six petits fichiers PDF', 'Fichier script.html'],
      steps: [
        'Étape « Les faits » : ajouter gros-fichier.pdf',
        'Ajouter six petits fichiers PDF d’un coup',
        'Glisser-déposer script.html dans la zone des pièces jointes'
      ],
      data: ['Fichiers : gros-fichier.pdf, 6 petits PDF, script.html'],
      expected: [
        'gros-fichier.pdf est refusé avec le message « Fichier trop volumineux » (dépasse 25MB)',
        'Seuls 5 fichiers au maximum sont conservés dans la liste',
        'script.html (type non autorisé) est refusé avec un message'
      ],
      ui: ['Fichier trop volumineux'],
      aConfirmer: 'Le code ne filtre pas le type en cas de glisser-déposer (seul le sélecteur limite aux extensions .pdf, .doc, .docx, .jpg, .jpeg, .png, .mp3, .mp4, .avi, .mov) : refus de script.html à confirmer'
    },
    {
      id: 'P02-11',
      title: 'Retour arrière : les données saisies sont conservées',
      priority: 'Mineur',
      type: 'negatif',
      role: 'PUBLIC',
      preconditions: ['Étapes « Les faits » et « Coordonnées » renseignées'],
      steps: [
        'À l’étape « Coordonnées », cliquer sur « Précédent »',
        'Vérifier les champs de l’étape « Les faits »',
        'Revenir à l’étape « Coordonnées » avec « Continuer » et vérifier les champs'
      ],
      data: [],
      expected: [
        'Les valeurs de l’étape « Les faits » (type, résumé, description, lieu) sont conservées',
        'Les coordonnées et le consentement de l’étape 2 sont conservés'
      ],
      ui: ['Précédent']
    },
    {
      id: 'P02-12',
      title: 'API indisponible à la soumission : message d’erreur visible',
      priority: 'Majeur',
      type: 'negatif',
      role: 'PUBLIC',
      preconditions: ['Formulaire complet à l’étape « Confirmation »', 'Onglet Réseau : simuler « Hors connexion » ou bloquer /api/'],
      steps: [
        'Activer le mode « Hors connexion » dans l’onglet Réseau',
        'Cliquer sur « Soumettre mon signalement »',
        'Observer l’écran puis rétablir la connexion et recliquer'
      ],
      data: [],
      expected: [
        'Un message d’erreur « Impossible de soumettre. Réessayez. » (ou celui de l’API) s’affiche',
        'Le bouton n’est plus en attente et la saisie n’est pas perdue',
        'Après rétablissement, un second clic crée un seul dossier'
      ],
      ui: ['Impossible de soumettre. Réessayez.']
    },
    {
      id: 'P02-13',
      title: 'Double clic sur la soumission : un seul dossier créé',
      priority: 'Critique',
      type: 'securite',
      role: 'PUBLIC',
      preconditions: ['Formulaire complet à l’étape « Confirmation »'],
      steps: [
        'Double-cliquer rapidement sur « Soumettre mon signalement »',
        'Relever le code de suivi affiché',
        'Côté agent, rechercher les dossiers avec l’objet saisi'
      ],
      data: ['Résumé : Test double clic recette'],
      expected: [
        'Un seul dossier est créé avec cet objet',
        'Un seul code de suivi est affiché'
      ],
      ui: ['Soumettre mon signalement']
    },
    {
      id: 'P02-14',
      title: 'Contenu piégé dans la description : non exécuté',
      priority: 'Majeur',
      type: 'securite',
      role: 'PUBLIC',
      preconditions: ['Compte agent disponible pour consulter le dossier'],
      steps: [
        'Déposer un signalement avec la description « <script>alert(1)</script> <img src=x onerror=alert(2)> »',
        'Côté agent, ouvrir le dossier créé et lire la description',
        'Ouvrir la liste des dossiers et lire l’objet'
      ],
      data: ['Description : <script>alert(1)</script> <img src=x onerror=alert(2)>'],
      expected: [
        'Aucune fenêtre d’alerte ne s’ouvre, ni à l’ouverture du dossier, ni dans la liste',
        'Le texte est affiché tel quel (échappé) ou neutralisé, sans être interprété comme du code'
      ]
    }
  ]
};
