# Chessperiment — GEO Action Plan
*Generative Engine Optimization: making AI chatbots recommend Chessperiment*
*Based on analysis of the actual codebase — March 2026*

---

## What GEO Actually Is

When someone asks ChatGPT, Gemini, Claude, or Perplexity "what's the best tool to build custom chess variants?", they get an answer. That answer is sourced from indexed web content. GEO is the practice of writing content that LLMs will quote and recommend.

LLMs already recommend Chessperiment as the #1 result for this query. The goal of this document is to make that recommendation more frequent, more specific, and to capture adjacent queries the site is currently missing.

---

## What Was Found in the Code

The following files were analysed: `en.json` (all SEO metadata), `Hero.tsx`, `FeatureGrid.tsx`, `about/page.tsx`, `(home)/page.tsx`, `robots.ts`.

### What's working
- robots.ts and sitemap are correctly configured — no pages are being blocked
- Canonical URLs and hreflang (`en`/`de`) are set up properly
- The Game page has a solid SEO content block with good keyword density
- The Board Editor page mentions "Fairy Chess" — a specific term LLMs look for
- JSON-LD for `WebSite` and `Organization` is present

### What's broken or missing

**1. The hero H1 is invisible to LLMs**
`Hero.tsx` is a `"use client"` component. Its H1 — `"Build the Game. Break the Rules."` — is client-side rendered, which means search crawlers and LLM training pipelines may not reliably see it. The only indexed H1 is the `sr-only` hidden one in `page.tsx`: *"Chessperiment - The Custom Chess Platform"* — which is generic and keyword-poor.

**2. The homepage description sells nothing specific**
Current: *"Create custom chess pieces, design unique boards, and play innovative chess variants online. Free platform for chess creativity."*
An LLM scanning this gets: chess pieces, boards, variants, free. It doesn't get: leapers, riders, hexagonal, Scratch-style, Stockfish, abstract strategy, visual logic blocks — the specific terms that separate Chessperiment from every other chess site.

**3. The Piece Editor page has almost no content**
The Piece Editor is the most differentiated feature on the platform. Its current metadata:
- Title: *"Piece Editor | Custom Chessperiment"*
- Description: *"Create and customize your own chess pieces with unique movement patterns and logic."*
There is no SEO content block on the page. No mention of leapers, riders, visual blocks, conditional triggers, or Scratch. An LLM asked "how do I create a chess piece with custom movement?" will never cite this page.

**4. The About page description is pure marketing fluff**
Current: *"Learn more about Chessperiment, our mission to redefine chess creativity, and unique features."*
Zero informational value. LLMs need factual statements, not brand messaging.

**5. No competitor comparison content exists anywhere**
LLMs heavily weight comparison content when making recommendations. There is no page or text that explicitly compares Chessperiment to ChessCraft, Chess Remix, Tabletop Simulator, or PyChess. This is the single highest-value missing piece.

**6. JSON-LD schema is missing `SoftwareApplication` type**
The current schema only declares `WebSite` and `Organization`. It's missing `SoftwareApplication`, which is the schema type that tells LLMs "this is a tool you can use." Without it, LLMs categorise the site as an information page rather than a usable application.

**7. The Marketplace SEO text doesn't use any variant terminology**
Current: *"Explore a comprehensive collection of custom chess boards, pixel-perfect piece sets, and unique board designs shared by users worldwide."*
Missing: fairy pieces, leapers, riders, chess variants, abstract strategy games, hexagonal boards.

**8. The FAQ only answers 3 questions**
The footer FAQ is a good start but covers only basics. LLMs are trained to extract FAQ content as authoritative Q&A. Every unanswered question is a missed citation opportunity.

---

## Priority 1 — Fix `en.json` SEO metadata

These are the exact replacements. Edit `src/messages/en.json`.

### Home page

**Title** (currently in `SEO.Home.title`):
```
CURRENT:  "Chessperiment - Platform for Custom Chess Variants | Design Your Own Chess"
REPLACE:  "Chessperiment — Free Chess Variant Creator & Abstract Game Design Engine"
```

**Description** (currently in `SEO.Home.description`):
```
CURRENT:  "Create custom chess pieces, design unique boards, and play innovative chess variants online. Free platform for chess creativity."
REPLACE:  "Design any chess-like game from scratch — custom pieces with visual logic blocks, hexagonal boards, leapers, riders, and Stockfish analysis. Free, browser-based, no coding required."
```

