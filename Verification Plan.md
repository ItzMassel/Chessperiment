1. Marketplace Grid & Filters (2 min)

Go to /marketplace
Verify 8 seed items load (5 games, 2 boards, 1 pieces)
Click filter pills: "Games" → only 5 games shown, "Boards" → 2 boards, "Pieces" → 1 piece set, "All" → all 8
Change sort dropdown: "Best Rated", "Most Viewed", "Newest" — order should change 2. Creator Links on Cards (1 min)

On any card, click the creator handle (e.g. @neonmaker)
Should navigate to /u/neonmaker profile page (may 404 since seed creators aren't in Firestore — that's OK, the link working is what matters)
Clicking the rest of the card should still go to /marketplace/{id} 3. Detail Page — Reviews & Fork (3 min)

Click any seed item card (e.g. "Atomic Chess") → detail page
Scroll down to Reviews section — should show "No reviews yet" with a write review button
If logged in: click "Write a Review", select stars, type text, submit
If not logged in: should show login prompt
Check Fork/Remix button is visible — click it (needs login)
For a board item (seed-neon-board): should show "Import to Library" instead 4. Publish Modal (2 min)

Go to the editor (create/open a project)
Look for the "Publish" button
Click it → PublishModal should open with title, description, type selector
Cancel without publishing (unless you want to test a real publish) 5. German Translations (1 min)

Switch locale to German (/de/marketplace)
Verify: filter pills say "Alle", "Spiele", "Bretter", "Figuren"
Sort dropdown: "Neueste", "Bestbewertet", etc.
Detail page review section should be in German 6. Home Page Trending (1 min)

Go to / (home page)
Check the trending section shows seed marketplace items
Cards should be clickable and link to detail pages
