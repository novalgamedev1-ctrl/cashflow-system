// lib/pushNotifications.js
// ─────────────────────────────────────────────────────────────────────────────
// Utility helpers for Web Push Notifications.
//
// SETUP REQUIRED:
// 1. Generate VAPID keys (one-time):
//      npx web-push generate-vapid-keys
// 2. Put the PUBLIC key in your .env:
//      VITE_VAPID_PUBLIC_KEY=Bxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
// 3. Put the PRIVATE key on your backend/edge function (NEVER in frontend).
// 4. Create a Supabase table:
//      push_subscriptions (
//        id          uuid primary key default gen_random_uuid(),
//        student_id  uuid references students(id) on delete cascade,
//        subscription jsonb not null,
//        created_at  timestamptz default now()
//      )
// 5. Create a Supabase Edge Function `send-push` (see sendPushToAll below).
// ─────────────────────────────────────────────────────────────────────────────

import { supabase } from './supabase'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || ''

// Convert base64url VAPID key to Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)))
}

// ── Check current permission state (no prompt) ────────────────────────────────
export function getNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported'
  return Notification.permission // 'default' | 'granted' | 'denied'
}

// ── Register SW and subscribe ─────────────────────────────────────────────────
export async function subscribeToPush(studentId) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error('Push not supported in this browser')
  }

  // 1. Register service worker
  const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
  await navigator.serviceWorker.ready

  // 2. Request permission
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') throw new Error('Permission denied')

  // 3. Subscribe
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  })

  // 4. Save to Supabase (upsert so re-subscribing works cleanly)
  const subJson = subscription.toJSON()
  const { error } = await supabase
    .from('push_subscriptions')
    .upsert(
      { student_id: studentId, subscription: subJson },
      { onConflict: 'student_id' }
    )
  if (error) throw error

  return subscription
}

// ── Unsubscribe ───────────────────────────────────────────────────────────────
export async function unsubscribeFromPush(studentId) {
  const registration = await navigator.serviceWorker.getRegistration('/sw.js')
  if (registration) {
    const sub = await registration.pushManager.getSubscription()
    if (sub) await sub.unsubscribe()
  }

  await supabase.from('push_subscriptions').delete().eq('student_id', studentId)
}

// ── Check if currently subscribed ────────────────────────────────────────────
export async function isSubscribed() {
  if (!('serviceWorker' in navigator)) return false
  const registration = await navigator.serviceWorker.getRegistration('/sw.js')
  if (!registration) return false
  const sub = await registration.pushManager.getSubscription()
  return !!sub
}

// ── Admin: send push to all subscribers via Supabase Edge Function ────────────
// The edge function handles the actual web-push delivery using the PRIVATE key.
// Deploy it at: supabase/functions/send-push/index.ts
export async function sendPushToAll({ title, body }) {
  const { data, error } = await supabase.functions.invoke('send-push', {
    body: { title, body },
  })
  if (error) throw error
  return data
}