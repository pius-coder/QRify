# QRIFY

## Scope fonctionnel complet et plan de développement technique selon la méthodologie APEX

**Nature :** projet académique
**Version du document :** 1.0
**Frontend :** SvelteKit avec TypeScript
**Backend :** Hono avec TypeScript sur Bun
**Base de développement :** SQLite natif Bun
**Bases futures :** MySQL ou PostgreSQL
**Accès aux données :** SQL direct, sans ORM
**Architecture :** deux projets séparés
**Méthode de développement :** Workflow APEX

---

# 1. PRÉSENTATION DU PROJET

## 1.1 Nom

**QRify**

## 1.2 Objectif

QRify est une application web académique de gestion de présence par QR code dynamique.

Elle permet à une entreprise de :

* créer son espace ;
* configurer ses horaires ;
* enregistrer ses employés ;
* afficher des QR codes en fonction de la période de la journée ;
* enregistrer les arrivées, pauses, retours de pause et départs ;
* calculer les retards, temps de pause, temps travaillé et heures supplémentaires ;
* détecter les absences ;
* consulter des statistiques et classements.

## 1.3 Positionnement académique

QRify représente un prototype SaaS multi-entreprises.

Le mot SaaS signifie ici que plusieurs entreprises peuvent utiliser la même application tout en conservant leurs données séparées.

Le projet ne comprend pas :

* la facturation ;
* les abonnements ;
* les paiements ;
* des garanties de disponibilité industrielles ;
* une infrastructure distribuée ;
* une application mobile native ;
* une intégration avec un système de paie réel.

---

# 2. OBJECTIFS DU MVP

Le MVP doit démontrer le scénario suivant :

1. un administrateur d’entreprise crée un compte ;
2. une entreprise et un code entreprise sont générés ;
3. l’administrateur configure les horaires ;
4. un employé s’inscrit avec le code entreprise ;
5. l’administrateur approuve l’employé ;
6. QRify détermine automatiquement le QR actif ;
7. l’employé scanne le QR ;
8. le système valide le scan ;
9. une présence journalière est mise à jour ;
10. les calculs de présence sont réalisés ;
11. l’employé consulte son historique ;
12. l’administrateur consulte ses employés et ses statistiques ;
13. le super administrateur supervise les entreprises.

---

# 3. PÉRIMÈTRE DU MVP

## 3.1 Fonctionnalités obligatoires

* inscription d’un administrateur d’entreprise ;
* création automatique de l’entreprise ;
* génération d’un code entreprise ;
* authentification JWT ;
* déconnexion ;
* identification de l’utilisateur connecté ;
* séparation des données par entreprise ;
* configuration des horaires ;
* configuration des jours travaillés ;
* inscription d’un employé avec un code entreprise ;
* approbation des employés ;
* suspension des employés ;
* génération des sessions QR ;
* écran public d’affichage du QR ;
* lecture du QR par la caméra ;
* validation du token QR ;
* contrôle de l’entreprise de l’employé ;
* contrôle de l’ordre des scans ;
* détection des doublons ;
* enregistrement des événements de scan ;
* création de la présence journalière ;
* calcul des retards ;
* calcul du temps de pause ;
* calcul du temps travaillé ;
* calcul des heures supplémentaires ;
* détection des absences ;
* historique personnel de l’employé ;
* tableau des présences de l’entreprise ;
* statistiques d’entreprise ;
* classements internes ;
* rapport hebdomadaire simple ;
* gestion des entreprises par le super administrateur ;
* suspension et réactivation d’une entreprise ;
* données de démonstration ;
* tests du scénario principal.

## 3.2 Fonctionnalités exclues

* géolocalisation du scan ;
* reconnaissance faciale ;
* empreinte digitale ;
* vérification de l’appareil ;
* scan hors connexion ;
* application Android ou iOS native ;
* gestion de plusieurs sites pour une même entreprise ;
* gestion de plusieurs équipes ou shifts ;
* horaires de nuit traversant deux dates ;
* planning individuel par employé ;
* jours fériés nationaux automatiques ;
* congés et permissions ;
* justificatifs d’absence ;
* intégration avec un logiciel de paie ;
* notifications par email ou SMS ;
* messagerie interne ;
* WebSocket ;
* facturation SaaS ;
* abonnements ;
* export comptable ;
* intelligence artificielle ;
* prédiction des absences ;
* système avancé de permissions ;
* audit de niveau industriel ;
* microservices ;
* Redis ;
* message broker ;
* ORM ;
* monorepo ;
* package partagé entre frontend et backend.

## 3.3 Fonctionnalités facultatives après le MVP

* export CSV du rapport hebdomadaire ;
* régénération du code entreprise ;
* correction manuelle d’une présence ;
* justification d’une absence ;
* ajout d’un logo d’entreprise ;
* export PDF ;
* deuxième horaire pour une équipe différente.

---

# 4. ACTEURS

## 4.1 Super administrateur

Le super administrateur appartient à QRify et n’est rattaché à aucune entreprise.

Il peut :

* consulter les entreprises ;
* rechercher une entreprise ;
* suspendre une entreprise ;
* réactiver une entreprise ;
* consulter les statistiques générales.

## 4.2 Administrateur d’entreprise

L’administrateur d’entreprise peut :

* créer son compte et son entreprise ;
* consulter et modifier les informations de l’entreprise ;
* consulter le code entreprise ;
* configurer les horaires ;
* consulter les employés en attente ;
* approuver ou rejeter un employé ;
* suspendre ou réactiver un employé ;
* consulter les présences ;
* filtrer les présences ;
* consulter les statistiques ;
* consulter les classements ;
* consulter un rapport hebdomadaire ;
* ouvrir l’écran public d’affichage du QR.

## 4.3 Employé

L’employé peut :

* s’inscrire avec un code entreprise ;
* se connecter après approbation ;
* scanner un QR ;
* consulter sa présence du jour ;
* consulter son historique ;
* consulter ses statistiques personnelles ;
* modifier ses informations personnelles simples.

## 4.4 Système

Le système doit :

* générer les sessions QR ;
* déterminer le QR actif ;
* vérifier les scans ;
* appliquer les règles de séquence ;
* calculer les données de présence ;
* détecter les absences ;
* isoler les données de chaque entreprise.

---

# 5. PRINCIPES MÉTIER

## 5.1 Isolation multi-tenant

Toutes les données d’entreprise doivent être filtrées par `company_id`.

Le `company_id` utilisé par les routes privées doit provenir de l’utilisateur authentifié.

Le backend ne doit jamais faire confiance à un `company_id` envoyé librement par le frontend.

Un administrateur de l’entreprise A ne doit jamais pouvoir :

* consulter les employés de l’entreprise B ;
* consulter les présences de l’entreprise B ;
* modifier les horaires de l’entreprise B ;
* consulter les statistiques de l’entreprise B.

## 5.2 Appartenance d’un utilisateur

Dans le MVP :

* un administrateur d’entreprise appartient à une entreprise ;
* un employé appartient à une entreprise ;
* un super administrateur n’appartient à aucune entreprise ;
* un utilisateur ne peut pas appartenir à plusieurs entreprises.

## 5.3 Code entreprise

Le code entreprise :

* est généré automatiquement ;
* est unique ;
* est lisible ;
* est utilisé pour l’inscription des employés ;
* ne constitue pas à lui seul une preuve d’autorisation ;
* associe le nouvel employé à l’entreprise ;
* place le compte employé en attente d’approbation.

Exemple de code :

`ABC7X91Q`

## 5.4 Approbation d’un employé

Après inscription :

* le compte possède le statut `PENDING`;
* l’administrateur voit le compte dans les demandes ;
* l’administrateur peut l’approuver ou le rejeter ;
* seul un employé `ACTIVE` peut scanner un QR ;
* un employé `SUSPENDED` ne peut plus se connecter ni scanner.

## 5.5 Horaires

Une entreprise possède un horaire principal.

Les informations sont :

* fuseau horaire ;
* jours travaillés ;
* heure de début ;
* heure de début de pause ;
* heure de retour de pause ;
* heure de fin ;
* tolérance de retard.

Les horaires de nuit traversant minuit ne sont pas pris en charge dans le MVP.

## 5.6 Types d’événements QR

Les types retenus sont :

* `ARRIVAL` : arrivée ;
* `BREAK_START` : début de pause ;
* `BREAK_END` : retour de pause ;
* `DEPARTURE` : départ.

`RETARD` n’est pas un type d’événement.

Le retard est un résultat calculé après un scan `ARRIVAL`.

`PRE_FIN` n’est pas un événement enregistré.

La fenêtre du QR `DEPARTURE` peut commencer avant l’heure officielle de fin.

## 5.7 Séquence normale

La séquence normale est :

```text
ARRIVAL
   ↓
BREAK_START
   ↓
BREAK_END
   ↓
DEPARTURE
```

Règles :

* `ARRIVAL` doit être le premier scan de la journée ;
* un deuxième `ARRIVAL` est rejeté ;
* `BREAK_START` nécessite une arrivée ;
* `BREAK_END` nécessite un début de pause ;
* `DEPARTURE` nécessite une arrivée ;
* un deuxième événement du même type est rejeté ;
* un scan expiré est rejeté ;
* un QR d’une autre entreprise est rejeté.

## 5.8 Journée sans pause

