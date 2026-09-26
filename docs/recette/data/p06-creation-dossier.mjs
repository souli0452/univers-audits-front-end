export default {
  id: 'P06',
  title: 'Création interne d’un dossier',
  access: 'Agents connectés (menu « Dossiers ») ; aucun rôle particulier exigé par le front',
  intro: 'Deux formulaires internes : « Nouveau dossier » (/app/dossiers/nouveau, 3 étapes) et « Dépôt audio » au guichet (/app/dossiers/audio). Avec le dépôt écrit public (P02) et le dépôt vocal public (P03), ce sont les 4 points d’entrée de création. Ils ont tous été corrigés ensemble pour le type, la qualité (VICTIME ou TEMOIN) et le type de déclarant : c’est la zone de régression à surveiller.',
  cases: [
    {
      id: 'P06-01',
      title: 'Nouveau dossier interne : identifié puis anonyme',
      priority: 'Critique',
      type: 'nominal',
      role: 'AGENT_BRPD',
      regression: true,
      preconditions: ['Session ouverte avec le compte AGENT_BRPD', 'Onglet Réseau (F12) ouvert'],
      steps: [
        'Menu « Dossiers » puis « Nouveau dossier » (page « Nouveau Dossier »)',
        'Étape « Informations du dossier » : type « Plainte », mode « Guichet BRPD », résumé, description, lieu, période, montant, puis « Suivant »',
        'Étape « Informations du déclarant » : catégorie « Citoyen », qualité « Victime », prénom, nom, téléphone, e-mail ; cocher « J\'accepte le traitement de mes données personnelles » puis « Suivant »',
        'Étape « Confirmation et soumission » : relire puis cliquer sur « Soumettre le Dossier »',
        'Dans l’onglet Réseau, lire le corps de la requête POST de création',
        'Recommencer avec le type « Dénonciation » en cochant l’option d’anonymat à l’étape « Informations du déclarant »'
      ],
      data: [
        'Résumé : Détournement à la mairie de test interne',
        'Description : Faits fictifs de recette',
        'Déclarant : Test Guichet, téléphone +226 70 00 00 01'
      ],
      expected: [
        'Cas identifié : la notification « Dossier enregistré » avec « Code B4 : XXXXXXXX » s’affiche puis la liste des dossiers s’ouvre au bout de 3 secondes',
        'Corps de la requête, cas identifié : type COMPLAINT, quality VICTIME, anonymous false, typeDeclarant CITIZEN',
        'Cas anonyme : anonymous true, quality TEMOIN, typeDeclarant ANONYMOUS, sans prénom, nom, e-mail ni téléphone',
        'Les deux dossiers apparaissent dans la liste avec le statut Soumis'
      ],
      ui: ['Nouveau Dossier', 'Informations du dossier', 'Informations du déclarant', 'Confirmation et soumission', 'Suivant', 'Soumettre le Dossier', 'Guichet BRPD']
    },
    {
      id: 'P06-02',
      title: 'Dépôt audio au guichet : identifié puis anonyme',
      priority: 'Critique',
      type: 'nominal',
      role: 'AGENT_BRPD',
      regression: true,
      preconditions: ['Session ouverte avec le compte AGENT_BRPD', 'Microphone autorisé', 'Onglet Réseau (F12) ouvert'],
      steps: [
        'Menu « Dossiers » puis « Dépôt audio »',
        'Cliquer sur « Démarrer l\'enregistrement », parler quelques secondes, cliquer sur « Arrêter l\'enregistrement »',
        'Renseigner le type « Dénonciation », le mode « Comptoir Audio », le résumé, la description et le nom du déclarant',
        'Cliquer sur « Créer le dossier avec audio »',
        'Lire le corps de la requête POST dans l’onglet Réseau',
        'Recommencer avec le type « Anonyme »'
      ],
      data: ['Résumé : Témoignage guichet audio test', 'Déclarant : Test Guichet Audio'],
      expected: [
        'L’écran « Dossier créé avec succès » propose « Imprimer le B4 » et « Voir le dossier »',
        'Cas identifié : anonymous false, typeDeclarant CITIZEN, quality TEMOIN',
        'Cas type Anonyme : type envoyé DENUNCIATION, anonymous true, typeDeclarant ANONYMOUS, aucun nom de déclarant envoyé',
        'Le fichier audio est présent dans les pièces jointes des deux dossiers'
      ],
      ui: ['Démarrer l\'enregistrement', 'Arrêter l\'enregistrement', 'Créer le dossier avec audio', 'Imprimer le B4', 'Voir le dossier'],
      aConfirmer: 'Si l’envoi de l’audio échoue, le dossier est créé avec le message « L\'audio n\'a pas pu être joint automatiquement » : conduite attendue à préciser'
    },
    {
      id: 'P06-03',
      title: 'Contrôle croisé des 4 points d’entrée de création',
      priority: 'Critique',
      type: 'nominal',
      role: 'ADMIN_DDIC',
      regression: true,
      preconditions: ['Dossiers créés lors des cas P02-01, P02-02, P03-01, P03-04, P06-01 et P06-02 : les 4 points d’entrée (écrit public, vocal public, formulaire interne, dépôt audio), en version identifiée et anonyme'],
      steps: [
        'Ouvrir « Tous les dossiers » et retrouver les dossiers créés par chacun des 4 points d’entrée',
        'Pour chacun, ouvrir le détail et relever le type, la qualité, le déclarant et la mention d’anonymat',
        'Renseigner le résultat dans le tableau de contrôle : point d’entrée, mode (identifié ou anonyme), type, qualité, type de déclarant'
      ],
      data: [
        'Écrit public identifié : COMPLAINT / VICTIME / CITIZEN',
        'Écrit public anonyme : DENUNCIATION / TEMOIN / ANONYMOUS',
        'Vocal public : DENUNCIATION / TEMOIN / CITIZEN si contact, ANONYMOUS sinon',
        'Interne et guichet : mêmes règles que ci-dessus'
      ],
      expected: [
        'Chaque dossier anonyme affiche « Anonyme » sans aucune donnée d’identité',
        'Chaque dossier anonyme a la qualité TEMOIN et le type Dénonciation',
        'Aucun des 4 points d’entrée ne produit un dossier au type ou à la qualité incohérents'
      ]
    },
    {
      id: 'P06-04',
      title: 'Les quatre types de saisine du formulaire interne',
      priority: 'Majeur',
      type: 'nominal',
      role: 'AGENT_BRPD',
      preconditions: ['Formulaire « Nouveau dossier » ouvert'],
      steps: [
        'Créer un dossier de type « Plainte »',
        'Créer un dossier de type « Dénonciation »',
        'Créer un dossier de type « Auto-saisine »',
        'Créer un dossier de type « Anonyme »',
        'Ouvrir la liste et filtrer par « Type » pour chacun'
      ],
      data: ['Résumé : Test type de saisine + numéro d’ordre'],
      expected: [
        'Chaque dossier est créé et le filtre « Type » de la liste le retrouve',
        'Le libellé du type affiché dans le détail correspond au type choisi',
        'Le type « Anonyme » ne demande aucune donnée d’identité valide côté déclarant'
      ],
      ui: ['Plainte', 'Dénonciation', 'Auto-saisine', 'Anonyme'],
      aConfirmer: 'Le formulaire interne propose à la fois le type « Anonyme » et une case d’anonymat du déclarant : cohérence attendue entre les deux (type Anonyme avec déclarant identifié) à confirmer'
    },
    {
      id: 'P06-05',
      title: 'Modes de réception du dossier',
      priority: 'Majeur',
      type: 'nominal',
      role: 'AGENT_BRPD',
      preconditions: ['Formulaire « Nouveau dossier » ouvert'],
      steps: [
        'Ouvrir la liste déroulante du mode de réception',
        'Créer un dossier pour « Email », « Téléphone », « Formulaire Papier » et « Courrier Postal »',
        'Créer un dossier avec le mode « Fax »',
        'Dans la liste, filtrer par « Canal »'
      ],
      data: [],
      expected: [
        'Les modes créés apparaissent dans le détail et dans le filtre « Canal »',
        'Le mode « Fax » est accepté et enregistré, ou refusé avec un message clair'
      ],
      ui: ['Email', 'Téléphone', 'Formulaire Papier', 'Courrier Postal', 'Fax'],
      aConfirmer: 'Le mode « Fax » est proposé par le formulaire mais absent du type des modes de saisine du modèle du front : le back l’accepte-t-il ?'
    },
    {
      id: 'P06-06',
      title: 'Dossier confidentiel : visibilité réservée',
      priority: 'Majeur',
      type: 'nominal',
      role: 'AGENT_BRPD',
      preconditions: ['Formulaire « Nouveau dossier » ouvert'],
      steps: [
        'Cocher « Marquer ce dossier comme confidentiel » et soumettre le dossier',
        'Ouvrir ce dossier avec AGENT_BRPD puis avec CGE puis avec CONTROLEUR_ETAT',
        'Comparer l’affichage de la mention « Confidentiel »'
      ],
      data: ['Résumé : Dossier confidentiel test recette'],
      expected: [
        'CGE, CGEA et ADMIN_DDIC voient la mention « Confidentiel » et peuvent retirer ou remettre la confidentialité',
        'Les autres rôles ne voient pas cette action de gestion de la confidentialité'
      ],
      ui: ['Marquer ce dossier comme confidentiel', 'Confidentiel'],
      aConfirmer: 'Données exactement masquées aux rôles qui ne peuvent pas voir la confidentialité (contenu, déclarant, pièces) à confirmer avec le responsable métier'
    },
    {
      id: 'P06-07',
      title: 'Champs obligatoires vides dans le formulaire interne',
      priority: 'Majeur',
      type: 'negatif',
      role: 'AGENT_BRPD',
      preconditions: ['Formulaire « Nouveau dossier » ouvert, à l’étape « Informations du dossier »'],
      steps: [
        'Cliquer sur « Suivant » sans rien saisir',
        'Saisir un résumé de 5 caractères et une description puis « Suivant »',
        'À l’étape déclarant, ne pas cocher le consentement et cliquer sur « Suivant »'
      ],
      data: ['Résumé trop court : Test'],
      expected: [
        'Le message « Champs requis » s’affiche et l’étape reste inchangée',
        'Un résumé de moins de 10 caractères est refusé',
        'Sans consentement, le message « Consentement requis » s’affiche et l’étape de confirmation n’est pas atteinte'
      ],
      ui: ['Suivant', 'Champs requis', 'Consentement requis']
    },
    {
      id: 'P06-08',
      title: 'Erreur du back à la création : message lisible, pas de blocage silencieux',
      priority: 'Majeur',
      type: 'negatif',
      role: 'AGENT_BRPD',
      preconditions: ['Formulaire interne complet à l’étape « Confirmation et soumission »', 'Onglet Réseau : bloquer l’URL de la requête de création'],
      steps: [
        'Bloquer la requête de création dans l’onglet Réseau',
        'Cliquer sur « Soumettre le Dossier »',
        'Lire le message affiché puis débloquer et recliquer'
      ],
      data: [],
      expected: [
        'Une notification « Erreur de validation » avec un texte explicatif reste affichée 8 secondes',
        'Le bouton de soumission redevient actif et la saisie n’est pas perdue',
        'Après déblocage, un seul dossier est créé'
      ],
      ui: ['Erreur de validation']
    },
    {
      id: 'P06-09',
      title: 'Numéro de dossier et code d’accès générés',
      priority: 'Mineur',
      type: 'nominal',
      role: 'AGENT_BRPD',
      preconditions: ['Un dossier vient d’être créé'],
      steps: [
        'Ouvrir le dossier depuis « Tous les dossiers »',
        'Relever le numéro et le code d’accès',
        'Utiliser le code d’accès sur /portail/suivi'
      ],
      data: [],
      expected: [
        'Le dossier porte un numéro unique non vide',
        'Le code d’accès de 8 caractères retrouve le dossier sur la page de suivi public'
      ]
    },
    {
      id: 'P06-10',
      title: 'Création par un rôle sans droit d’édition',
      priority: 'Majeur',
      type: 'securite',
      role: 'AGENT_CJ',
      preconditions: ['Session ouverte avec le compte AGENT_CJ (rôle absent de la liste des rôles autorisés à éditer un dossier)'],
      steps: [
        'Ouvrir « Nouveau dossier » depuis le menu, ou saisir /#/app/dossiers/nouveau',
        'Remplir et soumettre le formulaire',
        'Ouvrir /#/app/dossiers/audio et tenter un dépôt'
      ],
      data: [],
      expected: [
        'La création est refusée avec un message clair (403) et aucun dossier n’est créé',
        'Le refus est identique en accès par le menu et par adresse directe'
      ],
      aConfirmer: 'Le front ne protège pas ces pages par un rôle (seule la connexion est exigée) : la règle de droit de création est portée par le back, à confirmer'
    },
    {
      id: 'P06-11',
      title: 'Liste des dossiers : recherche, filtres et pagination',
      priority: 'Mineur',
      type: 'nominal',
      role: 'AGENT_BRPD',
      preconditions: ['Plus de 10 dossiers en base'],
      steps: [
        'Ouvrir « Tous les dossiers »',
        'Saisir un numéro ou un mot de l’objet dans « Numéro, objet, déclarant... »',
        'Utiliser les filtres « Statut », « Type », « Canal », « Priorité » et « Déclarant » puis « Réinitialiser les filtres »',
        'Changer le nombre de lignes par page (10, 20, 50) et naviguer entre les pages'
      ],
      data: [],
      expected: [
        'La recherche et chaque filtre réduisent la liste aux dossiers correspondants',
        '« Réinitialiser les filtres » rétablit la liste complète',
        'La pagination affiche le bon nombre de lignes et le bon total'
      ],
      ui: ['Numéro, objet, déclarant...', 'Réinitialiser les filtres', 'Tous les dossiers']
    }
  ]
};
