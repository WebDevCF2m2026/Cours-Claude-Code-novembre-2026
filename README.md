# Cours : comprendre et maîtriser Claude Code

Nov 7, 2026 · @Michaël Pitz

## Module 1 — Qu'est-ce que Claude Code ?

Claude Code est un agent de développement : on lui confie une tâche, et il lit le code, modifie les fichiers et lance des commandes lui-même jusqu'à ce qu'elle soit faite. Le chat de claude.ai répond à des questions ; Claude Code agit directement dans le projet.

Analogie Symfony : le chat ressemble à la documentation que l'on consulte, Claude Code ressemble à un collègue à qui l'on donne un accès au dépôt et un terminal. Il lance `bin/console`, `composer`, `phpunit` ou `git` comme vous le feriez.

### Où il tourne

| Surface | Usage typique |
| --- | --- |
| CLI (terminal) | La forme d'origine : `claude` dans le dossier du projet, en local ou en SSH sur un VPS |
| Extensions IDE (VS Code, JetBrains) | Voir les diffs directement dans l'éditeur |
| Application desktop | Interface graphique, plusieurs sessions côte à côte |
| Web et mobile | Lancer une tâche sur un dépôt GitHub depuis le navigateur ou le téléphone, exécutée dans le cloud |
| SDK (Agent SDK) | Intégrer le même moteur d'agent dans ses propres scripts et pipelines CI |

### Ce qu'il sait faire

- Explorer et expliquer une base de code inconnue
- Écrire des fonctionnalités sur plusieurs fichiers, avec les tests
- Corriger un bug à partir d'une stack trace, puis vérifier la correction en relançant les tests
- Gérer Git : commits, branches, résolution de conflits, ouverture de pull requests
- Automatiser des tâches répétitives (migrations, refactorings, mise à jour de dépendances)

### Ce qu'il faut retenir

Claude Code ne « devine » pas le projet : il le découvre en lisant les fichiers, comme un nouveau développeur. Plus le contexte qu'on lui donne est clair (module 4), meilleur est le résultat.

## Module 2 — La boucle agentique

Claude Code fonctionne en boucle : il rassemble du contexte, agit avec un outil, observe le résultat, puis recommence jusqu'à ce que la tâche soit terminée. Toute la puissance de l'outil vient de cette boucle, pas d'une réponse unique.

1. **Comprendre** : vous décrivez la tâche (« ajoute une entité Facture avec son CRUD »).
2. **Explorer** : il lit `composer.json`, `config/`, `src/Entity/` pour comprendre le projet.
3. **Planifier** : il découpe le travail, souvent dans une liste de tâches visible à l'écran.
4. **Agir** : il appelle un outil (édition de fichier, commande shell…).
5. **Vérifier** : il lit la sortie (`phpunit`, `bin/console lint:container`, erreurs PHPStan) et corrige si besoin.
6. **Rendre la main** quand tout est vert, ou quand il a besoin de votre décision.

### Les outils

Le modèle ne touche jamais directement à votre machine : il demande à utiliser un outil, et Claude Code l'exécute (sous réserve des permissions, module 5).

| Outil | Rôle | Équivalent humain |
| --- | --- | --- |
| Read | Lire un fichier | Ouvrir le fichier dans l'éditeur |
| Glob / Grep | Trouver des fichiers, chercher du texte | `find`, `grep`, la recherche globale de PhpStorm |
| Edit / Write | Modifier ou créer un fichier | Taper le code |
| Bash | Lancer une commande | Le terminal |
| WebFetch / WebSearch | Consulter une doc en ligne | Le navigateur |
| Agent | Déléguer à un sous-agent (module 7) | Confier une recherche à un collègue |
| Outils MCP | Parler à des services externes (module 8) | Jira, base de données, GitHub… |

### La fenêtre de contexte

Tout ce que Claude lit, écrit ou exécute s'accumule dans sa fenêtre de contexte, sa « mémoire de travail » pour la session. Quand elle se remplit, les réponses ralentissent, coûtent plus cher et perdent en précision.

- `/context` montre ce qui occupe la fenêtre.
- `/compact` résume la conversation pour libérer de la place (cela se fait aussi automatiquement).
- `/clear` repart de zéro : à utiliser entre deux tâches sans rapport.

