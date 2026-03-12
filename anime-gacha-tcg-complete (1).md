# Anime Gacha TCG — Complete Game Bible
> Web3 NFT Trading Card Game | Naruto × One Piece × Pokémon

---

## TABLE OF CONTENTS
1. [Game Overview](#1-game-overview)
2. [Board Layout](#2-board-layout)
3. [Match Structure](#3-match-structure)
4. [Resources — Mana](#4-resources--mana)
5. [Turn Structure](#5-turn-structure)
6. [Deck Construction Rules](#6-deck-construction-rules)
7. [Card Anatomy](#7-card-anatomy)
8. [Zone Rules](#8-zone-rules)
9. [Combat Rules](#9-combat-rules)
10. [Element System](#10-element-system)
11. [Keywords](#11-keywords)
12. [Status Effects](#12-status-effects)
13. [Physical Card Tracking System](#13-physical-card-tracking-system)
14. [Win and Loss Conditions](#14-win-and-loss-conditions)
15. [Anime Identity](#15-anime-identity)
16. [Full Card Roster](#16-full-card-roster)
17. [Card JSON Database](#17-card-json-database)
18. [Asset Pipeline](#18-asset-pipeline)
19. [NFT Implementation Guide](#19-nft-implementation-guide)
20. [Gacha Pack System](#20-gacha-pack-system)
21. [Smart Contract Logic](#21-smart-contract-logic)
22. [Suggested MVP Scope](#22-suggested-mvp-scope)

---

## 1. Game Overview

Anime Gacha TCG is a short-session, strategy-focused trading card game built for Web3. Players collect NFT cards from Naruto, One Piece, and Pokémon, build a deck, and battle other players in a fast tactical card system.

**Design Goals**
- Learn in under 2 minutes
- Deep enough to reward strategy
- Matches complete in 5–7 turns
- Balanced around small deck size and rare-card scarcity
- Compatible with NFT ownership and marketplace trading

**Match Format**
- 1v1 PvP (AI PvE optional later)
- 5–10 minute matches
- 25 Player HP each
- 8 battle cards + 1 Leader card per player

---

## 2. Board Layout

```
              [ LEADER ]

  [ FRONT ]   [ FRONT ]   [ FRONT ]

[ BACK  ]  [ BACK  ]  [ BACK  ]  [ BACK  ]

[ RESERVE ] [ RESERVE ] [ RESERVE ] [ RESERVE ]
```

| Zone | Slots | Purpose |
|------|-------|---------|
| Leader | 1 | Passive aura or once-per-game command. Cannot be attacked. |
| Frontline | 3 | Primary attackers and defenders. Protects Backline and player. |
| Backline | 4 | Ranged, support, and utility units that fight from safety. |
| Reserve | 4 | Pure utility. No attack. Passive or on-summon effects only. |

---

## 3. Match Structure

**Starting Conditions**
- Each player starts with 25 HP
- Draw 4 cards as opening hand
- Full mulligan allowed: keep all 4 or replace all 4, once
- Player 1 cannot attack the enemy player directly on turn 1
- Player 2 starts with 5 cards as compensation

**Hand Rules**
- Maximum hand size: 6
- Discard down to 6 at end of turn
- Draw 1 card at start of each turn

---

## 4. Resources — Mana

Mana increases by 1 each turn and fully refills at the start of your turn.

| Turn | Max Mana |
|------|----------|
| 1 | 1 |
| 2 | 2 |
| 3 | 3 |
| 4 | 4 |
| 5+ | 5 (cap) |

Unused mana does not carry over to the next turn.

---

## 5. Turn Structure

### 1. Start Phase
- Increment mana cap if applicable
- Refill mana to current cap
- Draw 1 card
- Resolve start-of-turn effects (Bulbasaur aura, Magikarp patience counter, burn/poison damage)
- Remove stun and disable from units that were disabled last turn

### 2. Main Phase
- Play cards from hand by paying their mana cost
- Place units into Frontline, Backline, or Reserve slots
- Newly played units have summoning sickness and cannot attack unless they have Rush

### 3. Battle Phase
- Declare attacks with eligible units
- Each unit may attack once per turn unless a keyword says otherwise
- Resolve combat and effects

### 4. End Phase
- Resolve end-of-turn effects
- Discard hand down to 6 if over limit
- Pass turn to opponent

---

## 6. Deck Construction Rules

| Rule | Limit |
|------|-------|
| Battle cards | Exactly 8 |
| Leader card | Exactly 1 (separate slot) |
| Duplicate cards | None — every card in the deck must be unique |
| Mythic cards | Max 1 |
| Legendary cards | Max 2 |
| Rare cards | Max 2 |
| Common cards | Remainder |

> **Demo Rule:** No duplicate cards are allowed. Every slot must be a different card. This simplifies the NFT ownership model since each card is a single unique asset per player.

**Recommended Demo Deck**
- 1 Mythic or Legendary as Leader
- 3 Common
- 2 Rare
- 2 Legendary
- 1 Mythic

**Deck Power Rating (optional for matchmaking)**

| Rarity | Points |
|--------|--------|
| Common | 1 |
| Rare | 2 |
| Legendary | 3 |
| Mythic | 4 |

Max demo deck total = 17 points.

---

## 7. Card Anatomy

Every card has the following fields:

| Field | Description |
|-------|-------------|
| Name | Card name |
| Subtitle | Character title or role |
| Anime | Naruto / OnePiece / Pokemon |
| Rarity | Common / Rare / Legendary / Mythic |
| Mana | Cost to play |
| Power | Damage dealt when attacking |
| HP | Health points before destroyed |
| Element | Fire / Water / Earth / Air |
| Ability | Effect text |
| Zone | Frontline / Backline / Reserve / Leader-Eligible |
| Lore | Flavour text |

**Rarity Frame Colors**

| Rarity | Frame Color |
|--------|-------------|
| Common | Grey / Silver |
| Rare | Blue |
| Legendary | Gold |
| Mythic | Purple / Rainbow |

Rarity must be identifiable from the frame alone at a glance without reading the label.

**Stat Baseline by Rarity**

| Rarity | Power | HP |
|--------|-------|----|
| Common | 1–3 | 2–4 |
| Rare | 4 | 5–6 |
| Legendary | 5–6 | 6–7 |
| Mythic | 6–7 | 7 |

---

## 8. Zone Rules

### Frontline
- Can attack enemy Frontline units freely
- Can attack enemy player directly only if all enemy Frontline slots are empty or via keyword
- Must be cleared before Backline and player are exposed

### Backline
- Cannot be attacked directly unless attacker has Backline Strike or all enemy Frontline is empty
- Can attack enemy Frontline units normally
- Cannot attack enemy player directly unless Frontline is cleared

### Reserve
- Cards here cannot be attacked under any circumstance
- Cards here cannot attack
- Only passive, aura, or on-summon effects activate from this zone

### Leader
- Visible and in play from turn 1
- Cannot be attacked
- Has a once-per-game activated effect
- Does not count as a battle card on the board
- Chosen from Legendary-Eligible or Mythic-Eligible cards

---

## 9. Combat Rules

### Summoning Sickness
Newly played units cannot attack the same turn unless they have Rush.

### Attack Declaration
A unit may attack if:
- It is on the board in Frontline or Backline
- It is not in a disabled/stunned/asleep state
- It has not already attacked this turn
- It was not summoned this turn unless it has Rush

### Combat Resolution — One-Way
- Attacker deals damage equal to its Power to the target
- Target does not retaliate unless it has Counter
- If target HP reaches 0 it is removed from the board
- If target survives it remains

### Direct Player Damage
- A unit may attack the enemy player directly if all enemy Frontline slots are empty
- Damage equal to attacker Power is dealt to enemy player HP
- Elemental bonus applies

### Clone Rule
- Some cards create a Clone version of themselves
- In the digital game the Clone is a separate frontend game object overlaid on the base card
- The Clone has its own Power and HP as stated in the card ability
- The Clone takes damage first
- When the Clone is destroyed the base card returns to its normal active state
- Clones are frontend-only objects and are not NFTs

---

## 10. Element System

**Advantage Cycle**

```
Fire  → beats → Air
Air   → beats → Earth
Earth → beats → Water
Water → beats → Fire
```

**Bonus Effect**
When a unit attacks a unit or player of a weaker element, it deals +1 bonus damage. No penalty for attacking a stronger element.

---

## 11. Keywords

| Keyword | Effect |
|---------|--------|
| Rush | Can attack on the turn it is summoned |
| Guard | Enemy units must target this unit before other Frontline units |
| Pierce | Excess damage from killing a unit carries over to the enemy player |
| Backline Strike | Can target Backline units directly regardless of Frontline state |
| Lifesteal | Heals your player for 1 when this unit deals damage |
| Counter | When attacked, deals damage back equal to its own Power |
| On Summon | Effect triggers once when the card is played |
| Aura | Passive effect active while this unit remains on the board |
| On Defeat | Effect triggers when this unit is destroyed |

---

## 12. Status Effects

All status effects are tracked by the game engine as state flags and integer counters. Visually represented in the frontend using the card back asset and status icon overlays.

| Status | Effect | Duration |
|--------|--------|----------|
| Stun | Cannot attack next turn | 1 turn |
| Sleep | Skips next 2 attack phases | 2 turns |
| Burn | Takes 1 damage at end of owner's turn | 2 triggers |
| Poison | Takes 1 damage at end of owner's turn | Until unit leaves board |
| Disabled | Cannot use its ability | 1 turn |
| Sealed | Ability cannot activate | 1 turn |
| Silenced | Permanently loses ability | Permanent |
| Shield | Negates next instance of damage | Until consumed |

---

## 13. Physical Card Tracking System

Since cards are Figma-exported static image assets, all physical tracking uses card orientation and verbal acknowledgment only. No external tokens or components required.

| Situation | Physical Tracking |
|-----------|------------------|
| Unit is stunned, disabled, asleep, burned, or poisoned | Turn that card 180 degrees |
| Status expires | Rotate card back to upright |
| Ability permanently cancelled (Shanks) | Both players verbally acknowledge and remember for the match |
| Shield block tracking (Gaara, Franky, Wartortle) | Announce remaining blocks aloud each time one is consumed |
| Clone is active (Naruto, Jiraiya) | Turn base card 180 degrees to show clone state |
| Clone is destroyed | Rotate base card back to upright |
| Leader ability used | Turn Leader card 180 degrees for the rest of the match |
| Gyarados Rage spent | Both players verbally acknowledge after first attack |
| Ability copied (Kakashi, Mewtwo) | Reference the source card briefly then return it |
| Eevee element declared | Declare aloud when played, both players acknowledge |
| Magikarp patience count | Count aloud at start of each turn: one, two, three — then trigger |

**Digital Status Tracking**

In the frontend game:
- When a unit is in a disabled state, display the card back asset over the card face
- The card back is a separate Figma-exported asset used as a frontend state indicator only
- The card back asset is not an NFT
- Status icons (burn, poison, shield, stun, sleep) are layered on top of the card face as UI overlays
- The game engine tracks all status durations as integer counters in board state

---

## 14. Win and Loss Conditions

**Win**
Reduce the enemy player's HP to 0.

**Loss**
- Your HP reaches 0
- You are required to draw from an empty deck (deck-out = immediate loss)

**Tiebreaker (if time limit reached)**
1. Higher HP wins
2. More board presence wins
3. More cards in hand wins
4. Draw

---

## 15. Anime Identity

| Anime | Identity | Playstyle |
|-------|----------|-----------|
| Naruto | Speed, clones, disables, tactical combos | Tempo and disruption. Creates board presence fast and denies opponent actions. |
| One Piece | Aggressive frontline, resilient bruisers, leadership buffs | Pressure and direct damage. Pushes for early lethal and buffs allies through leaders. |
| Pokémon | Elemental synergy, status effects, flexible utility | Status stacking and adaptive play. Burn, poison, and stun create value over multiple turns. |

---

## 16. Full Card Roster

---

### NARUTO

#### COMMON

**Naruto Uzumaki** — Shadow Clone Rookie
Mana: 2 | Power: 3 | HP: 3 | Element: Air
On Summon: A Shadow Clone (1 power / 1 health) is created in any empty Frontline slot. The clone attacks first. When the clone is destroyed it is removed and Naruto remains.
Tags: Naruto, Common, Frontline

---

**Sakura Haruno** — Medical Trainee
Mana: 2 | Power: 2 | HP: 4 | Element: Earth
On Summon: Heal 2 HP to one friendly unit or your player.
Tags: Naruto, Common, Backline

---

**Rock Lee** — Taijutsu Prodigy
Mana: 3 | Power: 4 | HP: 4 | Element: Earth
If this is the first unit to attack this turn, it gains +1 Power until end of turn.
Tags: Naruto, Common, Frontline

---

**Shikamaru Nara** — Tactical Genius
Mana: 3 | Power: 2 | HP: 4 | Element: Air
On Summon: One enemy unit is disabled. That unit cannot attack next turn.
Tags: Naruto, Common, Backline

---

**Hinata Hyuga** — Gentle Fist Adept
Mana: 2 | Power: 3 | HP: 3 | Element: Water
When this unit attacks, ignore the target's Shield and bypass Guard effects.
Tags: Naruto, Common, Frontline

---

**Kiba Inuzuka** — Fang of the Pack
Mana: 3 | Power: 3 | HP: 4 | Element: Earth
If at least one other friendly unit already attacked this turn, this unit gains +2 Power until end of turn.
Tags: Naruto, Common, Frontline

---

**Tenten** — Weapon Specialist
Mana: 2 | Power: 2 | HP: 3 | Element: Air
On Summon: Deal 1 damage to up to two different enemy units.
Tags: Naruto, Common, Backline

---

**Iruka Umino** — Village Guardian
Mana: 2 | Power: 1 | HP: 4 | Element: Earth
On Summon: Draw 1 card.
Tags: Naruto, Common, Reserve

---

**Konohamaru** — Future Hokage
Mana: 1 | Power: 2 | HP: 2 | Element: Fire
If a card named Naruto Uzumaki is on your side of the board, this unit permanently gains +1 Power.
Tags: Naruto, Common, Frontline

---

**Ninja Scroll** — Hidden Technique
Mana: 1 | Power: 0 | HP: 2 | Element: Air
Aura: The next friendly unit that attacks this turn gains +2 Power for that attack. The ability is spent after one trigger.
Tags: Naruto, Common, Reserve

---

#### RARE

**Kakashi Hatake** — Copy Ninja
Mana: 4 | Power: 4 | HP: 5 | Element: Air
On Summon: Choose one enemy unit on the board. This unit gains a copy of that unit's ability for the rest of the game.
Tags: Naruto, Rare, Frontline

---

**Gaara** — Sand Guardian
Mana: 4 | Power: 4 | HP: 6 | Element: Earth
On Summon: This unit ignores the next 2 instances of damage. Each block is consumed one at a time.
Tags: Naruto, Rare, Frontline

---

**Neji Hyuga** — Byakugan Master
Mana: 4 | Power: 4 | HP: 5 | Element: Air
On Summon: One enemy unit is sealed. That unit's ability cannot activate until end of your next turn.
Tags: Naruto, Rare, Frontline

---

#### LEGENDARY

**Itachi Uchiha** — Mangekyo Illusion
Mana: 5 | Power: 5 | HP: 6 | Element: Fire
On Summon: One enemy unit is put to sleep. That unit skips its next 2 attack phases.
As Leader: Once per game activate this effect without playing the card.
Tags: Naruto, Legendary, Frontline, Leader-Eligible

---

**Jiraiya** — Legendary Sannin
Mana: 5 | Power: 5 | HP: 6 | Element: Fire
On Summon: A Toad Clone (2 power / 3 health) is created on this card. The Toad Clone takes damage first. When the Toad Clone is destroyed Jiraiya fights at his base stats.
As Leader: Once per game give one friendly unit +2 Power and +2 HP until end of turn.
Tags: Naruto, Legendary, Frontline, Leader-Eligible

---

#### MYTHIC

**Naruto Uzumaki** — Sage of Six Paths
Mana: 6 | Power: 6 | HP: 7 | Element: Air
On Summon: All friendly units gain +1 Power and +1 HP until end of turn.
As Leader: Once per game activate this effect without playing the card.
Tags: Naruto, Mythic, Frontline, Leader-Eligible

---

### ONE PIECE

#### COMMON

**Monkey D. Luffy** — Rubber Brawler
Mana: 2 | Power: 3 | HP: 3 | Element: Air
This unit takes no retaliation damage when attacking any unit with the Counter keyword.
Tags: OnePiece, Common, Frontline

---

**Roronoa Zoro** — Three Sword Style
Mana: 3 | Power: 4 | HP: 4 | Element: Earth
If the enemy player is at 15 HP or less, this unit permanently gains +2 Power.
Tags: OnePiece, Common, Frontline

---

**Nami** — Weather Navigator
Mana: 2 | Power: 2 | HP: 3 | Element: Air
Aura: While Nami is on the board, all friendly Air units gain +1 Power.
Tags: OnePiece, Common, Backline

---

**Usopp** — Sniper King
Mana: 2 | Power: 3 | HP: 2 | Element: Air
This unit may target enemy Backline units directly, ignoring Frontline protection.
Tags: OnePiece, Common, Backline

---

**Sanji** — Black Leg
Mana: 3 | Power: 4 | HP: 4 | Element: Fire
If this is the only friendly unit that attacks this turn, it gains +2 Power for that attack.
Tags: OnePiece, Common, Frontline

---

**Tony Tony Chopper** — Emergency Doctor
Mana: 2 | Power: 1 | HP: 3 | Element: Earth
On Summon: Restore 2 HP to any one friendly unit or player.
Tags: OnePiece, Common, Reserve

---

**Nico Robin** — Devil Archaeologist
Mana: 3 | Power: 3 | HP: 4 | Element: Earth
On Summon: One enemy unit is bound. That unit cannot use its ability next turn.
Tags: OnePiece, Common, Backline

---

**Franky** — Cyborg Engineer
Mana: 3 | Power: 3 | HP: 5 | Element: Fire
On Summon: This unit ignores the next 2 instances of damage.
Tags: OnePiece, Common, Frontline

---

**Brook** — Soul Musician
Mana: 2 | Power: 2 | HP: 3 | Element: Air
When this unit is destroyed it enters a Revival state. At the start of your next turn it returns to the board with 1 HP. On Defeat effects do not trigger on the first death.
Tags: OnePiece, Common, Reserve

---

**Jinbe** — Fishman Karate Master
Mana: 3 | Power: 4 | HP: 4 | Element: Water
When this unit attacks a Fire-element unit, deal +1 bonus damage on top of any elemental advantage bonus.
Tags: OnePiece, Common, Frontline

---

#### RARE

**Trafalgar Law** — Room Surgeon
Mana: 4 | Power: 4 | HP: 5 | Element: Air
On Summon: Swap the positions of any two units on the board, friend or foe. Frontline becomes Backline and vice versa.
Tags: OnePiece, Rare, Backline

---

**Donquixote Doflamingo** — String Tyrant
Mana: 4 | Power: 5 | HP: 5 | Element: Fire
On Summon: Choose one enemy unit. That unit immediately attacks another enemy unit of your choice. Resolve that combat now.
Tags: OnePiece, Rare, Frontline

---

**Boa Hancock** — Pirate Empress
Mana: 4 | Power: 4 | HP: 5 | Element: Fire
On Summon: One enemy unit is stoned. That unit cannot attack or use abilities until the start of your next turn.
Tags: OnePiece, Rare, Backline

---

#### LEGENDARY

**Edward Newgate** — The Strongest Man
Mana: 5 | Power: 6 | HP: 7 | Element: Earth
Aura: While Whitebeard is on the board, all other friendly units gain +1 Power.
As Leader: Once per game give all friendly units +2 Power until end of turn.
Tags: OnePiece, Legendary, Frontline, Leader-Eligible

---

**Shanks** — Red-Haired Emperor
Mana: 5 | Power: 5 | HP: 6 | Element: Fire
On Summon: Choose one enemy unit. That unit permanently loses its ability for the rest of the game.
As Leader: Once per game cancel all enemy Reserve card abilities for this turn.
Tags: OnePiece, Legendary, Frontline, Leader-Eligible

---

#### MYTHIC

**Gol D. Roger** — Pirate King
Mana: 6 | Power: 7 | HP: 7 | Element: Fire
On Summon: If the enemy player is at 10 HP or less, this unit deals +3 damage on its first attack this turn.
As Leader: Once per game give all friendly units Rush this turn.
Tags: OnePiece, Mythic, Frontline, Leader-Eligible

---

### POKEMON

#### COMMON

**Charmander** — Flame Lizard
Mana: 2 | Power: 3 | HP: 3 | Element: Fire
On Summon: One enemy unit is burned. That unit takes 1 damage at the end of each of its owner's turns for 2 turns.
Tags: Pokemon, Common, Frontline

---

**Squirtle** — Tiny Defender
Mana: 2 | Power: 2 | HP: 4 | Element: Water
Passive: This unit reduces all incoming damage by 1.
Tags: Pokemon, Common, Frontline

---

**Bulbasaur** — Seed Pokémon
Mana: 2 | Power: 2 | HP: 4 | Element: Earth
Aura: At the start of your turn, restore 1 HP to one friendly unit of your choice while Bulbasaur is on the board.
Tags: Pokemon, Common, Reserve

---

**Pikachu** — Electric Ace
Mana: 3 | Power: 3 | HP: 3 | Element: Air
On Summon: One enemy unit is stunned. That unit cannot attack next turn.
Tags: Pokemon, Common, Frontline

---

**Pidgeotto** — Sky Hunter
Mana: 2 | Power: 2 | HP: 3 | Element: Air
This unit always attacks before all other units in the Battle Phase. If two units share this effect, the active player chooses order.
Tags: Pokemon, Common, Backline

---

**Geodude** — Rock Defender
Mana: 3 | Power: 3 | HP: 5 | Element: Earth
On Summon: This unit ignores the next 1 instance of damage. Guard: enemies must target this unit before other Frontline units if able.
Tags: Pokemon, Common, Frontline

---

**Magikarp** — Stubborn Splasher
Mana: 1 | Power: 1 | HP: 2 | Element: Water
Aura: At the start of each of your turns, a Patience counter is added to this unit. When the counter reaches 3, deal 3 damage directly to the enemy player then remove Magikarp from the board.
Tags: Pokemon, Common, Reserve

---

**Eevee** — Adaptive Pokémon
Mana: 2 | Power: 2 | HP: 3 | Element: Earth
When played, declare one element: Fire, Water, Earth, or Air. This unit becomes that element permanently for the rest of the game.
Tags: Pokemon, Common, Frontline, Backline

---

**Psyduck** — Confused Psychic
Mana: 2 | Power: 3 | HP: 3 | Element: Water
Each time this unit attacks, a random effect triggers with equal probability: Stun target / Burn target / Heal yourself 1 HP / Draw 1 card.
Tags: Pokemon, Common, Frontline

---

**Oddish** — Grass Sprout
Mana: 2 | Power: 2 | HP: 3 | Element: Earth
On Summon: One enemy unit is poisoned. That unit takes 1 damage at the end of each of its owner's turns until it leaves the board.
Tags: Pokemon, Common, Reserve

---

#### RARE

**Charmeleon** — Flame Warrior
Mana: 4 | Power: 5 | HP: 5 | Element: Fire
On Summon: One enemy unit is burned. Each time any burned unit takes its burn damage this game, Charmeleon permanently gains +1 Power.
Tags: Pokemon, Rare, Frontline

---

**Wartortle** — Shell Guardian
Mana: 4 | Power: 3 | HP: 6 | Element: Water
On Summon: Each friendly Frontline unit currently on the board ignores the next 1 instance of damage.
Tags: Pokemon, Rare, Frontline

---

**Ivysaur** — Bloom Fighter
Mana: 4 | Power: 3 | HP: 5 | Element: Earth
On Summon: Distribute 2 HP across any friendly units currently on the board in any combination.
Tags: Pokemon, Rare, Backline

---

#### LEGENDARY

**Gyarados** — Sea Fury
Mana: 5 | Power: 6 | HP: 6 | Element: Water
The first attack this unit makes deals double damage. The bonus is consumed after the first attack.
As Leader: Once per game give one friendly unit double damage on its next attack this turn.
Tags: Pokemon, Legendary, Frontline, Leader-Eligible

---

**Dragonite** — Sky Guardian
Mana: 5 | Power: 5 | HP: 6 | Element: Air
This unit may attack twice per turn. The second attack may only target a unit, not the enemy player directly.
As Leader: Once per game allow all friendly Frontline units to attack twice this turn. Second attacks may only target units.
Tags: Pokemon, Legendary, Frontline, Leader-Eligible

---

#### MYTHIC

**Mewtwo** — Psychic Apex
Mana: 6 | Power: 6 | HP: 7 | Element: Air
On Summon: Choose one enemy unit on the board. Mewtwo permanently gains a copy of that unit's ability in addition to its own.
As Leader: Once per game disable all enemy Reserve card abilities for this turn.
Tags: Pokemon, Mythic, Frontline, Leader-Eligible

---

## 17. Card JSON Database

Every card is represented as a JSON object. The frontend battle engine reads card data from this JSON to resolve abilities, calculate damage, and manage board state. The JSON is the single source of truth for all card logic.

### JSON Schema

```json
{
  "id": "string",
  "name": "string",
  "subtitle": "string",
  "anime": "Naruto | OnePiece | Pokemon",
  "rarity": "Common | Rare | Legendary | Mythic",
  "mana": "number",
  "power": "number",
  "hp": "number",
  "element": "Fire | Water | Earth | Air",
  "zone": "Frontline | Backline | Reserve | Frontline,Backline",
  "leaderEligible": "boolean",
  "keywords": ["string"],
  "ability": {
    "trigger": "OnSummon | Aura | OnDefeat | CombatTrigger | Passive",
    "type": "string",
    "value": "number | null",
    "target": "string | null",
    "duration": "string | null",
    "condition": "string | null"
  },
  "leaderAbility": {
    "type": "string",
    "value": "number | null",
    "target": "string | null"
  },
  "traits": ["string"],
  "imageUrl": "string",
  "nftTokenId": "string | null"
}
```

### Sample Card JSON Entries

```json
[
  {
    "id": "naruto_common_naruto_01",
    "name": "Naruto Uzumaki",
    "subtitle": "Shadow Clone Rookie",
    "anime": "Naruto",
    "rarity": "Common",
    "mana": 2,
    "power": 3,
    "hp": 3,
    "element": "Air",
    "zone": "Frontline",
    "leaderEligible": false,
    "keywords": ["OnSummon", "Clone"],
    "ability": {
      "trigger": "OnSummon",
      "type": "SpawnClone",
      "value": null,
      "target": "EmptyFrontlineSlot",
      "duration": "UntilCloneDies",
      "condition": null,
      "cloneStats": { "power": 1, "hp": 1 }
    },
    "leaderAbility": null,
    "traits": ["Naruto", "Common", "Frontline", "Aggro", "Clone"],
    "imageUrl": "assets/cards/naruto_common_naruto_01.png",
    "nftTokenId": null
  },
  {
    "id": "naruto_rare_kakashi_01",
    "name": "Kakashi Hatake",
    "subtitle": "Copy Ninja",
    "anime": "Naruto",
    "rarity": "Rare",
    "mana": 4,
    "power": 4,
    "hp": 5,
    "element": "Air",
    "zone": "Frontline",
    "leaderEligible": false,
    "keywords": ["OnSummon", "CopyAbility"],
    "ability": {
      "trigger": "OnSummon",
      "type": "CopyAbility",
      "value": null,
      "target": "EnemyUnit",
      "duration": "Permanent",
      "condition": null
    },
    "leaderAbility": null,
    "traits": ["Naruto", "Rare", "Frontline", "Control", "Copy"],
    "imageUrl": "assets/cards/naruto_rare_kakashi_01.png",
    "nftTokenId": null
  },
  {
    "id": "naruto_legendary_itachi_01",
    "name": "Itachi Uchiha",
    "subtitle": "Mangekyo Illusion",
    "anime": "Naruto",
    "rarity": "Legendary",
    "mana": 5,
    "power": 5,
    "hp": 6,
    "element": "Fire",
    "zone": "Frontline",
    "leaderEligible": true,
    "keywords": ["OnSummon", "Sleep"],
    "ability": {
      "trigger": "OnSummon",
      "type": "Sleep",
      "value": 2,
      "target": "EnemyUnit",
      "duration": "2Turns",
      "condition": null
    },
    "leaderAbility": {
      "type": "Sleep",
      "value": 2,
      "target": "EnemyUnit"
    },
    "traits": ["Naruto", "Legendary", "Frontline", "Control", "Genjutsu", "Leader-Eligible"],
    "imageUrl": "assets/cards/naruto_legendary_itachi_01.png",
    "nftTokenId": null
  },
  {
    "id": "pokemon_common_magikarp_01",
    "name": "Magikarp",
    "subtitle": "Stubborn Splasher",
    "anime": "Pokemon",
    "rarity": "Common",
    "mana": 1,
    "power": 1,
    "hp": 2,
    "element": "Water",
    "zone": "Reserve",
    "leaderEligible": false,
    "keywords": ["Aura", "Patience"],
    "ability": {
      "trigger": "Aura",
      "type": "PatienceCounter",
      "value": 3,
      "target": "EnemyPlayer",
      "duration": "UntilTriggered",
      "condition": "PatienceCounterReaches3",
      "onTrigger": {
        "type": "DirectDamage",
        "value": 3,
        "then": "RemoveSelf"
      }
    },
    "leaderAbility": null,
    "traits": ["Pokemon", "Common", "Reserve", "Scaling", "Water"],
    "imageUrl": "assets/cards/pokemon_common_magikarp_01.png",
    "nftTokenId": null
  },
  {
    "id": "pokemon_mythic_mewtwo_01",
    "name": "Mewtwo",
    "subtitle": "Psychic Apex",
    "anime": "Pokemon",
    "rarity": "Mythic",
    "mana": 6,
    "power": 6,
    "hp": 7,
    "element": "Air",
    "zone": "Frontline",
    "leaderEligible": true,
    "keywords": ["OnSummon", "CopyAbility"],
    "ability": {
      "trigger": "OnSummon",
      "type": "CopyAbility",
      "value": null,
      "target": "EnemyUnit",
      "duration": "Permanent",
      "condition": null
    },
    "leaderAbility": {
      "type": "DisableReserve",
      "value": null,
      "target": "AllEnemyReserveCards",
      "duration": "ThisTurn"
    },
    "traits": ["Pokemon", "Mythic", "Frontline", "Control", "Copy", "Leader-Eligible"],
    "imageUrl": "assets/cards/pokemon_mythic_mewtwo_01.png",
    "nftTokenId": null
  }
]
```

### Board State Model

The game engine tracks each unit on the board using this structure:

```json
{
  "cardId": "string",
  "owner": "player1 | player2",
  "zone": "Frontline | Backline | Reserve",
  "currentPower": "number",
  "currentHP": "number",
  "maxHP": "number",
  "element": "Fire | Water | Earth | Air",
  "statusEffects": ["Stun | Sleep | Burn | Poison | Disabled | Sealed | Silenced"],
  "statusDurations": { "Burn": 2, "Sleep": 2 },
  "canAttack": "boolean",
  "hasAttackedThisTurn": "boolean",
  "turnSummoned": "number",
  "shieldsRemaining": "number",
  "isSilenced": "boolean",
  "isDisabled": "boolean",
  "cloneActive": "boolean",
  "cloneHP": "number",
  "patienceCounter": "number"
}
```

---

## 18. Asset Pipeline

### Card Assets

All card visuals are designed in Figma and exported as static PNG files. The game engine never generates card visuals dynamically — images are pre-exported and referenced by card ID.

**Export Specs**
- Format: PNG
- Resolution: 1000 × 1400 px (5:7 ratio)
- One image per unique card
- Total assets for demo: 48 card faces + 1 card back

**File Naming Convention**
```
{anime}_{rarity}_{charactername}_{version}.png

Examples:
naruto_common_naruto_01.png
naruto_rare_kakashi_01.png
onepiece_mythic_roger_01.png
pokemon_legendary_gyarados_01.png

Card back:
card_back.png
```

**Rarity Frame Colors**

| Rarity | Frame Color |
|--------|-------------|
| Common | Grey / Silver |
| Rare | Blue |
| Legendary | Gold |
| Mythic | Purple / Rainbow |

### Card Back Asset

The card back is a single shared Figma-exported asset used by the frontend to represent any disabled state: stunned, asleep, stoned, disabled, sealed. It is displayed by the game engine as an overlay or replacement when a unit enters one of these states.

The card back is **not an NFT**. It is a UI asset used only in the frontend game client.

### UI Overlay Assets

These are frontend-only elements layered on top of card images at runtime by the game engine:

| Asset | Used For |
|-------|----------|
| card_back.png | Stunned, disabled, asleep, stoned, sealed states |
| icon_burn.png | Burn status indicator |
| icon_poison.png | Poison status indicator |
| icon_shield.png | Shield remaining count |
| icon_stun.png | Stun status indicator |
| icon_sleep.png | Sleep status indicator |
| icon_clone.png | Clone active state indicator |

None of these UI assets are NFTs.

### NFT vs Non-NFT Asset Summary

| Asset | NFT? |
|-------|------|
| 48 card face images | Yes — each minted as ERC-1155 |
| card_back.png | No — shared UI asset |
| Status icon overlays | No — shared UI assets |
| Clone game objects | No — frontend only, created at runtime |
| Jiraiya Toad Clone | No — frontend game object only |

---

## 19. NFT Implementation Guide

### Token Standard

Use **ERC-1155** (semi-fungible token standard).

Why ERC-1155 over ERC-721:
- Supports multiple copies of the same card up to supply cap
- More gas-efficient for batch minting packs
- Supports batch transfers for trading
- Compatible with OpenSea, Blur, and major marketplaces

### Demo Supply Caps

For the demo, no duplicate cards are allowed per player. Each card is a single unique asset per player inventory. Supply caps exist at the contract level.

| Rarity | Max Mint Per Anime |
|--------|--------------------|
| Common | 10,000 |
| Rare | 3,000 |
| Legendary | 500 |
| Mythic | 30 |

Total per anime: 13,530 NFTs
Total across 3 anime: 40,590 NFTs

### IPFS Metadata

```json
{
  "name": "Kakashi Hatake — Copy Ninja",
  "description": "Kakashi's Sharingan allows him to mirror enemy techniques instantly.",
  "image": "ipfs://QmXXXXXXXX/naruto_rare_kakashi_01.png",
  "attributes": [
    { "trait_type": "Anime", "value": "Naruto" },
    { "trait_type": "Rarity", "value": "Rare" },
    { "trait_type": "Element", "value": "Air" },
    { "trait_type": "Mana", "value": 4 },
    { "trait_type": "Power", "value": 4 },
    { "trait_type": "HP", "value": 5 },
    { "trait_type": "Zone", "value": "Frontline" },
    { "trait_type": "Leader Eligible", "value": false }
  ]
}
```

### Implementation Layers

**Layer 1 — NFT / Ownership**
- Mint cards as ERC-1155 tokens
- Store metadata on IPFS
- Verify ownership before deck save
- Marketplace: list, buy, transfer

**Layer 2 — Deck Layer**
- Player selects 8 cards + 1 Leader from owned inventory
- Backend validates deck rules (no duplicates, rarity limits, deck size)
- Deck saved off-chain or as a signed message referencing token IDs

**Layer 3 — Battle Engine**
- Reads card stats from JSON database by card ID
- Manages board state per unit
- Resolves attacks, abilities, status effects
- Tracks win/loss conditions

**Layer 4 — Match Services**
- Matchmaking
- PvP turn sync
- Turn timer: 45 seconds per turn
- Match result recording

### Suggested Contract Events

```solidity
event PackOpened(address indexed player, uint packType, uint[] tokenIds);
event CardMinted(address indexed player, uint tokenId, string rarity, string cardName);
event MarketplaceListed(address indexed seller, uint tokenId, uint price);
event MarketplaceSold(address indexed buyer, uint tokenId, uint price);
```

---

## 20. Gacha Pack System

### Pack Types

| Pack | Cards | Price | Guarantees |
|------|-------|-------|------------|
| Standard (x10) | 10 | Base price | ≥ 1 Rare |
| Premium (x20) | 20 | 1.8× Base | ≥ 2 Rare, higher Legendary chance |
| Ultra (x30) | 30 | 2.5× Base | ≥ 3 Rare + ≥ 1 Legendary |

### Rarity Probabilities

| Rarity | Base Chance |
|--------|-------------|
| Common | 82% |
| Rare | 14% |
| Legendary | 3.8% |
| Mythic | 0.2% |

Mythic ≈ 1 in 500 cards. Legendary ≈ 1 in 26 cards.

### Rarity Downgrade When Supply Runs Out

```
Mythic sold out    → roll becomes Legendary
Legendary sold out → roll becomes Rare
Rare sold out      → roll becomes Common
```

### Dynamic Probability

```
effectiveChance = baseChance × (remainingSupply / totalSupply)
```

As a rarity tier approaches zero supply, its effective pull rate naturally decreases.

### Pity System (Optional)

Every 50 packs opened without a Mythic, Mythic chance increases by +0.1%. Resets after a Mythic is pulled.

---

## 21. Smart Contract Logic

### Pull Logic

```solidity
uint roll = random % 10000;

if (roll < 8200) {
    rarity = Rarity.Common;
} else if (roll < 9600) {
    rarity = Rarity.Rare;
} else if (roll < 9980) {
    rarity = Rarity.Legendary;
} else {
    rarity = Rarity.Mythic;
}
```

### Supply Cap with Downgrade

```solidity
if (rarity == Rarity.Mythic && mythicSoldOut()) {
    rarity = Rarity.Legendary;
}
if (rarity == Rarity.Legendary && legendarySoldOut()) {
    rarity = Rarity.Rare;
}
if (rarity == Rarity.Rare && rareSoldOut()) {
    rarity = Rarity.Common;
}
```

### Guarantee Enforcement

```solidity
// Standard x10
// Slot 1:     force minimum Rare
// Slots 2–10: normal random pull

// Premium x20
// Slots 1–2:  force minimum Rare
// Slots 3–20: normal random pull

// Ultra x30
// Slots 1–3:  force minimum Rare
// Slot 4:     force minimum Legendary
// Slots 5–30: normal random pull
```

### Prevent Duplicate Cards Per Pack

```solidity
mapping(uint => bool) usedInThisPack;

function drawUniqueCard(Rarity rarity) internal returns (uint cardId) {
    do {
        cardId = getRandomCardOfRarity(rarity);
    } while (usedInThisPack[cardId]);
    usedInThisPack[cardId] = true;
}
```

### Randomness

Use **Chainlink VRF** for verifiable on-chain randomness. Never use block hash alone.

```solidity
// 1. Request random words from Chainlink VRF
// 2. Seed all pulls in one pack from returned randomness
// 3. Reveal results after VRF callback is received
```

---

## 22. Suggested MVP Scope

### Must Have
- Gacha pack opening (x10, x20, x30)
- Card inventory viewer
- Deck builder (8 cards + 1 Leader, no duplicates)
- 1v1 battle engine reading from card JSON
- Marketplace listing and buying
- Rarity-based collection display
- NFT minting and ownership verification
- Card back asset for status display in frontend

### Nice to Have
- Tournament bracket
- Ranked ladder
- Spectator mode
- Replay log
- Pity system tracker

### Do Not Build for Hackathon
- Evolution mechanics
- Multiple activated abilities per card
- Mobile-native build
- Infinite scaling or combo chains

---

*Anime Gacha TCG — Game Bible v1.2*
*No duplicate cards per deck. Figma card assets at 1000×1400px. Card back as frontend status indicator. Card JSON as battle engine source of truth.*