Une entreprise peut avoir une pause configurée, mais un employé peut ne pas la scanner.

Dans ce cas :

* si aucun des deux scans de pause n’existe, la pause enregistrée vaut zéro ;
* si un seul des deux scans existe, la présence est marquée `INCOMPLETE`;
* les calculs nécessitant la paire complète ne sont pas considérés comme définitifs.

## 5.9 Statuts de présence

Les statuts retenus sont :

* `PRESENT`;
* `LATE`;
* `ABSENT`;
* `INCOMPLETE`.

Priorité des statuts :

1. `ABSENT` si aucune arrivée n’existe après la clôture de la journée ;
2. `INCOMPLETE` si des informations essentielles sont manquantes ;
3. `LATE` si le retard est supérieur à zéro ;
4. `PRESENT` dans les autres cas.

---

# 6. CALCULS MÉTIER

## 6.1 Retard

Le seuil de retard est :

```text
heure de début + tolérance
```

Le calcul est :

```text
retard = heure d’arrivée - seuil de retard
```

Si le résultat est négatif, le retard vaut zéro.

Exemple :

* début : 08:00 ;
* tolérance : 10 minutes ;
* arrivée : 08:20 ;
* retard comptabilisé : 10 minutes.

## 6.2 Temps de pause

Si les deux événements existent :

```text
temps de pause = retour de pause - début de pause
```

Si aucun événement de pause n’existe :

```text
temps de pause = 0
```

Si un seul événement existe :

* le temps de pause n’est pas finalisé ;
* la présence devient `INCOMPLETE`.

## 6.3 Temps travaillé

Le temps travaillé est :

```text
départ - arrivée - temps de pause
```

Le temps travaillé ne peut pas être négatif.

Il n’est finalisé qu’après le scan de départ.

## 6.4 Heures supplémentaires

Le calcul est :

```text
départ - heure de fin prévue
```

Si le résultat est négatif, les heures supplémentaires valent zéro.

## 6.5 Absence

Un employé est absent si :

* il est actif ;
* le jour est un jour travaillé ;
* l’entreprise est active ;
* aucune arrivée n’a été enregistrée ;
* la journée est terminée dans le fuseau horaire de l’entreprise.

## 6.6 Journée locale et UTC

Les horaires sont interprétés selon le fuseau horaire de l’entreprise.

Les instants réels sont enregistrés en UTC.

La date de travail est calculée dans le fuseau horaire de l’entreprise.

---

# 7. ARCHITECTURE GÉNÉRALE

QRify utilise deux projets séparés.

```text
qrify-frontend/
qrify-backend/
```

Il n’existe pas :

* de workspace Bun ;
* de monorepo ;
* de package `shared`;
* de dépendances à la racine ;
* de fichiers TypeScript partagés automatiquement.

Les types utiles pourront exister dans les deux projets.

Le backend reste la source de vérité concernant :

* les statuts ;
* les validations ;
* les permissions ;
* les calculs ;
* les contrats de réponse.

---

# 8. INITIALISATION AVEC LES CLI

## 8.1 Backend

Le backend doit être initialisé avec le CLI officiel de Hono en sélectionnant :

* le template Bun ;
* TypeScript ;
* l’installation avec Bun.

Le squelette ne doit pas être créé manuellement.

## 8.2 Frontend

Le frontend doit être initialisé avec le CLI officiel Svelte en sélectionnant :

* SvelteKit ;
* TypeScript ;
* le template minimal ;
* Bun comme gestionnaire de paquets ;
* ESLint ;
* Prettier ;
* Tailwind CSS si retenu ;
* Playwright pour le test du scénario principal.

Le squelette ne doit pas être créé manuellement.

---

# 9. STRUCTURE DU BACKEND

```text
qrify-backend/
├── src/
│   ├── index.ts
│   ├── app.ts
│   │
│   ├── config/
│   │   ├── env.ts
│   │   ├── auth.config.ts
│   │   ├── qr.config.ts
│   │   └── schedule.config.ts
│   │
│   ├── database/
│   │   ├── database.types.ts
│   │   ├── database.factory.ts
│   │   │
│   │   ├── adapters/
│   │   │   ├── database.adapter.ts
│   │   │   └── sqlite.adapter.ts
│   │   │
│   │   └── repositories/
│   │       ├── contracts/
│   │       │   ├── company.repository.ts
│   │       │   ├── user.repository.ts
│   │       │   ├── schedule.repository.ts
│   │       │   ├── qr-session.repository.ts
│   │       │   ├── scan-event.repository.ts
│   │       │   ├── attendance.repository.ts
│   │       │   └── statistics.repository.ts
│   │       │
│   │       └── sqlite/
│   │           ├── sqlite-company.repository.ts
│   │           ├── sqlite-user.repository.ts
│   │           ├── sqlite-schedule.repository.ts
│   │           ├── sqlite-qr-session.repository.ts
│   │           ├── sqlite-scan-event.repository.ts
│   │           ├── sqlite-attendance.repository.ts
│   │           └── sqlite-statistics.repository.ts
│   │
│   ├── modules/
│   │   ├── auth/
│   │   ├── companies/
│   │   ├── schedules/
│   │   ├── employees/
│   │   ├── qr/
│   │   ├── scans/
│   │   ├── attendances/
│   │   ├── statistics/
│   │   └── super-admin/
│   │
│   ├── middlewares/
│   │   ├── auth.middleware.ts
│   │   ├── role.middleware.ts
│   │   ├── tenant.middleware.ts
│   │   ├── csrf.middleware.ts
│   │   ├── cors.middleware.ts
│   │   └── error.middleware.ts
│   │
│   ├── jobs/
│   │   ├── job-runner.ts
│   │   └── absence.job.ts
│   │
│   ├── services/
│   │   ├── token.service.ts
│   │   ├── password.service.ts
│   │   ├── clock.service.ts
│   │   └── id.service.ts
│   │
│   ├── utils/
│   │   ├── api-response.ts
│   │   ├── errors.ts
│   │   ├── pagination.ts
│   │   └── dates.ts
│   │
│   └── types/
│       ├── auth.types.ts
│       ├── hono.types.ts
│       └── common.types.ts
│
├── migrations/
│   ├── sqlite/
│   ├── mysql/
│   └── postgres/
│
├── scripts/
│   ├── migrate.ts
│   ├── seed.ts
│   └── reset-database.ts
│
├── data/
│   └── qrify.sqlite
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── api/
│
├── .env
├── .env.example
├── package.json
└── tsconfig.json
```

## 9.1 Structure d’un module backend

Exemple pour le module des scans :

```text
modules/scans/
├── scan.routes.ts
├── scan.service.ts
├── scan.schema.ts
├── scan.types.ts
└── scan.errors.ts
```

Les responsabilités sont :

* `routes` : réception de la requête et réponse HTTP ;
* `service` : règles métier ;
* `schema` : validation Zod ;
* `types` : types locaux ;
* `errors` : erreurs métier spécifiques.

Il n’est pas nécessaire d’ajouter une couche controller séparée.

---

# 10. REPOSITORIES ET COMPATIBILITÉ DES BASES

## 10.1 Objectif

Les services métier ne doivent pas dépendre directement de SQLite.

Ils doivent dépendre de contrats comme :

* `UserRepository`;
* `CompanyRepository`;
* `AttendanceRepository`;
* `QrSessionRepository`.

## 10.2 Implémentation du MVP

Le MVP implémente uniquement :

* l’adapter SQLite ;
* les repositories SQLite ;
* les migrations SQLite.

## 10.3 Préparation de MySQL et PostgreSQL

Les contrats seront conçus pour permettre plus tard :

```text
repositories/mysql/
repositories/postgres/
```

Les implémentations MySQL et PostgreSQL ne sont pas obligatoires pour valider le MVP académique.

## 10.4 Règles de portabilité

* les identifiants sont générés par l’application ;
* les méthodes de repository retournent des promesses ;
* les services ne contiennent pas de SQL ;
* les routes ne contiennent pas de SQL ;
* les requêtes utilisent des paramètres ;
* les dates sont enregistrées de manière uniforme ;
* les migrations sont séparées par moteur ;
* les fonctions SQL propres à un moteur sont évitées dans les services ;
* un repository générique universel n’est pas utilisé.

## 10.5 Sélection du moteur

Une variable d’environnement détermine le moteur :

* `sqlite`;
* ultérieurement `mysql`;
* ultérieurement `postgres`.

La factory crée les repositories adaptés.

---

# 11. STRUCTURE DU FRONTEND

