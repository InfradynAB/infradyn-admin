import { sql } from "drizzle-orm";
import db from "../db/drizzle";

async function fixMetadataColumn() {
  console.log("Fixing metadata column type in audit_log table...");
  
  try {
    // Cast the metadata column from text to jsonb
    await db.execute(sql`
      ALTER TABLE audit_log 
      ALTER COLUMN metadata TYPE jsonb 
      USING COALESCE(metadata::jsonb, '{}'::jsonb)
    `);
    
    console.log("✅ Successfully converted metadata column to jsonb");
  } catch (error: any) {
    if (error.message?.includes("already exists") || error.code === "42710") {
      console.log("Column is already jsonb type, skipping...");
    } else {
      console.error("Error:", error.message);
    }
  }
  
  process.exit(0);
}

fixMetadataColumn();
