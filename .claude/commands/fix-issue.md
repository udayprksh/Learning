You are helping me fix a GitHub issue end to end.
Repo: udayprksh/Learning

Work through these steps one by one.
After EACH step, show me the output and wait for my explicit
confirmation before moving to the next step.
Never skip or combine steps.

---

## STEP 1 — List Open Issues
Using GitHub MCP, fetch ALL open issues from udayprksh/Learning.

Display them in this exact format:
─────────────────────────────────────
#1  Bug: Login page crashes on Safari
#2  Feature: Add dark mode toggle
#3  Fix: API timeout on slow networks
#5  Chore: Update dependencies
─────────────────────────────────────

After displaying the list, ask me:
"Which issue would you like to fix? Please type the issue number."

STOP and wait for me to provide the issue number.
Store the issue number I provide as ISSUE_NUMBER for all remaining steps.

---

## STEP 2 — Show Full Issue Details
Fetch and display the full details of the issue I selected:
- Title
- Full description
- Labels
- Reporter

Then ask me: "Does this look correct? Type 'yes' to create a branch
and start fixing, or type 'no' to go back to the list."

STOP and wait for my confirmation.

---

## STEP 3 — Create Branch
Create a new git branch named:
fix/issue-[ISSUE_NUMBER]-short-description
(derive short-description from the issue title, lowercase, hyphenated)

Switch to that branch and confirm which branch I am now on.
Do NOT make any code changes yet.

Then say: "Branch created. Type 'continue' when ready to plan the fix."
STOP and wait.

---

## STEP 4 — Plan the Fix
Find the relevant files in the codebase related to this issue.
Show me:
1. Which files you plan to change
2. What change you will make in each file
3. Why this fixes the issue

Do NOT make any code changes yet.
Ask me: "Does this plan look good? Type 'approved, implement' to proceed."
STOP and wait for approval.

---

## STEP 5 — Implement the Fix
Implement the fix as planned in Step 4.
Show each file changed with a brief explanation.
Then say: "Implementation done. Type 'continue' to review changes."
STOP and wait.

---

## STEP 6 — Review Changes
1. Show the full git diff
2. Check for: console.log, hardcoded values,
   missing error handling, broken imports
3. Run linter (npm run lint) if available
4. Summarize changes in 3 bullet points

Then say: "Review complete. Type 'continue' to commit and push."
STOP and wait.

---

## STEP 7 — Commit and Push
1. Show git status — confirm .env and node_modules NOT listed
2. Ask: "Git status looks clean? Type 'approved' to commit."
3. STOP and wait for approval
4. After approval — commit with message:
   "fix: [issue title summary] — closes #[ISSUE_NUMBER]"
5. Push branch to origin

Then say: "Pushed. Type 'continue' to create the PR."
STOP and wait.

---

## STEP 8 — Create Pull Request
Create a PR on GitHub using MCP:
- From: fix/issue-[ISSUE_NUMBER]-short-description
- To: main
- Title: "fix: [issue title] — closes #[ISSUE_NUMBER]"
- Description:
  ## What changed
  [bullet points]
  ## Why
  [reason from issue]
  ## How to test
  [verification steps]
  ## Related issue
  Closes #[ISSUE_NUMBER]

Then say: "PR created. Type 'continue' to do final review."
STOP and wait.

---

## STEP 9 — Review PR
1. Show the full PR diff
2. Check for any existing review comments
3. Show CI checks status (passing/failing/pending)
4. Confirm PR targets main branch
5. Give a clear GO ✅ or NO-GO ❌ with reason

Ask me: "Ready to merge? Type 'merge it' to proceed."
STOP and wait.

---

## STEP 10 — Merge
After I say "merge it":
1. Squash merge the PR
2. Delete the feature branch (remote and local)
3. Switch local repo back to main
4. Pull latest main to sync
5. Confirm issue #[ISSUE_NUMBER] is now closed on GitHub
6. Show final git log --oneline -5

Say: "✅ Done! Issue #[ISSUE_NUMBER] is fixed, merged, and closed."