```text
qrify-frontend/
├── src/
│   ├── app.html
│   ├── app.d.ts
│   ├── hooks.server.ts
│   │
│   ├── lib/
│   │   ├── api/
│   │   │   ├── api-client.ts
│   │   │   ├── auth.api.ts
│   │   │   ├── company.api.ts
│   │   │   ├── schedule.api.ts
│   │   │   ├── employee.api.ts
│   │   │   ├── qr.api.ts
│   │   │   ├── attendance.api.ts
│   │   │   ├── statistics.api.ts
│   │   │   └── super-admin.api.ts
│   │   │
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   ├── layout/
│   │   │   ├── auth/
│   │   │   ├── company/
│   │   │   ├── employees/
│   │   │   ├── qr/
│   │   │   ├── attendance/
│   │   │   └── statistics/
│   │   │
│   │   ├── stores/
│   │   │   ├── auth.store.ts
│   │   │   └── toast.store.ts
│   │   │
│   │   ├── schemas/
│   │   │   ├── auth.schema.ts
│   │   │   ├── company.schema.ts
│   │   │   └── schedule.schema.ts
│   │   │
│   │   ├── types/
│   │   │   ├── auth.types.ts
│   │   │   ├── company.types.ts
│   │   │   ├── employee.types.ts
│   │   │   ├── qr.types.ts
│   │   │   ├── attendance.types.ts
│   │   │   └── statistics.types.ts
│   │   │
│   │   └── utils/
│   │       ├── dates.ts
│   │       ├── durations.ts
│   │       ├── statuses.ts
│   │       └── api-errors.ts
│   │
│   └── routes/
│       ├── +page.svelte
│       ├── login/
│       ├── register/
│       │   ├── company/
│       │   └── employee/
│       ├── display/
│       │   └── [companyCode]/
│       ├── employee/
│       ├── admin/
│       └── super-admin/
│
├── static/
├── tests/
│   ├── unit/
│   ├── components/
│   └── e2e/
│
├── .env
├── .env.example
├── package.json
├── svelte.config.js
├── vite.config.ts
└── tsconfig.json
```

---

# 12. ROUTES DU FRONTEND

## 12.1 Routes publiques

```text
/
/login
/register/company
/register/employee
/display/[companyCode]
```

## 12.2 Routes employé

```text
/employee/dashboard
/employee/scan
/employee/history
/employee/history/[date]
/employee/profile
```

## 12.3 Routes administrateur d’entreprise

```text
/admin/dashboard
/admin/company
/admin/schedule
/admin/employees
/admin/employees/[id]
/admin/attendances
/admin/attendances/[id]
/admin/statistics
/admin/rankings
/admin/reports/weekly
```

## 12.4 Routes super administrateur

```text
/super-admin/dashboard
/super-admin/companies
/super-admin/companies/[id]
```

---

# 13. MODÈLE DE DONNÉES

## 13.1 Table `companies`

Champs :

* `id`;
* `name`;
* `company_code`;
* `timezone`;
* `status`;
* `created_at`;
* `updated_at`.

Statuts :

* `ACTIVE`;
* `SUSPENDED`.

Contraintes :

* identifiant unique ;
* code entreprise unique ;
* nom obligatoire ;
* fuseau horaire obligatoire.

## 13.2 Table `users`

Champs :

* `id`;
* `company_id`;
* `first_name`;
* `last_name`;
* `email`;
* `password_hash`;
* `role`;
* `status`;
* `created_at`;
* `updated_at`.

Rôles :

* `SUPER_ADMIN`;
* `COMPANY_ADMIN`;
* `EMPLOYEE`.

Statuts :

* `PENDING`;
* `ACTIVE`;
* `REJECTED`;
* `SUSPENDED`.

Contraintes :

* email unique ;
* `company_id` obligatoire sauf pour le super administrateur ;
* le super administrateur doit avoir `company_id = null`.

## 13.3 Table `work_schedules`

Champs :

* `id`;
* `company_id`;
* `start_time`;
* `break_start_time`;
* `break_end_time`;
* `end_time`;
* `late_tolerance_minutes`;
* `created_at`;
* `updated_at`.

Contraintes :

* une configuration principale par entreprise ;
* heure de début avant le début de pause ;
* début de pause avant retour de pause ;
* retour de pause avant fin ;
* tolérance supérieure ou égale à zéro.

## 13.4 Table `work_schedule_days`

Champs :

* `id`;
* `schedule_id`;
* `weekday`.

Valeurs :

* 1 pour lundi ;
* 2 pour mardi ;
* 3 pour mercredi ;
* 4 pour jeudi ;
* 5 pour vendredi ;
* 6 pour samedi ;
* 7 pour dimanche.

Contrainte unique :

* une combinaison `schedule_id + weekday`.

## 13.5 Table `qr_sessions`

Champs :

* `id`;
* `company_id`;
* `work_date`;
* `event_type`;
* `token_hash`;
* `valid_from`;
* `valid_until`;
* `status`;
* `created_at`.

Types :

* `ARRIVAL`;
* `BREAK_START`;
* `BREAK_END`;
* `DEPARTURE`.

Statuts :

* `SCHEDULED`;
* `ACTIVE`;
* `EXPIRED`;
* `REVOKED`.

Contraintes :

* une session active unique pour une entreprise, une date et un type ;
* date de fin supérieure à la date de début.

## 13.6 Table `scan_events`

Cette table conserve l’historique brut des tentatives.

Champs :

* `id`;
* `company_id`;
* `user_id`;
* `qr_session_id`;
* `event_type`;
* `scanned_at`;
* `result`;
* `created_at`.

Résultats possibles :

* `ACCEPTED`;
* `DUPLICATE`;
* `EXPIRED`;
* `INVALID_SEQUENCE`;
* `WRONG_COMPANY`;
* `USER_NOT_ACTIVE`;
* `COMPANY_SUSPENDED`;
* `INVALID_TOKEN`.

## 13.7 Table `attendance_records`

Champs :

* `id`;
* `company_id`;
* `user_id`;
* `work_date`;
* `arrival_at`;
* `break_start_at`;
* `break_end_at`;
* `departure_at`;
* `status`;
* `late_minutes`;
* `break_minutes`;
* `worked_minutes`;
* `overtime_minutes`;
* `created_at`;
* `updated_at`.

Contrainte unique :

```text
company_id + user_id + work_date
```

## 13.8 Tables volontairement supprimées

Le MVP n’a pas besoin de :

* table `absences`;
* table `rankings`;
* table `statistics`;
* table `weekly_reports`;
* table `subscriptions`;
* table `invoices`.

Les absences, classements et statistiques sont calculés à partir de `attendance_records`.

---

# 14. INDEXES RECOMMANDÉS

* index unique sur `companies.company_code`;
* index unique sur `users.email`;
* index sur `users.company_id`;
* index sur `users.company_id + status`;
* index sur `qr_sessions.company_id + work_date`;
* index sur `qr_sessions.token_hash`;
* index sur `scan_events.user_id + scanned_at`;
* index sur `attendance_records.company_id + work_date`;
* index sur `attendance_records.user_id + work_date`;
* index unique sur `attendance_records.company_id + user_id + work_date`.

---

# 15. API REST

Préfixe :

```text
/api/v1
```

## 15.1 Authentification

```text
POST /auth/register/company
POST /auth/register/employee
POST /auth/login
POST /auth/logout
GET  /auth/me
```

## 15.2 Entreprise

```text
GET /company
PUT /company
GET /company/code
```

## 15.3 Horaire

```text
GET /company/schedule
PUT /company/schedule
```

## 15.4 Employés

```text
GET   /employees
GET   /employees/:id
PATCH /employees/:id/status
```

## 15.5 QR public et QR actif

```text
GET /public/companies/:companyCode/active-qr
GET /company/qr/status
```

## 15.6 Scans

```text
POST /scans
```

## 15.7 Présence personnelle

```text
GET /me/attendance/today
GET /me/attendances
GET /me/attendances/:date
GET /me/attendance-summary
```

## 15.8 Présences d’entreprise

```text
GET /attendances
GET /attendances/:id
POST /attendances/run-absence-detection
```

Le déclenchement manuel est limité au développement, à la démonstration ou au super administrateur.

## 15.9 Statistiques

```text
GET /statistics/dashboard
GET /statistics/attendance
GET /statistics/rankings
GET /reports/weekly
```

## 15.10 Super administration

```text
GET   /super-admin/companies
GET   /super-admin/companies/:id
PATCH /super-admin/companies/:id/status
GET   /super-admin/statistics
```

---

# 16. FORMAT DES RÉPONSES API

## 16.1 Succès

Une réponse réussie contient :

* `success`;
* `data`;
* éventuellement `meta`;
* éventuellement `message`.

## 16.2 Erreur

Une réponse en erreur contient :

* `success = false`;
* `error.code`;
* `error.message`;
* éventuellement `error.fields`.

## 16.3 Codes HTTP

* `200` : lecture ou modification réussie ;
* `201` : création réussie ;
* `204` : action sans contenu ;
* `400` : requête invalide ;
* `401` : authentification absente ou invalide ;
* `403` : accès interdit ;
* `404` : ressource inexistante ;
* `409` : conflit ou doublon ;
* `422` : validation incorrecte ;
* `500` : erreur interne.

---

# 17. AUTHENTIFICATION ET SÉCURITÉ

## 17.1 JWT

Le JWT contient au minimum :

* identifiant utilisateur ;
* rôle ;
* identifiant entreprise ;
* statut utilisateur.

Le backend vérifie néanmoins l’état réel de l’utilisateur pour les opérations sensibles.

## 17.2 Stockage du JWT

Le JWT doit être placé dans un cookie :

* `HttpOnly`;
* `Secure` en production ;
* `SameSite` adapté ;
* durée limitée.

## 17.3 CSRF

Les opérations de modification doivent utiliser :

* contrôle de l’origine ;
* contrôle du site d’origine ;
* token CSRF pour les opérations mutatives ;
* vérification côté backend.

## 17.4 Mots de passe

