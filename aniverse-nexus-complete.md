# Aniverse Nexus - Current Project and Game Bible

This document is the current-state reference for the project as it exists in this repository.

It replaces the older concept bible that no longer matched the implemented product.

If this file and the code ever disagree, the code is the source of truth. The most important implementation references are:

- `src/data/cards.json`
- `src/features/deck-builder/index.tsx`
- `src/features/practice/battle-engine.ts`
- `src/features/practice/practice-page.tsx`
- `src/hooks/usePackOpening.ts`
- `contracts/contracts/GachaNFT.sol`
- `contracts/contracts/CardRegistry.sol`
- `contracts/contracts/GachaPack.sol`

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [What Is Implemented Right Now](#2-what-is-implemented-right-now)
3. [Card Catalog and Series Scope](#3-card-catalog-and-series-scope)
4. [Deck Construction Rules](#4-deck-construction-rules)
5. [Board Layout and Card Roles](#5-board-layout-and-card-roles)
6. [Practice Match Structure](#6-practice-match-structure)
7. [Mana System](#7-mana-system)
8. [Abilities and Activation Rules](#8-abilities-and-activation-rules)
9. [Battle Rules and Attack Flow](#9-battle-rules-and-attack-flow)
10. [Targeting Rules](#10-targeting-rules)
11. [Elements, Keywords, and Status Effects](#11-elements-keywords-and-status-effects)
12. [Practice UI Behavior](#12-practice-ui-behavior)
13. [Gacha, NFT, and Collection Layer](#13-gacha-nft-and-collection-layer)
14. [Source of Truth and Maintenance Rules](#14-source-of-truth-and-maintenance-rules)

## 1. Project Overview

Aniverse Nexus is a Web3 trading card game product built around three connected loops:

- pack opening
- collection management
- tactical deck-based battle

The project uses an anime crossover catalog with three series for demo purposes:

- Naruto
- One Piece
- Pokemon

The current product surface is not just a minting demo. It already includes:

- responsive landing page
- wallet connection
- gacha pack selection
- pack opening and reveal flow
- collection inventory
- legal deck building
- a playable practice battle system against a bot
- tournament shell
- marketplace shell

The project is built for the Polkadot EVM-compatible category, using Solidity contracts and an EVM wallet flow.

## 2. What Is Implemented Right Now

### Frontend product areas

- Home page
- Gacha page
- Open Packs page
- Card Reveal page
- Inventory page
- Deck Builder page
- Practice Match page
- Tournament page
- Marketplace page

### Smart contract areas

- `GachaNFT.sol`: ERC-1155 NFT contract
- `CardRegistry.sol`: on-chain card registry and rarity lookup
- `GachaPack.sol`: pack opening logic and mint orchestration

### Current wallet path

- MetaMask only in the current UI flow
- Westend Asset Hub EVM network

## 3. Card Catalog and Series Scope

The current catalog contains `48` total cards:

- `16` Naruto
- `16` One Piece
- `16` Pokemon

Each series currently follows this rarity distribution:

- `10` Common
- `3` Rare
- `2` Legendary
- `1` Mythic

### Token ID ranges

- Naruto: `1-16`
- One Piece: `17-32`
- Pokemon: `33-48`

### Core card fields

Every card in `src/data/cards.json` may include:

- `id`
- `name`
- `subtitle`
- `anime`
- `rarity`
- `mana`
- `power`
- `hp`
- `element`
- `imageUrl`
- `traits`
- `leaderEligible`
- `ability`
- `leaderAbility`
- `nftTokenId`
- `zones` for cards that can belong to more than one zone

### Current special catalog notes

- `Eevee` is the current dual-zone exception and can be used in `Frontline` or `Backline`
- saved practice decks are rehydrated against the latest `cards.json`, so current stats override stale saved snapshots

## 4. Deck Construction Rules

The saved deck model is exactly `12 cards`:

- `1 Leader`
- `3 Frontline`
- `4 Backline`
- `4 Reserve`

The deck builder does not allow saving unless the battle deck is complete:

- Leader `1/1`
- Frontline `3/3`
- Backline `4/4`

### Rarity limits

The first `8` slots are the battle deck:

- slot `0`: Leader
- slots `1-3`: Frontline
- slots `4-7`: Backline

These battle slots use rarity limits:

- Mythic: max `1`
- Legendary: max `2`
- Rare: max `2`

Reserve slots are exempt from those rarity caps.

### Deck power

Saved decks also compute a power score using rarity weights:

- Common = `1`
- Rare = `2`
- Legendary = `3`
- Mythic = `4`

### Saved deck behavior

- Saved decks are stored locally in the browser
- deck names are capped at `20` characters
- saved deck previews are collapsible in the UI

## 5. Board Layout and Card Roles

Practice matches begin with both sides already fully deployed from their `12-card` decks. There is no hand-building or unit-playing phase in the current practice implementation.

### Board roles

#### Leader

- represents the player's HP pool
- starts at `40 HP`
- has a once-per-game leader ability
- can only attack after the enemy Frontline is fully cleared

#### Frontline

- primary defensive layer
- protects Backline and Leader access
- is the default attack target zone

#### Backline

- protected while enemy Frontline still exists
- becomes attackable when enemy Frontline is cleared
- can also be targeted earlier by special attack rules such as Backline Strike

#### Reserve

- can attack
- cannot be attacked directly
- often carries utility, healing, scaling, or passive effects

### Mobile visual board layout

Bot side:

```text
[Reserve][Reserve][Reserve][Reserve]
[Backline][Backline][Backline][Backline]
[Frontline][Frontline][Frontline][Leader]
```

Player side:

```text
[Leader][Frontline][Frontline][Frontline]
[Backline][Backline][Backline][Backline]
[Reserve][Reserve][Reserve][Reserve]
```

### Desktop formation concept

Desktop keeps the same slot logic, but the arena presents each side in a mirrored battlefield arrangement instead of the compact mobile rows.

## 6. Practice Match Structure

The current practice mode is a local player-versus-bot battle.

### Match start

- player selects a saved deck
- bot receives an auto-generated legal deck
- both boards load fully populated
- both leaders start at `40 HP`
- player starts first

### Phase flow

Each turn is split into:

1. Main Phase
2. Battle Phase
3. End Turn

The UI uses a single `Next Turn` button for flow control:

- player presses it to move from Main Phase to Battle Phase
- player presses it again to end their turn
- bot resolves its turn
- once bot animations finish, player presses it again to begin the next player turn

### Practice-specific match model

Unlike a paper TCG hand loop, current practice does not use:

- opening hand
- mulligan
- draw pile combat loop
- card deployment from hand each turn

Instead, practice is a tactical board battle built on already-deployed decks.

## 7. Mana System

The current practice mana system is:

- both sides start at `2 / 7`
- mana max increases by `+1` at the start of that side's turn
- mana max is capped at `7`
- current mana fully refills to the new max at the start of that side's turn
- unused mana does not carry over

### Example progression for one side

- Turn 1: `2 / 2`
- Turn 2: `3 / 3`
- Turn 3: `4 / 4`
- Turn 4: `5 / 5`
- Turn 5: `6 / 6`
- Turn 6 and onward: `7 / 7`

### UI display

Mana is shown as:

- `current/7`

The orb row still reflects true `manaMax`, but the text denominator is fixed to `7` in the current UI.

## 8. Abilities and Activation Rules

### Regular card abilities

In current practice, regular activatable card abilities behave like this:

- usable during `Main Phase`
- regular card `OnSummon` abilities are treated as activatable board skills
- usable `once per turn`
- reset at the start of that unit owner's next turn
- usually cost mana equal to the card's `mana` value

### Leader abilities

Leader abilities are:

- used during `Main Phase`
- limited to `once per game`
- do not currently consume mana
- visually marked as spent after use

### Ability popup behavior

During Main Phase:

- tapping/clicking a card opens its ability popup
- if the ability requires a target, valid targets highlight in gold
- if the ability does not require a target, activation resolves immediately
- if there is not enough mana, activation is disabled
- if the regular ability was already used this turn, the card is marked used

### Draw card re-interpretation

In current practice, all abilities that say `Draw 1 card` have been reinterpreted as mana gain effects.

Current rule:

- `DrawCard` abilities do not draw into a hand
- instead, they give mana immediately to the acting side
- they cost `0` mana
- they can only be used every other turn

### Bulbasaur special rule

Bulbasaur is a specific current implementation exception:

- its heal is manual, not auto-targeted
- it does not consume mana
- it becomes relevant from turn `2` onward, which also covers the case where the player was the second side to act on round one
- if the chosen target is already at full HP, the heal prompt dismisses and the turn proceeds

## 9. Battle Rules and Attack Flow

### Who can attack

Current attackable roles on the player's side:

- Leader
- Frontline
- Backline
- Reserve

### Leader attack restriction

Leader attacks are not always open.

Current rule:

- Leader can only attack when the enemy Frontline is cleared

### Reserve rule

Reserve is intentionally asymmetric:

- Reserve can attack
- Reserve cannot be attacked directly

### Team-wide attack cap

Each side can make a maximum of `3` attacks per turn total.

This is not per unit. It is a shared team cap.

Examples:

- three normal attacks = turn cap reached
- if a double-attack unit attacks twice, that consumes two of the three attacks

### Current player interaction

During Battle Phase, the player can:

- click a ready unit to select it as the attacker
- click the same unit again to cancel
- click a valid target to confirm the attack
- or drag the unit onto a valid target

## 10. Targeting Rules

### Default targeting

For most units:

- only enemy Frontline is targetable while it exists
- enemy Backline is dimmed and not targetable
- enemy Reserve is never targetable
- enemy leader HP is not targetable while enemy Frontline still exists

### After Frontline is cleared

Once all enemy Frontline units are gone:

- enemy Backline becomes targetable
- enemy leader HP becomes targetable
- enemy Reserve still cannot be targeted

### Guard priority

If an enemy Frontline unit has `Guard`:

- that Guard unit becomes the required target
- other normal frontline choices are effectively blocked

Cards that bypass guard or shields can ignore that restriction.

### Backline Strike

Backline Strike rules are also implemented:

- units with Backline Strike can target Backline before Frontline is cleared
- Reserve still cannot be attacked

## 11. Elements, Keywords, and Status Effects

### Elements

Current advantage cycle:

- Fire beats Air
- Air beats Earth
- Earth beats Water
- Water beats Fire

Element advantage gives:

- `+1` damage

There is no penalty for attacking into a stronger element.

### Important implemented keyword-style behaviors

The battle engine currently supports behavior such as:

- Rush
- Guard
- BacklineStrike
- DoubleAttack
- Counter
- CounterImmune
- GuardBypass
- Shield-related effects

### Status effects currently supported

- Burn
- Poison
- Stun
- Sleep
- Disabled
- Sealed
- Silenced
- Stoned
- Shield as a tracked protection effect

### High-level status behavior

- Burn and Poison deal chip damage over time
- Stun, Sleep, and Stoned prevent action
- Disabled and Sealed suppress skill use
- Shield blocks incoming hits based on remaining count

### Current visual behavior

- status icons show as overlays on the card
- multiple statuses stack in the bottom-right
- Burn and Shield show counts
- Stun, Sleep, and Stoned flip the card face-down using the shared card back asset

### Current control-debuff timing

Control debuffs such as:

- Stun
- Sleep
- Disabled
- Sealed
- Stoned

do not disappear immediately after being applied. They persist through the afflicted side's next turn and decrement after that side finishes its turn.

## 12. Practice UI Behavior

The practice page currently includes:

- deck selection modal before starting
- tutorial modal
- card detail modal
- ability popup in Main Phase
- drag-and-drop attack flow
- tap-to-attack flow
- gold targeting highlights for abilities
- red/orange targeting highlights for attacks
- live event feed
- battle log
- result modal for victory and defeat

### Bot turn behavior

The bot:

- uses the same mana rules
- follows the same board rules
- resolves actions one at a time
- can use abilities
- attacks through the same targeting engine

The UI also animates bot attacks using the actual board positions of attacker and target.

## 13. Gacha, NFT, and Collection Layer

### Pack series

The app currently supports:

- Naruto packs
- One Piece packs
- Pokemon packs

### Pack tiers

- Standard x10
- Premium x20
- Ultra x30

### Pack prices

- Standard: `0.001 WND`
- Premium: `0.0018 WND`
- Ultra: `0.0025 WND`

### Rarity guarantees

The client simulation mirrors the contract logic:

- Standard: at least `1` Rare
- Premium: at least `2` Rare
- Ultra: at least `3` Rare and at least `1` Legendary

### NFT contract stack

The EVM contract layer is:

- `GachaNFT.sol` for ERC-1155 card tokens
- `CardRegistry.sol` for card rarity/catalog registration
- `GachaPack.sol` for opening packs and minting cards

### Current simulation fallback

If pack contract addresses are missing or zeroed:

- pack opening falls back to client-side simulation mode

## 14. Source of Truth and Maintenance Rules

This file should stay aligned with the current codebase, not with older product ideas.

### Canonical sources

Use these as the source of truth:

- `src/data/cards.json` for card stats, abilities, zones, and metadata
- `src/features/deck-builder/index.tsx` for deck construction rules and save validation
- `src/features/practice/battle-engine.ts` for actual match rules
- `src/features/practice/practice-page.tsx` for battle UI behavior
- `src/hooks/usePackOpening.ts` for pack opening flow
- `src/hooks/useInventory.ts` for current inventory persistence behavior
- `contracts/contracts/*.sol` for the live contract model

### What should not be duplicated again

This file intentionally does not duplicate the full 48-card roster text anymore.

Reason:

- duplicating all card text here creates drift
- `cards.json` is already the authoritative catalog
- the battle engine reads from `cards.json`
- the deck builder and practice mode both depend on it

If card text changes, update `cards.json` first, not this file.
