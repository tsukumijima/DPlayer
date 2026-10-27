# Repository instructions

## Development

- This fork is implemented in TypeScript. Use English for code comments, documentation, and commit messages, and follow the surrounding code style.
- Use npm from the repository root. Keep `package.json` and `package-lock.json` consistent when updating dependencies.
- Player logic lives in `src/ts/`, templates in `src/template/`, and styles in `src/css/`. Read the relevant callers and templates before changing player behavior.
- Do not add test files, test scripts, or test frameworks unless the user explicitly requests them. Validate changes with existing checks and temporary browser experiments as needed.

## Git workflow

- Fetch `origin` before starting work and check the working tree, staged changes, and branch history. Base new commits on the latest target branch from `origin`; fast-forward when possible, and preserve unrelated local work when the histories differ.
- Before committing, check for new remote updates and keep the task's commits directly on top of the latest target branch. Do not introduce a merge commit just to reconcile stale local history.
- Keep bug fixes and dependency updates in separate commits. Follow the existing English Conventional Commit style, including the history of the files being changed.
- `dist/` contains generated release files. Do not include changes to `dist/` in ordinary source or dependency-update commits. Update and commit these files only when a release or generated-output update is explicitly requested.
- Pushing requires the user's explicit authorization. Permission to commit does not imply permission to push.

## Verification

- Run `npm run type-check` and `npm test` for TypeScript changes. `npm test` runs ESLint.
- Use `npm run build` to verify the production bundle. It writes to `dist/`; keep that output out of ordinary commits and preserve any pre-existing changes there.
- For playback or information-panel changes, also exercise the affected behavior in a browser. Type checking and linting do not validate frame delivery, timing, or rendered output.
