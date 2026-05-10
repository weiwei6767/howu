"use client";

export async function isPushSupported(): Promise<boolean> {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  );
}

export async function ensureSwRegistered(): Promise<ServiceWorkerRegistration | null> {
  if (!(await isPushSupported())) return null;
  const existing = await navigator.serviceWorker.getRegistration();
  if (existing) return existing;
  return navigator.serviceWorker.register("/sw.js");
}

export async function subscribePush(): Promise<{ success: boolean; reason?: string }> {
  try {
    if (!(await isPushSupported())) return { success: false, reason: "unsupported" };
    const reg = await ensureSwRegistered();
    if (!reg) return { success: false, reason: "no_sw" };

    const permission = await Notification.requestPermission();
    if (permission !== "granted") return { success: false, reason: "denied" };

    const rawKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
    const cleanedKey = sanitizeBase64Url(rawKey);
    if (!cleanedKey) return { success: false, reason: "no_vapid_key" };

    let appServerKey: Uint8Array;
    try {
      appServerKey = urlBase64ToUint8Array(cleanedKey);
    } catch (e) {
      console.error("[push] VAPID key decode failed:", e, "raw length:", rawKey.length);
      return { success: false, reason: "invalid_vapid_key" };
    }
    if (appServerKey.length !== 65) {
      // P-256 uncompressed public key 必為 65 bytes
      console.error("[push] VAPID key wrong length:", appServerKey.length);
      return { success: false, reason: "invalid_vapid_key" };
    }

    let sub: PushSubscription;
    try {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: appServerKey as BufferSource,
      });
    } catch (e) {
      console.error("[push] pushManager.subscribe failed:", e);
      return {
        success: false,
        reason: `subscribe_failed:${(e as Error).message ?? "unknown"}`,
      };
    }

    const json = sub.toJSON();
    if (!json.endpoint || !json.keys) return { success: false, reason: "invalid_subscription" };

    const res = await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        endpoint: json.endpoint,
        keys: { p256dh: json.keys.p256dh ?? "", auth: json.keys.auth ?? "" },
      }),
    });
    if (!res.ok) return { success: false, reason: "register_failed" };
    return { success: true };
  } catch (e) {
    console.error("[push] subscribePush threw:", e);
    return { success: false, reason: `error:${(e as Error).message ?? "unknown"}` };
  }
}

export async function unsubscribePush(): Promise<void> {
  if (!(await isPushSupported())) return;
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = await reg?.pushManager.getSubscription();
  if (!sub) return;
  await fetch("/api/push/subscribe", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint: sub.endpoint }),
  });
  await sub.unsubscribe();
}

/** 嚴格清出合法 base64url 字元(去掉 BOM、空白、引號等) */
function sanitizeBase64Url(s: string): string {
  return s
    .replace(/^﻿/, "") // BOM
    .trim()
    .replace(/^["']|["']$/g, "") // 引號
    .replace(/[^A-Za-z0-9_\-]/g, ""); // 只保留 base64url 合法字元
}

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const norm = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(norm);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}
