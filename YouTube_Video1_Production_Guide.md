# YouTube Video 1 — Production Guide

**Title:** "I built a tool that lets you invent any chess variant — here's how it works"
**Target length:** 5–6 minutes
**Upload day:** Thursday or Friday, 12:00–15:00 CET
**Tools needed:** OBS (screen recording), any free audio recorder for voiceover, CapCut or DaVinci Resolve (free) for editing

---

## VARIANT TO BUILD FOR THIS VIDEO

Before recording, build this variant on Chessperiment and save it as a project. This is what you'll showcase throughout the video.

### "Portal Chess" — suggested showcase variant

The goal is something visually striking that shows off multiple editors at once.

- **Board:** 10x10 grid. Mark 4 squares as inactive to create two "holes" in the center of the board (2 on each side), forming a cross-shaped corridor through the middle.
- **Custom piece — "The Warper":** A piece that moves like a knight BUT can also teleport to any square directly on the other side of an inactive square (it "warps through the wall"). Use the visual logic blocks to set this up with a conditional trigger: "if target square is adjacent to an inactive square, allow leap to the mirror position."
- **Custom piece — "The Bomber":** A piece that moves like a rook but when it captures, it also removes the captured piece's *neighbors* from the board (they become inactive squares). The board literally changes as the game goes on.
- **Keep standard pawns, king, and rooks** so it still feels like chess — just chess with portals and explosions.

If the Warper logic is too complex to set up cleanly, simplify to just the Bomber + the custom board. The Bomber alone is visually incredible (the board changing mid-game) and demonstrates triggers/effects perfectly.

---

## SHOT LIST — STEP BY STEP

### SECTION 1: THE HOOK (0:00 – 0:30)

> Purpose: Immediately show something wild to stop the scroll.

1. **Open on a mid-game position of Portal Chess.** The board should already have a few inactive squares from Bomber captures so it looks chaotic and unusual.
2. **Make a Warper move** — show the piece teleporting through a wall to the other side. Pause for a beat so the viewer registers what just happened.
3. **Make a Bomber capture** — show a piece capturing and then the neighboring squares turning inactive/disappearing. The board visibly changes shape.
4. **Cut to the Chessperiment logo / homepage** for 2 seconds.

**Voiceover direction (record this):**
*"What if chess pieces could teleport through walls? Or blow up the board when they capture? I built a tool that lets you design stuff like this — and I'm going to show you exactly how it works."*

---

### SECTION 2: WHAT IS CHESSPERIMENT? (0:30 – 1:15)

> Purpose: Explain the concept in 45 seconds flat.

5. **Show the Chessperiment homepage.** Scroll slowly so the viewer sees the tagline and feature highlights.
6. **Open the Marketplace / Library page.** Scroll through a few community-created sets to show variety — hex boards, weird pieces, different board shapes.
7. **Click into one community set** and start a quick game against yourself to show that these are real, playable games — not just images.

**Voiceover direction:**
*"Chessperiment is a free, browser-based tool where you can build any chess-like game from scratch. Custom boards, custom pieces, custom rules — and then actually play them. There's a whole library of games other people have made too. But the real magic is in the editors. Let me show you."*

---

### SECTION 3: THE BOARD EDITOR (1:15 – 2:15)

> Purpose: Show how fast it is to build a custom board.

8. **Open a new project.** Show the blank/default board.
9. **Resize the board** from 8x8 to 10x10. Make sure the dimension change is visible on screen.
10. **Toggle squares to inactive** — click a few squares to create the "holes" for Portal Chess. Show how clicking a square turns it off. Do this at a comfortable pace, not rushed.
11. **Switch to hexagonal mode** briefly (if you have a hex board variant saved). Show a hex board for 3–4 seconds, then switch back. This is just a quick flex to show it's possible.
12. **Show the final Portal Chess board** — the 10x10 with the inactive squares forming the cross pattern.

**Voiceover direction:**
*"Start with the board. You can make it any size — 6x6, 10x10, whatever. Then you can toggle individual squares on or off to make any shape you want. You can even do hexagonal boards. For Portal Chess, I made a 10x10 board with holes in the middle — those gaps are going to matter when we build the pieces."*

---

### SECTION 4: THE PIECE EDITOR — THE STAR OF THE SHOW (2:15 – 4:00)

> Purpose: This is the core demo. Take your time here.

