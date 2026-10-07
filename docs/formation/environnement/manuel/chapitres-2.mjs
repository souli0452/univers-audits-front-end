// Chapitres 5 à 8 : agent du BRPD, conseiller juridique, CGEA, CGE.
import { p, h1, h2, h3, puces, listeNumerotee, astuce, attention, exercice, aConfirmer, fig, tableau, apresTableau } from './lib-docx.mjs';

export async function chapitres2() {
    const c = [];

    // ============================================================ 5
    c.push(h1('5. Profil agent du BRPD'));
    c.push(p("L'agent du Bureau de Réception des Plaintes et des Dénonciations (BRPD) est la porte d'entrée des dossiers. Il **enregistre** les dépôts faits sur le portail, **saisit** ceux qui arrivent par le guichet, le téléphone, le courrier ou le courriel, et remet au déclarant son numéro et son code de suivi."));
    c.push(h2('5.1 Vos dossiers'));
    c.push(...(await fig('brpd-02-liste-dossiers', 'La liste des dossiers', { recadrer: { haut: 0, hauteur: 740 } })));
    c.push(...puces([
        "En haut, quatre compteurs : **Nouveaux**, **En cours**, **Traités**, **Critiques**.",
        "La barre de recherche accepte un numéro, un mot de l'objet ou un nom de déclarant.",
        "Les filtres **Statut**, **Type**, **Canal**, **Priorité** et **Déclarant** réduisent la liste ; le bouton ↻ les remet à zéro.",
        "Chaque ligne indique la priorité, le numéro officiel, l'objet, le type (plainte ou dénonciation), le statut, le canal et la date. L'icône 👁 ouvre la fiche."
    ]));
    c.push(...attention("Hormis les dépôts **Soumis** du portail, vous ne voyez dans la liste que les dossiers sur lesquels vous êtes **habilité** (par exemple ceux que vous avez enregistrés). C'est normal : l'accès est nominatif."));

    c.push(h2('5.2 Saisir un dossier reçu par un autre canal'));
    c.push(p("Quand une personne se présente au guichet, appelle le numéro vert ou envoie un courrier ou un courriel, l'agent saisit lui-même le dossier : menu **Dossiers > Nouveau dossier**."));
    c.push(...(await fig('brpd-07-nouveau-dossier-vide', 'Nouveau dossier : étape 1, le dossier', { recadrer: { haut: 0, hauteur: 880 } })));
    c.push(...listeNumerotee([
        "**Type de saisine** : Plainte ou Dénonciation. **Canal de réception** : Guichet BRPD, téléphone, courrier, courriel, numéro vert…",
        "Renseignez l'**objet** (en quelques mots) et la **description détaillée** des faits, puis, si vous les connaissez, le **lieu**, la **période** et le **montant estimé du préjudice**.",
        "Pour un courrier reçu, renseignez le **numéro d'enregistrement du courrier** quand le champ est proposé : il renvoie à l'application courrier.",
        "Cochez **Marquer ce dossier comme confidentiel** si le déclarant demande une protection.",
        "Cliquez sur **Suivant** pour passer aux informations du déclarant."
    ]));
    c.push(...(await fig('brpd-09-nouveau-dossier-declarant', 'Nouveau dossier : étape 2, le déclarant', { recadrer: { haut: 0, hauteur: 900 } })));
    c.push(p("À droite, le cadre **Après soumission** rappelle ce que la plateforme fait pour vous : génération du code d'accès B4, envoi d'un message au déclarant, attribution du numéro officiel, remise du récépissé et délai de traitement de 7 jours."));
    c.push(...astuce("Demandez toujours au déclarant s'il accepte d'être identifié, et expliquez-lui la différence : sans identité, son signalement sera traité comme une **dénonciation** et il ne sera pas contacté."));

    c.push(h2('5.3 Enregistrer un dépôt en ligne'));
    c.push(p("Un dépôt fait sur le portail arrive au statut **Soumis**. Pour l'enregistrer :"));
    c.push(...(await fig('brpd-04-dossier-soumis', 'La fiche d\'un dossier « Soumis » : le bouton Enregistrer', { recadrer: { haut: 0, hauteur: 860 } })));
    c.push(...listeNumerotee([
        "Ouvrez la fiche du dossier **Soumis**. En haut, la mention « En attente de numéro » indique qu'il n'est pas encore enregistré.",
        "Cliquez sur **Enregistrer** (bouton vert).",
        "Dans la fenêtre, vous pouvez ajouter un **motif ou une observation** (facultatif), puis cliquez sur **Enregistrer le dossier**.",
        "Le dossier passe au statut **Reçu**, reçoit son **numéro officiel** (par exemple ASCE-2026-000002) et le workflow affiche « Reçu : B4 remis »."
    ]));
    c.push(...(await fig('brpd-05-enregistrer-dialogue', 'La fenêtre d\'enregistrement', { recadrer: { haut: 0, hauteur: 860 } })));
    c.push(p("Une fois enregistré, vous disposez des boutons **Accusé de réception** (document destiné au déclarant, à envoyer sous **7 jours ouvrables**) et **Récépissé** (document remis au déclarant), ainsi que **PDF** et **Export officiel** pour imprimer le dossier."));
    c.push(...astuce("Les dépôts du portail (statut **Soumis**) sont visibles de **tous les agents du BRPD** sans habilitation, pour pouvoir être enregistrés. Dès l'enregistrement, l'accès redevient nominatif : seul l'agent qui l'a enregistré (et les agents habilités ensuite) le voit."));

    c.push(h2('5.4 Lire la fiche d\'un dossier'));
    c.push(p("La fiche d'un dossier est l'écran principal de tous les agents. Elle se lit de haut en bas."));
    c.push(...(await fig('adm-23-dossier-recevable', 'La fiche d\'un dossier en investigation', { recadrer: { haut: 0, hauteur: 1260 } })));
    c.push(...puces([
        "**L'en-tête** : le numéro, le statut, la version de la fiche (v5) et, en dessous, l'objet. Les boutons de droite changent selon le statut et votre rôle.",
        "**Les boutons d'export** : PDF, Export officiel, Récépissé, Accusé de réception, Quitus du CGE. **Marquer confidentiel** et **Priorité** (Normal ou Urgent) sont réservés à la direction.",
        "**Délais du circuit de traitement** : chaque étape avec son responsable, son échéance et son état (« Dans le délai » ou « En retard »).",
        "**Informations générales** : type, canal, dates de création et de réception, montant estimé, description, déclarant (ou « Déclarant anonyme »).",
        "**Les onglets** : Parties visées, Témoins, Observations, Pièces jointes, Affectation, Analyse.",
        "**La colonne de droite** : le **code de suivi citoyen**, le panneau **Investigation**, le **Workflow** (toutes les étapes, celles déjà franchies sont cochées) et l'**agent en charge**."
    ]));

    c.push(h2('5.5 Compléments d\'information'));
    c.push(p("Quand un agent demande un complément au déclarant (chapitre 6), le dossier passe en **En attente de complément**. Le déclarant répond depuis le portail. Dès qu'une réponse est reçue, vous pouvez cliquer sur **Complément reçu** : l'étude reprend. Le délai de réponse du déclarant est de **14 jours ouvrables**."));

    c.push(h2('5.6 Dépôt audio'));
    c.push(p("Le menu **Dossiers > Dépôt audio** sert à enregistrer le témoignage vocal d'une personne présente au guichet ou joignable par le numéro vert, avec le même circuit qu'un dépôt écrit."));
    c.push(...(await fig('brpd-10-depot-audio', 'La page de dépôt audio', { recadrer: { haut: 0, hauteur: 900 } })));

    c.push(h2('5.7 Informations préoccupantes'));
    c.push(p("Le menu **Bureau des plaintes > Informations préoccupantes** recueille les signalements reçus **hors dépôt de plainte** : article de presse, rapport d'audit, dénonciation interne, veille. Une information préoccupante n'ouvre pas de dossier par elle-même ; elle peut ensuite être rattachée à un dossier existant ou à une auto-saisine."));
    c.push(...(await fig('brpd-11-infos-preoccupantes', 'La liste des informations préoccupantes', { recadrer: { haut: 0, hauteur: 520 } })));
    c.push(...astuce("À retenir pour l'agent du BRPD : **enregistrer vite** (accusé de réception sous 7 jours ouvrables), **remettre le code de suivi**, **expliquer l'anonymat**, **marquer confidentiel** en cas de demande de protection."));
    c.push(...exercice('Exercice 2 : saisir un dossier', "1. Connectez-vous avec le compte **form-brpd**.", "2. Ouvrez **Dossiers > Nouveau dossier**, choisissez « Dénonciation » et le canal « Guichet BRPD », saisissez un objet et une description fictifs.", "3. Passez à l'étape du déclarant, choisissez l'anonymat, puis confirmez.", "4. Retrouvez votre dossier dans la liste et relevez son **numéro** et son **statut**."));

    // ============================================================ 6
    c.push(h1('6. Profil conseiller juridique'));
    c.push(p("Le conseiller juridique **étudie l'opportunité** de donner suite à un dossier : les faits relèvent-ils de la compétence de l'ASCE-LC, les preuves sont-elles suffisantes, une enquête est-elle nécessaire ? Son étude éclaire le comité (CTADP). Il peut aussi demander des informations supplémentaires au déclarant."));
    c.push(h2('6.1 Vos dossiers'));
    c.push(...(await fig('cj-02-liste-dossiers', 'La liste des dossiers du conseiller juridique', { recadrer: { haut: 0, hauteur: 700 } })));
    c.push(p("Vous voyez les dossiers qui vous ont été **affectés** (habilitation donnée par le CGE ou le CGEA). Le menu est plus court que celui d'un administrateur : vous n'avez pas la section Administration."));
    c.push(h2('6.2 Démarrer l\'étude'));
    c.push(p("Un dossier au statut **Reçu** et qui vous est affecté porte le bouton **Démarrer étude**. Un clic, une confirmation avec un motif facultatif, et le dossier passe à **En étude d'opportunité**."));
    c.push(...(await fig('cj-03-dossier-en-etude', 'La fiche d\'un dossier en étude', { recadrer: { haut: 0, hauteur: 1000 } })));
    c.push(p("Les boutons **Soumettre au CTADP** et **Demander complément** apparaissent à côté de **PDF**, **Export officiel** et **Récépissé**."));

    c.push(h2('6.3 Les onglets de la fiche'));
    c.push(...(await fig('cj-06-onglet-parties', 'L\'onglet « Parties visées »', { largeur: 560 })));
    c.push(...puces([
        "**Parties visées** : les personnes ou organismes mis en cause. Bouton **Ajouter une partie**.",
        "**Témoins** : les témoins identifiés. Bouton **Ajouter un témoin**.",
        "**Observations** : les notes internes de l'équipe, avec leur auteur et leur date. Bouton **Ajouter une observation**.",
        "**Pièces jointes** : les documents du dossier (ceux du déposant et ceux ajoutés par les agents).",
        "**Affectation** : la décision du cabinet du CGE et l'affectation par le CGEA (chapitres 7 et 8).",
        "**Analyse** : l'étude d'opportunité."
    ]));
    c.push(...(await fig('cj-08-onglet-observations', 'L\'onglet « Observations »', { largeur: 560 })));
    c.push(...(await fig('cj-13-ajouter-observation', 'Ajouter une observation', { recadrer: { haut: 0, hauteur: 700 }, largeur: 560 })));

    c.push(h2('6.4 L\'étude d\'opportunité'));
    c.push(p("L'étude se trouve dans l'onglet **Analyse** : cliquez sur **Créer l'étude d'opportunité**."));
    c.push(...(await fig('cj-11-onglet-analyse', 'L\'onglet « Analyse » avant la création de l\'étude', { largeur: 520 })));
    c.push(...(await fig('cj-12-etude-opportunite-dialogue', 'La fiche d\'analyse première', { recadrer: { haut: 0, hauteur: 860 } })));
    c.push(p("La fiche pose les questions suivantes. Pour chacune, choisissez une réponse et, si besoin, ajoutez un commentaire :"));
    c.push(...puces([
        "S'agit-il d'une **préoccupation réelle** ?",
        "Les faits relèvent-ils de la **compétence de l'ASCE-LC** ?",
        "Les **preuves** apportées sont-elles suffisantes ?",
        "Une **enquête complémentaire** est-elle nécessaire ?",
        "Y a-t-il **urgence à sécuriser des preuves** ?",
        "Y a-t-il **opportunité de saisir le procureur** ?",
        "L'**allégation** est-elle solide ?",
        "Le **secteur** est-il sensible (avec précision) ?",
        "Un **avis général** de synthèse."
    ]));
    c.push(...attention("L'étude d'opportunité est **obligatoire** avant de soumettre un dossier au comité. Sans elle, la plateforme refuse : « Impossible de soumettre au CTADP sans étude d'opportunité préalable »."));

    c.push(h2('6.5 Demander un complément d\'information'));
    c.push(...(await fig('cj-04-demander-complement', 'La demande de complément au déclarant', { recadrer: { haut: 0, hauteur: 860 } })));
    c.push(...listeNumerotee([
        "Cliquez sur **Demander complément** (bouton orangé).",
        "Rédigez précisément ce que vous attendez du déclarant : date, service concerné, document manquant.",
        "Cliquez sur **Envoyer la demande**. Le dossier passe à **En attente de complément** et le déclarant reçoit un lien pour répondre."
    ]));
    c.push(h2('6.6 Soumettre au comité (CTADP)'));
    c.push(...(await fig('cj-05-soumettre-ctadp', 'La soumission au comité', { recadrer: { haut: 0, hauteur: 860 } })));
    c.push(p("Quand l'étude est complète, cliquez sur **Soumettre au CTADP**. Le dossier passe à **En revue CTADP** et attend la prochaine séance, organisée par le CGEA."));
    c.push(...astuce("À retenir pour le conseiller juridique : **étude d'abord**, complément si les faits sont flous, soumission au comité ensuite. L'échéance « Analyse et transmission au conseiller juridique » est de 3 jours ouvrables."));
    c.push(...exercice('Exercice 3 : étudier un dossier', "1. Avec le compte **form-cj**, ouvrez le dossier « Délai anormal et frais demandés sans reçu ».", "2. Parcourez les six onglets.", "3. Dans **Analyse**, ouvrez la fiche d'étude d'opportunité et lisez chaque question.", "4. Ouvrez la fenêtre **Demander complément** sans l'envoyer, puis refermez-la."));

    // ============================================================ 7
    c.push(h1('7. Profil CGEA'));
    c.push(p("Le Contrôleur Général d'État Adjoint (CGEA) **organise** le traitement : il affecte les dossiers, convoque et tient les séances du comité, ouvre les enquêtes, constitue les équipes et surveille les retards. Il voit **tous** les dossiers."));
    c.push(h2('7.1 Votre tableau de bord'));
    c.push(...(await fig('cgea-01-tableau-de-bord', 'Le tableau de bord du CGEA', { recadrer: { haut: 0, hauteur: 860 } })));
    c.push(p("Il reprend les indicateurs du chapitre 3. L'indicateur **Alertes délais** compte les dépassements : c'est votre signal pour intervenir."));
    c.push(h2('7.2 Affecter un dossier'));
    c.push(p("L'affectation se fait en deux temps, visibles dans l'onglet **Affectation** de la fiche :"));
    c.push(...(await fig('cge-06-onglet-affectation', 'L\'onglet « Affectation » : décision du CGE puis affectation du CGEA', { largeur: 560 })));
    c.push(...listeNumerotee([
        "Le **cabinet du CGE** décide : « Affectation directe CGEA » ou « Échange préalable ».",
        "Le **CGEA** désigne le responsable : un **agent** (conseiller juridique), un **département** ou le **BRPD**.",
        "Le responsable désigné peut ensuite **mettre à jour le suivi** de l'affectation (en cours, clôturé, autre)."
    ]));
    c.push(p("Un agent désigné n'ouvre le dossier que s'il y est **habilité**. Sur un dossier **confidentiel**, le CGE, le CGEA et l'administrateur voient un panneau **Habilitations** dans la colonne de droite : le bouton « + » (**Octroyer un accès**) demande l'agent et le **motif** de l'accès, et chaque accès peut être **révoqué** avec un motif."));
    c.push(h2('7.3 Les séances du comité (CTADP)'));
    c.push(...(await fig('cgea-02-seances', 'La liste des séances du comité', { recadrer: { haut: 0, hauteur: 420 } })));
    c.push(h3('Créer une séance'));
    c.push(...(await fig('cgea-03-nouvelle-seance', 'La création d\'une séance', { recadrer: { haut: 0, hauteur: 860 } })));
    c.push(...listeNumerotee([
        "Menu **Bureau des plaintes > Séances CTADP**, puis **Nouvelle séance**.",
        "Choisissez la **date** et indiquez les **participants**, puis validez. La séance est créée au statut **Planifiée**."
    ]));
    c.push(h3('Préparer la séance'));
    c.push(...(await fig('cgea-04-seance-detail', 'Le détail d\'une séance', { recadrer: { haut: 0, hauteur: 700 } })));
    c.push(...puces([
        "**Ajouter un dossier** : la liste propose les dossiers au statut **En revue CTADP**.",
        "**Convocation (PDF)** : génère la convocation du comité, avec la date, les membres et l'ordre du jour.",
        "Pour chaque dossier, le crayon permet d'enregistrer la **recommandation du comité** (CGEA ou conseiller juridique)."
    ]));
    c.push(...(await fig('cgea-07-seance-ajouter-dossier', 'Ajouter un dossier à la séance', { recadrer: { haut: 0, hauteur: 860 } })));
    c.push(h3('Tenir la séance'));
    c.push(...(await fig('cgea-08-seance-tenir', 'La fenêtre « Tenir la séance »', { recadrer: { haut: 0, hauteur: 860 } })));
    c.push(p("Après la réunion, cliquez sur **Tenir la séance** et saisissez le **procès-verbal** (facultatif). La séance passe au statut **Tenue** et **ne peut plus être modifiée**."));
    c.push(...attention("Tenir une séance est **définitif**. Vérifiez la liste des dossiers et les recommandations avant de cliquer."));
    c.push(h2('7.4 Ouvrir une enquête'));
    c.push(p("Quand le CGE a déclaré un dossier **recevable**, le panneau **Investigation** de la fiche (colonne de droite) indique « Vous pouvez ouvrir l'investigation ». Choisissez la **durée** en jours (de 90 à 365 ; des boutons rapides proposent 90, 120 et 180 jours), puis cliquez sur **Ouvrir l'investigation**. L'enquête est créée au statut **Initiée**. Tant que le CGEA n'a pas ouvert l'enquête, les autres agents lisent « En attente d'ouverture par le CGEA »."));
    c.push(...puces([
        "Constituez ensuite l'**équipe** (chapitre 10) : exactement **un chef de mission**, au moins deux investigateurs, et des personnes ressources si besoin.",
        "Chaque membre doit d'abord déclarer l'**absence de conflit d'intérêts** et signer l'**engagement de confidentialité**, faute de quoi la plateforme refuse son ajout."
    ]));
    c.push(h2('7.5 Transférer, clôturer'));
    c.push(p("Si un dossier relève d'une autre institution, le bouton **Transférer** (CGE, CGEA) le transmet à l'autorité compétente. Les dossiers **irrecevables** se clôturent après l'envoi de la réponse motivée ; les dossiers ayant fait l'objet d'une **décision** se clôturent après transmission aux autorités (**Clôturer le dossier**)."));
    c.push(h2('7.6 Surveiller les retards'));
    c.push(...(await fig('adm-15-depassements', 'Les dépassements par acteur', { recadrer: { haut: 0, hauteur: 900 } })));
    c.push(p("Le menu **Administration > Dépassements par acteur** regroupe les retards par responsable (CGEA, CGE…) : étapes du circuit en retard et dossiers dont le délai est dépassé. Le **Registre des auditions** (même menu) liste toutes les auditions des enquêtes. La **File des notifications** permet de contrôler les alertes envoyées."));
    c.push(...astuce("À retenir pour le CGEA : **affecter vite** (3 jours ouvrables), **convoquer le comité** (3 jours ouvrables après l'avis juridique), **suivre les retards** chaque semaine."));
    c.push(...exercice('Exercice 4 : préparer une séance', "1. Avec le compte **form-cgea**, ouvrez **Séances CTADP** et créez une séance à une date de votre choix.", "2. Ouvrez-la et ajoutez un dossier **En revue CTADP**.", "3. Téléchargez la **Convocation (PDF)**.", "4. Ouvrez la fenêtre **Tenir la séance** et refermez-la **sans** valider."));

    // ============================================================ 8
    c.push(h1('8. Profil CGE'));
    c.push(p("Le Contrôleur Général d'État (CGE) **décide**. Il supervise l'ensemble des dossiers, tranche la recevabilité, fixe la priorité, protège les dossiers sensibles et rend la décision finale d'une enquête."));
    c.push(h2('8.1 Votre tableau de bord'));
    c.push(...(await fig('cge-01-tableau-de-bord', 'Le tableau de bord du CGE', { recadrer: { haut: 0, hauteur: 860 } })));
    c.push(h2('8.2 Déclarer un dossier recevable ou irrecevable'));
    c.push(p("Après la séance du comité, le dossier est en **En revue CTADP**. Sur sa fiche, vous disposez de deux décisions :"));
    c.push(...(await fig('cge-02-dossier-ctadp', 'La fiche d\'un dossier en revue CTADP', { recadrer: { haut: 0, hauteur: 560 } })));
    c.push(...(await fig('cge-03-declarer-recevable', 'La décision « Déclarer recevable »', { recadrer: { haut: 0, hauteur: 860 } })));
    c.push(...puces([
        "**Déclarer recevable** : une enquête pourra être ouverte. Ajoutez un motif ou une observation si besoin.",
        "**Déclarer irrecevable** : le dossier passe au statut **Irrecevable** ; la réponse motivée est ensuite envoyée au déclarant et le dossier est clôturé.",
        "**Transférer** : si le dossier relève d'une autre institution."
    ]));
    c.push(...attention("Une décision de recevabilité est **inscrite au journal d'audit** et ne se corrige pas par simple retour en arrière. Relisez l'étude d'opportunité et l'avis du comité avant de décider."));
    c.push(h2('8.3 Fixer la priorité'));
    c.push(...(await fig('cge-04-priorite', 'La fenêtre de priorité', { recadrer: { haut: 0, hauteur: 860 } })));
    c.push(p("Le bouton **Normal** (ou **Urgent**) à droite de l'en-tête ouvre la fenêtre « Définir la priorité du dossier ». Un dossier **urgent** s'affiche avec un bandeau orange, le **motif** de l'urgence et une **échéance**."));
    c.push(h2('8.4 Protéger un dossier : la confidentialité'));
    c.push(...(await fig('cge-05-confidentiel', 'Marquer un dossier confidentiel', { recadrer: { haut: 0, hauteur: 860 } })));
    c.push(p("**Marquer confidentiel** masque le contenu du dossier aux agents non habilités. Seuls le CGE, le CGEA et l'administrateur peuvent lever la protection. Le panneau **Habilitations** s'affiche alors dans la colonne de droite pour gérer, nom par nom, les accès."));
    c.push(h2('8.5 Les onglets d\'analyse et d\'affectation'));
    c.push(...(await fig('cge-07-onglet-analyse', 'L\'onglet « Analyse » vu par le CGE', { largeur: 560 })));
    c.push(p("L'onglet **Analyse** présente l'étude d'opportunité du conseiller juridique : c'est la base de votre décision. L'onglet **Affectation** retrace votre décision d'affectation et celle du CGEA."));
    c.push(h2('8.6 Décision finale et quitus'));
    c.push(p("À l'issue d'une enquête, le rapport suit un **circuit de validation** (chapitre 10). La **décision finale du CGE** intervient en dernier, dans un délai de **20 jours ouvrables**. Le bouton **Quitus du CGE**, sur la fiche du dossier, génère le quitus en PDF à partir de la décision enregistrée ; un délai de **15 jours ouvrables** est prévu après la séance du comité."));
    c.push(h2('8.7 Gérer les agents'));
    c.push(p("Comme l'administrateur, le CGE peut **créer un agent**, modifier ses rôles et le désactiver (voir le chapitre 12 pour le détail)."));
    c.push(...astuce("À retenir pour le CGE : **trancher la recevabilité** après le comité, **fixer la priorité** des dossiers urgents, **protéger** les dossiers sensibles, **signer** la décision finale d'enquête."));
    c.push(...exercice('Exercice 5 : décider', "1. Avec le compte **form-cge**, ouvrez un dossier **En revue CTADP**.", "2. Lisez l'onglet **Analyse**, puis ouvrez la fenêtre **Déclarer recevable** **sans valider**.", "3. Ouvrez la fenêtre de **priorité**, passez le dossier en « Urgent » avec un motif, puis annulez.", "4. Ouvrez la fenêtre **Marquer confidentiel** et lisez le message."));
    return c;
}
