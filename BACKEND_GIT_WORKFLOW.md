# E-COMMERCE BACKEND – COMPLETE GIT WORKFLOW & MIGRATION GUIDE

Goal: let you (or any new contributor) set up this backend on a **new machine** from scratch and push code to the canonical repository owned by **nikhil-os**.

---

## CURRENT REPOSITORY MAP

| Role                                    | URL                                                   | Notes                                                                                    |
| --------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| ✅ Primary origin (push target)         | `https://github.com/nikhil-os/e-commerce-backend.git` | Your personal repository – all pushes should land here.                                  |
| 🔁 Legacy reference (optional upstream) | `https://github.com/Saniya95/E-commerce-backend.git`  | Previous fork. Add as an `upstream`-style remote only if you still need to pull from it. |

> **Important:** Do **not** push to the legacy Saniya95 repo unless you explicitly decide to maintain it. All commands below assume the new origin is `nikhil-os/e-commerce-backend`.

---

## PRIMARY BRANCHES

- `main` – canonical working branch. Contains the latest fixes (secure cookies, dual-source auth tokens, refined CORS, etc.).
- `master` – legacy default branch from the original fork (still exists remotely, but no longer used).

Feel free to delete `master` after confirming the migration, or keep it for historical reference.

---

## KEY BACKEND IMPROVEMENTS ALREADY COMPLETED

- ✅ Hardened auth flow: JWT is issued as a secure, cross-site cookie (SameSite=None, Secure, HttpOnly, 7-day maxAge).
- ✅ Auth middleware now validates tokens from either `Authorization: Bearer …` headers **or** cookies and attaches `req.user`.
- ✅ CORS tightened with explicit origins (`localhost:3000` + production), credential support, and mandatory `Access-Control-Allow-Credentials` header.
- ✅ Placeholder assets and static routes cleaned up; duplicate directories removed.
- ✅ Database connection, payment integrations, and image handling stabilised.

Use this guide to transfer that stable state to a brand-new machine without copying the existing `.git` directory.

---

## SECTION 1 – OPTION C: FROM A FOLDER WITHOUT `.git`

If you copied the project folder via USB/zip and it **does not** contain a `.git` directory, follow these steps:

```powershell
# 1. Navigate into the project folder
cd C:\dev\e-commerce-backend

# 2. Initialize a brand-new repository
git init

# 3. Add everything and create your first local commit
git add .
git commit -m "chore: import backend project on new machine"

# 4. Configure remotes
#    Origin = your repo (nikhil)
#    Upstream = optional legacy reference
git remote add origin https://github.com/nikhil-os/e-commerce-backend.git
# Optional legacy remote (only if you still need to pull from Saniya95)
git remote add upstream https://github.com/Saniya95/E-commerce-backend.git

# 5. Fetch any existing remote history (so future merges know where to look)
git fetch origin --prune
# Optional legacy fetch
git fetch upstream --prune

# 6. Rename local branch to match canonical name
git branch -M main

# 7. Push your local history to the new origin (creates main if absent)
git push -u origin main
```

Verify remotes anytime:

```powershell
git remote -v
```

> **Tip:** If the remote already has history you want to keep, run `git pull origin main --rebase` after step 7 (before making changes) to sync.

---

## SECTION 2 – KEEPING HISTORY IN SYNC

### Pulling Latest Updates

```powershell
git checkout main
git fetch origin --prune
git pull --ff-only origin main
```

### (Optional) Tracking Legacy Repo

If you keep the `upstream` remote pointing at `Saniya95`, occasionally pull updates:

```powershell
git fetch upstream --prune
git merge upstream/main   # or upstream/master if that branch is newer
```

If Git complains about unrelated histories, resolve once using:

```powershell
git merge upstream/main --allow-unrelated-histories
```

Then resolve conflicts, stage, and commit as usual.

---

## SECTION 3 – MAKING CHANGES & PUSHING TO `nikhil-os`

```powershell
# Confirm branch
git branch --show-current

# Make code changes... then stage them
git add path\to\fileA path\to\fileB
# or everything: git add .

# Commit with a conventional message
git commit -m "feat(cart): add quantity update endpoint"

# Push to your origin (nikhil-os)
git push origin main
```

