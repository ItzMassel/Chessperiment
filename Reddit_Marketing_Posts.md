# Chessperiment — Reddit Marketing Posts
*Copy-paste ready posts for each subreddit. Read the "Strategy Note" for each before posting.*

---

## Subreddit Selection & Rationale

| # | Subreddit | Members | Why |
|---|-----------|---------|-----|
| 1 | r/chessvariants | ~9.6k | Core audience — variant enthusiasts who speak the language |
| 2 | r/chess | ~750k | Massive reach — appeal to the "what if?" crowd |
| 3 | r/boardgamedesign | ~29k | Designers who need a prototyping tool |
| 4 | r/tabletopgamedesign | ~50k | Tabletop prototypers — position as TTS alternative |
| 5 | r/boardgames | ~3M | Broad audience — community creativity angle |
| 6 | r/gamedev | ~2M | Tech-savvy — lead with the generalized rule engine |
| 7 | r/solodev | ~100k | Personal story — 13-year-old solo dev will blow up here |
| 8 | r/gamedesign | ~273k | Design philosophy crowd — infinite rule space angle |
| 9 | r/abstractgames | ~15k | Niche but perfect — abstract strategy designers |
| 10 | r/IndieGaming | ~250k | Visual showcase — GIF-heavy works great |

---

---

# POST 1 — r/chessvariants

**📌 Strategy Note:**
This community uses chess variant terminology fluently. They know what leapers, riders, fairy pieces, and promotion are. Don't dumb it down. Be specific. Show them exactly what the tool can do technically. They will respect precision. Posting a screenshot of the piece logic editor or a hexagonal board will go a long way.

**📸 Screenshot to include:** The Piece Editor showing a leaper/rider movement logic block for a custom piece, OR a hexagonal board mid-game with custom pieces.

---

**Title:**
> made a browser-based sandbox for building chess variants — leapers, riders, conditional triggers, hex boards, all free

**Body:**
> been working on this for a while and figured this was the right place to share it.
>
> it's called Chessperiment (chessperiment.app). the short version is you can define piece movement with a visual block editor — leapers and riders are both supported natively, and you can set up conditional logic like "this capture only works if the piece hasn't moved yet" or "after this happens, transform into X." pretty much anything you'd want for fairy pieces.
>
> the board editor lets you resize to any dimensions, toggle individual squares off to make weird shapes (rings, crosses, maps with chokepoints), and there's full hex support too. each square can also have its own rules, which opens up things like fractal chess if anyone wants to try that.
>
> stockfish integration is live — it evaluates custom positions even when en passant and win conditions are totally different. getting it to work with malleable rules was honestly painful but it works. still some lag on complex move trees.
>
> you can generate a room code and playtest with someone instantly. there's also a shared library where people have been uploading their creations.
>
> it's completely free, browser-based, no account needed to mess around.
>
> curious if anyone here runs into edge cases with how the movement logic is being interpreted — that's the area i'm most interested in feedback on.
>
> chessperiment.app

---

---

# POST 2 — r/chess

**📌 Strategy Note:**
r/chess is NOT primarily a variants community — it's mostly classical chess players. Don't lead with "chess variants." Lead with curiosity and the "what if" angle. Make it feel like a fun experiment rather than an alternative platform. Keep it light, visual, and non-threatening to the classical chess crowd. Do NOT criticize Chess.com or Lichess. The personal story (solo dev) humanizes it.

**📸 Screenshot to include:** Something visually surprising — like a hexagonal chess board with recognizable pieces, or a wild custom variant mid-game. Something that makes people say "wait, what is that?"

---

**Title:**
> I made a site where you can break any chess rule you want — here's some of the stuff people have built

