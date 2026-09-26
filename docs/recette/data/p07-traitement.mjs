export default {
  id: 'P07',
  title: 'Traitement du dossier',
  access: 'Agents connectés selon le rôle (écran de détail du dossier et séances CTADP)',
  intro: 'Cycle de traitement depuis le détail du dossier : Enregistrer (AGENT_BRPD), Démarrer étude, Soumettre au CTADP ou Demander complément (CONSEILLER_JURIDIQUE, CGEA), Déclarer recevable ou irrecevable (CGE, CGEA). Les boutons affichés dépendent du statut et du rôle. Chaque transition envoie la version du dossier : un conflit de version est signalé.',
  cases: [
    {
      id: 'P07-01',
      title: 'Enregistrement du dossier : SOUMIS vers RECU',
      priority: 'Critique',
      type: 'nominal',
      role: 'AGENT_BRPD',
      preconditions: ['Dossier D-A au statut SOUMIS', 'Session ouverte avec le compte AGENT_BRPD'],
      steps: [
        'Ouvrir le dossier D-A depuis « Tous les dossiers »',
        'Cliquer sur « Enregistrer » en haut de l’écran',
        'Lire la fenêtre « Enregistrer le dossier » puis, sans rien saisir, cliquer sur « Enregistrer le dossier »',
        'Lire la notification et le statut affiché'
      ],
      data: [],
      expected: [
        'Une notification « Statut mis à jour » s’affiche et le statut du dossier devient Reçu',
        'Le bouton « Enregistrer » disparaît et « Démarrer étude » devient visible pour les rôles concernés',
        'Sur le suivi public, le statut affiché est « Dossier enregistré »'
      ],
      ui: ['Enregistrer', 'Enregistrer le dossier', 'Statut mis à jour'],
      aConfirmer: 'Le délai d’enregistrement annoncé au citoyen est de 7 jours ouvrables : règle de calcul et alerte de dépassement à confirmer côté back'
    },
    {
      id: 'P07-02',
      title: 'Démarrage de l’étude d’opportunité et saisie de l’étude',
      priority: 'Critique',
      type: 'nominal',
      role: 'CONSEILLER_JURIDIQUE',
      preconditions: ['Dossier D-A au statut RECU', 'Session ouverte avec le compte CONSEILLER_JURIDIQUE'],
      steps: [
        'Ouvrir le dossier D-A',
        'Cliquer sur « Démarrer étude » puis confirmer dans la fenêtre « Démarrer étude opportunité »',
        'Ouvrir l’onglet « Analyse première », renseigner la fiche « Étude d\'opportunité — Fiche d\'analyse première » puis cliquer sur « Enregistrer »',
        'Relire la notification'
      ],
      data: ['Contenu de l’étude : texte de test de la recette'],
      expected: [
        'Le statut devient « En étude opportunité »',
        'Les boutons « Soumettre au CTADP » et « Demander complément » apparaissent',
        'L’étude enregistrée est relue à l’identique après rechargement de la page'
      ],
      ui: ['Démarrer étude', 'Démarrer étude opportunité', 'Analyse première', 'Soumettre au CTADP', 'Demander complément']
    },
    {
      id: 'P07-03',
      title: 'Demande de complément au déclarant',
      priority: 'Majeur',
      type: 'nominal',
      role: 'CONSEILLER_JURIDIQUE',
      preconditions: ['Dossier au statut EN_ETUDE_OPPORTUNITE'],
      steps: [
        'Cliquer sur « Demander complément »',
        'Dans « Demander un complément au déclarant », saisir un motif',
        'Cliquer sur « Envoyer la demande »',
        'Rechercher le dossier sur le suivi public avec son code'
      ],
      data: ['Motif : Veuillez fournir les justificatifs de paiement'],
      expected: [
        'La notification « Demande de complément envoyée » s’affiche et le statut devient « En attente complément »',
        'Le suivi public affiche « Complément requis »',
        'Une notification au déclarant est créée si ses coordonnées existent (visible dans la file des notifications)'
      ],
      ui: ['Demander un complément au déclarant', 'Envoyer la demande', 'Demande de complément envoyée']
    },
    {
      id: 'P07-04',
      title: 'Réception du complément : reprise de l’étude',
      priority: 'Majeur',
      type: 'nominal',
      role: 'AGENT_BRPD',
      preconditions: ['Dossier au statut EN_ATTENTE_COMPLEMENT'],
      steps: [
        'Ouvrir le dossier',
        'Cliquer sur « Complément reçu »',
        'Confirmer dans la fenêtre « Complément reçu »'
      ],
      data: [],
      expected: [
        'Le dossier reprend l’étude : statut « En étude opportunité »',
        '« Soumettre au CTADP » et « Demander complément » sont de nouveau proposés'
      ],
      ui: ['Complément reçu'],
      aConfirmer: 'Le complément du citoyen ne peut pas être déposé depuis le portail (voir P04-04) : la réception est aujourd’hui déclarée par un agent'
    },
    {
      id: 'P07-05',
      title: 'Soumission au CTADP',
      priority: 'Critique',
      type: 'nominal',
      role: 'CONSEILLER_JURIDIQUE',
      preconditions: ['Dossier au statut EN_ETUDE_OPPORTUNITE'],
      steps: [
        'Cliquer sur « Soumettre au CTADP »',
        'Confirmer dans la fenêtre qui annonce la transmission au Comité de Traitement et d’Analyse'
      ],
      data: [],
      expected: [
        'Le statut devient « En revue CTADP »',
        'Le dossier est proposé dans la liste des dossiers ajoutables à une séance CTADP'
      ],
      ui: ['Soumettre au CTADP']
    },
    {
      id: 'P07-06',
      title: 'Déclarer le dossier recevable',
      priority: 'Critique',
      type: 'nominal',
      role: 'CGE',
      preconditions: ['Dossier au statut EN_REVUE_CTADP', 'Session ouverte avec le compte CGE'],
      steps: [
        'Ouvrir le dossier',
        'Cliquer sur « Déclarer recevable »',
        'Saisir une observation facultative puis confirmer avec « Déclarer recevable »'
      ],
      data: ['Observation : Recevable après avis du CTADP'],
      expected: [
        'Le statut devient « Recevable »',
        'Le bouton « Ouvrir l\'investigation » est proposé aux rôles CGEA et ADMIN_DDIC',
        'Sur le suivi public : « Dossier recevable »'
      ],
      ui: ['Déclarer recevable', 'Ouvrir l\'investigation']
    },
    {
      id: 'P07-07',
      title: 'Déclarer le dossier irrecevable puis le clôturer',
      priority: 'Critique',
      type: 'nominal',
      role: 'CGE',
      preconditions: ['Dossier au statut EN_REVUE_CTADP'],
      steps: [
        'Cliquer sur « Déclarer irrecevable »',
        'Lire le message sur la réponse motivée, saisir un motif puis confirmer',
        'Vérifier le statut puis cliquer sur « Clôturer »',
        'Saisir un motif de clôture et confirmer'
      ],
      data: ['Motif : Faits hors du champ de compétence de l’ASCE-LC'],
      expected: [
        'Le statut devient « Irrecevable » avec l’information que le CGEA adressera une réponse motivée dans 3 jours ouvrables',
        'Sur le suivi public : « Dossier irrecevable » avec le message de réponse motivée',
        'Après « Clôturer », le dossier passe à l’état clôturé et n’est plus modifiable'
      ],
      ui: ['Déclarer irrecevable', 'Clôturer']
    },
    {
      id: 'P07-08',
      title: 'Transfert du dossier vers une institution compétente',
      priority: 'Majeur',
      type: 'nominal',
      role: 'CGE',
      preconditions: ['Dossier au statut EN_REVUE_CTADP (seule étape où le back autorise le transfert)', 'Session ouverte avec le compte CGE (ou CGEA, ADMIN_DDIC)', 'Institution destinataire connue (institution partenaire de test)'],
      steps: [
        'Ouvrir le dossier au statut En revue CTADP',
        'Cliquer sur « Transférer », à côté de « Déclarer recevable » et « Déclarer irrecevable »',
        'Dans « Transférer le dossier à une institution », laisser l’institution vide et cliquer sur « Transférer le dossier »',
        'Saisir l’institution destinataire et un motif puis cliquer sur « Transférer le dossier »',
        'Relire le bandeau affiché sur le dossier'
      ],
      data: ['Institution : Institution partenaire de test', 'Motif : Hors du champ de compétence de l’ASCE-LC'],
      expected: [
        'Sans institution, le message « Institution requise » s’affiche, la fenêtre reste ouverte et le dossier reste « En revue CTADP »',
        'Avec l’institution, la notification « Statut mis à jour » s’affiche, le statut devient « Transféré » et le bandeau « Dossier transféré » indique « Transmis à » suivi de l’institution',
        'Le dossier n’est plus modifiable et la note de transfert figure parmi les observations',
        'Le suivi public affiche « Dossier transféré »',
        'Le bouton « Transférer » n’apparaît sur aucun autre statut, ni pour un rôle autre que CGE, CGEA et ADMIN_DDIC'
      ],
      ui: ['Déclarer recevable', 'Déclarer irrecevable', 'Dossier transféré']
    },
    {
      id: 'P07-09',
      title: 'Séance CTADP : créer, ajouter un dossier, recommander, tenir',
      priority: 'Majeur',
      type: 'nominal',
      role: 'CGEA',
      preconditions: ['Un dossier au statut EN_REVUE_CTADP', 'Session ouverte avec le compte CGEA'],
      steps: [
        'Menu « Bureau des plaintes » puis « Séances CTADP » ; cliquer sur « Nouvelle séance »',
        'Renseigner la date et la liste des participants puis cliquer sur « Créer »',
        'Ouvrir la séance et cliquer sur « Ajouter un dossier », choisir le dossier et « Ajouter »',
        'Saisir la recommandation CTADP pour le dossier puis « Enregistrer »',
        'Cliquer sur « Tenir la séance », saisir un procès-verbal et confirmer'
      ],
      data: ['Date : date du jour', 'Participants : Membres de test'],
      expected: [
        'La séance est créée au statut « Planifiée »',
        'Seuls les dossiers en revue CTADP sont proposés à l’ajout',
        'La notification « Recommandation enregistrée » puis « Séance tenue » s’affichent et le statut devient « Tenue »',
        'Une séance tenue n’est plus modifiable'
      ],
      ui: ['Séances CTADP', 'Nouvelle séance', 'Ajouter un dossier', 'Tenir la séance', 'Recommandation enregistrée', 'Séance tenue'],
      aConfirmer: 'Le statut « Annulée » existe mais aucune action d’annulation n’est visible dans l’écran de la séance : comment une séance est-elle annulée ?'
    },
    {
      id: 'P07-10',
      title: 'Parties visées, témoins, observations et pièces jointes',
      priority: 'Majeur',
      type: 'nominal',
      role: 'CGE',
      preconditions: ['Dossier ouvert non clôturé', 'Session ouverte avec le compte CGE'],
      steps: [
        'Onglet « Parties visées » : cliquer sur « Ajouter une partie », remplir puis enregistrer ; modifier puis supprimer la partie',
        'Onglet « Témoins » : « Ajouter un témoin », enregistrer',
        'Onglet « Observations » : « Ajouter une observation », enregistrer',
        'Onglet « Pièces jointes » : ajouter un fichier PDF puis un fichier image et les consulter'
      ],
      data: ['Partie : Personne physique de test', 'Fichiers : document.pdf, photo.jpg'],
      expected: [
        'Chaque élément ajouté apparaît dans son onglet et reste après rechargement de la page',
        'La modification et la suppression fonctionnent avec confirmation',
        'Le PDF et l’image s’affichent dans la visionneuse des pièces jointes'
      ],
      ui: ['Parties visées', 'Témoins', 'Observations', 'Pièces jointes', 'Ajouter une partie', 'Ajouter un témoin', 'Ajouter une observation']
    },
    {
      id: 'P07-11',
      title: 'Fiche d’affectation : création, affectation, suivi',
      priority: 'Majeur',
      type: 'nominal',
      role: 'CGEA',
      preconditions: ['Dossier ouvert avec l’onglet « Affectation »', 'Session ouverte avec le compte CGEA'],
      steps: [
        'Ouvrir l’onglet « Affectation » et cliquer sur « Créer la fiche d\'affectation »',
        'Choisir le mode « Affectation directe CGEA » puis créer',
        'Cliquer sur « Affecter » et désigner le destinataire',
        'Cliquer sur « Mettre à jour le suivi » et enregistrer un suivi',
        'Recommencer avec le mode « Échange préalable » sur un second dossier'
      ],
      data: [],
      expected: [
        'La fiche est créée puis affectée et son état évolue à chaque étape',
        'Les deux modes d’affectation (directe et échange préalable) sont enregistrés',
        'Les boutons « Affecter » et « Mettre à jour le suivi » ne sont visibles qu’aux rôles habilités'
      ],
      ui: ['Affectation', 'Créer la fiche d\'affectation', 'Affecter', 'Mettre à jour le suivi']
    },
    {
      id: 'P07-12',
      title: 'Transition non autorisée pour le statut ou le rôle',
      priority: 'Majeur',
      type: 'negatif',
      role: 'CGE',
      preconditions: ['Un dossier SOUMIS, un dossier EN_ETUDE_OPPORTUNITE et un dossier EN_REVUE_CTADP', 'Session ouverte avec le compte CGE'],
      steps: [
        'Ouvrir le dossier SOUMIS et chercher le bouton « Enregistrer »',
        'Ouvrir le dossier EN_ETUDE_OPPORTUNITE et chercher « Soumettre au CTADP »',
        'Ouvrir le dossier EN_REVUE_CTADP et chercher « Déclarer recevable »'
      ],
      data: [],
      expected: [
        'Sur le dossier SOUMIS, CGE ne voit pas « Enregistrer » (réservé à AGENT_BRPD)',
        'Sur le dossier EN_ETUDE_OPPORTUNITE, CGE ne voit pas « Soumettre au CTADP » (réservé à CONSEILLER_JURIDIQUE et CGEA)',
        'Sur le dossier EN_REVUE_CTADP, CGE voit « Déclarer recevable » et « Déclarer irrecevable »'
      ],
      ui: ['Enregistrer', 'Soumettre au CTADP', 'Déclarer recevable']
    },
    {
      id: 'P07-13',
      title: 'Conflit de version : deux agents modifient le même dossier',
      priority: 'Majeur',
      type: 'negatif',
      role: 'CGE',
      preconditions: ['Deux navigateurs (ou deux sessions) avec deux comptes autorisés sur le même dossier EN_REVUE_CTADP'],
      steps: [
        'Ouvrir le même dossier dans les deux sessions',
        'Dans la session 1, cliquer sur « Déclarer recevable » et confirmer',
        'Sans recharger la session 2, cliquer sur « Déclarer irrecevable » et confirmer'
      ],
      data: [],
      expected: [
        'La session 2 affiche la fenêtre « Conflit de version détecté » avec « Ce dossier a été modifié par un autre agent »',
        'Le dossier est rechargé avec sa version actuelle et le statut Recevable',
        'Aucune transition contradictoire n’est enregistrée : le dossier reste « Recevable »'
      ],
      ui: ['Conflit de version détecté', 'Ce dossier a été modifié par un autre agent']
    },
    {
      id: 'P07-14',
      title: 'Motif obligatoire pour la demande de complément',
      priority: 'Majeur',
      type: 'negatif',
      role: 'CONSEILLER_JURIDIQUE',
      preconditions: ['Dossier au statut EN_ETUDE_OPPORTUNITE'],
      steps: [
        'Cliquer sur « Demander complément »',
        'Laisser le motif vide et cliquer sur « Envoyer la demande »',
        'Sur un autre dossier EN_REVUE_CTADP, déclarer irrecevable sans saisir de motif'
      ],
      data: [],
      expected: [
        'Le message « Le motif est obligatoire pour informer le déclarant. » s’affiche et la demande n’est pas envoyée',
        'Le statut du dossier reste « En étude opportunité »'
      ],
      ui: ['Le motif est obligatoire pour informer le déclarant.'],
      aConfirmer: 'Pour les autres transitions le motif est facultatif à l’écran (« Motif / Observation (optionnel) »), y compris « Déclarer irrecevable » qui entraîne une réponse motivée : obligation de motif à confirmer'
    },
    {
      id: 'P07-15',
      title: 'Rôle sans droit d’édition ou dossier clôturé : aucune action',
      priority: 'Majeur',
      type: 'securite',
      role: 'AGENT_CJ',
      preconditions: ['Un dossier ouvert et un dossier clôturé', 'Session ouverte avec le compte AGENT_CJ'],
      steps: [
        'Ouvrir le dossier ouvert avec AGENT_CJ et chercher les boutons d’ajout et de transition',
        'Se reconnecter avec CGE, ouvrir le dossier clôturé et chercher « Ajouter une partie »'
      ],
      data: [],
      expected: [
        'AGENT_CJ ne voit ni « Ajouter une partie », ni « Ajouter un témoin », ni bouton de transition',
        'Sur le dossier clôturé, transféré ou classé, aucun rôle ne voit les boutons d’ajout',
        'Un dossier de lanceur d’alerte protégé n’est modifiable que par CGE et CGEA'
      ],
      ui: ['Ajouter une partie']
    }
  ]
};
