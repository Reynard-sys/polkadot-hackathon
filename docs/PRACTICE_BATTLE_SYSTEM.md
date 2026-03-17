# Practice Battle System

This document describes the current `Practice Match` implementation used by the app.

Primary implementation files:

- `src/features/practice/battle-engine.ts`
- `src/features/practice/practice-page.tsx`
- `src/data/cards.json`

## 1. Match Overview

- Practice is a 1v1 battle between the player and a bot.
- Both boards start fully built from 12-card decks.
- The player uses a saved deck from deck builder.
- The bot uses an auto-generated deck that still follows deck-building limits.
- The goal is to reduce the opposing leader HP to `0`.

## 2. Board Structure

Each side has 12 slots:

- `1 Leader`
- `3 Frontline`
- `4 Backline`
- `4 Reserve`

Player battle order:

- Leader represents the player HP pool.
- Frontline protects the rest of the board.
- Backline is protected until Frontline is cleared, unless a special attack rule bypasses that.
- Reserve can attack, but Reserve cannot be attacked directly.

Mobile visual layout:

Player:

```text
[Leader][Frontline][Frontline][Frontline]
[Backline][Backline][Backline][Backline]
[Reserve][Reserve][Reserve][Reserve]
```

Bot:

```text
[Reserve][Reserve][Reserve][Reserve]
[Backline][Backline][Backline][Backline]
[Frontline][Frontline][Frontline][Leader]
```

## 3. Deck Rules Used in Practice

Practice uses the same saved deck structure as deck builder:

- `1 Leader`
- `3 Frontline`
- `4 Backline`
- `4 Reserve`

Battle-deck rarity limits apply to the first 8 battle slots:

- `Mythic`: max `1`
- `Legendary`: max `2`
- `Rare`: max `2`
- Reserve does not use those rarity caps

## 4. Core Card Stats

Card data comes from `src/data/cards.json`.

Important values:

- `mana`: ability cost
- `power`: attack damage base
- `hp`: unit HP
- `element`: Fire, Water, Earth, Air
- `keywords`: passive combat rules such as Guard, Rush, DoubleAttack, Counter, BacklineStrike
- `ability`: unit ability data
- `leaderAbility`: once-per-game leader effect

Saved practice decks are hydrated against the latest catalog data, so current `cards.json` values override stale saved snapshots.

## 5. Leader HP and Victory

- Leader HP is the real player HP pool.
- Both leaders start at `40 HP`.
- When the leader takes damage, player HP changes with it.
- When player HP reaches `0`, that side loses.

Win condition:

- Reduce the enemy leader HP to `0`.

## 6. Turn Structure

Each turn runs through:

1. `Main Phase`
2. `Battle Phase`
3. `End Turn`

Flow:

- The active player starts in `Main Phase`.
- The player presses `Next Turn` to move from `Main Phase` to `Battle Phase`.
- The player presses `Next Turn` again to end the turn.
- The bot then resolves its full turn.
- After bot actions finish, the player presses `Next Turn` to begin the next player turn.

## 7. Mana System

- Both players start at `2 / 2` mana.
- Mana max increases by `+1` at the start of that side's new turn.
- Mana is capped at `7`.
- Current mana fully refills to the new `manaMax` at the start of that side's turn.
- Unspent mana does not carry over.

Example progression for one side:

- Turn 1: `2 / 2`
- Turn 2: `3 / 3`
- Turn 3: `4 / 4`
- Turn 4: `5 / 5`
- Turn 5: `6 / 6`
- Turn 6+: `7 / 7`

When a card ability is used:

- The acting player spends that card's `mana` value immediately.
- Example: if a card costs `4` mana and the player has `4`, current mana becomes `0`.
- The same rule applies to the bot.

UI:

- Mana is shown as `current / max`.
- The arena also renders `7` gem-orb slots:
  - filled = current mana
  - empty outlined = available capacity this turn
  - dimmed/locked = above the current `manaMax`

## 8. Main Phase

Main Phase is for skill use.

Current player interaction:

- Tap/click a card to open its skill popup.
- If the card has a usable ability, the popup shows:
  - ability name
  - mana cost
  - description
  - activate button
- If there is not enough mana, activate is disabled.
- If the regular card ability was already used that turn, it shows `Already used this turn`.

Start-of-turn targeted aura exception:

- Bulbasaur's `HealAllyPerTurn` is not auto-picked for the player side.
- At the start of your turn, if Bulbasaur is on the board and active, practice pauses and asks you to choose the heal target manually.
- This only begins from turn `2` onward, which also means it still works on your first turn if you were the second side to act.
- You can target any friendly card or your player/leader HP panel.
- This start-of-turn heal does not spend mana.

Card state indicators during Main Phase:

- Ability ready: soft gold glow
- Not enough mana: dimmed card plus a small lock badge
- Already used this turn: dimmed card plus a `USED` badge
- These indicators are removed during `Battle Phase`

Ability targeting:

- If the ability needs targets, valid targets highlight in gold.
- If the ability has no target, it resolves immediately.
- Heal abilities can also be dragged onto valid allied targets.

Regular card abilities:

- Regular `OnSummon` abilities can be activated `once per turn`.
- They cost mana equal to the card's `mana` value.
- They reset at the start of that side's next turn.
- They are not once-per-game.

