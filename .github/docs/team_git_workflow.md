# Team Git Workflow (Miraki Website)

A plain-English reference for how our team of 3-4 developers shares code.
Read this once fully. After that, you'll only need the "Daily Routine" section.

---

## 1. The Big Picture

We have TWO permanent branches that live on GitHub forever:

| Branch    | What it is                                    | Who commits to it                     |
| --------- | --------------------------------------------- | ------------------------------------- |
| `main`    | Production. Stable code that is live.         | Nobody directly. Only via PR.         |
| `develop` | Shared integration branch. Everyone's work.   | Nobody directly. Only via PR.         |

Everyone else works on temporary **feature branches** that branch off `develop`,
and merge back into `develop` through a Pull Request (PR).

```
main        ●──────────────●────────────────●         (production, protected)
             \            /                 /
develop      ●──●──●──●──●──●──●──●──●──●──●            (shared, protected)
                  \        /   \       /
feature/x          ●──●──●      \     /                (dev1's work)
feature/y                        ●──●                  (dev2's work)
```

Key mental model:
- A schema/model file (e.g. `backend/src/models/seller.model.js`) is just CODE.
- Git shares CODE. So a teammate's change reaches you the moment you `git pull`.
- `push` = "share MY work". `pull` = "get EVERYONE's work". Do both every day.

---

## 2. One-Time Setup (already done)

This was run ONCE by the person who set up the repo. You do NOT repeat this:

```bash
git checkout -b develop        # create the develop branch from main
git push -u origin develop     # upload it to GitHub so the team can use it
```

Verify it exists:

```bash
git branch -a
# You should see:
#   develop
#   main
#   remotes/origin/develop
#   remotes/origin/main
```

If `remotes/origin/develop` is in the list, setup is complete.

---

## 3. Daily Routine (this is the part you use every day)

### Step 1 — Start from the latest shared code

```bash
git checkout develop     # switch to the shared branch
git pull                 # download everyone's latest merged work
```

> Windows PowerShell note: run these on two separate lines.
> `git checkout develop && git pull` only works in PowerShell 7+.

### Step 2 — Create your own branch to work in

```bash
git checkout -b feature/short-description
# examples:
#   feature/seller-vat-number
#   feature/theme-dark-mode
#   fix/login-crash
```

`-b` creates a NEW branch and switches you onto it. You never edit `develop` directly.

### Step 3 — Make your edits

Open the files in VS Code and change them. For example, add a field to a schema:

```js
// backend/src/models/seller.model.js
vatNumber: { type: String, required: false },   // start optional! (see section 5)
```

### Step 4 — Save your changes as a commit

```bash
git add .                                            # stage all changed files
git commit -m "feat(seller): add vatNumber field"    # save a snapshot
```

> Our husky pre-commit hook auto-runs Prettier + ESLint here.
> If it blocks the commit, fix what it reports and commit again.

Commit message convention:
- `feat(area): ...` — a new feature
- `fix(area): ...` — a bug fix
- `chore(area): ...` — config/tooling/cleanup

### Step 5 — Upload your branch to GitHub

```bash
git push -u origin feature/short-description
```

`-u origin ...` is only needed the FIRST time you push a new branch.
After that, just `git push`.

### Step 6 — Open a Pull Request (in the GitHub website, not the terminal)

1. Go to the repo on GitHub — it usually shows a "Compare & pull request" button.
2. Set base = `develop`, compare = `feature/short-description`.
3. Add a title + description, click **Create pull request**.
4. A teammate **reviews** and approves.
5. Click **Merge**. Your work is now in `develop`.

---

## 4. How a teammate GETS your change

They don't need your whole flow — just the pull part:

```bash
git checkout develop
git pull                 # <-- this is the moment they receive your merged change
```

If they're in the middle of their own feature branch and want your change too:

```bash
git checkout feature/their-task
git merge develop        # pull the latest develop into their branch
```

---

## 5. The Tricky Case: linked models / schema changes

Scenario: `store.model.js` references a seller via `sellerId`, and dev2 adds a
`required` field to `seller.model.js`. Here is what every dev must understand:

- **The CODE arrives automatically.** After `git pull`, the new field is in the
  schema file. Nothing else needed for the code.
- **The DATABASE does NOT update automatically.** MongoDB is schema-less:
  - Existing documents simply won't have the new field (they read as `undefined`).
  - If the field is `required: true`, saving old records can suddenly FAIL validation.
  - If each dev runs their own local Mongo (via `docker-compose.yml`), only the
    schema CODE is shared — their DATA is separate until they re-run the seed
    (`backend/src/config/seed.js`).

### Safe way to change a shared/linked schema

1. Add the field as **optional first** (`required: false` or with a `default`).
2. Merge that small PR quickly so everyone pulls it.
3. Backfill existing data if needed (a small script).
4. Only later tighten it to `required: true` in a follow-up PR.
5. **Announce** any breaking schema change (rename / newly-required) to the team —
   don't let it merge silently.
6. Route schema files to the right reviewer via `CODEOWNERS` so a data owner
   always reviews `*.model.js` changes.

---

## 6. Protect the Branches (do this once on GitHub)

Until this is set, anyone can still bypass PRs. On GitHub:

**Repo → Settings → Branches → Add branch protection rule**

Create a rule for `main`, then repeat for `develop`, and enable:

1. **Require a pull request before merging** → Require approvals: **1**
2. **Require status checks to pass before merging** → select the CI check from `ci.yml`
3. **Do not allow bypassing the above settings** (applies even to admins)

This is what actually FORCES the branch → PR → review → merge flow.

---

## 7. Quick Command Cheat Sheet

```bash
# --- every time you start work ---
git checkout develop
git pull
git checkout -b feature/my-task

# --- while working ---
git add .
git commit -m "feat(area): what I did"
git push                      # (first push of a new branch: git push -u origin feature/my-task)

# --- get teammates' latest work ---
git checkout develop
git pull

# --- see where you are / what branches exist ---
git status
git branch -a
```

---

## 8. Golden Rules

1. Never commit directly to `main` or `develop`. Always use a feature branch + PR.
2. `git pull` on `develop` at the START of every working session.
3. Keep PRs small and focused — easier to review, fewer conflicts.
4. Schema changes are additive-first (optional), then tightened later.
5. When in doubt, run `git status` — it tells you where you are and what's unsaved.
