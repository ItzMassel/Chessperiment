import { eq, and, desc, sql, asc, like, or, inArray } from 'drizzle-orm';
import { db } from './index';
import { marketplaceItems as mi, marketplaceReviews as mr, marketplaceReports as mrep } from './schema';
import type { MarketplaceItem, Review } from '@/lib/marketplace-types';

function rowToMarketplaceItem(row: any): MarketplaceItem {
  return {
    id: row.id,
    title: row.title,
    creator_handle: row.creatorHandle,
    type: row.type,
    rating: row.rating || 0,
    reviewCount: row.reviewCount || 0,
    stars_total: row.starsTotal || 0,
    stars_count: row.starsCount || 0,
    views: row.views || 0,
    forkCount: row.forkCount || 0,
    date_published: row.datePublished instanceof Date ? row.datePublished : new Date(row.datePublished),
    config_data: row.configData || null,
    sourceType: row.sourceType || undefined,
    sourceId: row.sourceId || undefined,
    forkedFrom: row.forkedFrom || undefined,
    isNew: row.isNew ?? true,
    imageUrl: row.imageUrl || '',
    description: row.description || '',
    searchKeywords: row.searchKeywords || [],
    preview_config: row.previewConfig || null,
  };
}

function rowToReview(row: any): Review {
  return {
    id: row.id,
    userId: row.userId,
    creatorHandle: row.creatorHandle || undefined,
    displayName: row.displayName,
    rating: row.rating,
    text: row.text,
    createdAt: row.createdAt instanceof Date ? row.createdAt : new Date(row.createdAt),
    updatedAt: row.updatedAt ? (row.updatedAt instanceof Date ? row.updatedAt : new Date(row.updatedAt)) : undefined,
  };
}

// ==================== QUERIES ====================

export async function getMarketplaceItems(query?: {
  type?: 'board' | 'pieces' | 'game';
  sort?: string;
  limit?: number;
}): Promise<MarketplaceItem[]> {
  let queryBuilder = db.select().from(mi);

  if (query?.type) {
    queryBuilder = queryBuilder.where(eq(mi.type, query.type)) as any;
  }

  const rows = await (queryBuilder as any).limit(query?.limit || 100);
  let items = rows.map(rowToMarketplaceItem);

  if (query?.sort) {
    switch (query.sort) {
      case 'rating':
        items.sort((a: any, b: any) => b.rating - a.rating);
        break;
      case 'most_reviewed':
        items.sort((a: any, b: any) => b.reviewCount - a.reviewCount);
        break;
      case 'most_viewed':
        items.sort((a: any, b: any) => b.views - a.views);
        break;
      case 'newest':
      default:
        items.sort((a: any, b: any) => new Date(b.date_published).getTime() - new Date(a.date_published).getTime());
    }
  }

  return items;
}

export async function getMarketplaceItem(id: string): Promise<MarketplaceItem | null> {
  const [row] = await db.select().from(mi).where(eq(mi.id, id)).limit(1);
  if (!row) return null;
  return rowToMarketplaceItem(row);
}

export async function searchMarketplaceItems(searchQuery: string, type?: string): Promise<MarketplaceItem[]> {
  const keywords = searchQuery.toLowerCase().split(/\s+/).filter(Boolean);
  if (keywords.length === 0) return [];

  let queryBuilder = db.select().from(mi);
  const conditions = [];

  if (type) {
    conditions.push(eq(mi.type, type));
  }

  conditions.push(sql`${mi.searchKeywords} ? ${keywords[0]}`);

  const rows = await (queryBuilder as any).where(and(...conditions)).limit(50);
  let items = rows.map(rowToMarketplaceItem);

  if (keywords.length > 1) {
    items = items.filter(item => {
      const kw = item.searchKeywords || [];
      return keywords.every(k => kw.includes(k));
    });
  }

  return items;
}

export async function getCreatorMarketplaceItems(handle: string): Promise<MarketplaceItem[]> {
  const queryHandle = handle.startsWith('@') ? handle : `@${handle}`;
  const rows = await db.select()
    .from(mi)
    .where(eq(mi.creatorHandle, queryHandle))
    .limit(50);
  return rows.map(rowToMarketplaceItem);
}

// ==================== MUTATIONS ====================

export async function createMarketplaceItem(item: Omit<MarketplaceItem, 'id' | 'rating' | 'reviewCount' | 'isNew' | 'stars_total' | 'stars_count' | 'views' | 'forkCount' | 'date_published'>): Promise<string> {
  const [row] = await db.insert(mi).values({
    title: item.title,
    description: item.description || '',
    creatorHandle: item.creator_handle,
    type: item.type,
    rating: 0,
    reviewCount: 0,
    starsTotal: 0,
    starsCount: 0,
    views: 0,
    forkCount: 0,
    isNew: true,
    datePublished: new Date(),
    imageUrl: item.imageUrl || '',
    searchKeywords: item.searchKeywords || [],
    previewConfig: item.preview_config || null,
    sourceType: item.sourceType || null,
    sourceId: item.sourceId || null,
  } as any).returning({ id: mi.id });
  return row.id;
}

