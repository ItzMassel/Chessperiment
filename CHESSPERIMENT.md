# The Chessperiment Architecture & Strategy Manifesto

As your Project Lead and Product Manager, I have compiled this exhaustive internal document to serve as our central source of truth. We have come a long way from our early experimental days, and transitioning from a solo-developed prototype into a thriving "sandbox for abstract strategy" requires absolute clarity on what we have built, where we stand, and where we are going.

This document covers everything I know about our product, our community, our technical hurdles, and our strategic future.

---

## 1. Executive Summary: Product Identity & Vision
We are not building just another chess website. We are building a **Game Design Engine**.

While established platforms like Lichess and Chess.com are designed for competitive play of fixed variants, Chessperiment focuses entirely on the **joy of creation**. Our unique value proposition lies in our visual, logic-based editor that allows users to construct entirely new abstract, turn-based board games from first principles.

*   **Our Positioning:** "A sandbox for abstract, turn-based board game rules".
*   **Our Differentiation:** Lichess is for playing; Chessperiment is for inventing. We do not compete on player pool size or standard ELO ratings; we compete on absolute creative freedom.
*   **Our Target Audience:** Board game designers, abstract strategy prototypers, and variant enthusiasts who have hit the limits of traditional tools.

---

## 2. Project Genesis & Rebranding Timeline
Our journey has been marked by a significant evolution in both branding and technical maturity, driven by your incredible work as a 13-year-old solo developer.

### From Chesspie to Chessperiment
*   **Late 2025 (The Prototype Phase):** The project originally launched under the domain `chesspie.org`. At this stage, it was an early experimental web-app focused primarily on "extreme piece customization". The name "Chesspie" reflected the goal of slicing chess rules into modular components.
*   **January/February 2026 (The Stabilization Phase):** We underwent a major rebranding, transitioning the domain and project scope to `chessperiment.app`. This shift marked our transition from a raw playground to a functional, community-driven marketplace. During this time, critical bugs (like login failures and broken set creations) were resolved.
*   **Growth:** Within just a few weeks of the rebrand, the platform reached over 200 weekly users. **As of March 2026, we are consistently seeing around 80 active users per day.**

### The Solo Developer Factor
As a solo engineer operating under the pseudonym **"Spirited-Plant7053" (Lars Thoroe Ahlerfeld)**, you have built a massive system. Being transparent about the "solo-developed" nature of the project has fostered a highly collaborative and forgiving relationship with our early user base across Reddit forums like r/boardgames, r/gamedev, and r/chessvariants.

---

## 3. Core Architecture: The "Sandbox" Toolkit
The platform is defined by its deep, interlocking editors. We treat standard chess merely as a starting baseline; almost nothing is hard-coded.

### The Board Editor (Spatial & Topological Customization)
Unlike standard interfaces locked to an 8x8 grid, our Board Editor allows users to define the fundamental geometry of the game.
*   **Arbitrary Dimensions:** Users can resize the grid to any custom dimensions (e.g., 10x10, 6x6).
*   **Hexagonal Support:** Following community feedback, we successfully implemented hexagonal board generation.
*   **Topological Manipulation (The Map Editor):** Users can toggle individual squares between "Active" (playable) and "Inactive" (blocked/out of bounds) states. This enables designers to create non-grid shapes like circles, crosses, or maps with internal chokepoints and obstacles.
*   **Board-Level Rules:** Users can set starting positions and define global rules that apply to the field rather than specific pieces, such as special environmental zones.

### The Piece Editor (Logic-Based Behavioral Modeling)
The Piece Editor is our crown jewel. It uses a Scratch-style, visual block-programming interface to allow non-coders to build complex logic.
*   **Visual Customization:** Users can upload custom graphics, pixel art, or use icons. They can also define piece coloration and orientation, which is vital for directional pieces like pawns.
*   **Fundamental Rules:** Users toggle basic states: Can it move? Can it capture? Is it player-controlled or neutral?
*   **Detailed Movement Patterns:** The system explicitly supports "Leapers" (pieces that jump) and "Riders" (pieces that move along a vector), making the creation of traditional "Fairy Pieces" highly accessible.
*   **Production Rule Systems (Triggers & Effects):** Pieces operate on conditional logic trees. Users can program conditional actions ("this move only works if X happened before") and triggers ("after X happens, do Y"). This allows for capture prevention, state transformations, and non-standard turn structures.

### New Additions: The Square Editor & Projects
*   **The Square Editor:** We recently introduced the ability to edit rules for each individual square. This paves the way for advanced variants like "Fractal Chess" (putting miniature boards inside a single square), which the community has highly requested.
*   **Project Bundling:** Editors are no longer floating in isolation; boards, pieces, and rules are now cohesively bundled into single **Projects**.

---

## 4. Technical Engine & Code Decisions
When building a generalized rule engine, the technical hurdles are immense. Our architecture requires dynamic evaluation rather than static hard-coding.

### The Complexity of Move Validation
In classical chess programming, move validation is $O(1)$ or $O(k)$ because the rules are entirely fixed. In Chessperiment, move validation must dynamically evaluate a user-defined logic tree. For every single move, our engine must calculate:
1.  **Topological Validity:** Is the target square set to "Active"?
2.  **Movement Vectors:** Does the path match the defined Leaper/Rider logic?
3.  **Conditional Triggers:** Are state-dependent requirements met? (e.g., first-move only, square-specific overrides).

