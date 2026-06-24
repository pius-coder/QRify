Oui. **Pour obtenir un développement réellement feature par feature, tu dois lancer APEX séparément pour chaque feature.**

Une exécution de `/apex` correspond à **une tâche unique** : APEX transforme la description en un `task_id`, puis crée un dossier `.claude/output/apex/{task-id}/` lorsque l’option `-s` est activée. Il ne découpe pas automatiquement un cahier des charges complet en plusieurs workflows indépendants. ([GitHub][1])

## Ce qu’il ne faut pas faire

Évite une commande globale comme :

```bash
/apex -a -s -t -x implémente toute l'application QRify avec authentification, employés, horaires, QR, scans, présences, statistiques et super administration
```

Dans ce cas, toute la description devient **une seule tâche APEX** avec :

```text
.claude/output/apex/01-implemente-toute-application-qrify/
```

L’agent risque alors de :

* analyser tout le projet en même temps ;
* produire un plan immense ;
* modifier de nombreux modules ;
* mélanger plusieurs features ;
* rendre la validation et la reprise difficiles.

APEX n’est pas un gestionnaire automatique de backlog. Chaque invocation possède une seule description, un seul identifiant de tâche et un seul cycle Analyze → Plan → Execute → Validate. ([GitHub][1])

# Organisation correcte pour QRify

Tu as deux projets séparés :

```text
qrify-backend/
qrify-frontend/
```

Chaque projet possède son propre dossier APEX :

```text
qrify-backend/
└── .claude/
    └── output/
        └── apex/
            ├── 01-initialize-hono-backend/
            ├── 02-setup-sqlite-database/
            ├── 03-implement-authentication/
            ├── 04-implement-company-management/
            └── ...

qrify-frontend/
└── .claude/
    └── output/
        └── apex/
            ├── 01-initialize-sveltekit-frontend/
            ├── 02-implement-authentication-pages/
            ├── 03-implement-company-settings/
            └── ...
```

Le dossier `.claude/output/apex/` est commun aux tâches d’un même projet, mais **chaque feature possède son sous-dossier de tâche**.

# Une feature fonctionnelle peut produire deux tâches APEX

Comme le frontend et le backend sont dans deux dossiers indépendants, une feature complète comme l’authentification doit généralement être divisée en :

```text
Feature F02 — Authentification
├── Tâche backend : F02 authentication backend
└── Tâche frontend : F02 authentication frontend
```

Cela donnera, par exemple :

```text
qrify-backend/.claude/output/apex/
└── 03-f02-authentication-backend/

qrify-frontend/.claude/output/apex/
└── 02-f02-authentication-frontend/
```

C’est préférable à une seule tâche tentant de modifier deux dépôts différents. Les sorties APEX sont enregistrées dans le projet depuis lequel Claude Code est lancé. ([GitHub][1])

# Ordre recommandé

## 1. Backend de la feature

Dans le projet backend :

```bash
cd qrify-backend
```

Puis :

```bash
/apex -s -t -x -b "F02 backend authentication: company admin registration, employee registration with company code, login, logout, current user, JWT cookie, role and tenant middleware. Respect only the acceptance criteria provided."
```

APEX créera un dossier semblable à :

```text
.claude/output/apex/03-f02-backend-authentication/
```

## 2. Vérifier et terminer le backend

La feature backend doit être considérée comme terminée uniquement lorsque :

* le plan est cohérent ;
* l’implémentation est terminée ;
* les tests passent ;
* la validation passe ;
* les constats de l’examen sont résolus ;
* les endpoints sont utilisables par le frontend.

## 3. Frontend de la même feature

Ensuite, dans le frontend :

```bash
cd ../qrify-frontend
```

Puis :

```bash
/apex -s -t -x -b "F02 frontend authentication: company registration page, employee registration page, login page, session restoration, logout and role-based redirection. Consume the existing Hono authentication API only."
```

Cela créera :

```text
.claude/output/apex/02-f02-frontend-authentication/
```

## 4. Passer à la feature suivante

Tu ne passes à F03 qu’après la validation de F02.

# Backlog APEX recommandé

## Backend

Lance les tâches dans cet ordre :

