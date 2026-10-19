# DnD Night

A responsive character-sheet and equipment-marketplace app for a local tabletop campaign.

## Run

Install Node.js 22 or newer, then run `node server.mjs` (or `npm start`) and open http://localhost:3000. No package installation, build process, secrets, or account is required. Set `PORT` to choose another port. The development server binds to localhost only. The app itself consists of static HTML, CSS, and JavaScript.

## Features

- Create, select, edit, and delete characters, with isolated inventory and wallets. Keep at least one character.
- Edit identity, ancestry, class, level, background, alignment, HP, temporary HP, AC, speed, XP, and six ability scores. Modifiers, initiative, skill bonuses, and proficiency bonus are calculated on save.
- Track skill proficiency, features, spells/resources, and adventure notes.
- Add custom loot, adjust quantities and weight, equip items, and remove stacks. Manual edits do not move currency.
- Search and filter a ten-item merchant catalog. Preview quantity and total before confirming purchases or sales. Transactions update inventory and currency in a single save.
- Store money as integer copper: 100 cp = 10 sp = 1 gp. The merchant pays half the unit value, rounded down to copper. Merchant stock is unlimited. These are configurable campaign defaults, not a complete rules database.
- Save locally, export/import versioned JSON backups, preserve unreadable data, and detect conflicting saves from another tab.

New characters start at level 1 with 100 gp, ability scores of 10, 12 HP, 12 AC, and 30 ft speed. These defaults are editable. Equipping gear does not automatically change AC, apply damage, cast spells, or enforce class rules; update the sheet for your table’s rules. Features and spells are freeform trackers. Silver and copper fields accept 0–9; use the gold field for larger amounts.

## Storage, routing, and ownership

The GitHub repository was empty when inspected, with no commits, branches, project guidance, framework, auth, database, or deployment workflow. This implementation establishes a dependency-free starting convention:

- `#/characters` and `#/store` share a party selector and persistent campaign state.
- `src/model.js` owns validation, currency, catalog, persistence, and pure transaction logic.
- `src/app.js` owns views, forms, and browser interactions; user-supplied text is escaped before rendering.
- `styles.css` supplies responsive styles with system/Georgia fallbacks. Optional Google Fonts improve typography when online.
- `localStorage` key `dndnight.campaign.v1` stores one campaign per browser origin. Choose **Save sheet** for sheet edits; character, inventory, and transaction dialogs save immediately. Navigation prompts before discarding unsaved sheet edits.
- Backup import validates all characters/items before replacing the campaign and requests confirmation. Export saves the last persisted state, not unsaved form changes.

There is no authentication or shared server state. Anyone using the same browser profile can edit its campaign, and browser data can be modified directly. This is a local game aid, not an authoritative multiplayer economy. Accounts, campaign permissions, and shared trading would require a backend with server-side transaction validation. Export backups regularly; clearing browser storage deletes local campaigns.

## Validation

Run `node --test` (or `npm test`) for model and persistence tests. They cover purchase/sale arithmetic, partial/full stacks, invalid quantities, insufficient funds, overselling, equipped-item restrictions, quantity/wallet limits, catalog prices, character isolation, backup validation, storage failures, and save/load round trips.

Browser checks exercised character editing and reload persistence, purchases and sales, equipped-item protection, search/empty states, character isolation, and desktop/mobile layouts at 1440 and 390 pixels. Both routes were visually inspected. No page errors or horizontal overflow were observed. See `VALIDATION.md` for scope and remaining limitations.

To repeat browser checks, start the app in a separate terminal, install Playwright as an optional local tool (`npm install --no-save playwright`, then `npx playwright install chromium`), and run `node scripts/check-ui.mjs`. Set `BROWSER_CHANNEL=msedge` to use installed Microsoft Edge instead. The script creates an isolated browser context and writes ignored screenshots to `browser-artifacts/`. `BASE_URL` overrides the app URL; `PLAYWRIGHT_MODULE` can point to an existing Playwright ES module.

## Repository conventions

Keep model rules separate from rendering, validate complete state before persistence, and add regression tests for transaction or storage changes. Do not store campaign saves or secrets in Git. No deployment, release, or merge automation is configured. Review changes before merging or configuring hosting.