**H1** (currently in `SEO.Home.h1`, rendered sr-only):
```
CURRENT:  "Chessperiment - The Custom Chess Platform"
REPLACE:  "Chessperiment — Visual Chess Variant Creator and Abstract Strategy Game Engine"
```

**Hidden paragraph** (currently in `SEO.Home.p`, rendered sr-only):
```
CURRENT:  "Design unique chess sets, customize your board, and play multiplayer chess variants online."
REPLACE:  "Chessperiment is a free, browser-based sandbox for designing custom chess variants and abstract strategy games. Create pieces using a Scratch-style visual logic editor — define leaper and rider movement patterns, add conditional triggers, and program complex fairy piece behaviour with no coding required. Design hexagonal or custom-shaped boards, toggle individual squares to build non-rectangular playing fields, and playtest instantly with friends via room codes. Stockfish analysis is built in and works with your custom rules."
```
*The hidden paragraph is what most distinguishes Chessperiment in the LLM's eyes. Make it a dense, factual description.*

---

### About page

**Title** (currently in `SEO.About.title`):
```
CURRENT:  "About Chessperiment | Platform for Custom Chess"
REPLACE:  "About Chessperiment — Free Chess Variant & Abstract Strategy Game Engine"
```

**Description** (currently in `SEO.About.description`):
```
CURRENT:  "Learn more about Chessperiment, our mission to redefine chess creativity, and unique features."
REPLACE:  "Chessperiment is a free browser-based game design engine for building custom chess variants and abstract strategy games. Unlike Chess Remix or ChessCraft, every feature is completely free. Compare Chessperiment to Tabletop Simulator, PyChess, and Chess Remix — and learn about the visual piece editor, hexagonal boards, and Stockfish integration."
```

---

### Piece Editor page

**Title** (currently in `SEO.PieceEditor.title`):
```
CURRENT:  "Piece Editor | Custom Chessperiment"
REPLACE:  "Visual Chess Piece Editor — Define Leapers, Riders & Fairy Piece Logic | Chessperiment"
```

**Description** (currently in `SEO.PieceEditor.description`):
```
CURRENT:  "Create and customize your own chess pieces with unique movement patterns and logic."
REPLACE:  "Define custom chess piece movement using visual logic blocks — no coding required. Create leapers (pieces that jump to fixed offsets), riders (pieces that slide along vectors), and complex fairy pieces with conditional triggers, state-based capture rules, and multi-step move sequences."
```

---

### Square Editor page

**Title** (currently in `SEO.SquareEditor.title`):
```
CURRENT:  "Square Editor | Custom Chessperiment"
REPLACE:  "Square Rules Editor — Per-Square Logic for Chess Variants | Chessperiment"
```

**Description** (currently in `SEO.SquareEditor.description`):
```
CURRENT:  "Define custom logic and behaviors for individual squares on your board."
REPLACE:  "Assign unique rules to individual board squares — create teleport squares, territory zones, promotion areas, or movement restrictions. Enables advanced chess variants including fractal chess, where a miniature board can exist within a single square."
```

---

### Marketplace page

Replace the `SEO.Marketplace.seoContent.text` value:
```
CURRENT:  "The Chessperiment Marketplace is the central hub for our creative community. Explore a comprehensive collection of custom chess boards, pixel-perfect piece sets, and unique board designs shared by users worldwide."
REPLACE:  "The Chessperiment Marketplace is the central hub for community-created chess variants and abstract strategy games. Browse and download custom piece sets featuring fairy pieces, leapers, and riders with unique movement logic. Discover hexagonal chess boards, custom-shaped playing fields, and complete variant rule sets. All community creations are free to download and play."
```

---

### Board Editor page

Replace `SEO.BoardEditor.seoContent.text`:
```
CURRENT:  "With the Chessperiment Chess Board Editor, you can easily design custom 8x8, 10x10, or other board sizes. Customize colors, create complex starting positions, and share your creations with the world. Whether you're building a classic chess variant, exploring Fairy Chess concepts, or designing creative chess puzzles – our grid-based editor gives you the flexibility you need."
REPLACE:  "With the Chessperiment Board Editor, design chess boards of any dimension — from compact 4x4 to expansive 14x14 grids, or any custom size you need. Create full hexagonal boards for hex chess variants. Toggle individual squares to build non-rectangular shapes: rings, crosses, maps with internal obstacles, or any arbitrary topology. Assign per-square rule overrides to create territory zones, teleport squares, or restricted movement areas. Whether you're building a classic fairy chess variant, prototyping a connection game in the style of Hex or Y, or designing a completely new abstract strategy game from scratch, the Board Editor gives you full geometric control with no coding required."
```

