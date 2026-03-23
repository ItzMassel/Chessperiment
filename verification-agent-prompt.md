# Marketplace Verification — Browser Agent Tasks (Round 2)

Verify the Chessperiment marketplace at `http://localhost:3000`. Report pass/fail for every check.

## 1. Marketplace Grid & Filters

- Navigate to `/marketplace`
- Verify that 8 items load in the grid
- Click the **"Games"** filter pill → verify **exactly 5** items shown (all game type)
- Click the **"Boards"** filter pill → verify **exactly 2** items shown (all board type)
- Click the **"Pieces"** filter pill → verify **exactly 1** item shown (piece type)
- Click **"All"** → all 8 items should be visible again

## 2. Sort Dropdown

- On `/marketplace` with "All" filter active, open the sort dropdown
- Select **"Best Rated"** → first item should be "Atomic Chess" (rating 4.5) or highest rated
- Select **"Most Viewed"** → first item should be "Chess960" (2500 views) or highest viewed
- Select **"Newest"** → items should be ordered by date (most recent first)
- Verify the grid actually re-renders with a different order each time

## 3. Creator Handle Links

- On any marketplace card, click the **creator handle text** (e.g. `@chessperiment`) — NOT the card itself
- Verify the URL navigates to `/u/chessperiment` (it will likely 404 since seed creators aren't in Firestore — the link working is what matters)
- Go back to `/marketplace`
- Click the **card area** (not the handle) → should navigate to `/marketplace/seed-atomic` or similar detail page

## 4. Detail Page — Reviews Section

- Navigate to `/marketplace/seed-atomic`
- Scroll down and verify a **Reviews section** is visible
- It should show an empty state like "No reviews yet"
- Verify a "Write a Review" button or login prompt exists

## 5. Detail Page — Fork Button

- On `/marketplace/seed-atomic` (game type), verify a **"Fork to Editor"** button exists
- Navigate to `/marketplace/seed-neon-board` (board type), verify it shows **"Import to Library"** instead

## 6. German Translations

- Navigate to `/de/marketplace`
- Verify filter pills read: **"Alle"**, **"Spiele"**, **"Bretter"**, **"Figuren"**
- Verify sort dropdown options are in German (e.g. **"Neueste"**, **"Bestbewertet"**)
- Click "Spiele" filter → verify it filters to games only

## 7. Home Page Trending

- Navigate to `/` (home page)
- Look for a trending/marketplace section
- Verify cards are rendered and clicking one navigates to `/marketplace/{id}`

## Report Format

For each section, report:
```
## Section Name
- [PASS/FAIL] Check description — details if failed
```