Open a PR only if collaborating with someone else or if you keep the legacy repo in sync. Otherwise, direct pushes to `main` are fine since you own the repo.

---

## SECTION 4 – TROUBLESHOOTING AUTH & CORS (BACKEND CONTEXT)

| Symptom                                     | Likely Cause                                         | Fix                                                                                                                                 |
| ------------------------------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `401 No token provided` from cart endpoints | Frontend not sending cookies or Authorization header | Ensure frontend fetch uses `credentials: 'include'` and sets `Authorization: Bearer <token>` if available. Backend now checks both. |
| Cookie missing in browser                   | `SameSite=None` requires HTTPS in production         | Use HTTPS locally via tools like `mkcert`, or rely on header token fallback for HTTP.                                               |
| CORS preflight fails                        | Origin not in whitelist or missing credentials       | Confirm frontend origin is listed in `corsOptions.origin` and requests include credentials.                                         |
| `jwt malformed`                             | Stale/empty token in header                          | Clear localStorage/cookies; retry login.                                                                                            |

---

## SECTION 5 – WINDOWS CREDENTIAL & PERMISSION GOTCHAS

- View stored GitHub credentials:
  ```powershell
  cmdkey /list | findstr github
  ```
- Delete stale entries causing push 403s:
  ```powershell
  cmdkey /delete:LegacyGeneric:target=git:https://github.com
  cmdkey /delete:LegacyGeneric:target=git:https://<username>@github.com
  ```
- Ensure your remote URL does **not** embed an old PAT:
  ```powershell
  git remote set-url origin https://github.com/nikhil-os/e-commerce-backend.git
  ```
- Prefer Git Credential Manager (bundled with modern Git for Windows) or browser auth prompts for new tokens.

---

## SECTION 6 – COMMON GIT COMMAND QUICK REFERENCE

| Task                            | Command                               |
| ------------------------------- | ------------------------------------- |
| Show short status               | `git status -sb`                      |
| View remotes                    | `git remote -v`                       |
| Fetch everything (clean)        | `git fetch --all --prune`             |
| Hard reset local main to origin | `git reset --hard origin/main`        |
| View diff since last push       | `git diff origin/main...HEAD --stat`  |
| Delete local branch             | `git branch -d old-branch`            |
| Delete remote branch            | `git push origin --delete old-branch` |

---

## SECTION 7 – RE-CREATING `main` FROM SCRATCH (EMERGENCY)

If your local history becomes unusable:

```powershell
rm -r -force .git

# Re-run Section 1 (Option C) steps
.git init
...
```

Or, if `.git` still exists but you want a clean branch:

```powershell
git fetch origin --prune
git checkout -B main origin/main
```

---

## SECTION 8 – BACKLOG / FUTURE IMPROVEMENTS

- [ ] Externalise CORS origins via environment variables (e.g., `CORS_ALLOWED_ORIGINS`).
- [ ] Automate health checks & smoke tests in CI (GitHub Actions).
- [ ] Add integration tests covering signup/login/cart flow.
- [ ] Split environment defaults from runtime secrets (production `.env` template).
- [ ] Create a Dockerfile + docker-compose for one-command local setup.

---

## SECTION 9 – BEST PRACTICES & SAFETY NETS

- Stick to conventional commits (`feat`, `fix`, `chore`, `docs`, etc.).
- Never commit `.env` or other secrets (already listed in `.gitignore`).
- Run light checks before pushing:
  ```powershell
  npm run lint
  npm run test   # add once test suite exists
  ```
- Pull (`git pull --ff-only origin main`) before every push to catch conflicts early.
- Use draft PRs when experimenting with large changes to get early CI feedback.

---

## APPENDIX – PUSHING THIS EXISTING CHECKOUT TO THE NEW ORIGIN

If you are currently inside the repo that still points to `Saniya95`:

```powershell
# Update remote to your repo
cd C:\Users\<you>\E-commerce-backend-main\E-commerce-backend-main

git remote set-url origin https://github.com/nikhil-os/e-commerce-backend.git

# (Optional) Add legacy remote for reference
git remote add upstream https://github.com/Saniya95/E-commerce-backend.git

# Confirm
git remote -v

# Push current main to your repo
git push -u origin main
```

You now own the canonical backend repo under `nikhil-os`. 🥳

---

**End of document.**
