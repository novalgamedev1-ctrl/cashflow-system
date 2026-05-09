// supabase/functions/send-push/index.ts
// Deploy with: supabase functions deploy send-push
//
// Set secrets (one-time):
//   supabase secrets set VAPID_PUBLIC_KEY=Bxxx...
//   supabase secrets set VAPID_PRIVATE_KEY=xxx...
//   supabase secrets set VAPID_SUBJECT=mailto:admin@yourschool.com
//
// Requires: web-push npm package (bundled via esm.sh below)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'https://esm.sh/web-push@3'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

webpush.setVapidDetails(
  Deno.env.get('VAPID_SUBJECT')!,
  Deno.env.get('VAPID_PUBLIC_KEY')!,
  Deno.env.get('VAPID_PRIVATE_KEY')!
)

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    const { title, body } = await req.json()
    if (!title || !body) {
      return new Response(JSON.stringify({ error: 'title and body are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Fetch all subscriptions
    const { data: rows, error } = await supabase
      .from('push_subscriptions')
      .select('id, subscription')

    if (error) throw error

    const payload = JSON.stringify({ title, body })

    // Send to all - collect results
    const results = await Promise.allSettled(
      (rows || []).map(async (row) => {
        const sub = row.subscription
        // sub must have { endpoint, keys: { p256dh, auth } }
        await webpush.sendNotification(sub, payload)
      })
    )

    const sent   = results.filter((r) => r.status === 'fulfilled').length
    const failed = results.filter((r) => r.status === 'rejected').length

    return new Response(
      JSON.stringify({ success: true, sent, failed, total: rows?.length ?? 0 }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }
})