# Marketplace Verification — Authenticated User Tasks

You are verifying the Chessperiment marketplace features that require a logged-in user session. Navigate using `http://localhost:3000`. You must be logged in with an account that has a creator profile. Report pass/fail for every check.

## 1. Publish Modal (3 min)

- Navigate to the **Editor** page and open or create a project
- Look for a **"Publish"** button in the editor UI
- Click it → a **PublishModal** should appear with:
  - Title input (pre-filled with project name)
  - Description textarea
  - Type selector (Game / Board / Pieces)
  - A "Publish" submit button and a "Cancel" button
- Click **Cancel** → modal should close without publishing
- Open the modal again, fill in a title and description, and click **Publish**
- Verify a success toast appears ("Published to marketplace!" or German equivalent)
- Navigate to `/marketplace` and verify the newly published item appears in the grid

## 2. Write a Review (3 min)

- Navigate to `/marketplace` and click any item card to open its detail page
- Scroll down to the **Reviews** section
- Click **"Write a Review"**
- A form should appear with:
  - Star rating selector (1–5 stars, clickable)
  - Text area for the review body
  - Submit and Cancel buttons
- Select **4 stars**, type "Great design, love the concept!", and click **Submit**
- Verify:
  - The review appears in the review list with your avatar, name, 4 stars, text, and date
  - The item's overall rating updates
  - The "Write a Review" button is replaced with "Already reviewed" or is hidden
- Try clicking **delete** on your own review → confirm dialog should appear → confirm → review removed

## 3. Fork / Remix (2 min)

- Navigate to a **game-type** item detail page (e.g. `/marketplace/seed-atomic`)
- Verify a **"Fork to Editor"** button is visible
- Click it → you should be redirected to the editor with a forked copy of the project
- Verify the editor shows "Forked from @creator" or similar attribution
- Go back to the marketplace detail page → verify the **fork count** incremented by 1

- Navigate to a **board-type** item (e.g. `/marketplace/seed-neon-board`)
- Verify the button says **"Import to Library"** instead
- Click it → verify the board appears in your library

## 4. Visual Polish (2 min)

- On `/marketplace`: do the cards look clean? Proper spacing, thumbnails, hover effects?
- On a detail page: is the layout readable? Reviews section properly separated from main content?
- On the publish modal: does it feel polished? Proper dark mode support?
- Check mobile responsiveness: resize browser to ~375px width, verify cards stack to 2 columns, modal is scrollable

## Report Format

For each section, report:
```
## Section Name
- [PASS/FAIL] Check description — details if failed
```