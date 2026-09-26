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
        'Rechercher le dossier sur /portail/suivi',
        'Lire le statut « Complément requis »',
        'Cliquer sur « Soumettre mon complément »'
      ],
      data: [],
      expected: [
        'Le message « Des informations supplémentaires sont nécessaires. Merci de soumettre votre complément. » s’affiche',
        'Le clic ouvre une page permettant de déposer le complément pour ce dossier',
        'La page ne renvoie ni vers /notfound ni vers une erreur'
      ],
      ui: ['Complément requis', 'Soumettre mon complément'],
      aConfirmer: 'La route /portail/complement n’existe pas dans portail.routes.ts (seules les routes vide, deposer, vocal et suivi existent) : le clic mène très probablement à /notfound. Anomalie probable à confirmer avant la recette'
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
        'Après un certain nombre d’essais, l’accès est ralenti ou bloqué avec un message clair',
        'Les codes valides ne peuvent pas être devinés par essais massifs'
      ],
      aConfirmer: 'Aucune limitation n’est visible côté écran : règle de limitation (seuil, durée) à définir avec le back'
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
    }
  ]
};