* hachage bcrypt ;
* aucun mot de passe en clair ;
* longueur minimale ;
* aucune exposition du hash dans les réponses ;
* comparaison sécurisée.

## 17.5 Validation

Toutes les entrées sont validées côté backend avec Zod.

La validation frontend améliore l’expérience, mais ne remplace pas la validation backend.

## 17.6 SQL

Toutes les requêtes utilisent des paramètres.

Aucune concaténation directe d’entrée utilisateur dans une requête SQL n’est autorisée.

## 17.7 Tokens QR

* token aléatoire difficile à deviner ;
* token limité dans le temps ;
* hash du token enregistré dans la base ;
* token lié à une entreprise ;
* token lié à un type d’événement ;
* token inutilisable après expiration ;
* token inutilisable par un employé d’une autre entreprise.

---

# 18. PLAN PAR FEATURES ET USER STORIES

---

# FEATURE F00 — INITIALISATION DES DEUX PROJETS

## Objectif

Créer les fondations techniques sans fonctionnalité métier.

## TS-F00-01 — Initialiser le backend

**Priorité : P0**

En tant que développeur, je veux initialiser le backend avec le CLI Hono et Bun afin de disposer d’une API indépendante.

### Critères d’acceptation

* le projet est généré par le CLI Hono ;
* le template Bun est utilisé ;
* le serveur démarre avec Bun ;
* une route de santé répond correctement ;
* TypeScript fonctionne ;
* aucun ORM n’est installé ;
* le projet possède son propre `package.json`.

## TS-F00-02 — Initialiser le frontend

**Priorité : P0**

En tant que développeur, je veux initialiser le frontend avec le CLI Svelte et Bun afin de disposer d’une application indépendante.

### Critères d’acceptation

* le projet est généré par le CLI Svelte ;
* SvelteKit et TypeScript sont activés ;
* Bun est utilisé pour les dépendances ;
* le projet démarre séparément ;
* le projet possède son propre `package.json`;
* aucune dépendance directe vers le backend n’existe.

## TS-F00-03 — Configurer la communication

**Priorité : P0**

En tant que développeur, je veux connecter le frontend à l’API afin de tester la communication entre les deux applications.

### Critères d’acceptation

* l’URL de l’API provient d’une variable d’environnement ;
* le backend possède une liste CORS autorisée ;
* le frontend peut appeler la route de santé ;
* les erreurs réseau sont affichées proprement ;
* aucune URL serveur n’est écrite directement dans les composants.

## Scope backend

* point d’entrée ;
* création de l’application Hono ;
* configuration d’environnement ;
* CORS ;
* route de santé ;
* gestion globale des erreurs.

## Scope frontend

* client API central ;
* variable d’environnement ;
* page d’accueil minimale ;
* test de communication.

## Tâches APEX

* `F00-backend-bootstrap`;
* `F00-frontend-bootstrap`.

---

# FEATURE F01 — BASE SQLITE ET REPOSITORIES PORTABLES

## Objectif

Créer la persistance SQLite sans lier les services métier au moteur.

## TS-F01-01 — Initialiser SQLite

**Priorité : P0**

En tant que développeur, je veux utiliser SQLite natif Bun afin de stocker les données du MVP sans serveur de base externe.

### Critères d’acceptation

* la base est ouverte par l’adapter SQLite ;
* les clés étrangères sont activées ;
* les migrations peuvent être exécutées ;
* la base peut être réinitialisée ;
* les requêtes utilisent des paramètres ;
* les erreurs SQLite sont transformées en erreurs applicatives.

## TS-F01-02 — Définir les contrats de repositories

**Priorité : P0**

En tant que développeur, je veux définir des repositories indépendants afin de pouvoir remplacer SQLite plus tard.

### Critères d’acceptation

* chaque domaine principal possède un contrat ;
* les services dépendent des contrats ;
* le SQL reste dans les implémentations SQLite ;
* toutes les méthodes sont asynchrones du point de vue du service ;
* une factory fournit les repositories ;
* aucun type SQLite ne remonte dans les services.

## TS-F01-03 — Migrations et données initiales

**Priorité : P0**

En tant que développeur, je veux pouvoir migrer et initialiser la base afin de reproduire facilement l’environnement.

### Critères d’acceptation

* les tables du MVP sont créées par migration ;
* les contraintes sont présentes ;
* les indexes sont présents ;
* un super administrateur de démonstration est créé ;
* des données fictives peuvent être chargées ;
* les scripts sont répétables de manière contrôlée.

## Scope backend

* adapter SQLite ;
* contrats repositories ;
* implémentations SQLite ;
* migrations ;
* seed ;
* factory de base.

## Scope frontend

Aucun écran métier.

## Tests

* migration sur base vide ;
* intégrité des clés étrangères ;
* unicité email ;
* unicité code entreprise ;
* unicité présence quotidienne ;
* repository sur base temporaire.

## Tâche APEX

* `F01-sqlite-repositories`.

---

# FEATURE F02 — AUTHENTIFICATION ET AUTORISATION

## US-F02-01 — Inscription d’un administrateur d’entreprise

**Priorité : P0**

En tant que responsable d’entreprise, je veux créer un compte afin de commencer à utiliser QRify.

### Critères d’acceptation

* le formulaire demande le nom de l’entreprise ;
* le formulaire demande prénom, nom, email et mot de passe ;
* l’email doit être unique ;
* le mot de passe est validé et haché ;
* une entreprise est créée ;
* un code entreprise unique est généré ;
* l’utilisateur reçoit le rôle `COMPANY_ADMIN`;
* l’utilisateur devient actif ;
* l’utilisateur est rattaché à l’entreprise créée ;
* une erreur complète annule l’ensemble de la transaction.

## US-F02-02 — Inscription d’un employé

**Priorité : P0**

En tant qu’employé, je veux créer un compte avec le code de mon entreprise afin de demander l’accès à QRify.

### Critères d’acceptation

* le formulaire demande prénom, nom, email, mot de passe et code entreprise ;
* le code doit correspondre à une entreprise active ;
* l’email doit être unique ;
* le compte reçoit le rôle `EMPLOYEE`;
* le compte est rattaché à l’entreprise ;
* le statut initial est `PENDING`;
* l’employé ne peut pas scanner avant approbation ;
* un message indique que l’approbation est en attente.

## US-F02-03 — Connexion

**Priorité : P0**

En tant qu’utilisateur actif, je veux me connecter afin d’accéder à mon espace.

### Critères d’acceptation

* l’utilisateur fournit email et mot de passe ;
* un mot de passe incorrect retourne une erreur générique ;
* un compte en attente reçoit un message spécifique ;
* un compte suspendu ne peut pas se connecter ;
* un utilisateur d’une entreprise suspendue ne peut pas se connecter ;
* un JWT valide est créé ;
* le JWT est placé dans un cookie sécurisé ;
* la réponse ne contient pas le hash du mot de passe ;
* l’utilisateur est redirigé selon son rôle.

## US-F02-04 — Déconnexion et session courante

**Priorité : P0**

En tant qu’utilisateur connecté, je veux consulter ma session et me déconnecter.

### Critères d’acceptation

* l’API peut retourner l’utilisateur connecté ;
* les informations comprennent le rôle et l’entreprise ;
* le frontend restaure l’état de connexion au chargement ;
* la déconnexion invalide le cookie ;
* les routes protégées deviennent inaccessibles ;
* l’utilisateur est redirigé vers la connexion.

## Scope backend

* routes d’authentification ;
* service d’authentification ;
* validation Zod ;
* hachage bcrypt ;
* JWT ;
* cookie ;
* middleware d’authentification ;
* middleware de rôle ;
* middleware de tenant ;
* transaction d’inscription entreprise.

## Scope frontend

* inscription entreprise ;
* inscription employé ;
* connexion ;
* attente d’approbation ;
* gestion de session ;
* redirections par rôle ;
* déconnexion.

## Tests critiques

* email dupliqué ;
* code entreprise invalide ;
* entreprise suspendue ;
* employé en attente ;
* mot de passe incorrect ;
* route entreprise appelée par employé ;
* route super administrateur appelée par entreprise.

## Tâches APEX

* `F02-auth-backend`;
* `F02-auth-frontend`.

---

# FEATURE F03 — PROFIL ENTREPRISE

## US-F03-01 — Consulter l’entreprise

**Priorité : P0**

En tant qu’administrateur d’entreprise, je veux consulter les informations de mon entreprise.

### Critères d’acceptation

* seules les informations de son entreprise sont retournées ;
* le code entreprise est visible ;
* le fuseau horaire est visible ;
* le statut est visible ;
* aucune donnée d’une autre entreprise n’est exposée.

## US-F03-02 — Modifier l’entreprise

**Priorité : P1**

En tant qu’administrateur d’entreprise, je veux modifier le nom et le fuseau horaire de mon entreprise.

### Critères d’acceptation

* seul l’administrateur de l’entreprise peut modifier ;
* le nom est obligatoire ;
* le fuseau horaire est validé ;
* le code entreprise n’est pas modifié ;
* la modification est immédiatement visible ;
* une entreprise suspendue ne peut pas être modifiée.

## US-F03-03 — Consulter le code entreprise

**Priorité : P0**

En tant qu’administrateur d’entreprise, je veux copier le code entreprise afin de le communiquer aux employés.

### Critères d’acceptation