**Body:**
> what if pawns could move backwards on their third turn? what if the board was hexagonal? what if your knight also had the option to just... teleport?
>
> i've been building Chessperiment (chessperiment.app) — basically a sandbox where you design your own pieces with a visual logic editor and then actually play with them. you can reshape the board however you want too, or just use a standard 8x8 and go wild with the pieces.
>
> people have been uploading stuff to the shared library and some of it is genuinely interesting to play. a lot of it is also completely unbalanced chaos, which is half the fun.
>
> no install, no account needed. if you build something you like, drop it in the comments — i'd love to see what people come up with.
>
> chessperiment.app

---

---

# POST 3 — r/boardgamedesign

**📌 Strategy Note:**
This community cares about the design process — not just the end product. They want to know HOW it helps them design better. Lead with the workflow: idea → build → playtest → iterate. Position Chessperiment as the missing tool between "napkin sketch" and "full Tabletop Simulator mod." Be self-aware that you're sharing your own project — acknowledge it up front and invite genuine feedback. This community respects that.

**📸 Screenshot to include:** The full editing UI showing board + piece editor side by side. Show the "Project" bundling view — designers love seeing organized workflows.

---

**Title:**
> built a free browser tool for prototyping abstract strategy games — design pieces with visual logic blocks and playtest immediately, no setup

**Body:**
> sharing my own project so obviously biased, but i think it's actually useful for people here and wanted to get some real feedback.
>
> the problem i kept running into with abstract strategy prototyping is there's this massive gap between "idea on paper" and "thing you can actually play." tabletop simulator is great but you need 3D assets and scripting just to enforce the rules. physical prototypes mean post-it notes and the honor system. i wanted something in between.
>
> so i built Chessperiment (chessperiment.app). it's a web-based sandbox where you design the board (any shape, any size, hex boards, custom topologies), define your pieces using a visual block logic system — movement patterns, capture conditions, state triggers, all without code — and then generate a room link so you can immediately playtest with someone in the browser.
>
> the rule engine actually enforces everything during play. no manually tracking "wait, can this piece do that?" everything is bundled into a single project you can share.
>
> there's also a marketplace now where people are publishing their designs.
>
> it's completely free.
>
> genuinely curious what's missing from your current prototyping workflow — that's the feedback i find most useful.
>
> chessperiment.app

---

---

# POST 4 — r/tabletopgamedesign

**📌 Strategy Note:**
Similar to r/boardgamedesign but slightly more RPG-adjacent. This crowd values playtesting and iteration. Position Chessperiment as a "Tabletop Simulator but 2D, rule-enforced, and zero coding required." Emphasize how fast you can go from idea to playtest. Mention the room code multiplayer explicitly.

**📸 Screenshot to include:** A multiplayer game in progress, showing two players in a live session with a custom board. If you can capture a GIF of a piece moving according to custom logic, even better.

---

**Title:**
> free tool for playtesting abstract strategy rules in the browser — rules get enforced automatically, no honor system

**Body:**
> if you've ever given up on a playtest because getting the rules working was more effort than it was worth, this might help.
>
> i built Chessperiment (chessperiment.app) — it's a 2D sandbox where you design your own board and pieces, and then actually play the game with someone via a room link. the whole thing runs in the browser, no install.
>
> the thing that makes it different from just drawing a board on paper or using TTS: the rule engine enforces your logic during play. you define what each piece can do using a visual block editor, and when you're playing, only legal moves are allowed. so you're actually testing the rules, not testing whether you and your opponent remember them correctly.
>
> design the board → define the pieces → share a link → play. the whole cycle can be under 10 minutes for a simple game.
>
> i know TTS gets recommended a lot around here and it's great for complex stuff — but if you just need to test whether a set of abstract rules is any fun, this gets you there much faster.
>
> it's free. would love to know if there's anything that would make this more useful for tabletop designers specifically.
>
> chessperiment.app

---

---

# POST 5 — r/boardgames

**📌 Strategy Note:**
This is the biggest and most general community. Don't go technical. Lead with the fun and creativity. The marketplace angle works really well here — show that a community of people is already inventing wild games. Curiosity and novelty drive upvotes here. Keep it punchy, not corporate.

