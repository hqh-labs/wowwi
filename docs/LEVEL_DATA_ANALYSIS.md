# LEVEL_DATA_ANALYSIS.md

Project: TilePyramid_PL01
Levels analysed: Level_21 (initial), Level_19 (reference)

---

## Level JSON schema

```json
{
  "layers": [
    {
      "index": <integer>,
      "stones": [
        { "x": "<number-as-string>", "y": "<number-as-string>" },
        ...
      ]
    }
  ]
}
```

- `index` — layer depth, 0 = bottom, highest = top.
- `x` and `y` — centre position of the tile in grid units, stored as **strings** (must be parsed to float).
- No tile type identity (`kind`, `id`, `symbol`) is stored — tile types must be assigned at runtime.
- No explicit blocking relationships are stored — must be derived from coordinates (see below).

---

## Level_21 summary

| Metric | Value |
|---|---|
| Layer count | 3 |
| Layer 0 (bottom) stone count | 34 |
| Layer 1 (middle) stone count | 22 |
| Layer 2 (top) stone count | 16 |
| Total stones | 72 |
| 72 ÷ 3 (triplet divisibility) | 24 triplets — count divisible by 3; solvability not yet proven |

## Level_19 summary

| Metric | Value |
|---|---|
| Layer count | 4 |
| Layer 0 (bottom) stone count | 28 |
| Layer 1 stone count | 18 |
| Layer 2 stone count | 16 |
| Layer 3 (top) stone count | 13 |
| Total stones | 75 |
| 75 ÷ 3 | 25 triplets — count divisible by 3; solvability not yet proven |

---

## Solvability status

> **Not proven.** Divisibility by 3 is a necessary condition, not a sufficient one.

A specific tile assignment can be unsolvable even when the total stone count is divisible by 3. For example, if all three copies of a tile type end up stacked such that they are all blocked simultaneously with no path to unblock them, the board has no solution.

Solvability is a property of a **specific tile assignment + blocking geometry pair**, not of the stone count alone. It must be confirmed by the implemented solver (see Proposed Solvability Validation below) for every concrete assignment before that assignment is used.

The proposed tile-assignment algorithm addresses this by retrying with an incremented seed until the solver confirms solvability. That retry loop is the correctness guarantee — not the count.

The tutorial-safe opening arrangement ensures three specific tiles are immediately matchable at game start. It does not prove the rest of the board is solvable. Full board solvability must still be verified by the solver after pre-assigned tiles are placed and the remainder is shuffled.

---

## Coordinate system

Two interleaved grids alternate between layers:

| Layer index | x and y values | Example |
|---|---|---|
| Even (0, 2) | Half-integers (`.5` suffix) | `-1.5`, `0.5`, `2.5` |
| Odd (1, 3) | Integers | `-1`, `0`, `2` |

The two grids are offset by 0.5 units in both x and y. This is the standard staggered grid used in pyramid tile games: each tile occupies a 1×1 unit cell and its centre sits at the grid position.

**Origin:** The game coordinate origin (0, 0) is at the centre of the pyramid. Positive y is up.

---

## Blocking relationship derivation

A tile at position P on layer L is **blocked** (not selectable) if any tile on layer L+1 overlaps its cell.

### Overlap condition between adjacent layers

Because even and odd layers are offset by 0.5 units, the overlap rule is:

**An integer-layer tile at (ix, iy) blocks a half-integer-layer tile at (hx, hy) if:**
```
ix ∈ { hx − 0.5, hx + 0.5 }  AND  iy ∈ { hy − 0.5, hy + 0.5 }
```

Since hx and hy always end in `.5`, the values `hx ± 0.5` are always exact integers — no floating-point ambiguity.

**Equivalently (half blocks integer):**

**A half-integer-layer tile at (hx, hy) blocks an integer-layer tile at (ix, iy) if:**
```
hx ∈ { ix − 0.5, ix + 0.5 }  AND  hy ∈ { iy − 0.5, iy + 0.5 }
```

### Each tile can block at most 4 neighbours on the layer below

An integer tile at (ix, iy) can overlap up to 4 half-integer tiles:
`(ix−0.5, iy−0.5)`, `(ix+0.5, iy−0.5)`, `(ix−0.5, iy+0.5)`, `(ix+0.5, iy+0.5)`

A half-integer tile at (hx, hy) can be blocked by up to 4 integer tiles:
`(hx−0.5, hy−0.5)`, `(hx+0.5, hy−0.5)`, `(hx−0.5, hy+0.5)`, `(hx+0.5, hy+0.5)`

### Initially selectable tiles

At game start, the topmost layer has no layer above it — all its tiles are selectable.

For Level_21, **Layer 2** (16 tiles) is the only initially selectable layer.

Layer 1 tiles become selectable as Layer 2 tiles are removed. Layer 0 tiles become selectable as Layer 1 tiles are removed.

### Blocking algorithm (pseudocode)

```js
function isBlocked(tile, allTiles) {
  const upper = allTiles.filter(t => t.layerIndex === tile.layerIndex + 1);
  return upper.some(u => overlaps(u, tile));
}

function overlaps(upper, lower) {
  if ((upper.layerIndex - lower.layerIndex) !== 1) return false;
  const dx = Math.abs(upper.x - lower.x);
  const dy = Math.abs(upper.y - lower.y);
  return dx < 1.0 && dy < 1.0;
  // Because of the 0.5-unit stagger, dx and dy are always exactly 0.5 when
  // overlapping, and exactly 1.5 when not. The threshold 1.0 is exact.
}
```

