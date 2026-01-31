import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Initialize Supabase Client
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Create 'documents' bucket if it doesn't exist
async function initStorage() {
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    if (error) {
      console.error("Error listing buckets:", error);
      return;
    }
    
    const bucketName = "documents";
    const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
    
    if (!bucketExists) {
      console.log(`Creating bucket: ${bucketName}`);
      const { error: createError } = await supabase.storage.createBucket(bucketName, {
        public: false,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ['image/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
      });
      if (createError) {
        console.error("Error creating bucket:", createError);
      } else {
        console.log(`Bucket ${bucketName} created successfully`);
      }
    }
  } catch (err) {
    console.error("Exception initializing storage:", err);
  }
}

// Run initialization
initStorage();

// Verification Route
app.post("/make-server-68c3da2b/verify", async (c) => {
  try {
    const body = await c.req.parseBody();
    const file = body['file'];

    if (!file || !(file instanceof File)) {
      return c.json({ error: "No file uploaded" }, 400);
    }

    // Sanitize filename to remove special characters and spaces that cause "Invalid key" errors
    // Keeps alphanumeric, dots, underscores, and hyphens. Replaces others with underscore.
    const sanitizedOriginalName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const fileName = `${Date.now()}_${sanitizedOriginalName}`;
    const filePath = `uploads/${fileName}`;

    // Upload to Supabase Storage
    const arrayBuffer = await file.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, arrayBuffer, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return c.json({ error: "Failed to upload file", details: uploadError.message }, 500);
    }

    // Mock Verification Logic
    // In a real app, we would send the file to an AI service here.
    // For now, we simulate processing time and result.
    
    // Determine result based on random chance or simple heuristics
    const score = Math.floor(Math.random() * 100);
    let verdict = "Real";
    let details = "This document appears to be authentic with no signs of manipulation.";

    if (score < 50) {
      verdict = "Fake";
      details = "High probability of AI generation or significant manipulation detected.";
    } else if (score < 85) {
      verdict = "Tampered";
      details = "Some inconsistencies found in metadata suggesting possible editing.";
    }

    const result = {
      id: crypto.randomUUID(),
      fileName: file.name,
      fileSize: file.size,
      storagePath: filePath,
      score,
      verdict,
      details,
      timestamp: new Date().toISOString()
    };

    // Store result in KV
    await kv.set(`verification:${result.id}`, result);

    return c.json(result);

  } catch (err) {
    console.error("Verification error:", err);
    return c.json({ error: "Internal server error", message: err.message }, 500);
  }
});

// Health check
app.get("/make-server-68c3da2b/health", (c) => {
  return c.json({ status: "ok" });
});

Deno.serve(app.fetch);