**📸 Screenshot to include:** The Library/Marketplace showing a grid of community-created games with varied, interesting-looking boards. The visual diversity of what people have made is the hook.

---

**Title:**
> I made a site where anyone can invent their own board game and share it — people have been coming up with some pretty weird stuff

**Body:**
> started as a personal project and somehow turned into an actual thing with users, so figured i'd share it here.
>
> Chessperiment (chessperiment.app) is a free browser-based sandbox where you design a board (any shape, hex, custom-cut, whatever), design your own pieces using a visual logic editor, and then play with anyone via a room link.
>
> no install, no account needed to browse, no paywall.
>
> the shared library has a few hundred games at this point, and the variety is kind of wild — some are chess with a single weird twist, some are completely different games that just happen to use a grid. a lot of it is broken and unbalanced, but that's kind of the point.
>
> if you've ever had a "what if chess had [X]" idea, this is where you can find out if it's actually fun to play.
>
> chessperiment.app

---

---

# POST 6 — r/gamedev

**📌 Strategy Note:**
This is a tech-first community. They respect the difficulty of what you've built. Lead with the hardest technical problem — the generalized rule engine and the Stockfish integration. This is NOT the place to talk about features; it's the place to talk about engineering decisions. The 13-year-old solo dev angle will work here but shouldn't be the headline — let the tech speak first, then mention it as context.

**📸 Screenshot to include:** None strictly required — r/gamedev text posts with solid technical content perform well. If anything, a diagram of the move validation logic flow would be impressive.

---

**Title:**
> built a generalized chess rule engine where users define piece logic at runtime — here's what makes it hard

**Body:**
> been working on Chessperiment (chessperiment.app) — a sandbox where users build custom chess-like games with a visual piece editor — and the interesting part technically is the move validation engine.
>
> in a normal chess engine, validation is fast because the rules are fixed. you hardcode the knight's L-shape, the bishop's diagonal, done. in a system where users define their own pieces, you can't hardcode anything. every move requires dynamic evaluation of a user-defined logic tree: is the target square active? does the movement path match the leaper/rider definition? are the conditional requirements met (first-move only, prior-capture conditions, square-specific overrides, etc.)?
>
> this gets expensive fast. it's manageable for a single move, but stockfish needs to evaluate all legal moves for every position — so now you're running the full tree evaluation for every piece, every candidate square, every ply. complex piece logic tanks performance noticeably.
>
> the other fun problem: making stockfish work with arbitrary rules. the engine assumes fixed win conditions, standard capture semantics, known piece types. we're wrapping it in a translation layer that re-encodes the custom game state into something evaluable — which breaks in interesting ways whenever someone does something like redefine how promotion works or change the turn structure.
>
> still haven't fully solved the lag on complex evaluations. if anyone's dealt with something similar in a generalized rule system i'd genuinely like to hear how you approached it.
>
> for context: i'm 13 and built this solo. it's at about 80 daily active users now. the community has been pretty patient with the rough edges.
>
> chessperiment.app

---

---

# POST 7 — r/solodev

**📌 Strategy Note:**
This is where the personal story should lead. r/solodev LOVES authentic "I built this alone" posts, especially from young developers. Be honest about the struggles — the bugs, the rebrand, the technical challenges. Don't oversell. The community will celebrate the journey. Mention the user numbers as a milestone, not as a brag. Ask for advice — this community is generous with feedback.

**📸 Screenshot to include:** A "before and after" if possible — old Chesspie vs new Chessperiment branding. OR a screenshot that shows the scope of the project (all three editors open, the marketplace, etc).

---

**Title:**
> 13 years old, built a chess variant engine solo, rebranded once, currently at 80 daily users — here's what the past year looked like