* le code est affiché clairement ;
* un bouton permet de le copier ;
* le code ne peut pas être modifié dans le MVP ;
* le code n’est visible que par l’administrateur concerné.

## Tâches APEX

* `F03-company-backend`;
* `F03-company-frontend`.

---

# FEATURE F04 — CONFIGURATION DES HORAIRES

## US-F04-01 — Créer l’horaire

**Priorité : P0**

En tant qu’administrateur d’entreprise, je veux définir l’horaire principal afin que QRify puisse déterminer les scans attendus.

### Critères d’acceptation

* l’administrateur sélectionne les jours travaillés ;
* il renseigne l’heure de début ;
* il renseigne l’heure de pause ;
* il renseigne l’heure de retour ;
* il renseigne l’heure de fin ;
* il renseigne la tolérance de retard ;
* au moins un jour travaillé est nécessaire ;
* l’ordre chronologique des heures est vérifié ;
* les valeurs sont enregistrées pour son entreprise uniquement.

## US-F04-02 — Modifier l’horaire

**Priorité : P0**

En tant qu’administrateur d’entreprise, je veux modifier l’horaire afin d’adapter les futurs QR.

### Critères d’acceptation

* l’horaire actuel est prérempli ;
* les mêmes validations sont appliquées ;
* la modification concerne les futures sessions ;
* les présences passées ne sont pas recalculées automatiquement ;
* les anciennes sessions futures incompatibles sont révoquées.

## SYS-F04-03 — Déterminer les fenêtres d’événements

**Priorité : P0**

En tant que système, je veux dériver les fenêtres QR à partir de l’horaire.

### Critères d’acceptation

* une fenêtre `ARRIVAL` est calculée ;
* une fenêtre `BREAK_START` est calculée ;
* une fenêtre `BREAK_END` est calculée ;
* une fenêtre `DEPARTURE` est calculée ;
* aucune fenêtre n’est créée pour un jour non travaillé ;
* les calculs utilisent le fuseau horaire de l’entreprise ;
* les fenêtres ne se chevauchent pas de manière incohérente.

## Décision du MVP sur les fenêtres

Les marges d’ouverture et de fermeture sont des constantes de configuration applicative.

Elles ne sont pas configurables par chaque entreprise dans le MVP.

## Tests critiques

* heure de pause avant heure de début ;
* retour avant début de pause ;
* fin avant retour ;
* tolérance négative ;
* aucun jour sélectionné ;
* changement d’horaire ;
* fuseau horaire.

## Tâches APEX

* `F04-schedule-backend`;
* `F04-schedule-frontend`.

---

# FEATURE F05 — GESTION DES EMPLOYÉS

## US-F05-01 — Consulter les demandes

**Priorité : P0**

En tant qu’administrateur d’entreprise, je veux voir les employés en attente afin de contrôler les inscriptions.

### Critères d’acceptation

* seuls les employés de son entreprise sont affichés ;
* la liste peut être filtrée par statut ;
* prénom, nom, email et date d’inscription sont visibles ;
* les employés d’une autre entreprise ne sont jamais retournés.

## US-F05-02 — Approuver ou rejeter un employé

**Priorité : P0**

En tant qu’administrateur d’entreprise, je veux approuver ou rejeter une demande.

### Critères d’acceptation

* un employé `PENDING` peut devenir `ACTIVE`;
* un employé `PENDING` peut devenir `REJECTED`;
* l’action ne peut concerner qu’un employé de la même entreprise ;
* un employé rejeté ne peut pas se connecter ;
* un employé approuvé peut se connecter et scanner.

## US-F05-03 — Suspendre ou réactiver un employé

**Priorité : P1**

En tant qu’administrateur d’entreprise, je veux suspendre un employé afin de bloquer son accès sans supprimer son historique.

### Critères d’acceptation

* un employé actif peut devenir suspendu ;
* un employé suspendu peut redevenir actif ;
* les anciennes présences sont conservées ;
* le scan est refusé pendant la suspension ;
* les nouvelles connexions sont refusées ;
* l’administrateur ne peut pas se suspendre lui-même par cette route.

## US-F05-04 — Rechercher un employé

**Priorité : P1**

En tant qu’administrateur d’entreprise, je veux rechercher un employé par nom ou email.

### Critères d’acceptation

* la recherche est limitée à l’entreprise ;
* la pagination est appliquée ;
* le filtre par statut fonctionne ;
* un état vide est affiché ;
* la recherche ne distingue pas inutilement majuscules et minuscules.

## Tâches APEX

* `F05-employees-backend`;
* `F05-employees-frontend`.

---

# FEATURE F06 — MOTEUR DE SESSIONS QR

## SYS-F06-01 — Créer une session QR

**Priorité : P0**

En tant que système, je veux créer une session QR pour l’événement actif.

### Critères d’acceptation

* une session est liée à une entreprise ;
* une session est liée à une date de travail ;
* une session possède un type ;
* un token aléatoire est généré ;
* seul le hash est stocké ;
* les dates de validité sont enregistrées ;
* une session déjà existante n’est pas dupliquée ;
* une session expirée ne redevient pas active.

## SYS-F06-02 — Résoudre le QR actif

**Priorité : P0**

En tant que système, je veux déterminer le QR actif selon l’heure locale de l’entreprise.

### Critères d’acceptation

* l’entreprise doit être active ;
* l’horaire doit exister ;
* la date doit être travaillée ;
* l’heure doit appartenir à une fenêtre ;
* un seul événement est retourné ;
* hors fenêtre, aucun QR n’est retourné ;
* le résultat indique la date d’expiration.

## US-F06-03 — Afficher le QR public

**Priorité : P0**

En tant qu’administrateur d’entreprise, je veux afficher un écran public contenant le QR actif.

### Critères d’acceptation

* la route utilise le code entreprise ;
* le nom de l’entreprise est visible ;
* le QR actif est affiché ;
* le type est affiché avec un libellé compréhensible ;
* l’heure de fin de validité est affichée ;
* l’écran se rafraîchit périodiquement ;
* un état « aucun QR actif » existe ;
* une entreprise suspendue n’affiche aucun QR ;
* aucune donnée d’employé n’est affichée.

## Écran public

Exemple :

```text
QRIFY

Entreprise : Exemple SARL

ARRIVÉE

[ QR CODE ]

Valide jusqu’à 08:30
```

## Tâches APEX

* `F06-qr-engine-backend`;
* `F06-qr-display-frontend`.

---

# FEATURE F07 — SCAN ET VALIDATION

## US-F07-01 — Ouvrir le scanner

**Priorité : P0**

En tant qu’employé actif, je veux utiliser la caméra afin de lire le QR affiché par mon entreprise.

### Critères d’acceptation

* l’accès nécessite une authentification ;
* seuls les employés actifs accèdent au scanner ;
* le navigateur demande l’autorisation de caméra ;
* un refus de caméra affiche une explication ;
* un mode de saisie du token peut être utilisé pour les tests ;
* le scan est interrompu pendant le traitement afin d’éviter les envois multiples.

## US-F07-02 — Enregistrer un scan valide

**Priorité : P0**

En tant qu’employé, je veux enregistrer mon événement lorsqu’un QR valide est scanné.

### Critères d’acceptation

* le token est vérifié ;
* la session doit être active ;
* l’employé doit appartenir à la même entreprise ;
* l’entreprise doit être active ;
* l’employé doit être actif ;
* le type d’événement doit respecter la séquence ;
* un événement brut `ACCEPTED` est enregistré ;
* la présence journalière est mise à jour ;
* la réponse indique le type et l’heure acceptée.

## US-F07-03 — Rejeter un doublon

**Priorité : P0**

En tant que système, je veux rejeter un événement déjà enregistré afin d’éviter le double pointage.

### Critères d’acceptation

* un deuxième événement du même type est refusé ;
* le premier événement reste inchangé ;
* la tentative est enregistrée comme `DUPLICATE`;
* le message explique que l’événement existe déjà ;
* aucun calcul n’est dupliqué.

## US-F07-04 — Rejeter un scan invalide

**Priorité : P0**

En tant que système, je veux refuser les scans invalides afin de garantir la cohérence.

### Critères d’acceptation

Le système refuse notamment :

* un token inconnu ;
* un token expiré ;
* un QR d’une autre entreprise ;
* un employé en attente ;
* un employé suspendu ;
* une entreprise suspendue ;
* un retour de pause sans début de pause ;
* un départ sans arrivée.

Chaque refus retourne :

* un code d’erreur ;
* un message utilisateur ;
* aucune modification de la présence ;
* un événement de scan si l’utilisateur et la session sont identifiables.

## Tests critiques

* attaque inter-tenant ;
* réutilisation du même token ;
* double scan rapide ;
* mauvais ordre ;
* session expirée ;
* heure limite exacte ;
* utilisateur suspendu ;
* entreprise suspendue.

## Tâches APEX

* `F07-scan-backend`;
* `F07-scanner-frontend`.

---

# FEATURE F08 — PRÉSENCE JOURNALIÈRE ET CALCULS

## SYS-F08-01 — Créer la présence du jour

**Priorité : P0**

En tant que système, je veux créer une présence au premier scan accepté.

### Critères d’acceptation

