// https://github.com/moeru-ai/airi/blob/main/services/telegram-bot/src/db/schema.ts

import { bigint, index, pgTable, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core'

import { bytea } from './type'
import { vector } from './custom-types'

// Get database type from environment
const isDuckDB = process.env.DATABASE_TYPE === 'duckdb'

export const photosTable = pgTable('photos', {
  id: uuid().primaryKey().defaultRandom(),
  platform: text().notNull().default(''),
  file_id: text().notNull().default(''),
  message_id: uuid(),
  image_bytes: bytea(),
  image_path: text().notNull().default(''),
  caption: text().notNull().default(''),
  description: text().notNull().default(''),
  created_at: bigint({ mode: 'number' }).notNull().default(0).$defaultFn(() => Date.now()),
  updated_at: bigint({ mode: 'number' }).notNull().default(0).$defaultFn(() => Date.now()),
  description_vector_1536: vector({ dimensions: 1536 }),
  description_vector_1024: vector({ dimensions: 1024 }),
  description_vector_768: vector({ dimensions: 768 }),
}, table => {
  const baseIndexes = [
    uniqueIndex('photos_platform_file_id_unique_index').on(table.platform, table.file_id),
    index('photos_message_id_index').on(table.message_id),
  ]

  // Add vector indexes only for PostgreSQL (DuckDB doesn't support HNSW)
  if (!isDuckDB) {
    baseIndexes.push(
      index('photos_description_vector_1536_index').using('hnsw', table.description_vector_1536.op('vector_cosine_ops')),
      index('photos_description_vector_1024_index').using('hnsw', table.description_vector_1024.op('vector_cosine_ops')),
      index('photos_description_vector_768_index').using('hnsw', table.description_vector_768.op('vector_cosine_ops')),
    )
  }

  return baseIndexes
})