export async function updateMarketplaceItem(id: string, updates: { title?: string; description?: string; imageUrl?: string }): Promise<void> {
  const updateData: any = {};
  if (updates.title !== undefined) updateData.title = updates.title.trim();
  if (updates.description !== undefined) updateData.description = updates.description.trim();
  if (updates.imageUrl !== undefined) updateData.imageUrl = updates.imageUrl.trim();
  await db.update(mi).set(updateData).where(eq(mi.id, id));
}

export async function deleteMarketplaceItem(id: string): Promise<void> {
  await db.delete(mr).where(eq(mr.marketplaceItemId, id));
  await db.delete(mi).where(eq(mi.id, id));
}

export async function incrementView(id: string): Promise<void> {
  await db.update(mi)
    .set({ views: sql`${mi.views} + 1` })
    .where(eq(mi.id, id));
}

export async function incrementForkCount(id: string): Promise<void> {
  await db.update(mi)
    .set({ forkCount: sql`${mi.forkCount} + 1` })
    .where(eq(mi.id, id));
}

export async function upsertMarketplaceItem(id: string, data: any): Promise<void> {
  await db.insert(mi).values(data).onConflictDoUpdate({ target: mi.id, set: data });
}

// ==================== REVIEWS ====================

export async function getReviews(marketplaceItemId: string): Promise<Review[]> {
  const rows = await db.select()
    .from(mr)
    .where(eq(mr.marketplaceItemId, marketplaceItemId))
    .orderBy(desc(mr.createdAt))
    .limit(50);
  return rows.map(rowToReview);
}

export async function addReview(
  marketplaceItemId: string,
  review: {
    userId: string;
    creatorHandle?: string;
    displayName: string;
    rating: number;
    text: string;
  }
): Promise<void> {
  await db.insert(mr).values({
    marketplaceItemId,
    userId: review.userId,
    creatorHandle: review.creatorHandle || null,
    displayName: review.displayName,
    rating: review.rating,
    text: review.text,
    createdAt: new Date(),
  });

  await db.update(mi)
    .set({
      starsTotal: sql`${mi.starsTotal} + ${review.rating}`,
      starsCount: sql`${mi.starsCount} + 1`,
      reviewCount: sql`${mi.reviewCount} + 1`,
      rating: sql`(${mi.starsTotal} + ${review.rating})::float / (${mi.starsCount} + 1)`,
    })
    .where(eq(mi.id, marketplaceItemId));
}

export async function deleteReviewFromItem(marketplaceItemId: string, reviewId: string, userId: string): Promise<void> {
  const [row] = await db.select({ rating: mr.rating, userId: mr.userId })
    .from(mr)
    .where(eq(mr.id, reviewId))
    .limit(1);

  if (!row) throw new Error('REVIEW_NOT_FOUND');
  if (row.userId !== userId) throw new Error('NOT_OWNER');

  await db.delete(mr).where(eq(mr.id, reviewId));

  await db.update(mi)
    .set({
      starsTotal: sql`GREATEST(${mi.starsTotal} - ${row.rating}, 0)`,
      starsCount: sql`GREATEST(${mi.starsCount} - 1, 0)`,
      reviewCount: sql`GREATEST(${mi.reviewCount} - 1, 0)`,
      rating: sql`CASE WHEN ${mi.starsCount} - 1 > 0 THEN (${mi.starsTotal} - ${row.rating})::float / (${mi.starsCount} - 1) ELSE 0 END`,
    })
    .where(eq(mi.id, marketplaceItemId));
}

export async function hasUserReviewed(marketplaceItemId: string, userId: string): Promise<boolean> {
  const [row] = await db.select({ id: mr.id })
    .from(mr)
    .where(and(eq(mr.marketplaceItemId, marketplaceItemId), eq(mr.userId, userId)))
    .limit(1);
  return !!row;
}

// ==================== REPORTS ====================

export async function createReport(report: {
  marketplaceId: string;
  itemTitle: string;
  creatorHandle: string;
  creatorUserId: string;
  reporterUserId: string;
  reporterHandle: string;
  reporterEmail: string;
  reason: string;
  details: string;
}): Promise<void> {
  await db.insert(mrep).values({
    marketplaceId: report.marketplaceId,
    itemTitle: report.itemTitle,
    creatorHandle: report.creatorHandle,
    creatorUserId: report.creatorUserId,
    reporterUserId: report.reporterUserId,
    reporterHandle: report.reporterHandle,
    reporterEmail: report.reporterEmail,
    reason: report.reason,
    details: report.details,
    status: 'new',
    createdAt: new Date(),
  } as any);
}
