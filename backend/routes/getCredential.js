import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

export async function getCredential(req) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (!id) return new Response(JSON.stringify({ error: 'id required' }), { status: 400 });

    const { data: doc } = await supabase.from('documents').select('*').eq('id', id).single();
    if (!doc) return new Response(JSON.stringify({ error: 'not found' }), { status: 404 });

    const { data: attestations } = await supabase.from('attestations').select('*').eq('document_id', id);

    return new Response(JSON.stringify({ document: doc, attestations }), { status: 200 });
  } catch (err) {
    console.error('getCredential error', err);
    return new Response(JSON.stringify({ error: err.message || String(err) }), { status: 500 });
  }
}
