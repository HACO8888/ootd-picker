-- D-SEC-2：closet_item / favorite / wear_log 的主鍵由全域 id 改為 (user_id, id)。
-- id 由 client 產生，原本的全域主鍵讓一個帳號持有的 id 可擋下其他帳號的同步。
-- 舊主鍵由 0000 以 inline PRIMARY KEY 建立，Postgres 預設名稱為 <table>_pkey。
-- 既有資料的 id 已全域唯一，(user_id, id) 必定唯一，加新主鍵不會失敗。
ALTER TABLE "closet_item" DROP CONSTRAINT IF EXISTS "closet_item_pkey";--> statement-breakpoint
ALTER TABLE "favorite" DROP CONSTRAINT IF EXISTS "favorite_pkey";--> statement-breakpoint
ALTER TABLE "wear_log" DROP CONSTRAINT IF EXISTS "wear_log_pkey";--> statement-breakpoint
ALTER TABLE "closet_item" ADD CONSTRAINT "closet_item_user_id_id_pk" PRIMARY KEY("user_id","id");--> statement-breakpoint
ALTER TABLE "favorite" ADD CONSTRAINT "favorite_user_id_id_pk" PRIMARY KEY("user_id","id");--> statement-breakpoint
ALTER TABLE "wear_log" ADD CONSTRAINT "wear_log_user_id_id_pk" PRIMARY KEY("user_id","id");--> statement-breakpoint
-- 墓碑瘦身：已軟刪除的列只需 id + deleted_at，清掉圖片與穿搭內容（新的刪除由程式直接寫瘦身值）。
UPDATE "closet_item" SET "image_url" = '' WHERE "deleted_at" IS NOT NULL AND "image_url" <> '';--> statement-breakpoint
UPDATE "favorite" SET "outfit" = '{}'::jsonb WHERE "deleted_at" IS NOT NULL AND "outfit" <> '{}'::jsonb;--> statement-breakpoint
UPDATE "wear_log" SET "outfit" = '{}'::jsonb, "note" = NULL WHERE "deleted_at" IS NOT NULL AND ("outfit" <> '{}'::jsonb OR "note" IS NOT NULL);