Leader abilities:

- Leaders have their own once-per-game leader ability.
- Leader abilities are used in `Main Phase`.
- Leader abilities currently do not cost mana.
- After leader use, the leader is treated as spent permanently for the rest of the match.

## 9. Battle Phase

Battle Phase is for attacks.

Current player interaction:

- Click a ready unit to select it as an attacker.
- Or drag the unit onto a valid target.
- Valid targets highlight in red/orange.
- Clicking the selected attacker again cancels attack selection.

Who can attack:

- Leader can attack
- Frontline can attack
- Backline can attack
- Reserve can attack

Who cannot be attacked:

- Reserve cannot be attacked directly

## 10. Attack Limit Per Turn

- A side can perform a maximum of `3 attacks` per turn total.
- This is a team-wide cap, not a per-unit cap.
- The attack counter resets at the start of the side's turn.

Special case:

- If a card has a second attack rule such as `DoubleAttack`, each actual attack still counts toward the team-wide limit.

UI:

- Battle Phase shows `Attacks: X / 3`.
- When the limit is reached, the player sees `Attack limit reached`.
- Remaining units stop being available for attack selection.

## 11. Targeting Rules

Default attack targeting:

- Attack enemy `Frontline` first
- `Backline` is not attackable while enemy Frontline still exists
- `Reserve` is never attackable
- Enemy leader HP can only be attacked directly after enemy Frontline is cleared

Backline opening:

- If all enemy Frontline is gone, enemy Backline becomes attackable
- At that point, direct leader attacks also become available

Guard:

- If an enemy Frontline unit has `Guard`, it becomes the required target
- Other normal frontline targets are effectively blocked until Guard is handled

Guard bypass:

- Units with `GuardBypass` / shield-break style behavior can ignore that restriction

Backline strike:

- Units with `BacklineStrike` can target Backline even before Frontline is cleared
- Reserve still cannot be attacked

## 12. Damage Resolution

Base damage is driven by card power:

- `damage = current attack power`

Damage can be modified by:

- element advantage
- temporary or permanent power buffs
- next-attack multipliers
- shield / reduction / counter interactions

Direct leader attack:

- If leader HP is exposed, attacks damage the leader HP directly

Unit attack:

- Damage is applied to the target unit HP
- Destroyed units are removed from board state

Counter:

- If the defender has `Counter`, it can damage the attacker back
- Counter can be bypassed by `CounterImmune`

Shield:

- Shield can block the next relevant hit, depending on the effect

## 13. Elements

Elements grant `+1 damage` when advantaged:

- `Fire -> Air`
- `Air -> Earth`
- `Earth -> Water`
- `Water -> Fire`

There is no penalty for attacking into a stronger element.

## 14. Keywords and Passive Combat Rules

The battle engine currently supports keyword- and effect-driven rules including:

- `Rush`
- `Initiative` / attack-priority behavior
- `DoubleAttack`
- `Guard`
- `BacklineStrike`
- `Counter`
- `CounterImmune`
- `ShieldBreak` / guard-bypass style interactions

These are resolved from card data and battle-engine helper logic.

## 15. Status Effects

Current supported status set:

- `Stun`
- `Sleep`
- `Burn`
- `Poison`
- `Disabled`
- `Sealed`
- `Silenced`
- `Stoned`

High-level behavior:

- `Stun`, `Sleep`, `Disabled` stop attacking
- `Silenced` suppresses ability use/passives where applicable
- `Sealed` blocks activatable ability use and suppresses passive logic where applicable
- `Burn` and `Poison` deal ongoing pressure over time
- `Stoned` is treated as a hard disable and is displayed as its own status

There are also effect-style mechanics such as:

- Shield gain
- temporary buffs
- reserve suppression
- cloned stats
- revive timers

Board visuals:

- Active statuses render as small icon overlays in the bottom-right corner of the card
- Multiple statuses stack horizontally
- `Burn` shows remaining triggers
- `Shield` shows remaining shield count
- `Stun`, `Sleep`, and `Stoned` flip the card face-down with a 3D `rotateY(180deg)` animation and show the shared card back art

## 16. Bot Rules

The bot follows the same core systems:

- same mana curve
- same board structure
- same attack rules
- same target rules
- same rarity limits when generating practice decks

Bot turn behavior:

- Uses activatable abilities when valid
- Advances phases
- Resolves attacks one at a time
- Ends turn when actions are exhausted

## 17. Practice UI Rules

Desktop and mobile both support:

- click/tap attack selection
- drag-and-drop attacks
- drag-and-drop healing for valid heal abilities
- skill popup in Main Phase
- live event feed
- battle log
- win/loss result modal

Mobile drag-and-drop is handled through explicit touch-aware DnD sensors in the practice page.

## 18. Source of Truth

Battle behavior is split across:

- `src/features/practice/battle-engine.ts`
  - rules
  - targeting
  - combat resolution
  - mana
  - bot decisions
- `src/features/practice/practice-page.tsx`
  - UI
  - drag-and-drop
  - phase controls
  - live feed
  - result modal
- `src/data/cards.json`
  - per-card stats
  - abilities
  - keywords
  - leader abilities

For exact card-level values, always treat `cards.json` as the source of truth.
