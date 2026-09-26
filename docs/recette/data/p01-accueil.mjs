export default {
  id: 'P01',
  title: 'Accueil du portail',
  access: 'Public (sans connexion)',
  intro: 'Page d’accueil « / » du portail citoyen : bandeau, carte de suivi, statistiques, sections d’information, pied de page. Toutes les icônes sont des icônes PrimeIcons (police web) : si la police ne se charge pas, elles disparaissent.',
  cases: [
    {
      id: 'P01-01',
      title: 'Chargement de la page d’accueil sans erreur',
      priority: 'Critique',
      type: 'nominal',
      role: 'PUBLIC',
      regression: true,
      preconditions: ['Navigateur récent (Chrome ou Edge)', 'Console du navigateur ouverte (F12, onglet Console)'],
      steps: [
        'Ouvrir https://denoncer.asce-lc.bf/',
        'Attendre la fin du chargement (les compteurs passent de « ··· » à des nombres)',
        'Lire les messages de la console',
        'Faire défiler la page jusqu’au pied de page'
      ],
      data: [],
      expected: [
        'La page s’affiche avec le bandeau, le bloc « Suivre mon dossier », les statistiques, les sections « Comment ça marche ? », « Vos garanties en tant que dénonciateur », « Comment nous contacter ? » et le pied de page',
        'Les 4 compteurs (Dossiers traités, Nouveaux, En cours, Confidentiel) affichent une valeur et non « ··· »',
        'La console ne contient aucune erreur rouge ni violation de Content-Security-Policy'
      ],
      ui: ['Comment ça marche ?', 'Comment nous contacter ?']
    },
    {
      id: 'P01-02',
      title: 'Icônes visibles : titre, cercles d’accès rapide et boutons',
      priority: 'Critique',
      type: 'nominal',
      role: 'PUBLIC',
      regression: true,
      preconditions: ['Page d’accueil chargée', 'Cache du navigateur vidé (Ctrl+Maj+R)'],
      steps: [
        'Lire le titre du bandeau « DÉNONCIATION DES ACTES DE CORRUPTION »',
        'Repérer les boutons « Faire un signalement » et « Suivre mon dossier » du bandeau (icônes mégaphone et loupe)',
        'Faire défiler jusqu’à la section « Prêt à agir contre la corruption ? »',
        'Observer les deux cercles rouge et vert sous le titre'
      ],
      data: [],
      expected: [
        'Dans le titre, la lettre O de « DÉNONCIATION » et de « CORRUPTION » est remplacée par une loupe : le titre se lit en entier, sans lettre manquante',
        'Le cercle rouge « FAIRE UN SIGNALEMENT » contient un mégaphone',
        'Le cercle vert « SUIVRE MON DOSSIER » contient une loupe',
        'Aucun cercle ni bouton n’apparaît vide'
      ],
      ui: ['Faire un signalement', 'Suivre mon dossier', 'Prêt à agir contre la corruption ?']
    },
    {
      id: 'P01-03',
      title: 'La police d’icônes PrimeIcons se charge (contrôle réseau)',
      priority: 'Critique',
      type: 'nominal',
      role: 'PUBLIC',
      regression: true,
      preconditions: ['Page d’accueil non encore chargée', 'Onglet Réseau (F12) ouvert, case « Désactiver le cache » cochée'],
      steps: [
        'Recharger la page d’accueil',
        'Dans l’onglet Réseau, taper « primeicons » dans le filtre',
        'Cliquer sur la requête du fichier .woff2 (dossier /media/, le nom peut porter un suffixe de version)',
        'Lire le code d’état et l’en-tête de réponse Content-Type'
      ],
      data: [],
      expected: [
        'La requête du fichier primeicons .woff2 retourne le code 200 (ni 404, ni 403, ni 304 sur un cache vidé)',
        'Content-Type de la réponse : font/woff2 (ou application/font-woff2), jamais text/html',
        'Aucune erreur « Content Security Policy » de type font-src en console'
      ],
      aConfirmer: 'Le nom exact du fichier en production (suffixe de version ajouté par le build) est à relever une fois sur la VM'
    },
    {
      id: 'P01-04',
      title: 'Pied de page : icônes, boutons sociaux et liens',
      priority: 'Majeur',
      type: 'nominal',
      role: 'PUBLIC',
      preconditions: ['Page d’accueil chargée'],
      steps: [
        'Faire défiler jusqu’au pied de page rouge',
        'Vérifier les 4 boutons sociaux en bas (Facebook, Twitter, LinkedIn, YouTube)',
        'Vérifier les flèches devant chaque lien des colonnes « LIENS RAPIDES » et « INFORMATIONS »',
        'Cliquer sur « Nos missions », « Textes juridiques », « FAQ » et « Mentions légales »'
      ],
      data: [],
      expected: [
        'Chaque bouton social affiche son logo, les icônes de contact (e-mail, globe, repère) sont visibles',
        'Le bouton Facebook ouvre la page de l’ASCE-LC dans un nouvel onglet',
        'Les liens « Nos missions », « Textes juridiques », « FAQ », « Mentions légales », « Confidentialité », « Conditions d\'utilisation » et « Rapport annuel » ouvrent la page ou le document correspondant'
      ],
      ui: ['LIENS RAPIDES', 'INFORMATIONS', 'Nos missions', 'Textes juridiques', 'FAQ', 'Mentions légales'],
      aConfirmer: 'Dans le code, ces 7 liens pointent vers « # » (aucune page cible) : contenu à fournir ou liens à retirer avant la mise en production'
    },
    {
      id: 'P01-05',
      title: 'Le bouton « Faire un signalement » ouvre le choix du mode de dépôt',
      priority: 'Majeur',
      type: 'nominal',
      role: 'PUBLIC',
      preconditions: ['Page d’accueil chargée'],
      steps: [
        'Cliquer sur « Faire un signalement » dans le bandeau',
        'Lire la fenêtre qui s’ouvre',
        'Cliquer sur « Formulaire écrit »',
        'Revenir à l’accueil, rouvrir la fenêtre et cliquer sur « Témoignage vocal »'
      ],
      data: [],
      expected: [
        'Une fenêtre « Comment voulez-vous déposer ? » propose « Formulaire écrit » et « Témoignage vocal » avec le message de confidentialité',
        '« Formulaire écrit » ouvre /portail/deposer',
        '« Témoignage vocal » ouvre /portail/vocal',
        'Un clic en dehors de la fenêtre ou sur la croix la referme'
      ],
      ui: ['Faire un signalement', 'Comment voulez-vous déposer ?', 'Formulaire écrit', 'Témoignage vocal']
    },
    {
      id: 'P01-06',
      title: 'Accès au suivi depuis le bandeau et depuis la carte de code',
      priority: 'Majeur',
      type: 'nominal',
      role: 'PUBLIC',
      preconditions: ['Page d’accueil chargée', 'Un code de suivi valide (voir dossiers de départ)'],
      steps: [
        'Cliquer sur « Suivre mon dossier » dans le bandeau',
        'Revenir à l’accueil',
        'Dans la carte « Suivre mon dossier », saisir le code de suivi dans la zone « Ex. A1B2C3D4 »',
        'Appuyer sur la touche Entrée puis, après retour, cliquer sur la flèche de la carte'
      ],
      data: ['Code de suivi : celui du dossier D-A'],
      expected: [
        'Le bouton du bandeau ouvre /portail/suivi',
        'Entrée et la flèche de la carte ouvrent la page de suivi avec le code transmis'
      ],
      ui: ['Suivre mon dossier'],
      aConfirmer: 'La zone de la carte accepte 10 caractères (maxlength 10) alors que la page de suivi en accepte 8 : confirmer la longueur réelle du code'
    },
    {
      id: 'P01-07',
      title: 'Une adresse inexistante redirige vers la page « Not Found »',
      priority: 'Mineur',
      type: 'negatif',
      role: 'PUBLIC',
      preconditions: ['Navigateur ouvert'],
      steps: [
        'Ouvrir https://denoncer.asce-lc.bf/page-qui-nexiste-pas',
        'Lire la page affichée et l’adresse dans la barre du navigateur'
      ],
      data: ['Adresse : /page-qui-nexiste-pas'],
      expected: [
        'L’adresse devient /notfound',
        'Une page d’erreur 404 s’affiche avec un lien de retour, sans écran blanc'
      ]
    },
    {
      id: 'P01-08',
      title: 'Coordonnées du pied de page issues des paramètres du portail',
      priority: 'Mineur',
      type: 'nominal',
      role: 'PUBLIC',
      preconditions: ['Paramètres du portail renseignés par l’administrateur (voir P12-06)'],
      steps: [
        'Ouvrir l’accueil et faire défiler jusqu’à la colonne « CONTACT »',
        'Relever le numéro, l’e-mail, le site web et l’adresse',
        'Comparer aux valeurs saisies dans les paramètres du portail'
      ],
      data: [],
      expected: [
        'Le numéro, l’e-mail, le site web et l’adresse affichés sont ceux des paramètres du portail',
        'À défaut de paramètre, les valeurs par défaut « 80 00 11 11 », « contact@asce-lc.bf », « www.asce-lc.bf » et « Ouagadougou, Burkina Faso » s’affichent'
      ],
      ui: ['CONTACT'],
      aConfirmer: 'Valeurs officielles attendues (numéro vert, e-mail, site, adresse) à fournir par l’ASCE-LC'
    }
  ]
};