* une seule présence existe par utilisateur et date ;
* elle appartient à la même entreprise que l’utilisateur ;
* le premier scan d’arrivée remplit `arrival_at`;
* les autres scans mettent à jour la même ligne ;
* la création et l’événement de scan sont transactionnels.

## SYS-F08-02 — Calculer le retard

**Priorité : P0**

En tant que système, je veux calculer le retard après l’arrivée.

### Critères d’acceptation

* le calcul utilise l’heure prévue de la journée ;
* la tolérance est appliquée ;
* un résultat négatif devient zéro ;
* le statut devient `LATE` si le résultat est positif ;
* le calcul utilise le fuseau horaire de l’entreprise.

## SYS-F08-03 — Calculer les durées

**Priorité : P0**

En tant que système, je veux calculer la pause, le travail et les heures supplémentaires.

### Critères d’acceptation

* la pause est calculée avec une paire complète ;
* le temps travaillé utilise arrivée, départ et pause ;
* les heures supplémentaires commencent après l’heure de fin ;
* les durées négatives sont interdites ;
* les durées sont enregistrées en minutes ;
* un événement manquant peut produire `INCOMPLETE`.

## US-F08-04 — Consulter les présences

**Priorité : P0**

En tant qu’administrateur d’entreprise, je veux consulter les présences afin de suivre mes employés.

### Critères d’acceptation

* la liste est limitée à l’entreprise ;
* un filtre par date existe ;
* un filtre par statut existe ;
* une recherche par employé existe ;
* les heures principales sont visibles ;
* les durées sont lisibles ;
* la pagination est disponible ;
* un détail peut être ouvert.

## US-F08-05 — Consulter le détail

**Priorité : P1**

En tant qu’administrateur d’entreprise, je veux consulter les événements d’une journée afin de comprendre le calcul.

### Critères d’acceptation

* les quatre heures éventuelles sont affichées ;
* les calculs sont affichés ;
* le statut est affiché ;
* les événements de scan acceptés sont visibles ;
* les tentatives rejetées peuvent être affichées sans information sensible ;
* seules les données de l’entreprise sont accessibles.

## Tâches APEX

* `F08-attendance-backend`;
* `F08-attendance-admin-frontend`.

---

# FEATURE F09 — DÉTECTION DES ABSENCES

## SYS-F09-01 — Détecter automatiquement les absences

**Priorité : P1**

En tant que système, je veux enregistrer les absences après la journée de travail.

### Critères d’acceptation

* seuls les employés actifs sont traités ;
* seules les entreprises actives sont traitées ;
* seuls les jours travaillés sont traités ;
* une présence avec arrivée n’est jamais remplacée ;
* une ligne `ABSENT` est créée s’il n’existe aucune arrivée ;
* l’opération est idempotente ;
* la date est évaluée dans le fuseau de l’entreprise.

## US-F09-02 — Déclencher la détection en démonstration

**Priorité : P1**

En tant qu’administrateur autorisé, je veux lancer la détection pour une date afin de démontrer la fonctionnalité.

### Critères d’acceptation

* la route est protégée ;
* elle peut être désactivée en production ;
* une date valide est obligatoire ;
* le même service que la tâche automatique est utilisé ;
* le résultat indique le nombre d’absences créées ;
* un second lancement ne crée aucun doublon.

## Job runner

Le job runner vérifie régulièrement les entreprises dont la journée locale est terminée.

La contrainte unique sur la présence garantit l’idempotence.

## Tâche APEX

* `F09-absence-job`.

---

# FEATURE F10 — ESPACE EMPLOYÉ ET HISTORIQUE

## US-F10-01 — Consulter la journée actuelle

**Priorité : P0**

En tant qu’employé, je veux voir ma journée actuelle afin de connaître les événements déjà enregistrés.

### Critères d’acceptation

* l’arrivée est affichée ;
* le début de pause est affiché ;
* le retour est affiché ;
* le départ est affiché ;
* le prochain événement attendu est indiqué ;
* le statut est affiché ;
* les données appartiennent uniquement à l’utilisateur connecté.

## US-F10-02 — Consulter l’historique

**Priorité : P0**

En tant qu’employé, je veux consulter mon historique afin de suivre mes présences.

### Critères d’acceptation

* les journées sont triées par date décroissante ;
* une période peut être sélectionnée ;
* les statuts sont visibles ;
* les durées sont visibles ;
* aucune donnée d’un autre employé n’est accessible ;
* un état vide est prévu.

## US-F10-03 — Consulter un résumé personnel

**Priorité : P1**

En tant qu’employé, je veux connaître mes statistiques personnelles.

### Critères d’acceptation

Pour une période, le système affiche :

* jours présents ;
* jours en retard ;
* jours absents ;
* total des minutes de retard ;
* total des minutes travaillées ;
* total des heures supplémentaires.

## US-F10-04 — Modifier son profil

**Priorité : P2**

En tant qu’employé, je veux modifier mon prénom et mon nom.

### Critères d’acceptation

* l’email ne peut pas être changé dans le MVP ;
* les champs sont validés ;
* l’utilisateur ne modifie que son compte ;
* le rôle et l’entreprise ne sont pas modifiables.

## Tâches APEX

* `F10-employee-history-backend`;
* `F10-employee-space-frontend`.

---

# FEATURE F11 — DASHBOARD ET STATISTIQUES D’ENTREPRISE

## US-F11-01 — Tableau de bord RH

**Priorité : P1**

En tant qu’administrateur d’entreprise, je veux consulter les indicateurs du jour.

### Critères d’acceptation

Le dashboard affiche :

* nombre d’employés actifs ;
* présents aujourd’hui ;
* retards aujourd’hui ;
* absents aujourd’hui ;
* présences incomplètes ;
* QR actuellement actif ;
* derniers scans acceptés.

Toutes les données sont limitées à l’entreprise.

## US-F11-02 — Statistiques par période

**Priorité : P1**

En tant qu’administrateur d’entreprise, je veux consulter les tendances de présence.

### Critères d’acceptation

* une date de début et une date de fin peuvent être sélectionnées ;
* le taux de présence est calculé ;
* le nombre de retards est calculé ;
* le nombre d’absences est calculé ;
* les heures supplémentaires sont totalisées ;
* un graphique journalier peut être affiché ;
* une période invalide est rejetée.

## US-F11-03 — Classements

**Priorité : P1**

En tant qu’administrateur d’entreprise, je veux consulter les classements internes.

### Critères d’acceptation

Trois classements sont disponibles :

* employés les plus assidus ;
* employés ayant le plus de retards ;
* employés ayant le plus d’absences.

Règles :

* les classements sont limités à l’entreprise ;
* la période est configurable ;
* le classement d’assiduité utilise les jours présents par rapport aux jours attendus ;
* les égalités peuvent être départagées par le nombre total de minutes de retard ;
* aucune donnée n’est publique.

## US-F11-04 — Rapport hebdomadaire

**Priorité : P1**

En tant qu’administrateur d’entreprise, je veux consulter un rapport hebdomadaire.

### Critères d’acceptation

Le rapport affiche par employé :

* jours présents ;
* jours en retard ;
* jours absents ;
* minutes de retard ;
* temps travaillé ;
* heures supplémentaires.

Autres critères :

* la semaine est sélectionnable ;
* le rapport est calculé à la demande ;
* il n’est pas nécessaire de le stocker ;
* l’export CSV est facultatif.

## Tâches APEX

* `F11-company-statistics-backend`;
* `F11-company-dashboard-frontend`.

---

# FEATURE F12 — SUPER ADMINISTRATION

## US-F12-01 — Consulter les entreprises

**Priorité : P0**

En tant que super administrateur, je veux consulter les entreprises inscrites.

### Critères d’acceptation

* la liste affiche nom, code, statut et date de création ;
* une recherche par nom ou code existe ;
* un filtre par statut existe ;
* la liste est paginée ;
* seuls les super administrateurs y accèdent.

## US-F12-02 — Suspendre une entreprise

**Priorité : P0**

En tant que super administrateur, je veux suspendre une entreprise.

### Critères d’acceptation

Après suspension :

* les nouvelles connexions sont refusées ;
* les QR publics deviennent indisponibles ;
* les scans sont refusés ;
* les données sont conservées ;
* les utilisateurs ne sont pas supprimés ;
* le statut est visible dans la liste.

## US-F12-03 — Réactiver une entreprise

**Priorité : P0**

En tant que super administrateur, je veux réactiver une entreprise.

### Critères d’acceptation

* l’entreprise retrouve le statut actif ;
* les utilisateurs actifs peuvent se reconnecter ;
* les QR peuvent être générés à nouveau ;
* les anciennes données restent disponibles.

## US-F12-04 — Statistiques générales

**Priorité : P1**

En tant que super administrateur, je veux consulter l’usage général de QRify.

### Critères d’acceptation

Les indicateurs comprennent :

* nombre total d’entreprises ;
* entreprises actives ;
* entreprises suspendues ;
* nombre total d’employés ;
* nombre de scans du jour ;
* nombre de présences enregistrées sur une période.

Aucune statistique financière n’est prévue.

## Tâches APEX

* `F12-super-admin-backend`;
* `F12-super-admin-frontend`.

---

# FEATURE F13 — QUALITÉ, DONNÉES DE DÉMONSTRATION ET FINALISATION

## TS-F13-01 — Créer les données de démonstration

**Priorité : P0**