**Body:**
> started this in late 2025 as an experiment. the idea was simple: what if chess rules were fully modular and you could swap any of them out? i called it Chesspie. it was buggy, barely worked, and basically only i used it.
>
> a few months later i fixed the core issues — login was broken, set creation was broken, the basics — rebranded to Chessperiment (chessperiment.app), and put it out again. within a few weeks it was at 200 weekly users. now it's holding around 80 daily actives.
>
> what i built is a game design engine where you can create completely custom chess-like games from scratch. custom boards (any shape, hex, whatever topology you want), pieces defined with a visual Scratch-style logic editor, multiplayer via room links, and a shared marketplace for community creations.
>
> the hardest problems:
> - generalized move validation. can't hardcode anything when the rules are user-defined, so every move evaluates a whole logic tree. gets slow with complex pieces.
> - stockfish integration. making the engine evaluate positions when win conditions and capture rules are malleable is genuinely messy. still not perfect.
> - performance in general. complex logic is expensive and i'm still working on it.
>
> the thing i didn't expect: being open about being a 13-year-old solo dev actually made people nicer about the bugs. early users felt like they were building something with me instead of just using a product. i think that helped a lot in the early days.
>
> next up is properly launching the marketplace and figuring out how to grow past the early adopter crowd.
>
> if you've hit this kind of inflection point with a solo project — going from engaged early users to something more mainstream — i'd genuinely love to know what worked for you.
>
> chessperiment.app

---

---

# POST 8 — r/gamedesign

**📌 Strategy Note:**
r/gamedesign is conceptually focused — they talk about mechanics, design philosophy, player psychology. Don't pitch the tool directly. Frame it as a design question or exploration first, and introduce the tool as the context. "Here's what I've been learning about designing rule systems when any rule is possible." This community respects intellectual depth.

**📸 Screenshot to include:** The Piece Editor's logic block system — it visually represents "rules as design elements" which is exactly what this community will find interesting.

---

**Title:**
> what happens to game design when any rule is possible? observations from building a rule sandbox and watching what people create

**Body:**
> i've been building Chessperiment (chessperiment.app), a sandbox where people design custom chess-like games using a visual logic editor, and one of the most interesting things has been watching what actually happens when you give designers complete rule freedom.
>
> the assumption going in was that removing constraints would produce better, more creative games. mostly what it produces first is chaos. people keep adding abilities and conditions to fix balance problems that would be better solved by taking something away. the complexity compounds until the game works technically but nobody can hold the rules in their head while playing.
>
> a few patterns i've noticed watching the community:
>
> learnability is the first thing to go. chess works partly because you can look at the board and intuitively read the threats. once you have pieces with conditional triggers and state-dependent movement, that legibility breaks down fast. the game becomes correct but opaque.
>
> symmetry does a lot of work. games where both sides have identical pieces are immediately trusted as fair, even before anyone fully understands the rules. asymmetric games require much more explanation before people will commit to learning them.
>
> win conditions always get bolted on last. almost every community-made game has a weak endgame because people design the interesting movement rules first and then scramble to add a goal. the goal ends up being an afterthought rather than the thing the whole game is built around.
>
> i built the sandbox to give people a creative tool, but it's accidentally become a kind of observatory for what new designers do with unlimited power. it's been one of the more interesting design education experiences i've had.
>
> curious if any of this matches what others have seen when giving non-designers free rein over rules.
>
> chessperiment.app

---

---

# POST 9 — r/abstractgames

**📌 Strategy Note:**
Small but highly relevant community. These are people who love abstract strategy games — Go, Chess, Hex, Havannah, etc. They are intellectually rigorous and will appreciate the depth of the tool. Lead with what the tool enables specifically for abstract game design. Mention specific abstract game concepts (perfect information, no luck, combinatorial). This community will become loyal power users if you get them.

**📸 Screenshot to include:** A non-chess variant that looks like a proper abstract strategy game — a hex board with elegant, minimal pieces. Show that the output can look "serious."

---

**Title:**
> built a free browser tool for designing and playtesting abstract strategy games — hex boards, enforced rules, custom piece logic, no coding

