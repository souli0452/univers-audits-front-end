// Chapitres 9 à 12 et annexes : comité (CTADP), contrôleur d'État, DCP, administrateur DDIC.
import { p, h1, h2, h3, puces, listeNumerotee, astuce, attention, exercice, aConfirmer, fig, tableau, apresTableau } from './lib-docx.mjs';

export async function chapitres3() {
    const c = [];

    // ============================================================ 9
    c.push(h1('9. Profil membre du comité (CTADP)'));
    c.push(p("Le Comité de Traitement et d'Analyse des Dénonciations et des Plaintes (CTADP) examine, en séance, les dossiers que le conseiller juridique lui soumet. Le membre du comité **lit** les dossiers et les enquêtes qui lui sont soumis et **participe à la séance** ; il ne modifie pas le circuit."));
    c.push(h2('9.1 Votre espace'));
    c.push(...(await fig('ctadp-01-tableau-de-bord', 'Le tableau de bord du membre du comité', { recadrer: { haut: 0, hauteur: 860 } })));
    c.push(p("Votre menu comprend le tableau de bord, les statistiques, les dossiers, les **séances CTADP**, les enquêtes et les rapports. Comme les autres agents, vous ne voyez que les dossiers pour lesquels vous avez une habilitation."));
    c.push(h2('9.2 Les séances'));
    c.push(...(await fig('ctadp-02-seances', 'La liste des séances', { recadrer: { haut: 0, hauteur: 420 } })));
    c.push(p("Une séance **Planifiée** a une date, une liste de participants et des dossiers à examiner. Ouvrez-la (icône 👁) pour lire les dossiers inscrits et, pour chacun, la recommandation déjà enregistrée. Une séance **Tenue** est figée : son procès-verbal ne change plus."));
    c.push(...(await fig('ctadp-03-seance-detail', 'Le détail d\'une séance', { recadrer: { haut: 0, hauteur: 700 } })));
    c.push(h2('9.3 Ce que vous pouvez faire sur un dossier'));
    c.push(...puces([
        "**Lire** la fiche, l'étude d'opportunité (onglet Analyse), les pièces jointes et les observations.",
        "**Demander un complément** d'information au déclarant, selon vos droits, si le dossier n'est pas assez clair pour décider.",
        "**Donner votre avis en séance** : la **recommandation du comité** est ensuite enregistrée dans la séance par le CGEA ou le conseiller juridique et sert de base à la décision du CGE."
    ]));
    c.push(...astuce("À retenir pour le membre du comité : **lire avant la séance**, **donner un avis motivé**, **demander un complément** plutôt que de deviner. La décision de recevabilité appartient au CGE."));
    c.push(...exercice('Exercice 6 : consulter une séance', "1. Avec le compte **form-ctadp**, ouvrez **Séances CTADP**.", "2. Ouvrez la séance planifiée et relevez les dossiers qu'elle contient.", "3. Ouvrez un dossier de la séance et lisez son étude d'opportunité."));

    // ============================================================ 10
    c.push(h1('10. Profil contrôleur d\'État (enquêteur)'));
    c.push(p("Le contrôleur d'État **conduit l'enquête** sur un dossier déclaré recevable. Il travaille dans la page « Investigation », qui rassemble tout ce dont une enquête a besoin : le mandat, les auditions, les pièces, les demandes de documents, les mesures conservatoires et le rapport."));
    c.push(h2('10.1 Vos enquêtes'));
    c.push(...(await fig('ce-02-enquetes-liste', 'La liste des enquêtes', { recadrer: { haut: 0, hauteur: 520 } })));
    c.push(...puces([
        "Les compteurs **Initiées**, **En cours**, **Suspendues** et **En retard**.",
        "Les filtres par **statut**, **délai** et **rôle dans l'équipe**.",
        "Pour chaque enquête : le dossier, l'objet, le statut, la **progression**, le **délai restant**, les membres de l'**équipe** et la date."
    ]));
    c.push(h2('10.2 Avant de commencer : l\'engagement préalable'));
    c.push(p("Avant d'entrer dans l'équipe d'une enquête, chaque agent doit déclarer qu'il n'a **aucun conflit d'intérêts** avec le dossier et signer l'**engagement de confidentialité**. Tant que ce n'est pas fait, le CGEA ne peut pas l'ajouter à l'équipe. S'il en existe un, vous le déclarez avec ses détails : le CGEA en tient compte."));
    c.push(h2('10.3 La page d\'une enquête'));
    c.push(...(await fig('ce-03-enquete-detail', 'La page d\'une enquête', { recadrer: { haut: 0, hauteur: 1500 } })));
    c.push(p("La colonne de gauche enchaîne les sections suivantes :"));
    c.push(...puces([
        "**Progression de l'enquête** : date de début, durée prévue (90 jours par défaut) et délai restant.",
        "**Circuit de validation** : (1) rapport soumis par l'équipe, (2) approbation, (3) avis du conseiller juridique (**10 jours ouvrables**), (4) **décision finale du CGE** (**20 jours ouvrables**).",
        "**Mandat** : le mandat délivré à l'équipe pour mener l'enquête.",
        "**Incidents d'objectivité** : un agent déclare tout incident qui pourrait mettre en cause l'objectivité de l'enquête. La déclaration notifie directement le CGE et reste tracée.",
        "**Procédures d'urgence** et **Mesures conservatoires** : actions à prendre sans attendre pour protéger des preuves.",
        "**Demandes de documents** : demande initiale, relance, puis sommation et saisine judiciaire si l'organisme ne répond pas (chaque étape a son délai).",
        "**Inventaire des pièces** : la liste des pièces rassemblées.",
        "**Auditions** et **Visites terrain** : planification et comptes rendus. Les auditions de toutes les enquêtes se retrouvent dans le **Registre des auditions**.",
        "**Check-list du dossier de travail** : les 22 points de contrôle à cocher au fil de l'enquête.",
        "**Rapport d'enquête officiel** : le rapport final."
    ]));
    c.push(p("La colonne de droite rappelle le **dossier associé** (un clic ouvre la fiche) et l'**équipe** : chef de mission, investigateurs, personnes ressources."));
    c.push(p("Les 22 points reprennent la « Liste de vérification du dossier de travail » du manuel des procédures de l'ASCE-LC (rencontre des témoins, théorie de l'infraction, PV d'audition signés, contrôle qualité interne du rapport, etc.). Le rapport ne peut pas être soumis tant qu'un point actif n'est pas coché."));
    c.push(h2('10.4 L\'équipe d\'enquête'));
    c.push(...puces([
        "Exactement **un chef de mission**, qui coordonne et signe le rapport final.",
        "**Au moins deux investigateurs**, qui participent à l'enquête de terrain.",
        "Des **personnes ressources** en nombre libre, pour une expertise ponctuelle."
    ]));
    c.push(p("Le **CGEA** constitue l'équipe. Les membres de l'équipe obtiennent automatiquement l'**accès au dossier**."));
    c.push(h2('10.5 Suspendre, prolonger, rendre compte'));
    c.push(p("Une enquête peut être **suspendue** puis **reprise**. Une **prolongation** du délai doit être validée par le CGEA et le CGE. Quand le rapport est prêt, l'équipe le **soumet** : il suit alors le circuit de validation. Le conseiller juridique, le CGEA et le CGE peuvent l'**approuver** ou le **rejeter**, chacun à son tour."));
    c.push(h2('10.6 Les rapports et les leçons à partager'));
    c.push(p("Le menu **Investigations > Rapport investigations** produit l'état d'avancement des enquêtes. Le menu **Leçons à partager** publie les leçons tirées des **fiches de retour d'expérience (RETEX)** des enquêtes closes, pour que l'ASCE-LC progresse d'une enquête à l'autre."));
    c.push(...(await fig('ce-08-lecons', 'Les leçons à partager', { recadrer: { haut: 0, hauteur: 420 }, largeur: 560 })));
    c.push(...astuce("À retenir pour le contrôleur d'État : **déclarer son engagement d'abord**, **cocher la check-list**, **déclarer tout incident d'objectivité**, **tracer chaque audition**."));
    c.push(...exercice('Exercice 7 : lire une enquête', "1. Avec le compte **form-ce**, ouvrez **Investigations > Toutes les enquêtes**.", "2. Ouvrez l'enquête et repérez le **circuit de validation** et l'**équipe**.", "3. Repérez les boutons **Déclarer** (incidents d'objectivité), **Planifier une audition** et **Nouvelle demande** (documents).", "4. Ouvrez le **dossier associé** depuis la colonne de droite."));

    // ============================================================ 11
    c.push(h1('11. Profil DCP'));
    c.push(p("La Direction de la Communication et de la Presse (DCP) a besoin de **chiffres** pour informer le public, mais n'a **aucun accès** au contenu des dossiers. Son espace se limite aux statistiques globales."));
    c.push(...(await fig('dcp-01-accueil', 'L\'espace de la DCP : un menu réduit aux statistiques', { recadrer: { haut: 0, hauteur: 860 }, menu: true })));
    c.push(...puces([
        "Le menu ne contient que **Statistiques**, **Mon profil** et **Se déconnecter**.",
        "La page des statistiques affiche les totaux, la répartition par statut, l'évolution mensuelle, les canaux de réception et les délais, sur la **période de votre choix** (cette année, l'année précédente, période libre).",
        "Les statistiques ne contiennent **aucune donnée personnelle**, ni nom, ni contenu de dossier.",
        "La DCP peut **exporter** les statistiques."
    ]));
    c.push(...(await fig('dcp-02-statistiques', 'La page des statistiques', { recadrer: { haut: 0, hauteur: 1700 } })));
    c.push(...attention("Les chiffres de la plateforme ne sont pas des chiffres publics : avant de les communiquer, rapprochez-les des chiffres publiés sur le portail (page « Chiffres »), qui sont arrêtés à la date de consultation."));
    c.push(...exercice('Exercice 8 : lire les statistiques', "1. Avec le compte **form-dcp**, ouvrez **Statistiques**.", "2. Passez la période à « Année précédente », puis revenez à « Cette année ».", "3. Relevez le **taux de recevabilité** et le **nombre de dossiers** de l'année."));

    // ============================================================ 12
    c.push(h1('12. Profil administrateur DDIC'));
    c.push(p("L'administrateur DDIC **gère la plateforme** : les agents et leurs rôles, le contenu du portail public, les paramètres métier (délais, jours fériés, catalogues) et le journal d'audit. Il voit tous les dossiers, mais les décisions du circuit (recevabilité, décision finale) restent au CGE et au CGEA."));
    c.push(h2('12.1 Gérer les agents'));
    c.push(...(await fig('adm-09-agents', 'La gestion des agents', { recadrer: { haut: 0, hauteur: 860 } })));
    c.push(p("Le menu **Administration > Agents** compte les agents actifs, inactifs et le total, et permet de rechercher par nom, matricule, courriel ou département. Pour chaque agent : le **crayon** modifie ses informations, l'icône **interdit** le désactive (il ne peut plus se connecter, mais son historique est conservé)."));
    c.push(h3('Créer un agent'));
    c.push(...(await fig('adm-10-agent-nouveau', 'Créer un agent', { recadrer: { haut: 0, hauteur: 1000 } })));
    c.push(...listeNumerotee([
        "Cliquez sur **Nouvel Agent**.",
        "Renseignez le **matricule** (par exemple ASCE-001), le **grade ou la fonction**, le **prénom**, le **nom** et le **courriel** (obligatoires), et le téléphone.",
        "Cochez le ou les **rôles** de l'agent dans « Gérer les permissions » : le cadre « Accès accordés » à droite résume le choix.",
        "Cliquez sur **Créer**. Un courriel invite l'agent à définir son mot de passe."
    ]));
    c.push(...attention("Le **nom d'utilisateur** de connexion est le **matricule en minuscules**. Évitez les parenthèses et les caractères spéciaux dans les noms : le service d'authentification les refuse. Les rôles cochés sont attribués directement dans le service d'authentification (Keycloak). Un rôle créé en plus dans l'écran « Rôles & Permissions » n'existe pas pour autant dans Keycloak : il faut l'y créer aussi, avec le même nom."));
    c.push(h2('12.2 Rôles et permissions'));
    c.push(...(await fig('adm-11-roles', 'Les rôles et leurs permissions', { recadrer: { haut: 0, hauteur: 900 } })));
    c.push(p("Cet écran présente chaque rôle (nom, code, description) et ses permissions principales (par exemple « Consulter les dossiers », « Créer un agent », « Changer le statut d'un dossier »). Les boutons **Modifier** et la corbeille adaptent ou retirent un rôle ; **Nouveau rôle** en ajoute. Les huit rôles livrés couvrent les profils de ce manuel."));
    c.push(h2('12.3 Le journal d\'audit'));
    c.push(...(await fig('adm-12-journal-audit', 'Le journal d\'audit', { recadrer: { haut: 0, hauteur: 1000 } })));
    c.push(p("Le journal trace **toutes les actions** : créations, enregistrements, décisions, ouvertures d'enquête, et les **connexions** (réussies ou en échec). En haut : actions du jour et de la semaine, connexions réussies, échecs de connexion, actions les plus fréquentes et agents les plus actifs. Deux onglets, **Actions métier** et **Connexions**, se filtrent par agent (nom ou matricule), type d'action et période."));
    c.push(...astuce("Utilisez le journal pour répondre à « qui a fait quoi, et quand ? » et pour repérer des échecs de connexion répétés."));
    c.push(h2('12.4 Les paramètres du portail'));
    c.push(...(await fig('adm-13-parametres-portail', 'Les paramètres du portail', { recadrer: { haut: 0, hauteur: 1250 } })));
    c.push(p("Ces paramètres pilotent le **portail public** et les messages envoyés aux déclarants :"));
    c.push(...puces([
        "**Contact** : adresse, **courriel de contact**, libellé et numéro du **numéro vert**, site web. Ces valeurs s'affichent dans le pied de page du portail et dans les mentions légales.",
        "**Identité et logos** : logos, nom du site, slogan du pied de page.",
        "**Modèles de notifications** : les textes (sujet et contenu) de tous les messages automatiques : accusé de réception, récépissé B4, demande de complément, affectation, alertes de délai, escalades, protection d'un lanceur d'alerte. Ils contiennent des champs entre crochets, par exemple [numero] ou [agentEnCharge], remplacés automatiquement."
    ]));
    c.push(p("Le bouton **Aperçu portail** montre le résultat avant diffusion ; **Enregistrer tout** applique les modifications. Un changement peut mettre jusqu'à **10 minutes** à apparaître sur le portail (mise en cache)."));
    c.push(...attention("Le courriel de contact et l'adresse saisis ici **remplacent** les valeurs par défaut du portail. Vérifiez-les : ce sont ceux que le public verra."));
    c.push(h2('12.5 Les paramètres métier'));
    c.push(...(await fig('adm-20-parametres-metier', 'Les paramètres métier : les délais', { recadrer: { haut: 0, hauteur: 1100 } })));
    c.push(p("Cinq onglets : **Délais**, **Jours fériés**, **Indices de fraude**, **Types d'infraction** et **Check-list dossier**. L'onglet Délais fixe, par exemple :"));
    c.push(tableau(['Délai', 'Valeur affichée'], [
        ['Accusé de réception du dossier', '7 jours ouvrables'],
        ['Réponse à une demande de complément d\'information', '14 jours ouvrables'],
        ['Durée par défaut d\'une investigation', '90 jours ouvrables'],
        ['Approbation du CGE', '20 jours ouvrables'],
        ['Validation du plan d\'investigation (après mandat)', '8 jours ouvrables'],
        ['Revue du rapport par le conseiller juridique', '10 jours ouvrables'],
        ['Approbation du rapport par le CGEA', '10 jours ouvrables'],
        ['Délai de grâce avant escalade automatique vers CGEA / CGE', '3 jours calendaires'],
        ['Analyse du dossier par le CGEA et transmission au conseiller juridique', '3 jours ouvrables'],
        ['Convocation du comité après l\'avis juridique', '3 jours ouvrables'],
        ['Quitus du CGE après la séance du comité', '15 jours ouvrables'],
        ['Imputation du dossier retenu par le CGE', '3 jours ouvrables'],
        ['Affectation du dossier par le CGEA', '3 jours ouvrables']
    ], [6900, 2738]));
    c.push(apresTableau());
    c.push(p("Le crayon à droite de chaque ligne modifie la valeur. Les délais « ouvrables » excluent les **week-ends** et les **jours fériés** de l'onglet Jours fériés : tenez cette liste à jour chaque année."));
    c.push(h2('12.6 La file des notifications'));
    c.push(...(await fig('adm-21-file-notifications', 'La file d\'attente des notifications', { recadrer: { haut: 0, hauteur: 560 } })));
    c.push(p("Le menu **Administration > File des notifications** liste les messages **en attente d'envoi** : type, canal (portail ou courriel), sujet, dossier concerné et date d'envoi prévue. Les icônes permettent d'**envoyer maintenant** ou d'**annuler** un message."));
    c.push(h2('12.7 Mon profil'));
    c.push(...(await fig('adm-14-profil', 'La page « Mon profil »', { recadrer: { haut: 0, hauteur: 1010 } })));
    c.push(p("Chaque utilisateur retrouve ici ses informations (modifiables), le bouton **Changer** son mot de passe et la liste de ses **rôles** et accès."));
    c.push(...exercice('Exercice 9 : administrer', "1. Avec le compte **admin.formation**, ouvrez **Administration > Agents** et repérez les huit agents de formation.", "2. Ouvrez **Nouvel Agent** et observez la liste des rôles, **sans créer** d'agent.", "3. Ouvrez le **Journal d'audit** et retrouvez l'enregistrement d'un dossier dans l'onglet Actions métier.", "4. Ouvrez **Paramètres du portail** et repérez le courriel de contact et le numéro vert."));

    // ============================================================ ANNEXES
    c.push(h1('Annexe A. Qui peut faire quoi'));
    c.push(p("Ce tableau résume les actions du circuit principal et les rôles qui les exécutent. « Voit tout » : l'accès à tous les dossiers sans habilitation."));
    c.push(tableau(['Action', 'Rôle(s)'], [
        ['Voir tous les dossiers', 'CGE, CGEA, administrateur'],
        ['Créer / saisir un dossier', 'Agent du BRPD'],
        ['Enregistrer un dossier « Soumis »', 'Agent du BRPD'],
        ['Démarrer l\'étude, créer l\'étude d\'opportunité', 'Conseiller juridique'],
        ['Demander un complément ; marquer « Complément reçu »', 'Conseiller juridique ; Complément reçu : aussi l\'agent du BRPD'],
        ['Soumettre au CTADP', 'Conseiller juridique, CGEA'],
        ['Créer une séance, y ajouter un dossier, la tenir', 'CGEA, administrateur'],
        ['Déclarer recevable / irrecevable', 'CGE'],
        ['Fixer la priorité, marquer confidentiel, gérer les habilitations', 'CGE, CGEA, administrateur'],
        ['Ouvrir une enquête, constituer l\'équipe', 'CGEA, administrateur'],
        ['Conduire l\'enquête, rédiger le rapport', 'Contrôleur d\'État (membre de l\'équipe)'],
        ['Transférer, clôturer', 'CGE, CGEA'],
        ['Décision finale d\'enquête', 'CGE'],
        ['Créer un agent, modifier ses rôles, le désactiver', 'Administrateur, CGE'],
        ['Rôles, journal d\'audit, paramètres, file des notifications', 'Administrateur (certains écrans aussi au CGEA)'],
        ['Statistiques globales', 'Tous les rôles, dont la DCP (seul accès de la DCP)']
    ], [5200, 4438]));
    c.push(apresTableau());

    c.push(h1('Annexe B. Les statuts d\'un dossier'));
    c.push(tableau(['Statut', 'Signification'], [
        ['Soumis', 'Déposé, pas encore enregistré : en attente de numéro officiel'],
        ['Reçu', 'Enregistré : numéro attribué et code de suivi (B4) remis'],
        ['En étude d\'opportunité', 'Le conseiller juridique étudie les suites à donner'],
        ['En attente de complément', 'Des informations ont été demandées au déclarant'],
        ['En revue CTADP', 'Soumis au comité de traitement'],
        ['Recevable', 'Déclaré recevable par le CGE : une enquête peut être ouverte'],
        ['Irrecevable', 'Déclaré irrecevable : réponse motivée puis clôture'],
        ['En investigation', 'Enquête en cours'],
        ['Rapport produit', 'Le rapport d\'enquête est rédigé et entre dans le circuit de validation'],
        ['Décision rendue', 'Décision finale du CGE enregistrée'],
        ['Clôturé / Classé sans suite', 'Dossier terminé'],
        ['Transféré', 'Transmis à une autre institution compétente']
    ], [3000, 6638]));
    c.push(apresTableau());

    c.push(h1('Annexe C. Glossaire'));
    c.push(tableau(['Terme', 'Définition'], [
        ['ASCE-LC', 'Autorité Supérieure de Contrôle d\'État et de Lutte contre la Corruption'],
        ['BRPD', 'Bureau de Réception des Plaintes et des Dénonciations'],
        ['DEI', "Département d'Enquête et d'Investigation : il fait l'analyse finale de fond et de forme des rapports d'enquête (15 jours ouvrables)"],
        ['B4 (code de suivi)', 'Code de 8 caractères remis au déclarant pour suivre son dossier'],
        ['CGE / CGEA', 'Contrôleur Général d\'État / Contrôleur Général d\'État Adjoint'],
        ['CTADP', 'Comité de Traitement et d\'Analyse des Dénonciations et des Plaintes'],
        ['DCP', 'Direction de la Communication et de la Presse'],
        ['DDIC', 'Direction chargée de l\'administration de la plateforme (rôle administrateur)'],
        ['Dénonciation', 'Information donnée par une personne extérieure aux faits, identifiée ou anonyme'],
        ['Plainte', 'Signalement d\'une victime ou de son représentant, identifiée, qui demande réparation'],
        ['Habilitation', 'Autorisation nominative d\'accéder à un dossier'],
        ['Étude d\'opportunité', 'Fiche d\'analyse du conseiller juridique avant le passage au comité'],
        ['Investigation', 'Enquête menée sur un dossier déclaré recevable'],
        ['Quitus', 'Document du CGE établi après la décision, à partir de la décision enregistrée'],
        ['RETEX', 'Fiche de retour d\'expérience d\'une enquête close'],
        ['Jours ouvrables', 'Jours hors week-end et hors jours fériés du calendrier de la plateforme']
    ], [2800, 6838]));
    c.push(apresTableau());

    c.push(h1('Annexe D. En cas de difficulté'));
    c.push(tableau(['Ce que vous voyez', 'Que faire'], [
        ['« Accès refusé : ce dossier ne vous est pas assigné »', 'Vous n\'êtes pas habilité sur ce dossier. Demandez au CGEA ou au CGE de vous y affecter.'],
        ['« Conflit de version détecté »', 'Un collègue a modifié le dossier en même temps. Cliquez sur « Fermer et réessayer », puis refaites votre action.'],
        ['« Impossible de soumettre au CTADP sans étude d\'opportunité »', 'Créez d\'abord l\'étude d\'opportunité dans l\'onglet Analyse.'],
        ['L\'agent ne peut pas être ajouté à l\'équipe d\'enquête', 'Il doit d\'abord déclarer l\'absence de conflit d\'intérêts et signer l\'engagement de confidentialité.'],
        ['Le code à usage unique est refusé', 'Vérifiez l\'heure de votre téléphone. Si vous n\'avez plus l\'application d\'authentification, demandez à l\'administrateur de réinitialiser votre double authentification.'],
        ['Un bouton attendu n\'apparaît pas', 'Les boutons dépendent du statut du dossier et de votre rôle. Vérifiez le statut et le workflow à droite de la fiche.'],
        ['Une modification du portail n\'apparaît pas', 'Attendez jusqu\'à 10 minutes (mise en cache), puis rechargez la page avec Ctrl + F5.'],
        ['Le déclarant a perdu son code de suivi', 'Il appelle le numéro vert. Ne communiquez jamais un code sans avoir vérifié l\'identité de la personne.']
    ], [3900, 5738]));
    c.push(apresTableau());

    c.push(h1('Annexe E. Points à confirmer avant diffusion'));
    c.push(p("Ces points ont été relevés pendant la rédaction du manuel. Ils doivent être confirmés avec l'ASCE-LC et, si nécessaire, corrigés dans la plateforme avant la formation."));
    c.push(tableau(['#', 'Point', 'Pourquoi'], [
        ['1', 'Accès du BRPD aux dépôts en ligne « Soumis »', 'Corrigé dans la plateforme (correctif du back, PR n° 6) : le BRPD voit et ouvre les dépôts « Soumis ». À vérifier en production après le déploiement, avec un vrai compte BRPD.'],
        ['2', 'Boutons visibles et droits réels', 'Corrigé dans le front (PR n° 6) : le CGEA ne voit plus les boutons que le serveur lui refuse. À vérifier après le déploiement du front.'],
        ['3', 'Check-list du dossier de travail', "Les 22 libellés du manuel des procédures sont repris dans la plateforme (migration 025 du back). À vérifier après le déploiement du back : ouvrir la check-list d'une investigation."],
        ['4', 'Abréviation « DEI »', "Vérifié dans le manuel des procédures : DEI = Département d'Enquête et d'Investigation (intitulé repris dans le glossaire). Rien à confirmer."],
        ['5', 'Délais', "Conformes au manuel des procédures, sauf deux écarts à confirmer : l'approbation du rapport par le CGEA (10 jours dans la plateforme, 20 jours pour le CGE et le CGEA ensemble dans le manuel) et la réponse à une demande de complément (14 jours dans la plateforme, 7 jours évoqués dans le manuel)."],
        ['6', 'Comptes de formation', 'Créer les huit comptes dans un environnement distinct de la production, avec des mots de passe propres à la formation.']
    ], [500, 3000, 6138]));
    c.push(apresTableau());
    return c;
}