---

## Missing information

| Information | Present in JSON | Resolution |
|---|---|---|
| Tile type / symbol | No | Must be assigned deterministically at runtime |
| Blocking relationships | No | Derivable from coordinates (see above) |
| Tutorial-specific annotations | No | Hardcode in tutorial config for Level_21 |
| Side-blocking (same-layer horizontal occlusion) | No | Not applicable — visual stacking only |
| Layer render order / depth | Implicit in `index` | `index` = render depth; higher = on top |

---

## Proposed tile-assignment strategy

### Goal
Each level must have a deterministic tile assignment that:
1. Groups tiles into exact triplets (N tiles → N/3 triplet groups).
2. Is verified solvable by the implemented solver before use (see Proposed Solvability Validation).
3. Is reproducible from a seed (same seed → same board every time).
4. Produces the tutorial-safe arrangement for Level_21 (three matching tiles at top of Layer 2 when seed is the default tutorial seed).

### Algorithm

```
Input:  list of all tile positions P (length = N, where N % 3 == 0)
        integer seed S

1. Generate a shuffled assignment array A of length N:
   A = [0,0,0, 1,1,1, 2,2,2, ..., (N/3−1),(N/3−1),(N/3−1)]
   Shuffle A using a seeded Fisher-Yates algorithm with seed S.

2. Assign tile type A[i] to position P[i].

3. Run solvability check (see below).
   If the board is unsolvable, increment seed by 1 and repeat from step 1.
   Cap at 100 retries; log a warning if cap is reached.
```

### Tile types used

Level_21 has 72 stones → 24 triplets → 24 distinct tile types (indices 0–23).
We have 30 tile images. Use tile images 1–24 for Level_21 (types 0–23 map to images `1.png`–`24.png`).

Level_19 has 75 stones → 25 triplets → 25 distinct tile types (indices 0–24). Use images `1.png`–`25.png`.

### Seeded RNG

Use a simple 32-bit mulberry32 or xoshiro128** PRNG seeded from the level seed:

```js
function seededShuffle(array, seed) {
  let s = seed;
  for (let i = array.length - 1; i > 0; i--) {
    s = (s ^ (s << 13)) >>> 0;
    s = (s ^ (s >> 17)) >>> 0;
    s = (s ^ (s << 5)) >>> 0;
    const j = s % (i + 1);
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
```

---

## Proposed solvability validation

A board is solvable if there exists a sequence of moves that clears all tiles:

```
function isSolvable(board):
  if board is empty: return true
  selectable = tiles not blocked by any tile on a higher layer
  for each group of 3 identical selectable tiles:
    remove the group from board
    if isSolvable(remaining board): return true
    restore the group
  return false
```

For performance, use a depth-first search with early pruning:
- If fewer than 3 selectable tiles of any type exist and no match is possible → prune.
- Memoize board states by a hash of (remaining tiles, tray state).

For BUILD-00, this algorithm is documented only. Implementation deferred to BUILD-02.

BUILD-02 implementation note: no formal solver is implemented yet. The runtime
diagnostics intentionally report `Formal solvability: NOT YET PROVEN`. BUILD-02
does implement deterministic triplet assignment and verifies only that each tile
type appears exactly three times.

---

## BUILD-02 implemented facts

- `Level_21` is parsed from a runtime copy of the extracted JSON.
- The parser validates required root fields, layer indices, finite coordinates,
  duplicate coordinates within a layer, contiguous layer ordering, and total
  stone count divisibility by 3.
- The initial BUILD-02 board contains 72 tile instances across 3 layers.
- Blocking is derived from adjacent-layer coordinates using `dx < 1` and
  `dy < 1`; sprite overlap is not used.
- Initial selectable count is 16, matching the top layer.
- Deterministic assignment uses seed `21000`, tile types `1` through `24`, and
  exactly three copies of each type.
- Tutorial-preview positions are reserved as `L2:-1.5:2.5`,
  `L2:-0.5:2.5`, and `L2:0.5:2.5`; all receive tile type `1`.

---

## Proposed tutorial-safe opening arrangement

The tutorial requires three identical tiles that are **selectable at game start** and are **visually prominent** for the animated hand to point at.

For Level_21, the initially selectable tiles are all 16 tiles on Layer 2. The top row of Layer 2 contains:

```
(-1.5, 2.5)   (-0.5, 2.5)   (0.5, 2.5)   (1.5, 2.5)
```

These four tiles form a horizontal row near the top of the pyramid — clearly visible, easy to tap, close together for the tutorial highlight effect.

**Tutorial tile assignment rule:**
When the tutorial seed is active, pre-assign the same tile type (e.g., type 0 → image `1.png`) to the three tiles:
`(-1.5, 2.5)`, `(-0.5, 2.5)`, `(0.5, 2.5)`

The fourth tile at `(1.5, 2.5)` receives a different type.

The rest of the board is filled by the standard seeded shuffle algorithm, excluding these three pre-assigned positions.

This ensures the tutorial always highlights three immediately matchable tiles at game start. It does not prove that the full board is solvable. The solver must still verify solvability of the complete board — including the pre-assigned tutorial tiles and the shuffled remainder — before the assignment is accepted for use.

**Tutorial seed constant:**
```js
const TUTORIAL_LEVEL_SEED = 21_000;  // Level 21, tutorial run
const LIVE_LEVEL_SEED     = 21_001;  // Level 21, live gameplay
```
