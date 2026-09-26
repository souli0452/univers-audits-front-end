# Complément du citoyen — volet back Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter au back deux routes publiques (lecture de la demande de complément, dépôt de la réponse) qui font passer un dossier de `EN_ATTENTE_COMPLEMENT` à `EN_ETUDE_OPPORTUNITE` sans intervention d'un agent.

**Architecture:** Un nouveau service `ComplementPublicService` (isolé de l'énorme `DossierServiceImpl`) porte les deux cas d'usage ; un contrôleur `ComplementPublicController` les expose sous `/api/v1/dossiers/public/complement/{accessCode}`. Il réutilise `AttachmentStorageService.upload` (types et tailles déjà contrôlés, code de suivi vérifié par `DossierAccessGuard`), `DossierAuditRecorder` pour l'observation et l'historique, et le `RateLimitFilter` existant.

**Tech Stack:** Java 17 (JDK 21 sur le poste), Spring Boot, Liquibase (SQL), JUnit 5, Mockito, AssertJ, Maven (`mvn -o test`).

**Spec:** `docs/superpowers/specs/2026-09-26-complement-citoyen-design.md` (dépôt front, branche `docs/cahier-recette`)

## Global Constraints

- Dépôt : `univers-audits-back-end`, branche de départ `feature/workflow-denociation-asce-fix`. Le travail se fait sur une **nouvelle branche** `feature/complement-portail`. Aucune branche existante n'est modifiée, rien n'est poussé sans accord explicite de l'utilisateur.
- Clone de travail : `C:\tmp\bk` (chemin court obligatoire sous Windows) ; les commandes s'exécutent dans `C:\tmp\bk\back-end`.
- Les deux routes sont publiques (`permitAll`) et protégées par le code de suivi ; **aucune donnée d'identité** n'est renvoyée.
- Message : 2 000 caractères maximum. Fichiers : 0 à 5, 25 Mo chacun, 50 Mo au total (`spring.servlet.multipart`), types de `AttachmentStorageService.ALLOWED_MIME_TYPES`. Un message **ou** au moins un fichier est obligatoire.
- Réponse acceptée après l'échéance et marquée en retard : « Reçu en retard (échéance du JJ/MM/AAAA) — ».
- Erreurs : 404 code inconnu, 409 statut différent de `EN_ATTENTE_COMPLEMENT` (« Aucun complément n'est attendu pour ce dossier »), 400 validation.
- Le champ auteur d'une observation est obligatoire en base : il reçoit l'agent qui a émis la demande, avec le nom affiché « Déclarant (via le portail) ».
- Notification : type **existant** `INTERNAL_ALERT`, canal `PORTAL`, sujet « Complément reçu » (aucun nouveau type de notification). Action d'audit : `RECEVOIR_COMPLEMENT`.
- Limitation des essais : lecture 20 requêtes par minute, envoi 5 par 10 minutes.
- Migration Liquibase : le CHECK SQL est élargi dans le **même changeset** que l'ajout de la valeur d'enum (leçon des migrations 013 et 014).
- Convention des commits : français, `feat(...)` / `test(...)`, avec la ligne `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`.

## Review Focus

1. Double envoi simultané de la réponse : un seul passe, l'autre reçoit 409 (verrou optimiste `ObjectOptimisticLockingFailureException` déjà mappé en 409 par `GlobalExceptionHandler`). Test : Task 4.
2. Code de suivi d'un dossier qui n'attend pas de complément (déjà répondu, ou autre statut) : 409, sans aucune écriture. Test : Tasks 3 et 4.
3. Fichier refusé au milieu de l'envoi : rien n'est enregistré côté base, le statut ne change pas. Test : Task 4.
4. Envoi sans message ni fichier, ou avec uniquement des fichiers vides : 400. Test : Task 4.
5. Dossier anonyme (sans déclarant) ou sans échéance : aucune erreur (pas de `NullPointerException`). Test : Tasks 3 et 4.

---

### Task 0: Branche et base de test

**Files:** aucun (préparation).

- [ ] **Step 1: Créer la branche de travail**

```bash
cd /c/tmp/bk/back-end
git status --short          # doit être vide
git checkout -b feature/complement-portail
git branch --show-current   # feature/complement-portail
```

- [ ] **Step 2: Relever l'état de base de la suite de tests**

Run: `mvn -o -q test 2>&1 | tail -30`
Expected: la commande se termine ; noter le nombre de tests exécutés et les éventuels échecs **déjà présents** (ils ne sont pas à corriger dans ce plan, mais ne doivent pas augmenter). Si la suite complète est trop longue (plus de 10 minutes), noter à la place le résultat de `mvn -o -q test -Dtest='RateLimitFilterTest,DossierServiceImplTest,AttachmentStorageServiceTest'`.

---

### Task 1: Type d'observation `COMPLEMENT_RESPONSE` et migration

**Files:**
- Modify: `src/main/java/gov/bf/ascelc/univers_audits/enums/ObservationType.java`
- Create: `src/main/resources/db/changelog/migrations/018-observation-type-complement-response.sql`
- Test: `src/test/java/gov/bf/ascelc/univers_audits/model/entity/ObservationTypeCheckMigrationTest.java`

**Interfaces:**
- Consumes: rien.
- Produces: `ObservationType.COMPLEMENT_RESPONSE` (utilisé par les Tasks 2 à 4) et la contrainte SQL `observation_type_check` qui l'autorise.

- [ ] **Step 1: Écrire le test qui garde l'enum et le CHECK SQL synchronisés**

```java
package gov.bf.ascelc.univers_audits.model.entity;

import gov.bf.ascelc.univers_audits.enums.ObservationType;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Garde-fou : ajouter une valeur à ObservationType sans élargir le CHECK SQL fait échouer
 * (et annuler) toute transaction qui l'utilise (leçon des migrations 013 et 014).
 */
class ObservationTypeCheckMigrationTest {

    @Test
    void laDerniereContrainteSqlAutoriseChaqueObservationType() throws Exception {
        Path dir = Path.of("src/main/resources/db/changelog/migrations");
        String derniere;
        try (Stream<Path> fichiers = Files.list(dir)) {
            derniere = fichiers
                    .filter(p -> p.toString().endsWith(".sql"))
                    .sorted()
                    .map(ObservationTypeCheckMigrationTest::lire)
                    .filter(sql -> sql.contains("observation_type_check"))
                    .reduce((premier, second) -> second)
                    .orElseThrow();
        }

        for (ObservationType type : ObservationType.values()) {
            assertThat(derniere)
                    .as("la valeur %s doit figurer dans le CHECK observation_type_check", type)
                    .contains("'" + type.name() + "'");
        }
    }

    private static String lire(Path fichier) {
        try {
            return new String(Files.readAllBytes(fichier), StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }
}
```

- [ ] **Step 2: Vérifier que le test passe sur l'état actuel (base saine)**

Run: `mvn -o -q test -Dtest=ObservationTypeCheckMigrationTest 2>&1 | tail -8`
Expected: PASS (les 7 valeurs actuelles figurent dans le CHECK de `001-baseline-schema.sql`).

- [ ] **Step 3: Ajouter la valeur d'enum et constater l'échec**

Dans `ObservationType.java`, remplacer :

```java
    // Note de transfert vers une institution compétente
    TRANSFER_NOTE
}
```

par :

```java
    // Note de transfert vers une institution compétente
    TRANSFER_NOTE,
    // Réponse du déclarant à une demande de complément, déposée depuis le portail public
    COMPLEMENT_RESPONSE
}
```

Run: `mvn -o -q test -Dtest=ObservationTypeCheckMigrationTest 2>&1 | grep -E "Tests run|COMPLEMENT_RESPONSE|FAIL" | head -5`
Expected: FAIL avec « la valeur COMPLEMENT_RESPONSE doit figurer dans le CHECK observation_type_check ».

- [ ] **Step 4: Écrire la migration**

Créer `src/main/resources/db/changelog/migrations/018-observation-type-complement-response.sql` :

```sql
--liquibase formatted sql
--changeset dev:018-observation-type-complement-response

-- Nouveau ObservationType COMPLEMENT_RESPONSE : réponse du déclarant à une demande de
-- complément, déposée depuis le portail public. Le CHECK est élargi DANS LE MEME changeset
-- que l'ajout de la valeur (leçon des migrations 013 et 014).
ALTER TABLE observation DROP CONSTRAINT observation_type_check;
ALTER TABLE observation ADD CONSTRAINT observation_type_check
    CHECK (type IN (
        'INTERNAL_NOTE','ADMISSIBILITY_ANALYSIS','CTADP_OPINION','COMPLEMENT_REQUEST',
        'CGE_DECISION','FIELD_FINDING','TRANSFER_NOTE','COMPLEMENT_RESPONSE'));
```

- [ ] **Step 5: Vérifier que le test passe**

Run: `mvn -o -q test -Dtest=ObservationTypeCheckMigrationTest 2>&1 | grep -E "Tests run|FAIL|ERROR" | head -5`
Expected: aucune ligne FAIL ni ERROR (succès silencieux avec `-q`).

- [ ] **Step 6: Commit**

```bash
git add src/main/java/gov/bf/ascelc/univers_audits/enums/ObservationType.java \
        src/main/resources/db/changelog/migrations/018-observation-type-complement-response.sql \
        src/test/java/gov/bf/ascelc/univers_audits/model/entity/ObservationTypeCheckMigrationTest.java
git commit -m "feat(observation): type COMPLEMENT_RESPONSE et migration du CHECK SQL

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 2: Observation écrite au nom du déclarant

**Files:**
- Modify: `src/main/java/gov/bf/ascelc/univers_audits/shared/utils/DossierAuditRecorder.java`
- Test: `src/test/java/gov/bf/ascelc/univers_audits/shared/utils/DossierAuditRecorderTest.java`

**Interfaces:**
- Consumes: `ObservationType.COMPLEMENT_RESPONSE` (Task 1).
- Produces: `void DossierAuditRecorder.addDeclarantObservation(Dossier dossier, ObservationType type, String content, Agent technicalAuthor, String displayName)` — enregistre une observation non confidentielle dont l'auteur technique est un agent et le nom affiché est `displayName`.

- [ ] **Step 1: Écrire le test qui échoue**

```java
package gov.bf.ascelc.univers_audits.shared.utils;

import gov.bf.ascelc.univers_audits.enums.DossierStatus;
import gov.bf.ascelc.univers_audits.enums.ObservationType;
import gov.bf.ascelc.univers_audits.model.entity.Agent;
import gov.bf.ascelc.univers_audits.model.entity.Dossier;
import gov.bf.ascelc.univers_audits.model.entity.Observation;
import gov.bf.ascelc.univers_audits.repository.ObservationRepository;
import gov.bf.ascelc.univers_audits.repository.StatusHistoryRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class DossierAuditRecorderTest {

    @Mock private ObservationRepository observationRepository;
    @Mock private StatusHistoryRepository statusHistoryRepository;
    @InjectMocks private DossierAuditRecorder recorder;

    @Test
    void addDeclarantObservation_garde_l_auteur_technique_et_affiche_le_nom_du_declarant() {
        Agent demandeur = Agent.builder().firstName("Issouf").lastName("Souli").build();
        Dossier dossier = Dossier.builder().status(DossierStatus.EN_ETUDE_OPPORTUNITE).build();

        recorder.addDeclarantObservation(dossier, ObservationType.COMPLEMENT_RESPONSE,
                "Voici les justificatifs", demandeur, "Déclarant (via le portail)");

        ArgumentCaptor<Observation> captor = ArgumentCaptor.forClass(Observation.class);
        verify(observationRepository).save(captor.capture());
        Observation obs = captor.getValue();
        assertThat(obs.getType()).isEqualTo(ObservationType.COMPLEMENT_RESPONSE);
        assertThat(obs.getContent()).isEqualTo("Voici les justificatifs");
        assertThat(obs.getAuthor()).isSameAs(demandeur);
        assertThat(obs.getAuthorFullName()).isEqualTo("Déclarant (via le portail)");
        assertThat(obs.getStatusSnapshot()).isEqualTo(DossierStatus.EN_ETUDE_OPPORTUNITE);
        assertThat(obs).extracting("confidential").isEqualTo(false);
    }
}
```

- [ ] **Step 2: Vérifier l'échec**

Run: `mvn -o -q test -Dtest=DossierAuditRecorderTest 2>&1 | grep -E "cannot find symbol|addDeclarantObservation|ERROR" | head -4`
Expected: FAIL de compilation : `cannot find symbol ... addDeclarantObservation`.

- [ ] **Step 3: Ajouter la méthode**

Dans `DossierAuditRecorder.java`, ajouter juste après `addObservation(...)` :

```java
    /**
     * Observation déposée par le déclarant lui-même (portail public). L'auteur est obligatoire en
     * base : il reçoit l'agent qui a émis la demande, mais le nom affiché est celui du déclarant.
     */
    public void addDeclarantObservation(Dossier dossier, ObservationType type,
                                        String content, Agent technicalAuthor,
                                        String displayName) {
        Observation obs = Observation.builder()
                .dossier(dossier)
                .type(type)
                .content(content)
                .confidential(false)
                .author(technicalAuthor)
                .authorFullName(displayName)
                .statusSnapshot(dossier.getStatus())
                .build();
        observationRepository.save(obs);
    }
```

- [ ] **Step 4: Vérifier que le test passe**

Run: `mvn -o -q test -Dtest=DossierAuditRecorderTest 2>&1 | grep -E "FAIL|ERROR" | head -3`
Expected: aucune ligne.

- [ ] **Step 5: Commit**

```bash
git add src/main/java/gov/bf/ascelc/univers_audits/shared/utils/DossierAuditRecorder.java \
        src/test/java/gov/bf/ascelc/univers_audits/shared/utils/DossierAuditRecorderTest.java
git commit -m "feat(audit): observation écrite au nom du déclarant

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 3: Lecture de la demande de complément

**Files:**
- Create: `src/main/java/gov/bf/ascelc/univers_audits/model/dto/response/ComplementRequestResponse.java`
- Create: `src/main/java/gov/bf/ascelc/univers_audits/model/dto/response/ComplementSubmissionResponse.java`
- Create: `src/main/java/gov/bf/ascelc/univers_audits/service/ComplementPublicService.java`
- Test: `src/test/java/gov/bf/ascelc/univers_audits/service/ComplementPublicServiceTest.java`

**Interfaces:**
- Consumes: `DossierRepository.findByAccessCode(String): Optional<Dossier>`, `ObservationRepository.findTopByDossierIdAndTypeOrderByCreatedAtDesc(UUID, ObservationType): Optional<Observation>`.
- Produces :
  - `record ComplementRequestResponse(String status, String motif, Instant requestedAt, Instant deadline, boolean overdue)`
  - `record ComplementSubmissionResponse(String status, boolean late, int filesUploaded)`
  - `ComplementRequestResponse ComplementPublicService.getComplementRequest(String accessCode)` (et la surcharge de visibilité paquet `getComplementRequest(String accessCode, Instant now)` pour les tests).
  - Exceptions : `ResourceNotFoundException` (404), `ConflictException` (409), `BusinessException` (400).

- [ ] **Step 1: Créer les deux DTO**

`ComplementRequestResponse.java` :

```java
package gov.bf.ascelc.univers_audits.model.dto.response;

import java.time.Instant;

/** Ce que le déclarant voit d'une demande de complément : aucune donnée d'identité. */
public record ComplementRequestResponse(
        String status,
        String motif,
        Instant requestedAt,
        Instant deadline,
        boolean overdue) {
}
```

`ComplementSubmissionResponse.java` :

```java
package gov.bf.ascelc.univers_audits.model.dto.response;

/** Résultat du dépôt d'une réponse à une demande de complément. */
public record ComplementSubmissionResponse(
        String status,
        boolean late,
        int filesUploaded) {
}
```

- [ ] **Step 2: Écrire les tests de lecture (échec attendu : le service n'existe pas)**

```java
package gov.bf.ascelc.univers_audits.service;

import gov.bf.ascelc.univers_audits.enums.DossierStatus;
import gov.bf.ascelc.univers_audits.enums.ObservationType;
import gov.bf.ascelc.univers_audits.model.dto.response.ComplementRequestResponse;
import gov.bf.ascelc.univers_audits.model.entity.Agent;
import gov.bf.ascelc.univers_audits.model.entity.Dossier;
import gov.bf.ascelc.univers_audits.model.entity.Observation;
import gov.bf.ascelc.univers_audits.repository.DossierRepository;
import gov.bf.ascelc.univers_audits.repository.NotificationRepository;
import gov.bf.ascelc.univers_audits.repository.ObservationRepository;
import gov.bf.ascelc.univers_audits.shared.exceptions.ConflictException;
import gov.bf.ascelc.univers_audits.shared.exceptions.ResourceNotFoundException;
import gov.bf.ascelc.univers_audits.shared.utils.DossierAuditRecorder;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ComplementPublicServiceTest {

    static final Instant NOW = Instant.parse("2026-09-26T10:00:00Z");

    @Mock private DossierRepository dossierRepository;
    @Mock private ObservationRepository observationRepository;
    @Mock private NotificationRepository notificationRepository;
    @Mock private AttachmentStorageService attachmentStorageService;
    @Mock private DossierAuditRecorder auditRecorder;
    @Mock private AuditService auditService;
    @InjectMocks private ComplementPublicService service;

    private final UUID dossierId = UUID.randomUUID();
    private final Agent demandeur = Agent.builder().firstName("Issouf").lastName("Souli").build();

    private Dossier dossier(DossierStatus status, Instant deadline) {
        return Dossier.builder().id(dossierId).accessCode("ABCD1234")
                .status(status).additionalInfoDeadline(deadline).build();
    }

    private Observation demande() {
        return Observation.builder().type(ObservationType.COMPLEMENT_REQUEST)
                .content("Veuillez fournir les justificatifs de paiement")
                .author(demandeur)
                .createdAt(Instant.parse("2026-09-20T09:00:00Z")).build();
    }

    private void givenDossierEnAttente(Instant deadline) {
        when(dossierRepository.findByAccessCode("ABCD1234"))
                .thenReturn(Optional.of(dossier(DossierStatus.EN_ATTENTE_COMPLEMENT, deadline)));
        when(observationRepository.findTopByDossierIdAndTypeOrderByCreatedAtDesc(
                dossierId, ObservationType.COMPLEMENT_REQUEST)).thenReturn(Optional.of(demande()));
    }

    // ── Lecture de la demande ───────────────────────────────────────────────

    @Test
    void getComplementRequest_renvoie_le_motif_et_l_echeance() {
        Instant deadline = Instant.parse("2026-09-30T23:59:59Z");
        givenDossierEnAttente(deadline);

        ComplementRequestResponse r = service.getComplementRequest("ABCD1234", NOW);

        assertThat(r.status()).isEqualTo("EN_ATTENTE_COMPLEMENT");
        assertThat(r.motif()).isEqualTo("Veuillez fournir les justificatifs de paiement");
        assertThat(r.requestedAt()).isEqualTo(Instant.parse("2026-09-20T09:00:00Z"));
        assertThat(r.deadline()).isEqualTo(deadline);
        assertThat(r.overdue()).isFalse();
    }

    @Test
    void getComplementRequest_signale_le_retard_quand_l_echeance_est_depassee() {
        givenDossierEnAttente(Instant.parse("2026-09-25T23:59:59Z"));

        assertThat(service.getComplementRequest("ABCD1234", NOW).overdue()).isTrue();
    }

    @Test
    void getComplementRequest_sans_echeance_n_est_jamais_en_retard() {
        givenDossierEnAttente(null);

        ComplementRequestResponse r = service.getComplementRequest("ABCD1234", NOW);

        assertThat(r.deadline()).isNull();
        assertThat(r.overdue()).isFalse();
    }

    @Test
    void getComplementRequest_code_inconnu_donne_404() {
        when(dossierRepository.findByAccessCode("ZZZZZZZZ")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getComplementRequest("ZZZZZZZZ", NOW))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void getComplementRequest_dossier_qui_n_attend_pas_de_complement_donne_409() {
        when(dossierRepository.findByAccessCode("ABCD1234"))
                .thenReturn(Optional.of(dossier(DossierStatus.EN_ETUDE_OPPORTUNITE, null)));

        assertThatThrownBy(() -> service.getComplementRequest("ABCD1234", NOW))
                .isInstanceOf(ConflictException.class)
                .hasMessage("Aucun complément n'est attendu pour ce dossier");
    }
}
```

Run: `mvn -o -q test -Dtest=ComplementPublicServiceTest 2>&1 | grep -E "cannot find symbol|ComplementPublicService|ERROR" | head -4`
Expected: FAIL de compilation : `cannot find symbol ... ComplementPublicService`.

- [ ] **Step 3: Écrire le service (lecture seulement)**

Créer `ComplementPublicService.java` :

```java
package gov.bf.ascelc.univers_audits.service;

import gov.bf.ascelc.univers_audits.enums.DossierStatus;
import gov.bf.ascelc.univers_audits.enums.ObservationType;
import gov.bf.ascelc.univers_audits.model.dto.response.ComplementRequestResponse;
import gov.bf.ascelc.univers_audits.model.entity.Dossier;
import gov.bf.ascelc.univers_audits.model.entity.Observation;
import gov.bf.ascelc.univers_audits.repository.DossierRepository;
import gov.bf.ascelc.univers_audits.repository.NotificationRepository;
import gov.bf.ascelc.univers_audits.repository.ObservationRepository;
import gov.bf.ascelc.univers_audits.shared.exceptions.BusinessException;
import gov.bf.ascelc.univers_audits.shared.exceptions.ConflictException;
import gov.bf.ascelc.univers_audits.shared.exceptions.ResourceNotFoundException;
import gov.bf.ascelc.univers_audits.shared.utils.DossierAuditRecorder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

/**
 * Réponse d'un déclarant à une demande de complément, depuis le portail public : le code de
 * suivi (accessCode) sert de preuve, comme pour le suivi public.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ComplementPublicService {

    static final int MAX_FILES = 5;
    static final int MESSAGE_MAX_LENGTH = 2000;
    static final String NOT_WAITING = "Aucun complément n'est attendu pour ce dossier";
    static final String DECLARANT_LABEL = "Déclarant (via le portail)";

    private final DossierRepository dossierRepository;
    private final ObservationRepository observationRepository;
    private final NotificationRepository notificationRepository;
    private final AttachmentStorageService attachmentStorageService;
    private final DossierAuditRecorder auditRecorder;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public ComplementRequestResponse getComplementRequest(String accessCode) {
        return getComplementRequest(accessCode, Instant.now());
    }

    ComplementRequestResponse getComplementRequest(String accessCode, Instant now) {
        Dossier dossier = findWaitingDossier(accessCode);
        Observation request = lastRequest(dossier);
        Instant deadline = dossier.getAdditionalInfoDeadline();
        return new ComplementRequestResponse(
                dossier.getStatus().name(),
                request.getContent(),
                request.getCreatedAt(),
                deadline,
                deadline != null && now.isAfter(deadline));
    }

    private Dossier findWaitingDossier(String accessCode) {
        Dossier dossier = dossierRepository
                .findByAccessCode(accessCode == null ? "" : accessCode.trim())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Dossier introuvable avec ce code d'accès"));
        if (dossier.getStatus() != DossierStatus.EN_ATTENTE_COMPLEMENT) {
            throw new ConflictException(NOT_WAITING);
        }
        return dossier;
    }

    private Observation lastRequest(Dossier dossier) {
        return observationRepository
                .findTopByDossierIdAndTypeOrderByCreatedAtDesc(
                        dossier.getId(), ObservationType.COMPLEMENT_REQUEST)
                .orElseThrow(() -> new BusinessException(
                        "La demande de complément est introuvable pour ce dossier"));
    }
}
```

- [ ] **Step 4: Vérifier que les 5 tests de lecture passent**

Run: `mvn -o test -Dtest=ComplementPublicServiceTest 2>&1 | grep -E "Tests run:|FAIL|ERROR" | head -4`
Expected: `Tests run: 5, Failures: 0, Errors: 0`.

- [ ] **Step 5: Commit**

```bash
git add src/main/java/gov/bf/ascelc/univers_audits/model/dto/response/ComplementRequestResponse.java \
        src/main/java/gov/bf/ascelc/univers_audits/model/dto/response/ComplementSubmissionResponse.java \
        src/main/java/gov/bf/ascelc/univers_audits/service/ComplementPublicService.java \
        src/test/java/gov/bf/ascelc/univers_audits/service/ComplementPublicServiceTest.java
git commit -m "feat(complement): lecture publique de la demande de complément

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 4: Dépôt de la réponse

**Files:**
- Modify: `src/main/java/gov/bf/ascelc/univers_audits/service/ComplementPublicService.java`
- Modify: `src/test/java/gov/bf/ascelc/univers_audits/service/ComplementPublicServiceTest.java`

**Interfaces:**
- Consumes: `ComplementPublicService` de la Task 3 ; `DossierAuditRecorder.addDeclarantObservation` (Task 2) et `recordStatusChange(Dossier, DossierStatus, DossierStatus, String, Agent, String)` ; `AttachmentStorageService.upload(String dossierId, List<MultipartFile> files, String accessCode, AttachmentSource source, ModeObtention mode, String personneRemettante, String sectionId): List<UploadedFile>` ; `AuditService.logAction(String agentId, String agentName, String agentRole, String action, String entityType, String entityId, String description, String ipAddress, String userAgent)`.
- Produces: `ComplementSubmissionResponse ComplementPublicService.submitComplement(String accessCode, String message, List<MultipartFile> files, String ipAddress)` (et la surcharge de visibilité paquet avec `Instant now` en dernier paramètre).

- [ ] **Step 1: Ajouter les tests du dépôt (échec attendu : la méthode n'existe pas)**

Ajouter ces imports au test :

```java
import gov.bf.ascelc.univers_audits.enums.NotificationChannel;
import gov.bf.ascelc.univers_audits.enums.NotificationType;
import gov.bf.ascelc.univers_audits.model.dto.response.ComplementSubmissionResponse;
import gov.bf.ascelc.univers_audits.model.entity.Notification;
import gov.bf.ascelc.univers_audits.shared.exceptions.BusinessException;
import org.mockito.ArgumentCaptor;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
```

Puis, avant l'accolade finale de la classe, ajouter :

```java
    // ── Dépôt de la réponse ─────────────────────────────────────────────────

    private static MultipartFile fichier(String nom) {
        return new MockMultipartFile("files", nom, "application/pdf", "contenu".getBytes());
    }

    private static AttachmentStorageService.UploadedFile recu(String nom) {
        return new AttachmentStorageService.UploadedFile("id-" + nom, nom, "application/pdf", 7L, false);
    }

    @Test
    void submitComplement_message_seul_fait_repasser_le_dossier_en_etude() {
        givenDossierEnAttente(Instant.parse("2026-09-30T23:59:59Z"));

        ComplementSubmissionResponse r = service.submitComplement(
                "ABCD1234", "  Voici mes justificatifs  ", null, "10.0.0.1", NOW);

        assertThat(r.status()).isEqualTo("EN_ETUDE_OPPORTUNITE");
        assertThat(r.late()).isFalse();
        assertThat(r.filesUploaded()).isZero();

        ArgumentCaptor<Dossier> saved = ArgumentCaptor.forClass(Dossier.class);
        verify(dossierRepository).save(saved.capture());
        assertThat(saved.getValue().getStatus()).isEqualTo(DossierStatus.EN_ETUDE_OPPORTUNITE);

        verify(auditRecorder).addDeclarantObservation(any(Dossier.class),
                eq(ObservationType.COMPLEMENT_RESPONSE), eq("Voici mes justificatifs"),
                eq(demandeur), eq("Déclarant (via le portail)"));
        verify(auditRecorder).recordStatusChange(any(Dossier.class),
                eq(DossierStatus.EN_ATTENTE_COMPLEMENT), eq(DossierStatus.EN_ETUDE_OPPORTUNITE),
                eq("Complément reçu du déclarant"), eq(null), eq("10.0.0.1"));
        verify(auditService).logAction(eq(null), eq("Déclarant (via le portail)"), eq(null),
                eq("RECEVOIR_COMPLEMENT"), eq("DOSSIER"), eq(dossierId.toString()),
                anyString(), eq("10.0.0.1"), eq(null));
        verifyNoInteractions(attachmentStorageService);
    }

    @Test
    void submitComplement_cree_une_alerte_interne_pour_le_dossier() {
        givenDossierEnAttente(null);

        service.submitComplement("ABCD1234", "Voici", null, "10.0.0.1", NOW);

        ArgumentCaptor<Notification> notif = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(notif.capture());
        assertThat(notif.getValue().getType()).isEqualTo(NotificationType.INTERNAL_ALERT);
        assertThat(notif.getValue().getChannel()).isEqualTo(NotificationChannel.PORTAL);
        assertThat(notif.getValue().getSubject()).isEqualTo("Complément reçu");
        assertThat(notif.getValue().getScheduledAt()).isEqualTo(NOW);
    }

    @Test
    void submitComplement_fichiers_seuls_sont_deposes_avec_le_code_de_suivi() {
        givenDossierEnAttente(null);
        List<MultipartFile> files = List.of(fichier("a.pdf"), fichier("b.pdf"));
        when(attachmentStorageService.upload(dossierId.toString(), files, "ABCD1234",
                null, null, null, null)).thenReturn(List.of(recu("a.pdf"), recu("b.pdf")));

        ComplementSubmissionResponse r = service.submitComplement(
                "ABCD1234", "", files, "10.0.0.1", NOW);

        assertThat(r.filesUploaded()).isEqualTo(2);
        verify(auditRecorder).addDeclarantObservation(any(Dossier.class),
                eq(ObservationType.COMPLEMENT_RESPONSE),
                eq("Pièces jointes uniquement (2 fichier(s))."), eq(demandeur), anyString());
    }

    @Test
    void submitComplement_apres_l_echeance_est_accepte_et_marque_en_retard() {
        givenDossierEnAttente(Instant.parse("2026-09-25T23:59:59Z"));

        ComplementSubmissionResponse r = service.submitComplement(
                "ABCD1234", "Désolé du retard", null, "10.0.0.1", NOW);

        assertThat(r.late()).isTrue();
        assertThat(r.status()).isEqualTo("EN_ETUDE_OPPORTUNITE");
        verify(auditRecorder).addDeclarantObservation(any(Dossier.class),
                eq(ObservationType.COMPLEMENT_RESPONSE),
                eq("Reçu en retard (échéance du 25/09/2026) — Désolé du retard"),
                eq(demandeur), anyString());
        verify(auditRecorder).recordStatusChange(any(Dossier.class), any(), any(),
                eq("Complément reçu du déclarant (en retard)"), eq(null), anyString());
    }

    @Test
    void submitComplement_les_fichiers_vides_sont_ignores() {
        givenDossierEnAttente(null);
        MultipartFile vide = new MockMultipartFile("files", "vide.pdf", "application/pdf", new byte[0]);

        ComplementSubmissionResponse r = service.submitComplement(
                "ABCD1234", "Message", List.of(vide), "10.0.0.1", NOW);

        assertThat(r.filesUploaded()).isZero();
        verifyNoInteractions(attachmentStorageService);
    }

    @Test
    void submitComplement_sans_message_ni_fichier_donne_400_sans_rien_lire() {
        assertThatThrownBy(() -> service.submitComplement("ABCD1234", "   ", null, "10.0.0.1", NOW))
                .isInstanceOf(BusinessException.class)
                .hasMessage("Joignez un message ou au moins un fichier");

        verifyNoInteractions(dossierRepository, attachmentStorageService, auditRecorder);
    }

    @Test
    void submitComplement_avec_uniquement_des_fichiers_vides_donne_400() {
        MultipartFile vide = new MockMultipartFile("files", "vide.pdf", "application/pdf", new byte[0]);

        assertThatThrownBy(() -> service.submitComplement("ABCD1234", null, List.of(vide), "10.0.0.1", NOW))
                .isInstanceOf(BusinessException.class);

        verifyNoInteractions(dossierRepository);
    }

    @Test
    void submitComplement_message_trop_long_donne_400() {
        String trop = "x".repeat(ComplementPublicService.MESSAGE_MAX_LENGTH + 1);

        assertThatThrownBy(() -> service.submitComplement("ABCD1234", trop, null, "10.0.0.1", NOW))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("2000");
    }

    @Test
    void submitComplement_plus_de_cinq_fichiers_donne_400() {
        List<MultipartFile> six = List.of(fichier("1"), fichier("2"), fichier("3"),
                fichier("4"), fichier("5"), fichier("6"));

        assertThatThrownBy(() -> service.submitComplement("ABCD1234", "Message", six, "10.0.0.1", NOW))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("5");

        verifyNoInteractions(dossierRepository, attachmentStorageService);
    }

    @Test
    void submitComplement_dossier_qui_n_attend_pas_de_complement_donne_409_sans_ecriture() {
        when(dossierRepository.findByAccessCode("ABCD1234"))
                .thenReturn(Optional.of(dossier(DossierStatus.EN_ETUDE_OPPORTUNITE, null)));

        assertThatThrownBy(() -> service.submitComplement("ABCD1234", "Message", null, "10.0.0.1", NOW))
                .isInstanceOf(ConflictException.class);

        verify(dossierRepository, never()).save(any());
        verifyNoInteractions(attachmentStorageService, auditRecorder, notificationRepository, auditService);
    }

    @Test
    void submitComplement_un_fichier_refuse_n_enregistre_rien_et_ne_change_pas_le_statut() {
        givenDossierEnAttente(null);
        List<MultipartFile> files = List.of(fichier("a.exe"));
        when(attachmentStorageService.upload(anyString(), any(), anyString(), any(), any(), any(), any()))
                .thenThrow(new BusinessException("Type de fichier non autorisé"));

        assertThatThrownBy(() -> service.submitComplement("ABCD1234", "Message", files, "10.0.0.1", NOW))
                .isInstanceOf(BusinessException.class)
                .hasMessage("Type de fichier non autorisé");

        verify(dossierRepository, never()).save(any());
        verifyNoInteractions(auditRecorder, notificationRepository, auditService);
    }

    @Test
    void submitComplement_un_double_envoi_simultane_remonte_le_verrou_optimiste_pour_donner_409() {
        givenDossierEnAttente(null);
        when(dossierRepository.save(any(Dossier.class)))
                .thenThrow(new org.springframework.orm.ObjectOptimisticLockingFailureException(
                        Dossier.class, dossierId));

        // GlobalExceptionHandler mappe cette exception en 409 : elle ne doit pas être avalée.
        assertThatThrownBy(() -> service.submitComplement("ABCD1234", "Message", null, "10.0.0.1", NOW))
                .isInstanceOf(org.springframework.orm.ObjectOptimisticLockingFailureException.class);

        verifyNoInteractions(notificationRepository, auditService);
    }

    @Test
    void submitComplement_fonctionne_pour_un_dossier_sans_declarant() {
        Dossier anonyme = dossier(DossierStatus.EN_ATTENTE_COMPLEMENT, null);
        assertThat(anonyme.getDeclarant()).isNull();
        when(dossierRepository.findByAccessCode("ABCD1234")).thenReturn(Optional.of(anonyme));
        when(observationRepository.findTopByDossierIdAndTypeOrderByCreatedAtDesc(
                dossierId, ObservationType.COMPLEMENT_REQUEST)).thenReturn(Optional.of(demande()));

        ComplementSubmissionResponse r = service.submitComplement(
                "ABCD1234", "Message", null, "10.0.0.1", NOW);

        assertThat(r.status()).isEqualTo("EN_ETUDE_OPPORTUNITE");
    }
```

Run: `mvn -o -q test -Dtest=ComplementPublicServiceTest 2>&1 | grep -E "cannot find symbol|submitComplement|ERROR" | head -4`
Expected: FAIL de compilation : `cannot find symbol ... submitComplement`.

- [ ] **Step 2: Implémenter `submitComplement`**

Dans `ComplementPublicService.java`, ajouter ces imports :

```java
import gov.bf.ascelc.univers_audits.enums.NotificationChannel;
import gov.bf.ascelc.univers_audits.enums.NotificationType;
import gov.bf.ascelc.univers_audits.model.dto.response.ComplementSubmissionResponse;
import gov.bf.ascelc.univers_audits.model.entity.Notification;
import org.springframework.web.multipart.MultipartFile;

import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.List;
```

Ajouter la constante :

```java
    private static final DateTimeFormatter DAY =
            DateTimeFormatter.ofPattern("dd/MM/yyyy").withZone(ZoneOffset.UTC);
```

Puis ajouter, après `getComplementRequest(String, Instant)` :

```java
    @Transactional
    public ComplementSubmissionResponse submitComplement(String accessCode, String message,
                                                         List<MultipartFile> files,
                                                         String ipAddress) {
        return submitComplement(accessCode, message, files, ipAddress, Instant.now());
    }

    ComplementSubmissionResponse submitComplement(String accessCode, String message,
                                                  List<MultipartFile> files,
                                                  String ipAddress, Instant now) {
        String text = message == null ? "" : message.trim();
        List<MultipartFile> attached = files == null ? List.of()
                : files.stream().filter(f -> f != null && !f.isEmpty()).toList();

        if (text.isEmpty() && attached.isEmpty()) {
            throw new BusinessException("Joignez un message ou au moins un fichier");
        }
        if (text.length() > MESSAGE_MAX_LENGTH) {
            throw new BusinessException(
                    "Le message ne doit pas dépasser " + MESSAGE_MAX_LENGTH + " caractères");
        }
        if (attached.size() > MAX_FILES) {
            throw new BusinessException("Maximum " + MAX_FILES + " fichiers par réponse");
        }

        Dossier dossier = findWaitingDossier(accessCode);
        Observation request = lastRequest(dossier);
        Instant deadline = dossier.getAdditionalInfoDeadline();
        boolean late = deadline != null && now.isAfter(deadline);

        // Les fichiers passent par le stockage existant : types, taille et code de suivi y sont
        // contrôlés. Le statut est encore EN_ATTENTE_COMPLEMENT, donc le dépôt est autorisé.
        int uploaded = attached.isEmpty() ? 0
                : attachmentStorageService.upload(dossier.getId().toString(), attached,
                        accessCode, null, null, null, null).size();

        String content = (late ? "Reçu en retard (échéance du " + DAY.format(deadline) + ") — " : "")
                + (text.isEmpty() ? "Pièces jointes uniquement (" + uploaded + " fichier(s))." : text);

        dossier.setStatus(DossierStatus.EN_ETUDE_OPPORTUNITE);
        dossierRepository.save(dossier);

        auditRecorder.addDeclarantObservation(dossier, ObservationType.COMPLEMENT_RESPONSE,
                content, request.getAuthor(), DECLARANT_LABEL);

        notificationRepository.save(Notification.builder()
                .dossier(dossier)
                .type(NotificationType.INTERNAL_ALERT)
                .channel(NotificationChannel.PORTAL)
                .subject("Complément reçu")
                .content("Le déclarant a répondu à la demande de complément"
                        + (late ? " (en retard)" : "") + ".")
                .scheduledAt(now)
                .build());

        auditRecorder.recordStatusChange(dossier,
                DossierStatus.EN_ATTENTE_COMPLEMENT, DossierStatus.EN_ETUDE_OPPORTUNITE,
                "Complément reçu du déclarant" + (late ? " (en retard)" : ""), null, ipAddress);

        auditService.logAction(null, DECLARANT_LABEL, null, "RECEVOIR_COMPLEMENT", "DOSSIER",
                dossier.getId().toString(),
                "Complément reçu via le portail" + (late ? " (en retard)" : "")
                        + " — " + uploaded + " fichier(s)",
                ipAddress, null);

        return new ComplementSubmissionResponse(
                DossierStatus.EN_ETUDE_OPPORTUNITE.name(), late, uploaded);
    }
```

- [ ] **Step 3: Vérifier que les tests passent**

Run: `mvn -o test -Dtest=ComplementPublicServiceTest 2>&1 | grep -E "Tests run:|FAIL|ERROR" | head -6`
Expected: `Tests run: 18, Failures: 0, Errors: 0`. Si un test signale `UnnecessaryStubbingException`, retirer le stub inutile du test concerné (jamais la vérification).

- [ ] **Step 4: Commit**

```bash
git add src/main/java/gov/bf/ascelc/univers_audits/service/ComplementPublicService.java \
        src/test/java/gov/bf/ascelc/univers_audits/service/ComplementPublicServiceTest.java
git commit -m "feat(complement): dépôt public de la réponse, passage automatique en étude

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 5: Routes, sécurité et limitation des essais

**Files:**
- Create: `src/main/java/gov/bf/ascelc/univers_audits/controller/ComplementPublicController.java`
- Modify: `src/main/java/gov/bf/ascelc/univers_audits/shared/config/SecurityConfig.java` (lignes 41-44)
- Modify: `src/main/java/gov/bf/ascelc/univers_audits/shared/config/RateLimitProperties.java`
- Modify: `src/main/java/gov/bf/ascelc/univers_audits/security/RateLimitFilter.java`
- Modify: `src/main/resources/application.properties` (après la ligne `rate-limit.stats-public.refill-minutes=1`)
- Test: `src/test/java/gov/bf/ascelc/univers_audits/controller/ComplementPublicControllerTest.java`
- Modify: `src/test/java/gov/bf/ascelc/univers_audits/security/RateLimitFilterTest.java`

**Interfaces:**
- Consumes: `ComplementPublicService.getComplementRequest(String)` et `submitComplement(String, String, List<MultipartFile>, String)` (Tasks 3 et 4) ; `AuditService.extractIp(HttpServletRequest)` (statique, déjà utilisé par `DossierController`) ; `ApiUrls.DOSSIERS`.
- Produces: `GET /api/v1/dossiers/public/complement/{accessCode}` et `POST` (multipart : `message`, `files`) ; règles de limitation `complementRead` (20/min) et `complementSubmit` (5/10 min).

- [ ] **Step 1: Écrire le test du contrôleur (échec attendu : le contrôleur n'existe pas)**

```java
package gov.bf.ascelc.univers_audits.controller;

import gov.bf.ascelc.univers_audits.model.dto.response.ComplementRequestResponse;
import gov.bf.ascelc.univers_audits.model.dto.response.ComplementSubmissionResponse;
import gov.bf.ascelc.univers_audits.service.ComplementPublicService;
import gov.bf.ascelc.univers_audits.shared.exceptions.ConflictException;
import gov.bf.ascelc.univers_audits.shared.exceptions.GlobalExceptionHandler;
import gov.bf.ascelc.univers_audits.shared.exceptions.ResourceNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class ComplementPublicControllerTest {

    private static final String URL = "/api/v1/dossiers/public/complement/ABCD1234";

    @Mock private ComplementPublicService service;
    private MockMvc mvc;

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.standaloneSetup(new ComplementPublicController(service))
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void get_renvoie_le_motif_et_l_echeance() throws Exception {
        when(service.getComplementRequest("ABCD1234")).thenReturn(new ComplementRequestResponse(
                "EN_ATTENTE_COMPLEMENT", "Fournissez les justificatifs",
                Instant.parse("2026-09-20T09:00:00Z"), Instant.parse("2026-09-30T23:59:59Z"), false));

        mvc.perform(get(URL))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("EN_ATTENTE_COMPLEMENT"))
                .andExpect(jsonPath("$.motif").value("Fournissez les justificatifs"))
                .andExpect(jsonPath("$.overdue").value(false));
    }

    @Test
    void get_code_inconnu_donne_404() throws Exception {
        when(service.getComplementRequest("ABCD1234"))
                .thenThrow(new ResourceNotFoundException("Dossier introuvable avec ce code d'accès"));

        mvc.perform(get(URL)).andExpect(status().isNotFound());
    }

    @Test
    void get_dossier_qui_n_attend_pas_de_complement_donne_409() throws Exception {
        when(service.getComplementRequest("ABCD1234"))
                .thenThrow(new ConflictException("Aucun complément n'est attendu pour ce dossier"));

        mvc.perform(get(URL)).andExpect(status().isConflict());
    }

    @Test
    @SuppressWarnings("unchecked")
    void post_transmet_le_message_les_fichiers_et_l_adresse_ip() throws Exception {
        when(service.submitComplement(eq("ABCD1234"), anyString(), any(), anyString()))
                .thenReturn(new ComplementSubmissionResponse("EN_ETUDE_OPPORTUNITE", false, 1));
        MockMultipartFile fichier = new MockMultipartFile(
                "files", "preuve.pdf", "application/pdf", "contenu".getBytes());

        mvc.perform(multipart(URL).file(fichier).param("message", "Voici mes pièces")
                        .with(request -> { request.setRemoteAddr("10.0.0.7"); return request; }))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("EN_ETUDE_OPPORTUNITE"))
                .andExpect(jsonPath("$.late").value(false))
                .andExpect(jsonPath("$.filesUploaded").value(1));

        ArgumentCaptor<List<MultipartFile>> files = ArgumentCaptor.forClass(List.class);
        verify(service).submitComplement(eq("ABCD1234"), eq("Voici mes pièces"), files.capture(), eq("10.0.0.7"));
        assertThat(files.getValue()).hasSize(1);
        assertThat(files.getValue().get(0).getOriginalFilename()).isEqualTo("preuve.pdf");
    }

    @Test
    void post_sans_fichier_est_accepte_quand_le_service_l_accepte() throws Exception {
        when(service.submitComplement(eq("ABCD1234"), anyString(), any(), anyString()))
                .thenReturn(new ComplementSubmissionResponse("EN_ETUDE_OPPORTUNITE", true, 0));

        mvc.perform(multipart(URL).param("message", "Seulement un message"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.late").value(true));
    }

    @Test
    void post_seconde_reponse_donne_409() throws Exception {
        when(service.submitComplement(eq("ABCD1234"), anyString(), any(), anyString()))
                .thenThrow(new ConflictException("Aucun complément n'est attendu pour ce dossier"));

        mvc.perform(multipart(URL).param("message", "Deuxième réponse"))
                .andExpect(status().isConflict());
    }
}
```

Run: `mvn -o -q test -Dtest=ComplementPublicControllerTest 2>&1 | grep -E "cannot find symbol|ComplementPublicController|ERROR" | head -4`
Expected: FAIL de compilation : `cannot find symbol ... ComplementPublicController`.

- [ ] **Step 2: Écrire le contrôleur**

```java
package gov.bf.ascelc.univers_audits.controller;

import gov.bf.ascelc.univers_audits.model.dto.response.ComplementRequestResponse;
import gov.bf.ascelc.univers_audits.model.dto.response.ComplementSubmissionResponse;
import gov.bf.ascelc.univers_audits.service.AuditService;
import gov.bf.ascelc.univers_audits.service.ComplementPublicService;
import gov.bf.ascelc.univers_audits.shared.utils.ApiUrls;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * Routes publiques (sans authentification) : le code de suivi sert de preuve. Elles sont
 * déclarées en permitAll dans SecurityConfig et limitées par RateLimitFilter.
 */
@RestController
@RequestMapping(ApiUrls.DOSSIERS + "/public/complement")
@RequiredArgsConstructor
public class ComplementPublicController {

    private final ComplementPublicService service;

    @GetMapping("/{accessCode}")
    public ResponseEntity<ComplementRequestResponse> getComplementRequest(
            @PathVariable String accessCode) {
        return ResponseEntity.ok(service.getComplementRequest(accessCode));
    }

    @PostMapping(value = "/{accessCode}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ComplementSubmissionResponse> submitComplement(
            @PathVariable String accessCode,
            @RequestParam(value = "message", required = false) String message,
            @RequestParam(value = "files", required = false) List<MultipartFile> files,
            HttpServletRequest request) {
        return ResponseEntity.ok(service.submitComplement(
                accessCode, message, files, AuditService.extractIp(request)));
    }
}
```

- [ ] **Step 3: Vérifier que le test du contrôleur passe**

Run: `mvn -o test -Dtest=ComplementPublicControllerTest 2>&1 | grep -E "Tests run:|FAIL|ERROR" | head -4`
Expected: `Tests run: 6, Failures: 0, Errors: 0`. Si `AuditService.extractIp` renvoie une valeur différente de `10.0.0.7` (en-tête `X-Forwarded-For` prioritaire), adapter l'attendu du test à ce que renvoie réellement `extractIp` sur une requête sans en-tête, jamais la méthode.

- [ ] **Step 4: Ouvrir les routes dans `SecurityConfig`**

Dans `SecurityConfig.java`, remplacer :

```java
                        .requestMatchers(HttpMethod.GET,
                                "/api/v1/dossiers/public/track/**").permitAll()
```

par :

```java
                        .requestMatchers(HttpMethod.GET,
                                "/api/v1/dossiers/public/track/**").permitAll()
                        .requestMatchers(HttpMethod.GET,
                                "/api/v1/dossiers/public/complement/**").permitAll()
                        .requestMatchers(HttpMethod.POST,
                                "/api/v1/dossiers/public/complement/**").permitAll()
```

- [ ] **Step 5: Tests de limitation (échec attendu) puis règles**

Ajouter à `RateLimitFilterTest` (imports déjà présents) :

```java
    @Test
    void doFilter_limite_la_lecture_du_complement_a_20_par_minute() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET",
                "/api/v1/dossiers/public/complement/ABCD1234");
        request.setRemoteAddr("10.0.0.1");
        when(rateLimiter.tryConsume(anyString(), anyInt(), any(Duration.class)))
                .thenReturn(new RateLimiter.RateLimitResult(true, 0));

        filter.doFilterInternal(request, new MockHttpServletResponse(), filterChain);

        verify(rateLimiter).tryConsume(anyString(), eq(20), eq(Duration.ofMinutes(1)));
    }

    @Test
    void doFilter_limite_l_envoi_du_complement_a_5_par_10_minutes_et_bloque_avec_429() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("POST",
                "/api/v1/dossiers/public/complement/ABCD1234");
        request.setRemoteAddr("10.0.0.1");
        MockHttpServletResponse response = new MockHttpServletResponse();
        when(rateLimiter.tryConsume(anyString(), anyInt(), any(Duration.class)))
                .thenReturn(new RateLimiter.RateLimitResult(false, 30));

        filter.doFilterInternal(request, response, filterChain);

        verify(rateLimiter).tryConsume(anyString(), eq(5), eq(Duration.ofMinutes(10)));
        assertThat(response.getStatus()).isEqualTo(429);
        verify(filterChain, never()).doFilter(any(), any());
    }
```

Run: `mvn -o -q test -Dtest=RateLimitFilterTest 2>&1 | grep -E "FAIL|Wanted but not invoked|never invoked" | head -4`
Expected: FAIL (aucune règle ne correspond encore : `tryConsume` n'est jamais appelé).

Dans `RateLimitProperties.java`, ajouter après `statsPublic` :

```java
    private Rule complementRead = new Rule(20, 1);
    private Rule complementSubmit = new Rule(5, 10);
```

Dans `RateLimitFilter.java`, remplacer la fin de la liste `rules` :

```java
                new RouteRule("GET", "/api/v1/stats/public", "statsPublic",
                        properties.getStatsPublic().getCapacity(),
                        Duration.ofMinutes(properties.getStatsPublic().getRefillMinutes()))
        );
```

par :

```java
                new RouteRule("GET", "/api/v1/stats/public", "statsPublic",
                        properties.getStatsPublic().getCapacity(),
                        Duration.ofMinutes(properties.getStatsPublic().getRefillMinutes())),
                new RouteRule("GET", "/api/v1/dossiers/public/complement/**", "complementRead",
                        properties.getComplementRead().getCapacity(),
                        Duration.ofMinutes(properties.getComplementRead().getRefillMinutes())),
                new RouteRule("POST", "/api/v1/dossiers/public/complement/**", "complementSubmit",
                        properties.getComplementSubmit().getCapacity(),
                        Duration.ofMinutes(properties.getComplementSubmit().getRefillMinutes()))
        );
```

Dans `application.properties`, ajouter après `rate-limit.stats-public.refill-minutes=1` :

```properties
rate-limit.complement-read.capacity=20
rate-limit.complement-read.refill-minutes=1
rate-limit.complement-submit.capacity=5
rate-limit.complement-submit.refill-minutes=10
```

- [ ] **Step 6: Vérifier que la limitation passe**

Run: `mvn -o test -Dtest='RateLimitFilterTest,ComplementPublicControllerTest' 2>&1 | grep -E "Tests run:|FAIL|ERROR" | head -5`
Expected: aucune ligne FAIL ni ERROR ; `Tests run` cumulés en succès.

- [ ] **Step 7: Commit**

```bash
git add src/main/java/gov/bf/ascelc/univers_audits/controller/ComplementPublicController.java \
        src/main/java/gov/bf/ascelc/univers_audits/shared/config/SecurityConfig.java \
        src/main/java/gov/bf/ascelc/univers_audits/shared/config/RateLimitProperties.java \
        src/main/java/gov/bf/ascelc/univers_audits/security/RateLimitFilter.java \
        src/main/resources/application.properties \
        src/test/java/gov/bf/ascelc/univers_audits/controller/ComplementPublicControllerTest.java \
        src/test/java/gov/bf/ascelc/univers_audits/security/RateLimitFilterTest.java
git commit -m "feat(complement): routes publiques, permitAll et limitation des essais

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 6: Vérification finale et livraison

**Files:** aucun (vérification).

- [ ] **Step 1: Suite complète**

Run: `mvn -o -q test 2>&1 | tail -30`
Expected: aucun échec nouveau par rapport à la base relevée à la Task 0. Toute régression dans `DossierServiceImplTest`, `RateLimitFilterTest` ou `AttachmentStorageServiceTest` est à corriger avant de continuer.

- [ ] **Step 2: Vérifier que rien d'inattendu n'est modifié**

Run: `git diff --stat feature/workflow-denociation-asce-fix..HEAD`
Expected: uniquement les fichiers listés dans les Tasks 1 à 5 (2 fichiers principaux modifiés dans `ObservationType` et `DossierAuditRecorder`, la migration 018, le nouveau service, le contrôleur, 2 DTO, `SecurityConfig`, `RateLimitProperties`, `RateLimitFilter`, `application.properties`, 5 fichiers de test).

- [ ] **Step 3: Vérification manuelle à faire par l'utilisateur sur un environnement avec base de données**

Les tests ci-dessus n'exercent ni Liquibase, ni Spring Security, ni la base réelle. À vérifier une fois la branche déployée en recette (adapter l'URL) :

```bash
# 1. Un dossier au statut « En attente de complément » (voir P07-03 du cahier), code CODE1234
curl -i https://denoncer.asce-lc.bf/api/v1/dossiers/public/complement/CODE1234
#    attendu : 200 avec motif, requestedAt, deadline, overdue — sans authentification

# 2. Réponse avec message et un fichier
curl -i -X POST -F "message=Voici les justificatifs demandés" -F "files=@preuve.pdf" \
     https://denoncer.asce-lc.bf/api/v1/dossiers/public/complement/CODE1234
#    attendu : 200 {"status":"EN_ETUDE_OPPORTUNITE","late":false,"filesUploaded":1}

# 3. Seconde réponse
curl -i -X POST -F "message=Encore" https://denoncer.asce-lc.bf/api/v1/dossiers/public/complement/CODE1234
#    attendu : 409

# 4. Côté agent : l'observation « Déclarant (via le portail) », la pièce jointe et le statut « En étude »
```

- [ ] **Step 4: Livraison**

Ne **pas** pousser sans accord. Présenter à l'utilisateur : la liste des commits, le résultat de la suite complète, et demander s'il faut pousser `feature/complement-portail` (nouvelle branche sur `univers-audits-back-end`) et ouvrir une pull request vers `feature/workflow-denociation-asce-fix`. Le volet front (plan `2026-09-26-complement-citoyen-front.md`) ne se déploie qu'après le back.
