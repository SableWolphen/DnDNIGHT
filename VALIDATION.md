# Validation

## Passed

- Node syntax checks for server and both browser modules.
- Ten automated model/persistence tests with Node’s built-in test runner.
- Headless Microsoft Edge browser flows: identity edit, ability/HP/note/proficiency edit, save and reload, buy three daggers, sell two, equip the remaining dagger and verify selling is disabled, search and empty results, create/select a second character, verify separate wallets/inventories.
- Desktop (1440 × 1100 viewport) and mobile (390 × 844 viewport) screenshots of both routes; visually inspected marketplace desktop and character sheet mobile. No horizontal overflow on either mobile route and no browser page errors during these flows.
- Browser checks also passed for invalid HP refusing to save, backup download/import restoring the party, and recovery of unreadable persisted data through import without silently discarding the original data.

The repeatable browser check is in `scripts/check-ui.mjs`. GitHub Actions runs syntax and model checks on pushes and pull requests; browser checks require the optional Playwright installation described in the README.

## Scope

This initial app has local browser storage, no backend or authentication. Unit tests simulate malformed backups and storage failure. Manual assistive-technology testing and cross-browser coverage beyond Chromium/Edge have not been performed. No merge or deployment was performed.