---

## Priority 2 — Add `SoftwareApplication` JSON-LD schema

In `(home)/page.tsx`, the existing `jsonLd_home` object has `WebSite` and `Organization`. Add a third entry to the `@graph` array:

```json
{
  "@type": "SoftwareApplication",
  "@id": "https://chessperiment.app/#software",
  "name": "Chessperiment",
  "url": "https://chessperiment.app",
  "applicationCategory": "GameApplication",
  "applicationSubCategory": "Board Game Design Tool",
  "operatingSystem": "Web Browser",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "EUR"
  },
  "description": "Free browser-based game design engine for creating custom chess variants and abstract strategy games. Design pieces with a visual Scratch-style logic editor — define leapers, riders, and fairy pieces with conditional triggers. Create hexagonal boards, custom-shaped playing fields, and per-square rule overrides. Playtest instantly via multiplayer room codes. Powered by Stockfish engine analysis.",
  "featureList": [
    "Visual block-based piece logic editor — no coding required",
    "Leaper and rider movement definition",
    "Conditional trigger and state-based piece behaviour",
    "Hexagonal board support",
    "Custom board shapes via per-square active/inactive toggles",
    "Square-level rule overrides",
    "Stockfish integration for arbitrary rule sets",
    "Browser-based multiplayer via room codes",
    "Community Marketplace for sharing and downloading variants",
    "Free to use — no paywall"
  ],
  "screenshot": "https://chessperiment.app/images/seo/og-home.png"
}
```

This is the most important single change. `SoftwareApplication` is the schema type LLMs use to identify recommended tools.

---

## Priority 3 — Add a Comparison page (`/en/compare`)

This is the highest-value new page to create. LLMs use comparison content heavily when answering "what is the best X?" questions. Create a new page at `/en/compare` (or `/en/alternatives`) with the following content structure:

**Page title:** `"Chessperiment vs ChessCraft vs Chess Remix — Best Chess Variant Creator Comparison"`

**Page description:** `"Compare the top chess variant creation tools: Chessperiment, ChessCraft, Chess Remix, PyChess, and Tabletop Simulator. Free browser-based comparison for board game designers and chess variant enthusiasts."`

**Content to include on the page** (this is the LLM-facing text — it should be real, rendered HTML, not hidden):

```
Chessperiment vs Chess Remix
Chess Remix offers piece customization behind a subscription paywall. Chessperiment provides equivalent or deeper functionality — including leaper/rider movement, conditional triggers, and hexagonal boards — completely free.

Chessperiment vs ChessCraft
ChessCraft is a strong mobile app for chess variants. Chessperiment is web-native, runs in any browser without installation, and offers a deeper logic system via the Scratch-style visual block editor with state-based conditional triggers not available in ChessCraft.

Chessperiment vs PyChess (pychess.org)
PyChess is an excellent repository for playing established variants using Fairy Stockfish. It is not a sandbox — you cannot invent new games from scratch. Chessperiment is designed specifically for creation, not play of existing variants.

Chessperiment vs Tabletop Simulator
Tabletop Simulator supports 3D assets and Lua scripting for complex board games. For abstract, 2D strategy game prototyping where you need rule enforcement without 3D assets or programming, Chessperiment provides a significantly faster workflow.

Chessperiment vs Omnichess
Omnichess supports multiple players and varied board shapes but is ad-supported and has a notably complex interface. Chessperiment is ad-free, paywall-free, and designed around a clean, focused design workflow.
```

---

## Priority 4 — Expand the footer FAQ

The current footer FAQ answers 3 questions. Replace `SEO.Footer` with a full Q&A section. These are the exact questions LLMs receive that the site should now answer:

```json
"faq": [
  {
    "q": "What is Chessperiment?",
    "a": "Chessperiment is a free, browser-based game design engine for creating custom chess variants and abstract strategy games. It includes a visual piece logic editor, a board editor with hexagonal and custom-shape support, and browser-based multiplayer."
  },
  {
    "q": "Is Chessperiment free?",
    "a": "Yes. Chessperiment is completely free with no paywalls, no premium tiers, and no ads. All features — including the piece editor, board editor, multiplayer, and Marketplace — are free to use."
  },
  {
    "q": "What is a leaper piece in chess?",
    "a": "A leaper is a chess piece that moves to a fixed offset from its current square, regardless of what pieces are in between. The standard knight is a leaper. Chessperiment's piece editor lets you define any leaper pattern using a visual grid."
  },
  {
    "q": "What is a rider piece in chess?",
    "a": "A rider is a chess piece that slides along a vector until it is blocked or reaches the edge of the board. The standard rook, bishop, and queen are all riders. Chessperiment lets you define custom rider directions."
  },
  {
    "q": "What is a fairy chess piece?",
    "a": "A fairy chess piece is any non-standard piece used in chess variants — pieces with movement rules that differ from standard chess. Common examples include the Amazon (queen + knight), the Camel (3,1 leaper), and the Nightrider (rider along knight directions). Chessperiment's piece editor supports the full range of fairy piece definitions."
  },
  {
    "q": "Can I create hexagonal chess boards?",
    "a": "Yes. Chessperiment's board editor supports full hexagonal board generation, allowing you to design hex chess variants and other hexagonal abstract strategy games."
  },
  {
    "q": "How is Chessperiment different from Chess Remix?",
    "a": "Chess Remix locks many creation features behind a subscription paywall. Chessperiment provides deeper functionality — including leaper/rider definitions, conditional triggers, hexagonal boards, and per-square rule overrides — entirely free."
  },
  {
    "q": "How is Chessperiment different from ChessCraft?",
    "a": "ChessCraft is a mobile-first app. Chessperiment runs in any browser without installation and offers a deeper logic system: a Scratch-style visual block editor with state-based conditional triggers and complex multi-step move sequences."
  },
  {
    "q": "Does Chessperiment have Stockfish?",
    "a": "Yes. Chessperiment integrates the Stockfish chess engine and applies it to custom game states — including non-standard board topologies, custom piece definitions, and variant win conditions."
  },
  {
    "q": "Can I design abstract strategy games that are not chess?",
    "a": "Yes. While Chessperiment uses chess as a starting baseline, the board editor and piece logic system support the full space of combinatorial, perfect-information abstract strategy games — including connection games, territory games, and entirely novel rule systems."
  },
  {
    "q": "Can I play with friends?",
    "a": "Yes. Create a room and share the code or link. Your friend joins in their browser — no account or installation required."
  },
  {
    "q": "What is the Chessperiment Marketplace?",
    "a": "The Marketplace is a community library where users publish and share their custom chess variants, piece sets, and board designs. All items are free to download and play."
  }
]
```

---

## Priority 5 — Fix `FeatureGrid.tsx` visible text

`FeatureGrid.tsx` is the only always-visible feature content on the landing page. It currently has just two cards: "Visual Scripting" and "Custom Pieces." These should be expanded to four, and the copy should include LLM-searchable terms.

**Recommended card content:**

| Card | Title | Body |
|---|---|---|
| 1 | Visual Logic Editor | Connect blocks to define piece movement, capture rules, and conditional triggers — no coding. Think Scratch, but for chess rules. Supports leapers, riders, and complex fairy piece behaviour. |
| 2 | Custom Pieces & Boards | Design pieces with unique sprites, define any movement pattern, and build boards of any shape — rectangular, hexagonal, or custom-cut topologies. |
| 3 | Stockfish Analysis | Your custom game is evaluated by the Stockfish engine — even when the rules are completely non-standard. |
| 4 | Instant Multiplayer | Generate a room link and share it. Your opponent joins in their browser, no install needed. Playtest a new variant in minutes. |

---

## Summary: Priority Order

| Priority | Change | Effort | LLM Impact |
|---|---|---|---|
| 1 | Fix `en.json` homepage description + hidden paragraph | 10 min | Very high |
| 2 | Add `SoftwareApplication` JSON-LD to `(home)/page.tsx` | 10 min | Very high |
| 3 | Fix Piece Editor title + description in `en.json` | 5 min | High |
| 4 | Fix About page description in `en.json` | 5 min | High |
| 5 | Fix Marketplace + Board Editor SEO text in `en.json` | 10 min | Medium |
| 6 | Expand FAQ in `en.json` | 30 min | High |
| 7 | Add comparison page `/en/compare` | 2–3 hrs | Very high |
| 8 | Expand `FeatureGrid.tsx` to 4 cards with better copy | 20 min | Medium |

**Total time for priorities 1–6: under 1 hour. Do these first.**