En tant que développeur, je veux disposer de données fictives afin de présenter toutes les fonctions.

### Critères d’acceptation

Le seed crée :

* un super administrateur ;
* deux entreprises ;
* un administrateur par entreprise ;
* plusieurs employés actifs ;
* un employé en attente ;
* un employé suspendu ;
* des horaires ;
* des présences ;
* des retards ;
* des absences ;
* des heures supplémentaires.

## TS-F13-02 — Tester le scénario principal

**Priorité : P0**

En tant que développeur, je veux automatiser le scénario critique afin d’éviter les régressions.

### Critères d’acceptation

Le scénario vérifie :

1. création d’une entreprise ;
2. configuration de l’horaire ;
3. inscription d’un employé ;
4. approbation ;
5. génération d’un QR ;
6. scan d’arrivée ;
7. scan de pause ;
8. retour de pause ;
9. départ ;
10. calcul de la présence ;
11. affichage de l’historique ;
12. affichage des statistiques.

## TS-F13-03 — Vérifier le responsive

**Priorité : P1**

En tant qu’utilisateur mobile, je veux utiliser QRify sur smartphone.

### Critères d’acceptation

* le scanner est utilisable sur mobile ;
* les formulaires ne débordent pas ;
* les tableaux disposent d’une présentation mobile ;
* les boutons principaux sont accessibles ;
* les messages sont lisibles ;
* l’écran QR fonctionne sur un écran large.

## Tâches APEX

* `F13-demo-seed`;
* `F13-e2e-validation`;
* `F13-responsive-finish`.

---

# 19. APPLICATION DE LA MÉTHODOLOGIE APEX

## 19.1 Unité de travail

Chaque feature est divisée en une ou deux tâches APEX :

* tâche backend ;
* tâche frontend.

Le backend est généralement développé avant le frontend.

Exemple :

```text
F07-scan-backend
F07-scanner-frontend
```

## 19.2 Dossier APEX dans chaque projet

Chaque projet conserve ses propres sorties :

```text
qrify-backend/.claude/output/apex/
qrify-frontend/.claude/output/apex/
```

Il n’existe pas de dossier APEX partagé.

## 19.3 Étape Initialize

Pour chaque tâche :

* analyser les options APEX ;
* créer un identifiant de tâche ;
* créer le contexte ;
* vérifier la branche ;
* détecter une éventuelle reprise ;
* enregistrer les critères d’acceptation.

Le fichier de contexte doit contenir :

* description de la feature ;
* user stories concernées ;
* critères d’acceptation ;
* dépendances ;
* état d’avancement.

## 19.4 Étape Analyze

L’analyse ne doit pas proposer immédiatement une implémentation.

Elle doit identifier :

* les fichiers existants ;
* les patterns utilisés ;
* les modules liés ;
* les dépendances ;
* les contrats API ;
* les tables concernées ;
* les tests existants ;
* les risques de sécurité ;
* les risques d’isolation multi-tenant.

Exemple pour la feature scan :

* analyser le middleware d’authentification ;
* analyser les sessions QR ;
* analyser les repositories de présence ;
* analyser la gestion des transactions ;
* analyser les tests existants ;
* vérifier les règles de séquence.

## 19.5 Étape Plan

Le plan doit être organisé par fichier.

Pour chaque fichier :

* chemin ;
* création ou modification ;
* objectif ;
* changements précis ;
* user stories couvertes ;
* critères d’acceptation couverts ;
* tests prévus ;
* dépendances.

Le plan ne doit contenir aucun changement qui ne correspond pas au scope validé.

## 19.6 Étape Execute

Pendant l’exécution :

* un seul travail est marqué en cours ;
* les fichiers sont lus avant modification ;
* les tâches sont suivies ;
* les changements respectent le plan ;
* aucun refactoring non demandé n’est ajouté ;
* chaque changement est journalisé.

## 19.7 Étape Validate

La validation vérifie :

* compilation TypeScript ;
* lint ;
* formatage ;
* tests ;
* build ;
* critères d’acceptation ;
* erreurs de sécurité évidentes ;
* isolation par entreprise.

Une feature n’est pas terminée si un critère d’acceptation obligatoire échoue.

## 19.8 Étape Tests

Pour les features critiques, les tests sont une étape APEX distincte.

Features exigeant obligatoirement cette étape :

* authentification ;
* repositories ;
* horaires ;
* QR ;
* scans ;
* calculs ;
* absences ;
* multi-tenant ;
* suspension entreprise.

## 19.9 Étape Examine

L’examen adversarial est obligatoire pour :

* authentification ;
* autorisation ;
* isolation des entreprises ;
* tokens QR ;
* scans ;
* calculs de présence ;
* routes super administrateur.

L’examen recherche :

* accès inter-tenant ;
* contournement de rôle ;
* replay de QR ;
* doublons ;
* incohérence transactionnelle ;
* calculs négatifs ;
* fuite de données ;
* injection SQL ;
* validation insuffisante.

## 19.10 Étape Resolve

Seuls les constats réels et vérifiés sont corrigés.

Après correction :

* les tests concernés sont relancés ;
* la validation est relancée ;
* le constat est marqué résolu ;
* aucun changement sans rapport n’est ajouté.

## 19.11 Étape Finish

La finition comprend :

* vérification finale ;
* vérification de la branche ;
* résumé des changements ;
* résumé des tests ;
* liste des limites connues ;
* création éventuelle d’une pull request.

Aucune nouvelle fonctionnalité n’est ajoutée pendant Finish.

---

# 20. FLAGS APEX RECOMMANDÉS

## Features critiques

Pour :

* authentification ;
* base ;
* QR ;
* scan ;
* présence ;
* multi-tenant ;

utiliser :

* sauvegarde des sorties ;
* tests ;
* examen adversarial ;
* branche dédiée.

L’approbation manuelle du plan est recommandée.

## Features frontend simples

Pour :

* pages de liste ;
* états vides ;
* affichage de cartes ;
* ajustements responsive ;

le mode automatique peut être utilisé après stabilisation des patterns.

## Mode economy

À réserver pour :

* petite correction ;
* texte ;
* style ;
* changement local ;
* bug simple.

Il ne doit pas être utilisé pour la sécurité, les repositories ou les calculs.

## Mode resume

Il doit être utilisé lorsqu’une tâche APEX interrompue doit reprendre sans perdre le contexte.

---

# 21. STRATÉGIE DE TESTS

## 21.1 Tests unitaires backend

Priorités :

* calcul du retard ;
* calcul des pauses ;
* calcul du temps travaillé ;
* calcul des heures supplémentaires ;
* résolution des fenêtres QR ;
* séquence des scans ;
* détermination du statut ;
* détection des jours travaillés.

## 21.2 Tests d’intégration SQLite

* création entreprise et administrateur dans une transaction ;
* repositories ;
* contraintes uniques ;
* filtre `company_id`;
* création de présence ;
* événements de scan ;
* détection idempotente des absences.

## 21.3 Tests API Hono

* inscription ;
* connexion ;
* session ;
* permissions ;
* modification d’horaire ;
* approbation employé ;
* QR actif ;
* scan ;
* listes de présences ;
* statistiques ;
* suspension entreprise.

## 21.4 Tests frontend

* validation des formulaires ;
* affichage des erreurs API ;
* redirection par rôle ;
* états chargement, vide et erreur ;
* scanner ;
* tableau des présences ;
* dashboard.

## 21.5 Tests end-to-end

Scénarios minimum :

### Scénario normal

* entreprise créée ;
* employé approuvé ;
* arrivée ;
* pause ;
* retour ;
* départ ;
* présence calculée.

### Scénario retard

* arrivée après la tolérance ;
* statut `LATE`;
* minutes exactes.

### Scénario doublon

* deux scans d’arrivée ;
* second rejeté ;
* présence inchangée.

### Scénario inter-tenant

* employé A utilise QR B ;
* scan refusé ;
* aucune présence créée.

### Scénario absence

* employé actif sans arrivée ;
* job exécuté ;
* présence `ABSENT`;
* deuxième exécution sans doublon.

### Scénario suspension

* super administrateur suspend l’entreprise ;
* connexion refusée ;
* QR indisponible ;
* scan refusé ;
* réactivation fonctionnelle.

---

# 22. CRITÈRES NON FONCTIONNELS

## 22.1 Performance

Pour le jeu de données académique :

* réponse des routes courantes visée sous deux secondes ;
* pagination des grandes listes ;
* indexes sur les filtres principaux ;
* pas de chargement de toutes les présences sans limite ;
* statistiques calculées sur une période limitée.

Il ne s’agit pas d’un engagement contractuel de production.

## 22.2 Responsive

Interfaces principales utilisables sur :

* smartphone ;
* tablette ;
* ordinateur.

Le scanner est prioritairement conçu pour smartphone.

L’affichage du QR est prioritairement conçu pour un écran d’accueil ou ordinateur.

## 22.3 Accessibilité minimale

* labels sur les formulaires ;
* navigation au clavier raisonnable ;
* contraste lisible ;
* messages d’erreur explicites ;
* boutons identifiables ;
* absence de dépendance exclusive à la couleur.

## 22.4 Maintenabilité

* modules fonctionnels ;
* services métier séparés des routes ;
* SQL séparé des services ;
* repositories testables ;
* erreurs uniformes ;
* noms cohérents ;
* aucune abstraction non utilisée.

