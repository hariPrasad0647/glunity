-- One-time migration script to rename Post caption to content

-- 1. Inspect the schema before executing
-- DESCRIBE posts;

-- 2. Execute the rename. 
-- TiDB supports the CHANGE syntax to rename a column and modify its type in one statement.
ALTER TABLE `posts` CHANGE `caption` `content` TEXT;

-- 3. Verify the schema after executing
-- DESCRIBE posts;