**Body:**
> i think this community is probably the most relevant audience for what i've built, so wanted to share it here.
>
> Chessperiment (chessperiment.app) is a browser-based sandbox for designing abstract, turn-based games from scratch. it started as a chess variant tool but the goal was always the broader combinatorial game space — perfect information, no luck elements, that kind of thing.
>
> the board editor supports arbitrary grid sizes, hexagonal boards, and per-square active/inactive toggles so you can make non-rectangular shapes. each individual square can also carry its own rule overrides, which is useful for territory zones or connection-based conditions.
>
> pieces are defined with a visual block logic editor — leapers and riders are first-class, and you can set up conditional rules like capture restrictions, state triggers, or turn structure modifications. the rule engine enforces all of this during play, so you're actually testing the game rather than the players' memory of the rules.
>
> the area i'm most uncertain about is connection-family games (Hex, Y, TwixT-style) and territory games. those have fundamentally different win condition structures from capture games, and i'm actively working on making that work well. right now it's possible but rough.
>
> it's entirely free. would be curious whether anyone here tries it for anything non-chess and whether the toolset holds up.
>
> chessperiment.app

---

---

# POST 10 — r/IndieGaming

**📌 Strategy Note:**
This is a visual community. GIFs and screenshots are king. The post NEEDS a visual. Show the most impressive-looking thing — either a wild custom board/piece design, or ideally a GIF of the piece editor in action (watching logic blocks control a piece's movement is genuinely impressive). Keep the text short and punchy. This community shares things that look cool.

**📸 / 🎬 GIF required:** Record a short GIF showing: (1) opening the piece editor and adding movement logic to a custom piece, then (2) going to the board and that piece moving according to the logic you just defined. 15-30 seconds max. This is the make-or-break for this subreddit.

---

**Title:**
> I made a browser game where you design chess pieces with logic blocks and then actually play with them [GIF]

**Body:**
> made this mostly for myself but people seem to want it, so here it is.
>
> it's called Chessperiment — you build pieces using a visual block editor (movement patterns, capture rules, conditional triggers), design whatever board shape you want, and then play online with someone via a room link. the whole thing is in the browser, free, no install.
>
> there's a shared library where the community posts their creations. some of it is wild.
>
> chessperiment.app

*(Post the GIF as a top-level comment right after — "piece editor in action: [gif]")*

---

---

# 🗓️ Posting Schedule & Notes

## Order of Operations
Post in this order to build momentum. Start with the smaller, highly engaged communities first (they're more likely to give genuine feedback that you can reference in later posts):

1. **Week 1:** r/chessvariants, r/abstractgames, r/solodev
2. **Week 2:** r/boardgamedesign, r/tabletopgamedesign, r/gamedesign
3. **Week 3:** r/gamedev, r/IndieGaming
4. **Week 4:** r/chess, r/boardgames *(biggest audiences — save for when you've refined your pitch based on earlier feedback)*

## General Rules
- **Don't post all at once.** Reddit's spam filters will flag it, and the community notices.
- **Reply to every comment**, especially in the first hour. Engagement in the comments signals quality to the algorithm.
- **Don't delete and repost** if a post underperforms. Just move on.
- **Vary your account activity.** If your account only posts Chessperiment links, it looks like spam. Comment on other people's posts in between.

## Screenshots to Prepare Before Posting
| Asset | Used in |
|-------|---------|
| Piece Editor with leaper/rider logic visible | r/chessvariants, r/boardgamedesign, r/gamedesign |
| Hexagonal board mid-game | r/chess, r/abstractgames |
| Marketplace/Library overview | r/boardgames |
| Full UI (board + piece editor side by side) | r/boardgamedesign, r/tabletopgamedesign |
| GIF: Piece editor → piece moving on board | r/IndieGaming *(required)* |
| Solo dev "scope" screenshot | r/solodev, r/gamedev |