---

# 23. DEFINITION OF READY

Une user story peut entrer en développement si :

* l’acteur est identifié ;
* la valeur métier est claire ;
* les critères d’acceptation sont écrits ;
* les dépendances sont connues ;
* les règles métier sont définies ;
* les tables impactées sont connues ;
* les endpoints nécessaires sont identifiés ;
* les pages nécessaires sont identifiées ;
* les cas d’erreur sont définis ;
* la priorité est connue.

---

# 24. DEFINITION OF DONE

Une feature est terminée si :

* tous les critères P0 de la feature passent ;
* le backend valide les entrées ;
* les permissions sont vérifiées ;
* le filtre entreprise est appliqué ;
* les erreurs sont normalisées ;
* les tests nécessaires passent ;
* le typecheck passe ;
* le lint passe ;
* le build passe ;
* le frontend gère chargement, erreur et état vide ;
* les écrans importants sont responsive ;
* l’examen APEX ne contient aucun constat critique non résolu ;
* la documentation de l’API est actualisée ;
* les sorties APEX sont enregistrées ;
* aucune fonctionnalité hors scope n’a été ajoutée.

---

# 25. ORDRE DE DÉVELOPPEMENT

## Phase 1 — Fondations

Features :

* F00 Initialisation ;
* F01 SQLite et repositories.

Résultat :

* deux projets opérationnels ;
* API connectée ;
* base migrable ;
* repositories disponibles.

## Phase 2 — Comptes et entreprises

Features :

* F02 Authentification ;
* F03 Entreprise ;
* F04 Horaires.

Résultat :

* entreprise inscrite ;
* administrateur connecté ;
* horaire configuré.

## Phase 3 — Employés

Feature :

* F05 Employés.

Résultat :

* employé inscrit avec le code ;
* approbation ;
* suspension.

## Phase 4 — QR

Feature :

* F06 Sessions QR.

Résultat :

* QR déterminé par l’horaire ;
* écran public.

## Phase 5 — Pointage

Features :

* F07 Scan ;
* F08 Présences et calculs.

Résultat :

* workflow complet d’une journée.

## Phase 6 — Absence et espace employé

Features :

* F09 Absences ;
* F10 Historique employé.

Résultat :

* journées absentes ;
* historique personnel.

## Phase 7 — Pilotage

Features :

* F11 Dashboard et statistiques ;
* F12 Super administration.

Résultat :

* suivi RH ;
* classements ;
* supervision des entreprises.

## Phase 8 — Finalisation

Feature :

* F13 Qualité et démonstration.

Résultat :

* données de démonstration ;
* tests critiques ;
* scénario de soutenance ;
* interface responsive.

---

# 26. PLAN INDICATIF SUR HUIT SEMAINES

## Semaine 1

* initialisation ;
* configuration ;
* SQLite ;
* migrations ;
* repositories ;
* seed minimal.

## Semaine 2

* inscription entreprise ;
* inscription employé ;
* connexion ;
* JWT ;
* permissions ;
* isolation tenant.

## Semaine 3

* entreprise ;
* horaire ;
* jours travaillés ;
* gestion des employés.

## Semaine 4

* sessions QR ;
* résolution du QR actif ;
* écran public ;
* expiration.

## Semaine 5

* scanner ;
* validation ;
* séquence ;
* événements ;
* présence journalière.

## Semaine 6

* calculs ;
* absences ;
* historique employé ;
* listes de présence.

## Semaine 7

* dashboard ;
* statistiques ;
* classements ;
* rapport hebdomadaire ;
* super administration.

## Semaine 8

* tests ;
* examen APEX ;
* corrections ;
* responsive ;
* données de démonstration ;
* préparation de la soutenance.

---

# 27. RISQUES PRINCIPAUX

## 27.1 Fuite inter-tenant

Risque :

Un administrateur peut consulter une autre entreprise.

Mesures :

* `company_id` dérivé de la session ;
* repositories filtrés ;
* tests inter-tenant ;
* examen APEX obligatoire.

## 27.2 Replay du QR

Risque :

Un même QR est réutilisé.

Mesures :

* expiration ;
* séquence ;
* unicité des événements ;
* token aléatoire ;
* hash en base ;
* vérification de l’entreprise.

## 27.3 Double scan

Risque :

La caméra envoie plusieurs fois le même token.

Mesures :

* blocage temporaire du scanner ;
* contrainte métier ;
* transaction ;
* résultat `DUPLICATE`.

## 27.4 Calcul incorrect à cause du fuseau horaire

Mesures :

* fuseau par entreprise ;
* instants en UTC ;
* date de travail locale ;
* service d’horloge testable ;
* tests autour de minuit.

## 27.5 Job d’absence exécuté plusieurs fois

Mesures :

* opération idempotente ;
* contrainte unique ;
* vérification avant insertion ;
* tests répétitifs.

## 27.6 Scope trop important

Mesures :

* priorités P0, P1 et P2 ;
* aucune fonctionnalité P2 avant le scénario P0 ;
* pas de MySQL/PostgreSQL avant stabilisation SQLite ;
* pas de refactoring hors plan APEX.

---

# 28. PRIORITÉS

## P0 — Obligatoire pour la soutenance

* initialisation ;
* SQLite ;
* repositories ;
* inscription entreprise ;
* code entreprise ;
* inscription employé ;
* approbation ;
* connexion ;
* horaire ;
* QR actif ;
* écran QR ;
* scanner ;
* validation ;
* présence ;
* retard ;
* pause ;
* travail ;
* heures supplémentaires ;
* historique employé ;
* présence entreprise ;
* suspension entreprise ;
* tests du scénario critique.

## P1 — MVP complet

* absence automatique ;
* statistiques ;
* classements ;
* rapport hebdomadaire ;
* recherche employés ;
* détail des scans ;
* responsive avancé ;
* statistiques super administrateur.

## P2 — Après le MVP

* profil employé modifiable ;
* export CSV ;
* correction manuelle ;
* régénération de code ;
* logo ;
* PDF.

---

# 29. SCÉNARIO DE SOUTENANCE

1. le super administrateur consulte les entreprises ;
2. un administrateur crée une entreprise ;
3. le code entreprise est affiché ;
4. l’administrateur configure un horaire ;
5. un employé s’inscrit avec le code ;
6. l’administrateur voit la demande ;
7. l’administrateur approuve l’employé ;
8. l’écran public affiche le QR d’arrivée ;
9. l’employé se connecte ;
10. l’employé scanne l’arrivée ;
11. QRify confirme l’heure ;
12. l’employé scanne le début de pause ;
13. il scanne le retour ;
14. il scanne le départ ;
15. QRify calcule les durées ;
16. l’employé consulte son historique ;
17. l’administrateur consulte la présence ;
18. il consulte les statistiques ;
19. le job crée une absence pour un employé sans arrivée ;
20. le super administrateur suspend l’entreprise ;
21. le QR devient indisponible ;
22. le super administrateur réactive l’entreprise.

---

# 30. CRITÈRES DE VALIDATION FINALE

QRify est considéré comme terminé lorsque :

* frontend et backend démarrent séparément avec Bun ;
* SQLite est initialisé par migration ;
* le seed fonctionne ;
* une entreprise peut s’inscrire ;
* le code entreprise est unique ;
* un employé peut demander son inscription ;
* l’administrateur peut l’approuver ;
* chaque rôle accède uniquement à son espace ;
* les données des entreprises sont isolées ;
* un horaire peut être enregistré ;
* le QR actif correspond à l’horaire ;
* le QR expire ;
* un employé peut scanner ;
* un QR étranger est refusé ;
* un doublon est refusé ;
* l’ordre des événements est contrôlé ;
* la présence journalière est créée ;
* le retard est calculé ;
* la pause est calculée ;
* le temps travaillé est calculé ;
* les heures supplémentaires sont calculées ;
* les absences sont créées sans doublon ;
* l’employé voit uniquement son historique ;
* l’administrateur voit uniquement son entreprise ;
* les statistiques principales sont affichées ;
* le super administrateur peut suspendre une entreprise ;
* le scénario end-to-end principal passe ;
* aucun constat critique APEX ne reste ouvert.

---

# 31. DÉCISION TECHNIQUE FINALE

## Frontend

* SvelteKit ;
* TypeScript ;
* Bun ;
* interface et caméra ;
* appels HTTP ;
* aucune connexion directe à la base ;
* aucun package partagé.

## Backend

* Hono ;
* TypeScript ;
* Bun ;
* API REST ;
* JWT ;
* bcrypt ;
* Zod ;
* CSRF ;
* services métier ;
* repositories ;
* SQL direct.

## Base

### MVP

* SQLite natif Bun.

### Évolutions

* MySQL ;
* PostgreSQL.

### Portabilité

* contrats de repositories communs ;
* implémentation SQLite actuelle ;
* implémentations futures séparées ;
* migrations propres à chaque moteur ;
* aucune promesse de SQL identique entre les trois bases.

## Organisation

```text
qrify-frontend/
qrify-backend/
```

* deux projets indépendants ;
* deux fichiers `package.json`;
* deux installations Bun ;
* deux dépôts Git possibles ;
* deux dossiers APEX ;
* aucun monorepo ;
* aucun package `shared`;
* aucun ORM.
