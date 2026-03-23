# Marketplace Verification — Manual Checklist (~3 min)

Focus on things that need your login session and visual judgment.

## Publish Modal (logged in as creator)

- [ ] Open the editor with a project
- [ ] Click the "Publish" button
- [ ] Verify the PublishModal opens with title, description, and type selector
- [ ] Try submitting with an empty title → should show validation error
- [ ] Cancel the modal → it should close cleanly
- [ ] (Optional) Publish a real item and verify it appears on `/marketplace`

## Submit a Review (logged in)

- [ ] Go to `/marketplace/seed-atomic` (or any detail page)
- [ ] Click "Write a Review"
- [ ] Select a star rating (click the stars)
- [ ] Type review text and submit
- [ ] Verify your review appears in the list with your name, stars, and text
- [ ] (Optional) Try deleting your review

## Fork / Remix (logged in)

- [ ] On a game detail page, click "Fork to Editor"
- [ ] Verify you get redirected to the editor with the forked project
- [ ] Check the project has a "Forked from @creator" badge
- [ ] On a board detail page (`/marketplace/seed-neon-board`), click "Import to Library"
- [ ] Verify the board appears in your library

## Visual Polish

- [ ] Do the marketplace cards look clean? Thumbnails, spacing, text truncation?
- [ ] Does the review section look good? Star display, text alignment, dates?
- [ ] Does the PublishModal feel polished? Form layout, button styles?
- [ ] Dark mode: toggle and spot-check marketplace, detail page, and review section