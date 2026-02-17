
import { eq, desc } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { invitationWishes } from '../db/schema';
import type { Env } from '../lib/types';

export type AttendanceStatus = 'hadir' | 'tidak-hadir' | 'masih-ragu';

export interface WishInsert {
  invitationSlug: string;
  name: string;
  message: string;
  attendance: AttendanceStatus;
  guestCount: number;
}

export interface WishRow {
  id: number;
  invitationSlug: string;
  name: string;
  message: string;
  attendance: AttendanceStatus;
  guestCount: number;
  createdAt: string;
}

export class WishesRepository {
  private getDb(env: Env) {
    const client = postgres(env.DATABASE_URL);
    return drizzle(client);
  }

  async create(data: WishInsert, env: Env): Promise<WishRow> {
    const db = this.getDb(env);

    const [newWish] = await db.insert(invitationWishes).values({
      invitationSlug: data.invitationSlug,
      name: data.name,
      message: data.message,
      attendance: data.attendance,
      guestCount: data.guestCount,
    }).returning();

    return this.mapToWishRow(newWish);
  }

  async list(invitationSlug: string, env: Env): Promise<WishRow[]> {
    const db = this.getDb(env);

    const results = await db.select()
      .from(invitationWishes)
      .where(eq(invitationWishes.invitationSlug, invitationSlug))
      .orderBy(desc(invitationWishes.createdAt))
      .limit(100);

    return results.map(this.mapToWishRow);
  }

  private mapToWishRow(row: any): WishRow {
    return {
      id: Number(row.id),
      invitationSlug: row.invitationSlug,
      name: row.name,
      message: row.message,
      attendance: row.attendance as AttendanceStatus,
      guestCount: row.guestCount,
      createdAt: row.createdAt,
    };
  }
}

export const wishesRepository = new WishesRepository();