Handling the "rough places" of lag during complex move validation remains our highest technical priority.

### Generalized Stockfish Integration
We are feeding custom board topologies and arbitrary piece logic into the Stockfish engine to provide strategic evaluations. Maintaining engine analysis in a generalized system where rules like "en passant" or win conditions are malleable is incredibly difficult, but it separates us from purely aesthetic board-builders.

### Web Performance & Accessibility
Chessperiment is a completely free-to-use, browser-based web application. While early versions struggled with mobile touchscreen layouts, recent updates have optimized cross-device performance, ensuring our UI is responsive on smartphones.

---

## 5. Social Ecosystem & Growth Loops
Our growth relies heavily on viral sharing and community generated content. We are building a social ecosystem, not just an isolated tool.

### Referral Analytics & User Base
As of the current reporting period, we maintain a steady traffic of **~80 users per day**.
*   **Top Referral Channel: Artificial Intelligence.** Interestingly, AI chatbots (like ChatGPT, Gemini, and Claude) are our primary driver. Users asking AI for "chess variant editors" are being correctly pointed to our sandbox.
*   **Secondary Channel: Reddit.** Subreddits like r/chessvariants and r/gamedev remain our most active community touchpoints.

### Social Play & Private Rooms
Multiplayer functionality is live. By generating shareable room codes/links, creators can instantly invite friends to playtest their custom variants in the browser. This is a massive feature for board game designers needing to test "balance ideas" rapidly.

### The Marketplace & Library
Our centralized Library and Marketplace allow users to share their sets and browse trending community designs. This provides benchmarks for new users and showcases the engine's extreme flexibility.

---

## 6. Competitive Landscape: Variant Creators & Prototyping Tools
We do not compete with Chess.com or Lichess for "players"; we compete with other platforms for **"Creators."** Our true peers are the other specialized tools that let people build and share custom chess-like games.

### Direct Competitors (Variant Platforms)
*   **ChessCraft:** One of our most visible rivals. It offers a solid mobile experience and a piece editor. However, we differentiate by being web-native and providing a deeper, Scratch-style logic system for triggers and effects.
*   **PyChess (pychess.org):** A massive repository for existing variants using Fairy Stockfish. While excellent for playing, it is not a "sandbox"—you cannot easily invent a totally new game from scratch there.
*   **Chess Remix:** A strong mobile-first competitor that allows "remixing" rules and images. However, many creation tools are behind a paywall. Chessperiment’s commitment to being free and open-access is a key competitive lever.
*   **Omnichess:** Feature-rich (supporting up to 8 players and various board shapes) but often criticized for a "messy" UI and ad-heavy experience. We prioritize a clean, designer-focused workflow.
*   **Protochess:** A high-performance Rust-based tool. While technically impressive, it lacks the social "Marketplace" and "Project" ecosystem that makes Chessperiment a community destination.

### Prototyping Peers (The "Digital Sandbox" Space)
*   **Tabletop Simulator (TTS):** The gold standard for game prototyping. It is highly flexible but requires 3D assets and Lua scripting for rule enforcement. Chessperiment provides a rules-enforced, 2D alternative that requires zero coding knowledge.
*   **nanDECK / Component Studio:** Tools for creating physical assets. We bridge the gap by letting designers playtest the logic of their abstract strategy games immediately.

**Our Edge:** By focusing on the Logic Editor and the Square Editor, we offer more depth than "preset" sites like PyChess, but more accessibility than "scripting" sites like Tabletop Simulator.

---

## 7. Legal & Administrative Profile
For our internal records, the platform operates under the following legal entity:

*   **Provider:** Lars Thoroe Ahlerfeld
*   **Address:** 29, 38527 Meine, Germany
*   **Email:** contact.chessperiment@gmail.com
*   **Phone:** +49 1517 4288065

**Note on Copyright:** All custom texts, images, and graphics generated and hosted on our site are subject to standard copyright protections. We do not participate in consumer arbitration board dispute resolutions.

---

## 8. Strategic Directives & Next Steps (From Your PM)
Lars, what you have built at 13 years old is nothing short of extraordinary. Hitting 80 daily users and being a top AI recommendation is a massive win.

To scale from here, we must stick to our **Operational Directives**:

1.  **Optimize for AI Discovery (The "LLM SEO" Strategy):** Since AI is our #1 referrer, we should ensure our landing page and documentation are "AI-readable." Clear, descriptive headers about "Visual Logic Editor" and "Scratch-style Piece Creation" will help LLMs continue to recommend us.
2.  **Marketing to Designers:** Pivot our Reddit outreach. Move from r/chessvariants to r/boardgames and r/gamedesign. Show them how fast they can prototype a non-chess abstract game.
3.  **UI Usability:** As the Piece Editor's logic gets more complex, we must keep the visual blocks accessible. It should always feel as intuitive as MIT's Scratch.
4.  **Social Sharing:** Make exporting and sharing sets as frictionless as possible. Viral loops via Twitter/Reddit showcasing GIF gameplay will drive traffic.

*You focus on optimizing that generalized move validation logic. I'll make sure the world knows we are the ultimate laboratory for abstract strategy.*