13. **Open the Piece Editor.** Show the interface — the piece preview on one side, the logic blocks on the other.
14. **Start building the Bomber piece.** First, set the movement pattern to "Rider" along ranks and files (rook-style movement). Show yourself dragging/clicking the movement blocks.
15. **Add the capture trigger.** This is the big moment — show the conditional logic: "On capture → set adjacent squares to inactive." Walk through each block you connect. Go slow enough that the viewer can follow, but don't belabor it.
16. **Show the visual preview** of the piece's movement pattern if there's a preview/test feature. If not, skip to step 17.
17. **Upload or pick a graphic** for the Bomber piece. Even a simple colored icon works — just show that customization is possible.
18. **Save the piece and place it on the board.** Switch back to the board editor and put the Bomber in a starting position.
19. **Quick-start a game and make a Bomber capture** to prove it works. Show the adjacent squares disappearing live.

**Voiceover direction:**
*"Now the piece editor — this is where it gets interesting. It uses visual logic blocks, kind of like Scratch. So you don't need to write any code. I'll make the Bomber: it moves like a rook, slides along straight lines. But here's the twist — I add a trigger. When it captures a piece, it also destroys the squares around the captured piece. They just... disappear from the board. Let me show you what that looks like in a real game."*
*(pause for the live demo of the capture)*
*"Yeah. The board changes as you play. That's what's possible when you can program the rules yourself."*

---

### SECTION 5: MULTIPLAYER & SHARING (4:00 – 4:45)

> Purpose: Show it's not just a solo tool — you can play with others instantly.

20. **From the project, click "Create Room" or "Play" or however multiplayer is initiated.** Show the room link being generated.
21. **Open the link in a second browser tab** (or show a phone screen if you want). Show that a second player has joined.
22. **Play 2–3 moves** in the custom variant between the two tabs. Keep it fast.
23. **Show the Marketplace "Publish" or "Share" button** if available — demonstrate that you can share your creation with the community.

**Voiceover direction:**
*"Once your game is built, you can play it instantly. Generate a room link, send it to a friend, and you're playing your custom variant in the browser — no downloads, no installs. And if you think your game is good, you can publish it to the Marketplace for everyone to try."*

---

### SECTION 6: CALL TO ACTION / CLOSE (4:45 – 5:15)

> Purpose: Get them to visit the site.

24. **Show the homepage one more time.** Make sure `chessperiment.app` is clearly visible in the URL bar.
25. **Show a montage of 3–4 different community variants** playing in quick succession (1–2 seconds each). Hex boards, weird shapes, unusual pieces — show range.
26. **End on the Chessperiment logo or homepage.** Hold for 3 seconds.

**Voiceover direction:**
*"Chessperiment is completely free. If you've ever wanted to invent your own chess game, or prototype any kind of abstract strategy game, go try it — chessperiment.app. Link in the description. And if you build something cool, let me know in the comments. I'd love to see it."*

---

## POST-PRODUCTION CHECKLIST

- [ ] **Chapters** — Add these timestamps in the YouTube description:
  - 0:00 — What happens when chess pieces break the rules
  - 0:30 — What is Chessperiment?
  - 1:15 — The Board Editor
  - 2:15 — The Piece Editor (visual logic blocks)
  - 4:00 — Multiplayer & sharing
  - 4:45 — Try it free

- [ ] **Description** — Include:
  - First line: "Build any chess variant with zero code → chessperiment.app"
  - Brief paragraph about what Chessperiment is
  - Link to chessperiment.app
  - Chapters (above)
  - Tags: chess variant creator, custom chess rules, build your own chess game, chess piece editor, abstract strategy game engine, fairy chess

- [ ] **Thumbnail** — Show the Portal Chess board mid-game with the "exploded" inactive squares. Add bold text: "I BROKE CHESS" or "Chess but the board explodes". High contrast, readable at small size.

- [ ] **Tags / keywords:** chess variant creator, custom chess, build your own chess game, chess piece editor, fairy chess, abstract strategy, board game creator, chess game engine, visual programming chess

- [ ] **Upload as unlisted first** — Watch it back. Check audio levels, pacing, and that every editor screen is readable. Then set to public.

- [ ] **End screen** — Add an end screen card pointing to chessperiment.app (external link) and to your channel (for the devlog video later).

---

## RECORDING TIPS

- **Screen resolution:** Record at 1920×1080. Make sure the browser is zoomed enough that the editors and pieces are clearly visible — no tiny UI.
- **Mouse movements:** Move your cursor deliberately, not frantically. Pause on important UI elements for 1–2 seconds so viewers can read them.
- **Voiceover:** Record the voiceover separately from the screen recording. This lets you adjust pacing in editing. Speak naturally — don't try to sound like a YouTuber. Authenticity is your strength.
- **Music:** Add quiet background music (royalty-free). YouTube Audio Library has plenty. Keep it low — the voiceover is the focus.
- **Pacing:** The Piece Editor section (Section 4) is the most important. If you need to cut time, trim Sections 2 and 5 — not Section 4.