Analogie : la fenêtre de contexte, c'est la RAM d'une requête PHP. Ce qui doit survivre d'une session à l'autre doit être écrit ailleurs, dans le CLAUDE.md (module 4).

## Module 3 — Installation et premiers pas

Une seule commande suffit sous Linux, macOS ou WSL, puis `claude` dans le dossier du projet. Il faut un abonnement Claude (Pro, Max, Team, Enterprise) ou un compte Console avec clé API ([doc officielle](https://code.claude.com/docs/en/overview)).

```bash
curl -fsSL https://claude.ai/install.sh | bash
claude --version
cd mon-projet-symfony
claude
```

L'installation native se met à jour seule en arrière-plan. Il existe aussi Homebrew (`brew install --cask claude-code`), WinGet, et des paquets apt, dnf ou apk pour Debian, Fedora, RHEL et Alpine.

### Sur un VPS Linux

- Installez-le sous votre utilisateur, jamais en root : Claude hérite des droits du compte qui le lance.
- En SSH sans navigateur, la connexion affiche une URL à ouvrir sur votre poste ; collez ensuite le code obtenu dans le terminal.
- Lancez-le dans `tmux` ou `screen` pour qu'une longue tâche survive à une coupure SSH.
- Alternative : définir `ANTHROPIC_API_KEY` (facturation à l'usage via la Console), que Claude Code propose d'utiliser au démarrage.

### Avec Docker

Deux approches : lancer Claude Code sur l'hôte et lui faire exécuter `docker compose exec php bin/console …`, ou le lancer dans un conteneur de développement (devcontainer) pour isoler complètement le système. La seconde est la plus sûre quand on accorde des permissions larges (module 5).

### Premiers pas

1. `claude` dans le projet, puis une question d'exploration : « Explique-moi l'architecture de ce projet ».
2. `/init` pour générer un premier CLAUDE.md (module 4).
3. Une petite tâche réelle : « Ajoute une validation `Assert\Email` sur `User::$email` et lance les tests ».
4. Relisez le diff, puis « commit avec un message clair ».

Modes non interactifs utiles pour scripter :

```bash
claude -p "liste les routes sans contrôle d'accès"   # une réponse, puis sortie
git diff main --name-only | claude -p "relis ces fichiers pour la sécurité"
claude -c          # reprendre la dernière conversation
claude --resume    # choisir une conversation à reprendre
```

## Module 4 — La mémoire : CLAUDE.md et auto memory

Chaque session démarre avec une fenêtre de contexte vide ; deux mécanismes transportent le savoir d'une session à l'autre : les fichiers CLAUDE.md, que vous écrivez, et l'auto memory, que Claude écrit lui-même ([doc mémoire](https://code.claude.com/docs/en/memory.md)).

Analogie Symfony : CLAUDE.md joue le rôle de `config/` + du README d'onboarding. On y met ce qu'on expliquerait à un nouveau développeur le premier jour.

### Où placer les fichiers

| Portée | Emplacement | Partagé avec |
| --- | --- | --- |
| Organisation | `/etc/claude-code/CLAUDE.md` (Linux) | Tous les utilisateurs de la machine |
| Utilisateur | `~/.claude/CLAUDE.md` | Vous, sur tous vos projets |
| Projet | `./CLAUDE.md` ou `./.claude/CLAUDE.md` | L'équipe, via Git |
| Local | `./CLAUDE.local.md` (à mettre dans `.gitignore`) | Vous, sur ce projet |
| Règles ciblées | `.claude/rules/*.md` avec `paths:` en frontmatter | Chargées seulement pour les fichiers concernés |

Tous les fichiers trouvés s'additionnent, ils ne s'écrasent pas. Un CLAUDE.md placé dans un sous-dossier (`src/Admin/CLAUDE.md`) se charge dès que Claude touche à ce dossier. Si le dépôt a déjà un `AGENTS.md` (format partagé avec d'autres agents), Claude Code peut le lire à la place.

### Exemple pour un projet Symfony

```markdown
# Projet : back-office CF2m (Symfony 7.3, PHP 8.3)

## Commandes
- Tests : `docker compose exec php bin/phpunit`
- Analyse : `vendor/bin/phpstan analyse` (niveau 8)
- Style : `vendor/bin/php-cs-fixer fix`

## Conventions
- Contrôleurs fins : la logique va dans `src/Service/`
- Attributs PHP pour les routes et l'ORM, jamais d'annotations
- Toute nouvelle route admin exige `#[IsGranted('ROLE_ADMIN')]`
- Migrations : `make:migration`, jamais de modification manuelle du schéma

## À ne jamais faire
- Toucher à `.env.local` ou aux secrets
- Lancer `doctrine:schema:update --force`
```

### Bonnes pratiques

- Visez moins de 200 lignes : un fichier trop long coûte du contexte et est moins bien suivi.
- Soyez vérifiable : « lance `bin/phpunit` avant de committer » plutôt que « teste ton code ».
- Ajoutez une règle quand Claude commet deux fois la même erreur.
- `/init` génère un premier fichier en analysant le projet ; `/memory` ouvre les fichiers pour les éditer ; `/context` vérifie ce qui est chargé.
- `@chemin/fichier.md` importe un autre fichier (par exemple `@docs/architecture.md`).

### Auto memory

Quand vous corrigez Claude (« ici on utilise Messenger, pas des appels synchrones »), il peut l'enregistrer seul dans `~/.claude/projects/<projet>/memory/`. Cette mémoire est locale à la machine, en Markdown lisible, et consultable avec `/memory`.

Important : CLAUDE.md est une consigne, pas une barrière. Pour interdire réellement une action, il faut une permission `deny` ou un hook (modules 5 et 8).

## Module 5 — Permissions, modes et sécurité

C'est Claude Code (le programme), pas le modèle, qui applique les permissions : une règle `deny` bloque l'action quoi que Claude « décide ». Par défaut, la lecture dans le dossier du projet est libre ; les commandes shell, les modifications de fichiers et les accès web demandent votre accord ([doc permissions](https://code.claude.com/docs/en/permissions.md)).

Analogie Symfony : c'est le `security.yaml` de l'agent. Les règles `allow`, `ask`, `deny` jouent le rôle des `access_control`, et comme pour un voter, un `deny` l'emporte toujours.

### Les modes (Shift+Tab pour basculer)

| Mode | Comportement | Quand l'utiliser |
| --- | --- | --- |
| Manual (`default`) | Demande à la première utilisation de chaque outil | Découverte, projet sensible |
| `acceptEdits` | Accepte les modifications de fichiers sans demander | Tâche bien cadrée, sous Git |
| `plan` | Lit et explore, mais ne modifie rien ; propose un plan à valider | Avant toute fonctionnalité non triviale |
| `auto` | Pas de demandes de routine ; un classifieur vérifie chaque action risquée | Longues tâches, si disponible sur votre offre |
| `dontAsk` | Refuse tout ce qui n'est pas pré-autorisé | Scripts, CI |
| `bypassPermissions` | Ne demande plus rien | Uniquement dans un conteneur ou une VM jetable |

### Configurer les règles

Dans `.claude/settings.json` (partagé via Git) ou `.claude/settings.local.json` (personnel), ou via `/permissions` :

```json
{
  "permissions": {
    "allow": [
      "Bash(docker compose exec php bin/phpunit *)",
      "Bash(vendor/bin/phpstan *)",
      "Bash(git commit *)"
    ],
    "ask": ["Bash(git push *)"],
    "deny": [
      "Read(./.env.local)",
      "Read(./config/secrets/**)",
      "Bash(bin/console doctrine:schema:drop *)",
      "Bash(rm -rf *)"
    ]
  }
}
```

Placez toujours le `*` après la sous-commande : `Bash(git log *)` autorise seulement `git log`, alors que `Bash(git *)` autorise tout Git.

### Les limites à connaître

- Une règle Bash compare le texte de la commande. `Bash(rm *)` ne bloque pas `/bin/rm` ni `sh -c 'rm …'` : ce n'est pas une frontière de sécurité absolue.
- Un `deny` sur `Read(./.env)` ne bloque pas un script PHP que Claude lancerait et qui lirait ce fichier lui-même.
- Pour une isolation réelle, activez le sandboxing (isolation du système de fichiers et du réseau au niveau OS) ou travaillez dans un conteneur.

### Checklist sécurité pour un VPS

- Utilisateur dédié sans sudo, jamais root.
- Secrets hors du dépôt, et en `deny` explicite.
- Pas de `bypassPermissions` hors conteneur jetable.
- Méfiance envers les dépôts que vous n'avez pas écrits : un `.claude/settings.json` ou un `.mcp.json` peut déclarer des hooks et des serveurs. Claude Code demande de faire confiance au dossier avant de les activer ; lisez ce qu'il liste.
- Attention à l'injection de prompt : une page web ou un fichier lu par Claude peut contenir des instructions malveillantes. Les permissions sont votre filet de sécurité.

## Module 6 — Les commandes slash

Tout ce qui commence par `/` dans Claude Code est une commande : soit une commande intégrée qui exécute une logique fixe, soit un skill (module 8) qui donne des instructions à Claude. Les anciennes « commandes personnalisées » de `.claude/commands/` fonctionnent toujours, mais elles ont été fusionnées dans les skills.

Analogie Symfony : ce sont les commandes `bin/console` de l'agent. Les intégrées sont celles du framework, les vôtres sont vos `make:` maison.

### Les commandes à connaître

| Commande | Rôle |
| --- | --- |
| `/help` | Liste des commandes disponibles |
| `/init` | Génère ou améliore le CLAUDE.md |
| `/clear` | Vide la conversation (nouvelle tâche) |
| `/compact` | Résume la conversation pour libérer du contexte |
| `/context` | Montre ce qui occupe la fenêtre de contexte |
| `/memory` | Ouvre les fichiers CLAUDE.md et l'auto memory |
| `/permissions` | Gère les règles allow / ask / deny |
| `/model` | Change de modèle (Opus, Sonnet, Haiku…) |
| `/agents` | Crée et gère les sous-agents |
| `/mcp` | Gère les serveurs MCP connectés |
| `/hooks` | Gère les hooks |
| `/plugin` | Installe ou désactive des plugins |
| `/skills` | Liste les skills disponibles |
| `/resume` | Reprend une ancienne conversation |
| `/rewind` | Revient en arrière (code et conversation) à un point précédent |
| `/usage` | Consommation de votre forfait |
| `/doctor` | Vérifie l'installation et la configuration |
| `/code-review` | Relecture du code par Claude (skill fourni) |

### Raccourcis utiles

- `Shift+Tab` : change de mode (Manual, acceptEdits, plan…).
- `Échap` : interrompt Claude ; deux fois `Échap` pour revenir à un message précédent.
- `@fichier` : ajoute un fichier au contexte (`@src/Controller/FactureController.php`).
- `!commande` : lance une commande shell vous-même, sa sortie entre dans le contexte.
- `Ctrl+B` : passe une tâche longue (ou un sous-agent) en arrière-plan.

### Créer sa propre commande

Un fichier `.claude/skills/nouvelle-entite/SKILL.md` crée la commande `/nouvelle-entite` :

```markdown
---
description: Crée une entité Doctrine avec repository, CRUD admin et tests
argument-hint: [NomEntite]
disable-model-invocation: true
---

Crée l'entité $ARGUMENTS en suivant nos conventions :
1. `bin/console make:entity $ARGUMENTS` (attributs PHP)
2. Génère la migration et montre-la-moi avant de l'exécuter
3. Ajoute un CRUD dans `src/Controller/Admin/` protégé par `ROLE_ADMIN`
4. Écris des tests fonctionnels et lance `bin/phpunit`
```

Usage : `/nouvelle-entite Facture`. Committé dans le dépôt, tout le monde dans l'équipe l'obtient.

## Module 7 — Les sous-agents

Un sous-agent est une autre instance de Claude, avec sa propre fenêtre de contexte vierge : il reçoit une mission, lit et travaille de son côté, puis ne renvoie que son résultat à la session principale ([article Anthropic](https://claude.com/blog/how-and-when-to-use-subagents-in-claude-code)). Plusieurs sous-agents peuvent tourner en parallèle, chacun avec ses propres outils et permissions.

Analogie : les onglets du navigateur pour suivre une piste sans perdre le fil. Ou, côté Symfony, un message Messenger envoyé à un worker : la session principale délègue et récupère le résultat, sans porter tout le travail intermédiaire.

### Les sous-agents intégrés

| Agent | Rôle |
| --- | --- |
| Explore | Recherche rapide en lecture seule dans le code |
| Plan | Étudie le code avant de proposer une stratégie d'implémentation |
| General-purpose | Tâches complexes en plusieurs étapes |

Claude les lance souvent tout seul. Vous pouvez aussi le demander explicitement : « Utilise un sous-agent pour comprendre comment fonctionne l'authentification ».

### Quand les utiliser

- **Recherche lourde** : comprendre une partie du code exige de lire des dizaines de fichiers. Le sous-agent les lit et ne renvoie qu'un résumé.
- **Tâches indépendantes** : corriger trois contrôleurs sans lien entre eux, en parallèle.
- **Regard neuf** : une relecture par un agent qui n'a pas suivi la discussion, donc sans ses biais.
- **Vérification avant commit** : un second avis sur les cas limites oubliés.
- **Pipeline** : conception, puis implémentation, puis tests, chaque étape dans son propre agent.

Repère pratique de l'article : plus de dix fichiers à explorer, ou trois tâches indépendantes ou plus, justifient un sous-agent.

### Quand les éviter

- Travail séquentiel où chaque étape dépend de la précédente.
- Deux agents qui modifieraient le même fichier : conflit assuré.
- Petites tâches : le coût de délégation dépasse le gain.
- Trop d'agents spécialisés : Claude choisit moins bien. Quelques agents bien cadrés suffisent.
- Les sous-agents ne se parlent pas entre eux ; pour des agents qui coordonnent, il existe les « agent teams », plus lourdes et plus coûteuses.

### Créer un sous-agent personnalisé

`/agents` vous guide pas à pas ; sinon, un fichier Markdown dans `.claude/agents/` (projet, partagé via Git) ou `~/.claude/agents/` (personnel) :

```markdown
---
name: security-reviewer
description: Relit le code PHP/Symfony pour la sécurité avant chaque commit. À utiliser après toute modification de contrôleur, formulaire, requête Doctrine ou configuration de sécurité.
tools: Read, Grep, Glob
model: sonnet
---

Tu es un auditeur sécurité Symfony. Pour chaque fichier modifié, vérifie :
- Contrôle d'accès : `#[IsGranted]`, voters, `access_control`
- Injection SQL : DQL ou SQL construit par concaténation
- XSS : usage de `|raw` dans Twig
- CSRF sur les formulaires et actions sensibles
- Secrets ou données personnelles exposés dans les logs

Rends une liste classée par gravité (critique, élevée, moyenne), avec fichier et ligne. Ne modifie rien.
```

Le champ `description` décide quand Claude délègue : décrivez le déclencheur, pas seulement la compétence. « Relit le code avant chaque commit » fonctionne mieux que « expert sécurité ». Avec `tools: Read, Grep, Glob`, l'agent ne peut rien modifier, ce qui est idéal pour une relecture.

Invocation automatique, ou par son nom : « Demande au security-reviewer de relire les changements en cours ». Une tâche longue passe en arrière-plan avec `Ctrl+B`.

## Module 8 — Étendre Claude Code : skills, hooks, MCP, plugins

Quatre mécanismes complètent CLAUDE.md et les sous-agents ; chacun répond à une question différente.

| Mécanisme | Répond à | Chargé quand | Analogie Symfony |
| --- | --- | --- | --- |
| CLAUDE.md | « Que doit-il toujours savoir ? » | À chaque session | `config/` + README |
| Skill | « Comment faire telle procédure ? » | À la demande | Une commande `make:` maison |
| Sous-agent | « Qui s'en occupe ? » | Quand on délègue | Un worker Messenger |
| Hook | « Que doit-il se passer à coup sûr ? » | À chaque événement | Un EventSubscriber |
| Serveur MCP | « À quoi peut-il se connecter ? » | Au démarrage | Un bundle d'intégration (client API) |
| Plugin | « Comment tout distribuer ? » | À l'installation | Un bundle Composer |

### Skills

Un skill est un dossier avec un `SKILL.md` (frontmatter + instructions), et éventuellement des scripts, modèles ou exemples ([doc skills](https://code.claude.com/docs/en/skills.md)). Seule la description est chargée en permanence ; le contenu complet n'est lu que lorsqu'on l'invoque (`/nom`) ou que Claude juge qu'il correspond à la tâche. C'est donc l'endroit idéal pour une procédure longue qui ne sert pas tout le temps.

Options utiles du frontmatter : `disable-model-invocation: true` (seulement à la main, pour un `/deploy`), `allowed-tools` (pré-autorise des outils pendant le skill), `context: fork` (exécute le skill dans un sous-agent isolé). Une ligne `` !`git diff HEAD` `` injecte la sortie d'une commande avant que Claude ne lise le skill.

### Hooks

Un hook est une commande shell (ou un appel HTTP) déclenchée à un moment précis du cycle de vie : `PreToolUse` (avant un outil, peut bloquer), `PostToolUse` (après), `Stop` (quand Claude veut rendre la main), `SessionStart`, `UserPromptSubmit`… Contrairement à CLAUDE.md, un hook s'exécute toujours, quoi que Claude décide.

Exemple : formater automatiquement chaque fichier PHP modifié, dans `.claude/settings.json` :

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          { "type": "command", "command": "vendor/bin/php-cs-fixer fix --quiet" }
        ]
      }
    ]
  }
}
```

Un hook `PreToolUse` qui sort avec le code 2 bloque l'action : c'est la bonne façon d'interdire réellement l'écriture dans `config/secrets/`. Un hook `Stop` peut refuser que Claude s'arrête tant que `bin/phpunit` échoue. Méfiance : un hook tourne avec vos droits, relisez ceux des dépôts tiers.

### Serveurs MCP

Le Model Context Protocol est un standard ouvert pour brancher Claude sur des outils externes : GitHub, Jira, Sentry, une base PostgreSQL ou MySQL, un navigateur… Chaque serveur ajoute des outils (`mcp__github__create_issue`).

```bash
claude mcp add --transport http github https://api.githubcopilot.com/mcp/
claude mcp list
```

Un fichier `.mcp.json` à la racine partage les serveurs du projet avec l'équipe. Côté sécurité, branchez une base en lecture seule avec un utilisateur dédié, jamais l'utilisateur de production.

### Plugins

Un plugin regroupe skills, sous-agents, hooks et serveurs MCP dans un paquet installable : `/plugin` pour parcourir les marketplaces, installer, activer ou désactiver. C'est la façon la plus simple de distribuer la même configuration à toute une équipe ou à une promotion d'apprenants.

Ordre conseillé pour bâtir sa configuration : CLAUDE.md d'abord, puis un skill quand une procédure revient, un sous-agent quand une tâche encombre le contexte, un hook quand une règle doit être garantie, MCP quand il faut sortir du dépôt.

## Module 9 — Atelier pratique sur un projet Symfony

Six exercices progressifs, environ 3 heures au total, sur un projet Symfony neuf (`symfony new atelier-claude --webapp`) versionné sous Git. Chaque exercice mobilise un module du cours.

- [ ] **Exercice 1 — Explorer (20 min, modules 1-2).** Demandez : « Explique-moi la structure de ce projet et le cycle d'une requête jusqu'à un contrôleur ». Observez les outils utilisés (Read, Glob, Bash). Puis `/context` pour voir ce que cela a coûté.
- [ ] **Exercice 2 — Donner la mémoire (20 min, module 4).** Lancez `/init`, relisez le CLAUDE.md produit, ajoutez vos commandes de test et deux règles maison. Vérifiez avec `/context` qu'il est chargé.
- [ ] **Exercice 3 — Planifier puis coder (45 min, modules 2 et 5).** Passez en mode plan (`Shift+Tab`) : « Ajoute une entité Formation (titre, date, places) avec un CRUD admin protégé et des tests ». Discutez le plan, validez-le, laissez coder, puis relisez le diff avant le commit.
- [ ] **Exercice 4 — Sécuriser (30 min, module 5).** Écrivez `.claude/settings.json` avec des `deny` sur `.env.local` et `doctrine:schema:drop`. Demandez à Claude de lire `.env.local` et constatez le refus.
- [ ] **Exercice 5 — Créer un skill et un sous-agent (40 min, modules 6-7).** Créez le skill `/nouvelle-entite` et le sous-agent `security-reviewer` des modules précédents. Générez une entité Inscription avec le skill, puis faites-la relire par le sous-agent.
- [ ] **Exercice 6 — Automatiser avec un hook (25 min, module 8).** Ajoutez un hook `PostToolUse` qui lance `php-cs-fixer` après chaque modification. Introduisez volontairement un défaut de style et vérifiez qu'il est corrigé tout seul.

### Bilan à faire après l'atelier

- Qu'est-ce que Claude a fait sans qu'on le lui demande, et était-ce souhaitable ?
- Quelles consignes avez-vous dû répéter ? Elles doivent rejoindre le CLAUDE.md.
- Quelles actions vous ont mis mal à l'aise ? Elles appellent une règle `deny` ou un hook.

## Module 10 — Bonnes pratiques, pièges et usage en équipe

La règle d'or : traitez Claude Code comme un développeur compétent mais nouveau dans le projet. Donnez-lui du contexte, un objectif vérifiable, et relisez son travail.

### Bonnes pratiques

- **Explorer, planifier, coder, committer** : faites-le lire et proposer un plan avant d'écrire, surtout sur une fonctionnalité de plus de quelques fichiers.
- **Donnez-lui un moyen de vérifier** : tests, PHPStan, captures attendues. Un agent qui peut constater son erreur la corrige seul.
- **Soyez précis** : « ajoute une pagination de 20 éléments à `FormationController::index` avec KnpPaginator » plutôt que « améliore la liste ».
- **Une tâche par conversation** : `/clear` entre deux sujets sans rapport, sinon le contexte se pollue.
- **Commits fréquents** : Git est votre filet. `/rewind` aide aussi, mais Git reste la référence.
- **Corrigez tôt** : `Échap` dès que Claude part dans la mauvaise direction, plutôt que d'attendre la fin.

### Pièges classiques

- Accepter un diff sans le lire. Le code compile, mais la logique métier peut être fausse.
- Laisser grossir un CLAUDE.md au-delà de 200 lignes : il est alors moins bien suivi.
- Croire qu'une consigne écrite dans CLAUDE.md est une protection. Seuls les permissions, hooks et sandbox protègent.
- Lancer `bypassPermissions` sur sa machine ou sur un VPS de production.
- Multiplier les sous-agents et les MCP « au cas où » : chacun coûte du contexte.

### Coûts

Avec un abonnement (Pro, Max, Team, Enterprise), l'usage est inclus dans des limites ; avec une clé API, chaque token est facturé. Dans les deux cas, le contexte est le principal levier : `/clear` et `/compact` régulièrement, Haiku ou Sonnet pour les tâches simples via `/model`, sous-agents pour les recherches lourdes. `/usage` indique où vous en êtes.

### Déployer dans une équipe ou une promotion

- Committez `CLAUDE.md`, `.claude/settings.json`, `.claude/skills/` et `.claude/agents/` : tout le monde part de la même base.
- Pour des règles qu'aucun membre ne peut contourner, utilisez les paramètres gérés (managed settings) de l'organisation, par exemple `/etc/claude-code/managed-settings.json` sur Linux.
- Pour des apprenants : commencez en mode Manual, puis plan, et n'introduisez `acceptEdits` qu'une fois la relecture de diff acquise. L'objectif pédagogique reste de comprendre le code produit, pas seulement de l'obtenir.
- Formalisez une checklist de relecture humaine : sécurité, tests, cohérence avec l'architecture.

## Ressources

Claude Code évolue toutes les semaines : vérifiez les détails (noms de modes, options, commandes) dans la documentation officielle avant d'en faire un standard d'équipe. `/help` et `/doctor` restent la référence pour votre version installée.

- [Documentation officielle de Claude Code](https://code.claude.com/docs/en/overview)
- [Mémoire et CLAUDE.md](https://code.claude.com/docs/en/memory.md)
- [Permissions](https://code.claude.com/docs/en/permissions.md)
- [Skills](https://code.claude.com/docs/en/skills.md)
- [Sous-agents](https://code.claude.com/docs/en/sub-agents)
- [Hooks](https://code.claude.com/docs/en/hooks)
- [Bonnes pratiques](https://code.claude.com/docs/en/best-practices.md)
- [Article : quand utiliser les sous-agents](https://claude.com/blog/how-and-when-to-use-subagents-in-claude-code)
- [Claude Academy](https://academy.claude.com/) : cours gratuits, dont Claude Code 101 et Claude Code in Action (en anglais)