| Ordre | Tâche APEX                                         |
| ----: | -------------------------------------------------- |
|     1 | `F00 initialize Hono backend`                      |
|     2 | `F01 SQLite migrations and database adapter`       |
|     3 | `F01 repository contracts and SQLite repositories` |
|     4 | `F02 authentication backend`                       |
|     5 | `F03 company profile backend`                      |
|     6 | `F04 work schedule backend`                        |
|     7 | `F05 employee management backend`                  |
|     8 | `F06 QR session engine backend`                    |
|     9 | `F07 scan validation backend`                      |
|    10 | `F08 attendance calculations backend`              |
|    11 | `F09 absence detection job`                        |
|    12 | `F10 employee history backend`                     |
|    13 | `F11 company statistics backend`                   |
|    14 | `F12 super administration backend`                 |
|    15 | `F13 backend integration validation`               |

## Frontend

| Ordre | Tâche APEX                                      |
| ----: | ----------------------------------------------- |
|     1 | `F00 initialize SvelteKit frontend`             |
|     2 | `F02 authentication frontend`                   |
|     3 | `F03 company profile frontend`                  |
|     4 | `F04 work schedule frontend`                    |
|     5 | `F05 employee management frontend`              |
|     6 | `F06 public QR display frontend`                |
|     7 | `F07 employee scanner frontend`                 |
|     8 | `F08 attendance management frontend`            |
|     9 | `F10 employee dashboard and history frontend`   |
|    10 | `F11 company dashboard and statistics frontend` |
|    11 | `F12 super administration frontend`             |
|    12 | `F13 frontend end-to-end validation`            |

# Faut-il utiliser `-a` ?

Pour les premières features, je recommande **de ne pas utiliser `-a`**.

L’option `-a` active le mode autonome : elle saute les confirmations et approuve automatiquement le plan. Sans `-a`, tu peux contrôler le plan avant que l’agent commence à modifier le projet. ([GitHub][1])

Utilise donc d’abord :

```bash
/apex -s -t -x -b "F02 backend authentication..."
```

Et non :

```bash
/apex -a -s -t -x -b "F02 backend authentication..."
```

Tu pourras utiliser `-a` plus tard pour des tâches simples et répétitives, une fois que l’architecture est stable.

# Rôle des options

```text
-s   sauvegarde le cycle dans un dossier APEX
-t   crée et exécute les tests
-x   effectue l’examen adversarial
-b   travaille sur une branche dédiée
-a   approuve automatiquement le plan
-r   reprend une tâche existante
```

Le workflow sauvegardé contient notamment :

```text
00-context.md
01-analyze.md
02-plan.md
03-execute.md
04-validate.md
05-examine.md
06-resolve.md
07-tests.md
08-run-tests.md
09-finish.md
```

La présence exacte de certains fichiers dépend des options utilisées, notamment `-t`, `-x` et `-pr`. ([GitHub][1])

# Reprendre une feature interrompue

Il ne faut pas relancer une nouvelle tâche pour reprendre une feature existante.

Utilise :

```bash
/apex -r 03-f02-backend-authentication
```

Ou une correspondance partielle :

```bash
/apex -r 03
```

APEX recherche alors le dossier existant, relit `00-context.md`, identifie la dernière étape terminée et poursuit à l’étape suivante. ([GitHub][1])

# Règle de fonctionnement à imposer à l’agent

Au début de chaque tâche, ajoute cette contrainte :

```text
Implémente uniquement cette feature.

Ne commence aucune feature suivante.
Ne modifie aucun module sans rapport avec les critères d’acceptation.
Avant l’exécution, produis un plan fichier par fichier.
À la fin, valide tous les critères d’acceptation et arrête le workflow.
```

# Convention finale recommandée

Utilise cette correspondance :

```text
1 feature métier
    ↓
1 tâche APEX backend
    ↓
validation backend
    ↓
1 tâche APEX frontend
    ↓
validation frontend
    ↓
feature suivante
```

Pour une feature uniquement backend, comme le job d’absence :

```text
1 feature
    ↓
1 tâche APEX backend uniquement
```

Pour une feature uniquement frontend, comme un ajustement responsive :

```text
1 feature
    ↓
1 tâche APEX frontend uniquement
```

## Conclusion

**APEX ne développera feature par feature que si tu lui donnes une seule feature par invocation.**

La règle à retenir est :

```text
Une commande /apex
=
une tâche
=
un dossier .claude/output/apex/{task-id}
=
une feature ou une partie clairement délimitée d’une feature
```

Pour QRify, le meilleur niveau de découpage est généralement **un dossier APEX backend et un dossier APEX frontend par feature**, en terminant complètement le backend avant de lancer le frontend correspondant.

[1]: https://raw.githubusercontent.com/Zeldious-Studio-Company/agent-skills/main/.claude/skills/workflow-apex/SKILL.md "raw.githubusercontent.com"
