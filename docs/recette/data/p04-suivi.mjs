export default {
  id: 'P04',
  title: 'Suivi de dossier',
  access: 'Public (sans connexion)',
  intro: 'Page /portail/suivi : saisie du code de suivi à 8 caractères (mis automatiquement en majuscules, recherche possible à partir de 6), statut, progression sur 10 étapes, récépissé PDF.',
  cases: [
    {
      id: 'P04-01',
      title: 'Code valide : statut, message et progression affichés',
      priority: 'Critique',
      type: 'nominal',
      role: 'PUBLIC',
      preconditions: ['Un dossier existe avec son code de suivi (dossier D-A, statut SOUMIS)'],
      steps: [
        'Ouvrir /portail/suivi',
        'Saisir le code de suivi du dossier D-A',
        'Cliquer sur « Rechercher »',
        'Lire la carte de statut'
      ],
      data: ['Code de suivi : celui du dossier D-A'],
      expected: [
        'Le statut « Dossier déposé » s’affiche avec le message « Votre signalement a bien été reçu. Il sera enregistré sous 7 jours ouvrables. »',
        'La progression indique « Étape 1 / 10 »',
        'Le code est rappelé sous la forme « CODE : XXXXXXXX »'
      ],
      ui: ['Rechercher', 'Dossier déposé', 'Votre signalement a bien été reçu. Il sera enregistré sous 7 jours ouvrables.']
    },
    {
      id: 'P04-02',
      title: 'Téléchargement du récépissé PDF',
      priority: 'Majeur',
      type: 'nominal',
      role: 'PUBLIC',
      preconditions: ['Un dossier trouvé sur la page de suivi'],
      steps: [
        'Cliquer sur « Mon récépissé »',
        'Attendre la fin du téléchargement',
        'Ouvrir le fichier téléchargé'
      ],
      data: [],
      expected: [
        'Un fichier recepisse-XXXXXXXX.pdf est téléchargé (XXXXXXXX = code de suivi)',
        'Le PDF s’ouvre et mentionne le dossier et son code de suivi'
      ],
      ui: ['Mon récépissé']
    },
    {
      id: 'P04-03',
      title: 'Code saisi en minuscules accepté',
      priority: 'Majeur',
      type: 'nominal',
      role: 'PUBLIC',
      preconditions: ['Un code de suivi valide'],
      steps: [
        'Saisir le code en minuscules dans la zone « EX: BCS5XHRG »',
        'Observer la zone de saisie',
        'Appuyer sur la touche Entrée'
      ],
      data: ['Code en minuscules, par exemple bcs5xhrg'],
      expected: [
        'La saisie est convertie en majuscules',
        'Le dossier est trouvé avec la touche Entrée comme avec le bouton « Rechercher »'
      ],
      ui: ['Rechercher']
    },
    {
      id: 'P04-04',
      title: 'Dossier en attente de complément : lien de dépôt du complément',
      priority: 'Majeur',
      type: 'nominal',
      role: 'PUBLIC',
      preconditions: ['Un dossier au statut EN_ATTENTE_COMPLEMENT (voir P07-03)'],
      steps: [
        'Rechercher le dossier sur /portail/suivi avec son code',
        'Lire le statut « Complément requis »',
        'Cliquer sur « Soumettre mon complément »'
      ],
      data: [],
      expected: [
        'Le message « Des informations supplémentaires sont nécessaires. Merci de soumettre votre complément. » s’affiche',
        'La page « Compléter mon dossier » s’ouvre (adresse /#/portail/complement?code=…)',
        'Elle affiche le motif de la demande saisi par l’agent et l’échéance'
      ],
      ui: ['Complément requis', 'Soumettre mon complément', 'Compléter mon dossier']
    },
    {
      id: 'P04-05',
      title: 'Code inexistant : message « Code introuvable »',
      priority: 'Majeur',
      type: 'negatif',
      role: 'PUBLIC',
      preconditions: ['Page /portail/suivi ouverte'],
      steps: [
        'Saisir le code ZZZZZZZZ',
        'Cliquer sur « Rechercher »',
        'Modifier la saisie'
      ],
      data: ['Code : ZZZZZZZZ'],
      expected: [
        'Le message « Code introuvable » avec « Vérifiez le code sur votre reçu B4. » s’affiche',
        'Le message disparaît dès que la saisie est modifiée'
      ],
      ui: ['Code introuvable', 'Vérifiez le code sur votre reçu B4.']
    },
    {
      id: 'P04-06',
      title: 'Code vide ou trop court : recherche bloquée',
      priority: 'Mineur',
      type: 'negatif',
      role: 'PUBLIC',
      preconditions: ['Page /portail/suivi ouverte'],
      steps: [
        'Laisser la zone vide et observer le bouton « Rechercher »',
        'Saisir 5 caractères et observer le bouton',
        'Saisir 6 caractères et observer le bouton'
      ],
      data: ['Saisies : vide, ABCDE, ABCDEF'],
      expected: [
        'Le bouton « Rechercher » est désactivé avec 0 à 5 caractères',
        'Il devient actif à partir de 6 caractères',
        'Les 8 traits sous la zone se colorent au fur et à mesure de la saisie'
      ],
      ui: ['Rechercher']
    },
    {
      id: 'P04-07',
      title: 'Dossier confidentiel : aucune donnée sensible exposée au portail',
      priority: 'Majeur',
      type: 'securite',
      role: 'PUBLIC',
      preconditions: ['Un dossier confidentiel existe (voir P06-06)'],
      steps: [
        'Rechercher ce dossier par son code sur /portail/suivi',
        'Lire tout ce qui s’affiche',
        'Dans l’onglet Réseau, lire la réponse de la requête de suivi'
      ],
      data: [],
      expected: [
        'La page affiche uniquement le statut, le message, la progression et le code',
        'La réponse de l’API ne contient ni description, ni nom de déclarant, ni parties visées, ni pièces jointes'
      ],
      aConfirmer: 'Périmètre exact des champs renvoyés par l’API de suivi public à confirmer côté back'
    },
    {
      id: 'P04-08',
      title: 'Essais répétés de codes : limitation ou alerte',
      priority: 'Majeur',
      type: 'securite',
      role: 'PUBLIC',
      preconditions: ['Page /portail/suivi ouverte'],
      steps: [
        'Effectuer 20 recherches successives avec des codes aléatoires',
        'Observer les réponses et les messages'
      ],
      data: ['Codes aléatoires de 8 caractères'],
      expected: [
        'Au-delà de 20 recherches par minute depuis la même adresse, le suivi répond « Trop de requêtes » (code 429) et l’accès reprend après l’attente indiquée',
        'Les codes valides ne peuvent pas être devinés par essais massifs'
      ]
    },
    {
      id: 'P04-09',
      title: 'Bouton « Nouvelle recherche »',
      priority: 'Mineur',
      type: 'nominal',
      role: 'PUBLIC',
      preconditions: ['Un dossier trouvé sur la page de suivi'],
      steps: [
        'Cliquer sur « Nouvelle recherche »',
        'Observer la zone de saisie'
      ],
      data: [],
      expected: [
        'La carte du dossier disparaît',
        'La zone de code est vide et prête à une nouvelle saisie'
      ],
      ui: ['Nouvelle recherche']
    },
    {
      id: 'P04-10',
      title: 'Réponse par message seul dans les délais : le dossier repasse en étude',
      priority: 'Critique',
      type: 'nominal',
      role: 'PUBLIC',
      preconditions: ['Dossier au statut EN_ATTENTE_COMPLEMENT dont l’échéance n’est pas dépassée (voir P07-03)', 'Le back du complément est déployé avant le front'],
      steps: [
        'Ouvrir la page « Compléter mon dossier » depuis le suivi (« Soumettre mon complément »)',
        'Lire « Ce que l’ASCE-LC vous demande » et l’échéance',
        'Saisir un message d’au moins 10 caractères sans joindre de fichier',
        'Cliquer sur « Envoyer ma réponse »',
        'Côté agent (CONSEILLER_JURIDIQUE), ouvrir le dossier, l’onglet « Observations » puis le journal d’audit'
      ],
      data: ['Message : Voici les justificatifs demandés, en pièce du dossier'],
      expected: [
        'L’écran « Réponse envoyée » s’affiche avec les boutons « Suivre mon dossier » et « Accueil »',
        'Le dossier passe au statut « En étude » sans aucun clic d’agent',
        'Une observation « Réponse au complément » signée « Déclarant (via le portail) » contient le message',
        'Une alerte interne « Complément reçu » existe pour le dossier',
        'Le journal d’audit contient l’action « Recevoir complément »',
        'Le suivi public affiche « Étude en cours »'
      ],
      ui: ['Compléter mon dossier', 'Ce que l’ASCE-LC vous demande', 'Envoyer ma réponse', 'Réponse envoyée', 'Suivre mon dossier', 'Accueil']
    },
    {
      id: 'P04-11',
      title: 'Réponse avec pièces jointes',
      priority: 'Majeur',
      type: 'nominal',
      role: 'PUBLIC',
      preconditions: ['Dossier au statut EN_ATTENTE_COMPLEMENT', 'Fichiers document.pdf et photo.jpg disponibles'],
      steps: [
        'Ouvrir la page « Compléter mon dossier »',
        'Saisir un message puis cliquer sur « Ajouter des fichiers » et choisir document.pdf et photo.jpg',
        'Vérifier la liste des fichiers avec leur taille, retirer puis rajouter photo.jpg',
        'Cliquer sur « Envoyer ma réponse »',
        'Côté agent, ouvrir l’onglet « Pièces jointes » du dossier'
      ],
      data: ['Fichiers : document.pdf, photo.jpg'],
      expected: [
        'Chaque fichier est listé avec son nom et sa taille et peut être retiré avant l’envoi',
        'Après « Réponse envoyée », les deux fichiers sont présents et téléchargeables côté agent',
        'Le dossier est passé au statut « En étude »'
      ],
      ui: ['Compléter mon dossier', 'Ajouter des fichiers', 'Envoyer ma réponse', 'Pièces jointes'],
      aConfirmer: 'La limite d’envoi du proxy nginx (client_max_body_size) doit permettre au moins 50 Mo sur la VM : sans cela, un envoi avec pièces jointes échoue'
    },
    {
      id: 'P04-12',
      title: 'Réponse après l’échéance : acceptée et signalée en retard',
      priority: 'Majeur',
      type: 'nominal',
      role: 'PUBLIC',
      preconditions: ['Dossier au statut EN_ATTENTE_COMPLEMENT dont l’échéance est dépassée (à préparer avec un technicien)'],
      steps: [
        'Ouvrir la page « Compléter mon dossier »',
        'Lire le bandeau au-dessus du formulaire',
        'Saisir un message et cliquer sur « Envoyer ma réponse »',
        'Côté agent, lire l’observation « Réponse au complément »'
      ],
      data: [],
      expected: [
        'Le bandeau « L’échéance est dépassée. Votre réponse sera tout de même transmise. » s’affiche avant l’envoi',
        'L’écran de succès indique que la réponse a été « reçue après l’échéance »',
        'L’observation côté agent commence par « Reçu en retard (échéance du JJ/MM/AAAA) »',
        'Le dossier passe quand même au statut « En étude »'
      ],
      ui: ['Compléter mon dossier', 'Envoyer ma réponse', 'Réponse envoyée']
    },
    {
      id: 'P04-13',
      title: 'Dossier anonyme : la réponse fonctionne avec le seul code de suivi',
      priority: 'Critique',
      type: 'securite',
      role: 'PUBLIC',
      preconditions: ['Dossier anonyme (sans e-mail ni téléphone) au statut EN_ATTENTE_COMPLEMENT (voir P02-02)'],
      steps: [
        'Ouvrir /#/portail/complement?code= suivi du code de suivi du dossier anonyme',
        'Lire la page puis envoyer une réponse',
        'Dans l’onglet Réseau (F12), lire la réponse de la requête de lecture de la demande'
      ],
      data: ['Code de suivi du dossier anonyme'],
      expected: [
        'La page s’affiche et la réponse est acceptée sans aucun champ d’identité',
        'La réponse de l’API ne contient que le statut, le motif, la date de la demande, l’échéance et l’indicateur de retard : aucun nom, e-mail, téléphone ni autre champ du dossier',
        'Aucune notification n’est envoyée à un contact inexistant'
      ],
      ui: ['Compléter mon dossier', 'Envoyer ma réponse']
    },
    {
      id: 'P04-14',
      title: 'Seconde réponse ou dossier qui n’attend pas de complément',
      priority: 'Majeur',
      type: 'negatif',
      role: 'PUBLIC',
      preconditions: ['Un dossier déjà repassé en étude par une première réponse (P04-10) et un dossier à un autre statut'],
      steps: [
        'Rouvrir la page /#/portail/complement?code= avec le code du dossier déjà répondu',
        'Lire la page affichée',
        'Cliquer sur « Voir l’état de mon dossier »',
        'Recommencer avec le code d’un dossier au statut « Soumis »'
      ],
      data: [],
      expected: [
        'La page « Aucune réponse attendue » s’affiche avec « Aucun complément n’est attendu pour ce dossier »',
        '« Voir l’état de mon dossier » ouvre le suivi avec le code',
        'Aucun second changement de statut ni aucune seconde observation n’est créé côté agent'
      ],
      ui: ['Aucune réponse attendue', 'Voir l’état de mon dossier']
    },
    {
      id: 'P04-15',
      title: 'Saisie refusée avant l’envoi : message court, fichiers interdits, trop gros, trop nombreux',
      priority: 'Majeur',
      type: 'negatif',
      role: 'PUBLIC',
      preconditions: ['Dossier au statut EN_ATTENTE_COMPLEMENT', 'Fichiers script.html, virus.exe, gros-fichier.pdf (plus de 25 Mo) et six petits PDF'],
      steps: [
        'Saisir un message de 5 caractères et cliquer sur « Envoyer ma réponse »',
        'Tenter d’ajouter script.html puis virus.exe (par le sélecteur puis par glisser-déposer)',
        'Ajouter gros-fichier.pdf',
        'Ajouter les six petits PDF d’un coup',
        'Ouvrir /#/portail/complement sans code, puis avec un code inexistant'
      ],
      data: ['Message : court'],
      expected: [
        'Le message de moins de 10 caractères est refusé avec une explication et rien n’est envoyé',
        'script.html et virus.exe sont refusés (« type de fichier non autorisé »), y compris par glisser-déposer',
        'gros-fichier.pdf est refusé (« dépasse 25 Mo »)',
        'Seuls 5 fichiers sont conservés, le sixième est signalé',
        'Sans code ou avec un code inexistant, la page « Code introuvable » s’affiche'
      ],
      ui: ['Envoyer ma réponse', 'Code introuvable']
    },
    {
      id: 'P04-16',
      title: 'Coupure réseau pendant l’envoi et trop d’essais',
      priority: 'Majeur',
      type: 'negatif',
      role: 'PUBLIC',
      preconditions: ['Dossier au statut EN_ATTENTE_COMPLEMENT', 'Onglet Réseau (F12) ouvert'],
      steps: [
        'Saisir un message et un fichier, passer l’onglet Réseau en « Hors connexion »',
        'Cliquer sur « Envoyer ma réponse » puis repasser en ligne et recliquer',
        'Recharger la page et lancer plus de 5 envois valides ou refusés en 10 minutes depuis la même adresse'
      ],
      data: [],
      expected: [
        'Hors connexion : aucun faux succès, un message d’erreur s’affiche, le message et le fichier saisis sont conservés et le bouton redevient actif',
        'Après retour du réseau, un seul envoi aboutit (« Réponse envoyée ») et un seul passage en étude est enregistré',
        'Au-delà de 5 envois en 10 minutes, le message « Trop de tentatives. Patientez quelques minutes avant de réessayer. » s’affiche et la saisie est conservée'
      ],
      ui: ['Envoyer ma réponse', 'Réponse envoyée']
    }
  ]
};
