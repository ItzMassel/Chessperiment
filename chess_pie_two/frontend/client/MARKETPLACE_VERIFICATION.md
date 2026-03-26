# Marketplace Feature Verification Plan

Test the Chessperiment marketplace feature at `localhost:3000` (or the deployed URL). You must be able to log in with a Google account to test authenticated features.

## 1. Marketplace Browse Page (`/marketplace`)

- [ ] Navigate to `/marketplace` — verify the grid loads with items (or an empty state if no items published yet)
- [ ] Test the **type filter** pills: click "Games", "Boards", "Pieces" — verify the grid filters correctly
- [ ] Test the **sort dropdown**: try "Newest", "Top Rated", "Most Forked" — verify order changes
- [ ] Test the **search input**: type a partial title — verify results filter in real-time
- [ ] Verify each **MarketplaceItemCard** displays: thumbnail, title, creator handle, star rating, fork count
- [ ] Click a card — verify it navigates to `/marketplace/[id]`

## 2. Marketplace Detail Page (`/marketplace/[id]`)

- [ ] Verify the detail page shows: title, description, creator handle, rating, view count, fork count, published date
- [ ] Verify the **view count increments** on page load (refresh and check)
- [ ] Verify the **Review Section** is visible below the item details

## 3. Reviews (requires login)

- [ ] Submit a review: select a star rating (1-5) and type review text, click submit
- [ ] Verify the review appears immediately in the review list
- [ ] Verify the item's **average rating updates**
- [ ] Try submitting a **second review on the same item** — verify it prevents duplicate reviews
- [ ] Delete your review — verify it disappears and rating updates

## 4. Publishing (requires login + having a project/board/piece set)

- [ ] Go to the **editor/library** page
- [ ] Find the **Publish** button on a project, board, or piece set
- [ ] Click Publish — verify the **PublishModal** opens with title and description fields
- [ ] Fill in title and description, submit — verify success message
- [ ] Navigate to `/marketplace` — verify your newly published item appears
- [ ] Navigate to `/creator` — verify your item appears in your creator dashboard

## 5. Forking (requires login)

- [ ] Go to a marketplace item detail page for an item you did NOT create
- [ ] Click the **Fork** button
- [ ] Verify a success message appears
- [ ] Navigate to your library/editor — verify the forked item appears with fork attribution

## 6. Creator Dashboard (`/creator`)

- [ ] Navigate to `/creator` — verify it shows your published items
- [ ] Test **editing** a published item: change title/description/image URL — verify changes save
- [ ] Test **deleting** a published item: click delete, confirm — verify it's removed from marketplace
- [ ] Verify your creator profile info displays (handle, display name)

## 7. Home Page Integration

- [ ] Navigate to the home page (`/`)
- [ ] Verify the **MarketplaceTrending** section shows up to 3 trending items
- [ ] Click a trending item — verify it navigates to the correct detail page

## 8. Edge Cases & Error Handling

- [ ] Visit `/marketplace/nonexistent-id` — verify graceful 404 or error state
- [ ] Try publishing without a title — verify validation prevents submission
- [ ] Try submitting a review with no star rating — verify validation
- [ ] Test on **mobile viewport** (resize to 375px width) — verify responsive layout
- [ ] Test while **logged out**: verify publish/review/fork buttons are hidden or redirect to login

## 9. Cross-browser Basics

- [ ] Verify marketplace grid renders correctly (no layout breaks)
- [ ] Verify modals open/close cleanly with no background scroll issues
- [ ] Verify navigation back/forward works without stale data
