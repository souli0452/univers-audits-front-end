// Chapitres 1 à 4 : mode d'emploi, présentation, connexion, portail citoyen.
import { p, h1, h2, h3, puces, listeNumerotee, astuce, attention, exercice, aConfirmer, fig, tableau, apresTableau } from './lib-docx.mjs';

export async function chapitres1() {
    const c = [];

    // ============================================================ 1
    c.push(h1('1. Comment utiliser ce manuel'));
    c.push(h2('1.1 À qui s\'adresse-t-il ?'));
    c.push(p("Ce manuel forme les agents de l'ASCE-LC à **INTÉGRITÉ+**, la plateforme de réception et de traitement des dénonciations et des plaintes, et présente le **portail citoyen** par lequel le public dépose et suit un signalement. Il suit le parcours réel d'un dossier, écran par écran, avec les captures de la plateforme."));
    c.push(p("Chaque profil dispose de son propre chapitre. Vous pouvez lire le manuel dans l'ordre, ou aller directement au chapitre de votre rôle après avoir lu les chapitres 2 et 3, communs à tous."));

    c.push(h2('1.2 Les profils'));
    c.push(tableau(['Profil', 'Ce que fait la personne', 'Chapitre'], [
        ['Citoyen', 'Dépose une plainte ou une dénonciation, écrite ou vocale, et suit son dossier avec un code', '4'],
        ['Agent du BRPD', 'Reçoit et enregistre les dossiers, saisit ceux qui arrivent par d\'autres canaux', '5'],
        ['Conseiller juridique', 'Étudie l\'opportunité de donner suite, demande un complément, saisit le comité', '6'],
        ['CGEA (adjoint du CGE)', 'Affecte les dossiers, organise les séances du comité, ouvre les enquêtes, suit les retards', '7'],
        ['CGE (Contrôleur Général d\'État)', 'Décide de la recevabilité, fixe la priorité, protège les dossiers sensibles', '8'],
        ['Membre du comité (CTADP)', 'Examine les dossiers en séance et formule ses recommandations', '9'],
        ['Contrôleur d\'État', 'Conduit l\'enquête sur un dossier recevable et rédige le rapport', '10'],
        ['DCP', 'Consulte les statistiques globales, sans accès aux dossiers', '11'],
        ['Administrateur DDIC', 'Gère les agents, les rôles, le portail et les paramètres métier', '12']
    ], [2500, 5900, 1238]));
    c.push(apresTableau());

    c.push(h2('1.3 Les comptes de formation'));
    c.push(p("Pour s'exercer sans risque, créez un compte par profil dans un environnement de formation, avec des dossiers fictifs. Les exercices de ce manuel supposent les comptes suivants (le mot de passe est choisi par le formateur et communiqué aux stagiaires, jamais écrit dans ce document)."));
    c.push(tableau(['Compte', 'Rôle de la plateforme', 'Profil'], [
        ['form-brpd', 'AGENT_BRPD', 'Agent du BRPD'],
        ['form-cj', 'CONSEILLER_JURIDIQUE', 'Conseiller juridique'],
        ['form-cgea', 'CGEA', 'CGEA'],
        ['form-cge', 'CGE', 'CGE'],
        ['form-ctadp', 'MEMBRE_CTADP', 'Membre du comité'],
        ['form-ce', 'CONTROLEUR_ETAT', 'Contrôleur d\'État'],
        ['form-dcp', 'DCP', 'DCP'],
        ['admin.formation', 'ADMIN_DDIC', 'Administrateur DDIC']
    ], [2800, 3700, 3138]));
    c.push(apresTableau());
    c.push(...attention("N'utilisez **jamais** de vrais dossiers pour vous exercer. Les captures de ce manuel viennent d'un environnement de test : tous les dossiers qui y figurent, repérables au préfixe « [FORMATION] », sont fictifs."));

    c.push(h2('1.4 Les encadrés'));
    c.push(...astuce("Un encadré vert résume ce qu'il faut retenir d'une section."));
    c.push(...attention("Un encadré orangé signale un risque d'erreur ou une règle à ne pas oublier."));
    c.push(...exercice('Exercice', "Un encadré bleu propose un exercice à faire sur le compte de formation de votre profil."));

    // ============================================================ 2
    c.push(h1('2. Présentation de la plateforme'));
    c.push(h2('2.1 Deux espaces'));
    c.push(p("La plateforme comprend deux espaces, qui partagent les mêmes dossiers :"));
    c.push(...puces([
        "**Le portail citoyen** : ouvert à tous, sans compte. On y trouve l'accueil, la foire aux questions, les chiffres publics, le dépôt d'un signalement (écrit ou vocal) et le suivi par code.",
        "**INTÉGRITÉ+** : l'espace de travail des agents, accessible après connexion. Le menu affiché dépend du rôle de chacun."
    ]));
    c.push(h2('2.2 Le circuit de traitement d\'un dossier'));
    c.push(p("Un dossier avance d'étape en étape. À chaque étape, un rôle précis a la main : les autres consultent, ou n'ont pas accès au dossier. Le tableau suivant donne le circuit principal."));
    c.push(tableau(['Statut du dossier', 'Qui agit', 'Action'], [
        ['**Soumis**', 'Agent du BRPD', 'Enregistrer : le dossier reçoit son numéro officiel et le déclarant son code de suivi (B4)'],
        ['**Reçu**', 'CGE, CGEA, conseiller juridique', 'Décision d\'affectation (CGE), affectation (CGEA), puis « Démarrer étude »'],
        ['**En étude d\'opportunité**', 'Conseiller juridique', 'Remplir l\'étude d\'opportunité, puis « Soumettre au CTADP » ou « Demander complément »'],
        ['**En attente de complément**', 'Déclarant, puis BRPD / conseiller juridique', 'Le déclarant répond ; l\'agent marque « Complément reçu » et l\'étude reprend'],
        ['**En revue CTADP**', 'CGEA, comité, CGE', 'Séance du comité ; le CGE (ou le CGEA) déclare le dossier **recevable** ou **irrecevable**'],
        ['**Recevable**', 'CGEA', 'Ouvrir l\'enquête (investigation)'],
        ['**En investigation**', 'Contrôleur d\'État, CGEA', 'Enquête, rapport, circuit de validation'],
        ['**Rapport produit**, **Décision rendue**', 'CGE, CGEA', 'Décision finale, quitus, transmission aux autorités'],
        ['**Clôturé**, **Classé sans suite**, **Transféré**', 'CGE, CGEA', 'Clôturer, ou transférer à l\'institution compétente'],
        ['**Irrecevable**', 'CGE, CGEA', 'Clôturer après envoi de la réponse motivée']
    ], [2600, 2700, 4338]));
    c.push(apresTableau());
    c.push(h2('2.3 Les règles à connaître'));
    c.push(h3('Le code de suivi'));
    c.push(p("Chaque dépôt reçoit un **code de suivi de 8 caractères** (le « B4 »). Il est remis au déclarant à la fin du dépôt, et c'est sa seule clé pour suivre son dossier ou répondre à une demande de complément. Un agent le voit sur la fiche du dossier, dans l'encadré vert « Code de suivi citoyen »."));
    c.push(h3('Dénonciation, plainte et anonymat'));
    c.push(p("La **nature** d'un dossier est calculée par la plateforme, jamais choisie à la main :"));
    c.push(...puces([
        "une **plainte** émane d'une victime (ou de son représentant) **identifiée** ;",
        "une **dénonciation** émane d'un témoin, identifié ou anonyme ;",
        "une victime qui souhaite rester **anonyme** n'est pas refusée : son signalement est enregistré comme **dénonciation**."
    ]));
    c.push(h3('L\'accès aux dossiers : les habilitations'));
    c.push(p("Le **CGE**, le **CGEA** et l'**administrateur** voient tous les dossiers. Les autres agents ne voient que les dossiers sur lesquels ils ont une **habilitation** : par exemple l'agent en charge, ou un membre de l'équipe d'enquête. Un agent qui tente d'ouvrir un autre dossier lit le message « Accès refusé : ce dossier ne vous est pas assigné »."));
    c.push(h3('La confidentialité'));
    c.push(p("Un dossier peut être marqué **confidentiel** : son contenu est alors masqué aux agents non habilités et seuls le CGE, le CGEA et l'administrateur peuvent lever cette protection. Un dossier dont le déclarant demande la protection d'un lanceur d'alerte est marqué confidentiel dès le dépôt."));
    c.push(h3('Les délais et les alertes'));
    c.push(p("Chaque étape a un **délai** (par exemple, 7 jours ouvrables pour l'accusé de réception). La fiche du dossier affiche le délai de chaque étape (« Dans le délai », « En retard ») et le CGEA et le CGE reçoivent une alerte quand une échéance est dépassée. Les délais se règlent dans les « Paramètres métier » (chapitre 12)."));
    c.push(h3('La traçabilité'));
    c.push(p("Toute action (création, enregistrement, décision, connexion) est inscrite au **journal d'audit** avec son auteur, sa date et son adresse. Il n'existe pas d'action « sans trace »."));
    c.push(h3('Les conflits de version'));
    c.push(p("Si deux agents modifient le même dossier au même moment, la plateforme affiche « Conflit de version détecté ». Cliquez sur **Fermer et réessayer** : la fiche se recharge avec la dernière version, puis refaites votre action."));

    // ============================================================ 3
    c.push(h1('3. Se connecter et se repérer'));
    c.push(h2('3.1 La connexion'));
    c.push(p("Ouvrez l'adresse de la plateforme, puis choisissez l'espace des agents. Vous arrivez sur la page de connexion."));
    c.push(...(await fig('con-01-page-connexion', 'La page de connexion (l\'aspect peut varier légèrement selon l\'installation)', { largeur: 520 })));
    c.push(...listeNumerotee([
        "Saisissez votre **nom d'utilisateur ou courriel** et votre **mot de passe**, puis validez.",
        "Si la double authentification est activée sur votre compte, la plateforme demande un **code à usage unique** : c'est le code à 6 chiffres affiché par l'application d'authentification de votre téléphone. Il change toutes les 30 secondes.",
        "Après la connexion, le **tableau de bord** s'affiche."
    ]));
    c.push(...attention("Ne communiquez jamais votre mot de passe ni vos codes à usage unique, même à un collègue ou à l'assistance. Si vous avez perdu l'accès à votre application d'authentification, demandez à l'administrateur de réinitialiser votre double authentification."));
    c.push(h2('3.2 L\'écran de travail'));
    c.push(...(await fig('adm-01-tableau-de-bord', 'Le tableau de bord de l\'administrateur', { recadrer: { haut: 0, hauteur: 860 }, menu: true })));
    c.push(...puces([
        "**La barre du haut** : le bouton ☰ (réduire ou ouvrir le menu), le logo INTÉGRITÉ+, le choix du thème clair ou sombre, la personnalisation des couleurs, la cloche des **notifications** et le menu du **profil**.",
        "**Le menu de gauche**, organisé en sections : Navigation, Dossiers, Bureau des plaintes, Investigations, Administration, Compte. Il n'affiche que ce que votre rôle permet.",
        "**La zone centrale** : le contenu de la page, avec ses indicateurs, ses filtres et ses tableaux."
    ]));
    c.push(h2('3.3 Le tableau de bord'));
    c.push(p("Il donne en un coup d'œil l'état du travail :"));
    c.push(...puces([
        "**Total dossiers** de l'année, **En investigation** (enquêtes actives), **Taux de recevabilité** (dossiers recevables parmi ceux examinés) et **Alertes délais** (dépassements) ;",
        "la **répartition des dossiers par statut**, en barre puis en anneau ;",
        "les **canaux de réception** (web, audio, courrier, téléphone, guichet, courriel, numéro vert) ;",
        "les boutons **Nouveau dossier** et **Suivi citoyen** pour aller plus vite."
    ]));
    c.push(h2('3.4 Votre profil, vos notifications, la déconnexion'));
    c.push(...puces([
        "**Mon profil** (menu Compte) : vos informations et le changement de mot de passe.",
        "**La cloche** : les notifications qui vous concernent (nouveau dossier à traiter, délai à surveiller, dossier affecté). Un clic ouvre le dossier concerné.",
        "**Se déconnecter** (menu Compte) : à utiliser à chaque fin de session, surtout sur un poste partagé."
    ]));

    // ============================================================ 4
    c.push(h1('4. Profil citoyen : le portail public'));
    c.push(p("Le portail citoyen est l'espace par lequel toute personne peut signaler des faits de corruption à l'ASCE-LC, sans compte. Les agents doivent bien le connaître : ils reçoivent les dossiers qu'il produit et répondent aux questions du public."));
    c.push(h2('4.1 L\'accueil'));
    c.push(...(await fig('por-01-accueil-haut', 'L\'accueil du portail', { largeur: 560 })));
    c.push(...puces([
        "**Faire un signalement** : le bouton rouge ouvre le choix entre le **formulaire écrit** et le **témoignage vocal**.",
        "**Suivre mon dossier** : on saisit le code de suivi pour connaître l'état d'avancement.",
        "**Le numéro vert** (80 00 11 02), cliquable, et les boutons **A−** et **A+** qui réduisent ou agrandissent le texte (le choix est mémorisé).",
        "Sous le bandeau vert, on trouve les chiffres publics, des repères « Avant de signaler », le témoignage vocal, le fonctionnement en quatre étapes, les garanties et les canaux de contact."
    ]));
    c.push(...(await fig('por-02-accueil-chiffres', 'La section « En chiffres » de l\'accueil', { largeur: 560 })));
    c.push(p("Ces chiffres sont des **totaux anonymes** : aucune donnée personnelle n'y figure. Le **taux de traitement** n'est publié qu'à partir de 20 dossiers reçus ; en dessous, la tuile affiche le nombre de nouveaux dossiers, pour ne pas donner une image trompeuse d'un service qui démarre."));
    c.push(...(await fig('por-03-accueil-avant-de-signaler', 'Les repères « Avant de signaler »', { largeur: 560 })));

    c.push(h2('4.2 Déposer un signalement écrit'));
    c.push(p("Le formulaire comporte **trois étapes** : les faits, les coordonnées, la confirmation."));
    c.push(h3('Étape 1 : les faits'));
    c.push(...(await fig('por-14-depot-etape1-rempli', 'Étape 1 du dépôt : décrire les faits', { recadrer: { haut: 340, hauteur: 1400 }, largeur: 520 })));
    c.push(...puces([
        "**Type de signalement** : « Plainte » (je demande réparation pour un préjudice subi) ou « Dénonciation » (je signale des faits en tant que témoin).",
        "**Résumé** et **description détaillée** (obligatoires) : qui, quoi, où, quand.",
        "**Lieu**, **période** et **montant estimé** (facultatifs).",
        "**Témoignage audio** et **pièces jointes** (facultatifs) : jusqu'à **5 fichiers de 25 Mo**, aux formats PDF, DOC, DOCX, JPG, JPEG, PNG, MP3, MP4, AVI ou MOV."
    ]));
    c.push(...astuce("Un soupçon raisonnable suffit : le déclarant n'a pas à prouver les faits. Même incomplet, un signalement doit être déposé."));
    c.push(h3('Étape 2 : les coordonnées'));
    c.push(...(await fig('por-15-depot-etape2-identite', 'Étape 2 du dépôt : choisir de s\'identifier ou non', { recadrer: { haut: 340, hauteur: 1000 }, largeur: 520 })));
    c.push(p("Le déclarant choisit :"));
    c.push(...puces([
        "**Je fournis mes coordonnées** (recommandé) : un agent pourra lui poser des questions et l'informer de la suite ;",
        "**Je reste anonyme** : la plateforme ne retient aucune identité. Le signalement est alors traité comme une **dénonciation**, et le déclarant suit son dossier uniquement avec son code."
    ]));
    c.push(...attention("Si une victime choisit l'anonymat, la plateforme l'en informe par un message : « Sans identité, votre signalement est traité comme une dénonciation. Pour déposer une plainte, indiquez vos coordonnées. »"));
    c.push(h3('Étape 3 : la confirmation'));
    c.push(...(await fig('por-17-depot-etape3-confirmation', 'Étape 3 du dépôt : relire et soumettre', { recadrer: { haut: 90, hauteur: 780 }, largeur: 520 })));
    c.push(p("Le déclarant relit le récapitulatif, puis clique sur **Soumettre mon signalement**."));
    c.push(h3('Le code de suivi'));
    c.push(...(await fig('por-18-depot-code-suivi', 'Le code de suivi remis à la fin du dépôt', { largeur: 520 })));
    c.push(...attention("Le code de suivi n'est affiché **qu'à ce moment-là**. Il faut le noter ou le photographier. Sans lui, le déclarant ne peut ni suivre son dossier ni répondre à une demande de complément. En cas de perte, il doit appeler le numéro vert."));

    c.push(h2('4.3 Le témoignage vocal'));
    c.push(p("Pour les personnes qui préfèrent parler plutôt qu'écrire, le portail propose un enregistrement vocal, dans la langue de son choix (mooré, dioula, fulfuldé, etc.), depuis un téléphone. Les agents du BRPD reçoivent ces dépôts avec une alerte « dénonciation audio à traiter »."));
    c.push(...(await fig('por-21-vocal', 'La page du témoignage vocal', { recadrer: { haut: 0, hauteur: 900 }, largeur: 520 })));

    c.push(h2('4.4 Suivre son dossier'));
    c.push(...(await fig('por-19-suivi-recherche', 'Le suivi par code', { largeur: 480 })));
    c.push(p("Le déclarant saisit son code et clique sur **Rechercher**. Il voit l'étape actuelle de son dossier."));
    c.push(...(await fig('por-20-suivi-resultat', 'Le suivi d\'un dossier déposé', { recadrer: { haut: 50, hauteur: 700 }, largeur: 480 })));
    c.push(...puces([
        "**Dossier déposé** : le signalement est reçu. Il sera enregistré sous 7 jours ouvrables.",
        "Les étapes suivantes s'affichent au fur et à mesure (enregistrement, étude, comité, enquête, décision).",
        "**Mon récépissé** : télécharge le récépissé de dépôt.",
        "Si l'agent demande un **complément d'information**, le déclarant reçoit un lien pour y répondre depuis le portail, avec des fichiers si besoin, sans créer de compte."
    ]));

    c.push(h2('4.5 La foire aux questions, les chiffres et les pages d\'information'));
    c.push(...(await fig('por-09-faq', 'La foire aux questions', { recadrer: { haut: 0, hauteur: 760 }, largeur: 520 })));
    c.push(p("La FAQ répond aux craintes les plus fréquentes : faut-il des preuves, que peut-on signaler, quelle différence entre plainte et dénonciation, mon identité sera-t-elle révélée, puis-je rester anonyme, que se passe-t-il ensuite, que faire si j'ai perdu mon code. Les pages **Chiffres**, **Nos missions**, **Textes juridiques**, **Confidentialité**, **Conditions d'utilisation** et **Mentions légales** complètent l'information du public."));
    c.push(...(await fig('por-10-chiffres', 'La page des chiffres publics', { recadrer: { haut: 0, hauteur: 1000 }, largeur: 560 })));

    c.push(h2('4.6 Ce que les agents doivent répondre au public'));
    c.push(...puces([
        "**« Dois-je avoir des preuves ? »** Non : un soupçon raisonnable suffit.",
        "**« Puis-je rester anonyme ? »** Oui. Sans identité, le signalement est traité comme une dénonciation et ne peut être suivi qu'avec le code.",
        "**« J'ai perdu mon code. »** Le code est la seule clé d'accès : l'agent oriente la personne et ne le communique jamais sans vérification.",
        "**« Combien de temps cela prendra-t-il ? »** L'accusé de réception est envoyé sous 7 jours ouvrables ; la durée de l'enquête dépend des faits."
    ]));
    c.push(...exercice('Exercice 1 : déposer et suivre', "1. Ouvrez le portail et déposez une **dénonciation** fictive : résumé et description de votre choix, lieu « Ouagadougou ».", "2. À l'étape 2, choisissez **Je reste anonyme** et lisez le message.", "3. Notez le **code de suivi**, puis allez dans **Suivre mon dossier** et retrouvez votre dossier.", "4. Ouvrez la **foire aux questions** et trouvez la réponse à : « Puis-je rester anonyme ? »"));
    return c;
}
