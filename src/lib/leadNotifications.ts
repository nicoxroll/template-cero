/**
 * Despacho de notificaciones comerciales de leads en tiempo real.
 *
 * Permite integrar la captación de leads con Webhooks externos (Slack, Discord,
 * Telegram, Zapier, Make, o endpoints de CRM / Email comercial) de forma no bloqueante.
 */

import { configRepo } from '../data';
import type { Lead, PageConfig } from '../data/types';

export interface LeadNotificationPayload {
  event: 'new_lead';
  site: 'Punto Cero Desarrollos';
  timestamp: string;
  lead: {
    id?: string;
    name: string;
    email: string;
    phone: string;
    message: string;
    source: string;
    interestSlug?: string;
    createdAt: string;
  };
}

/**
 * Despacha la notificación a los canales configurados en segundo plano.
 * Nunca lanza excepciones para no interrumpir el flujo del usuario.
 */
export async function dispatchLeadNotification(
  lead: Omit<Lead, 'id' | 'createdAt' | 'status'> & { id?: string; createdAt?: string },
  preloadedConfig?: PageConfig | null,
): Promise<void> {
  try {
    const config = preloadedConfig ?? (await configRepo.get().catch(() => null));
    const webhookUrl = config?.leadNotificationWebhook?.trim();

    if (!webhookUrl || !webhookUrl.startsWith('http')) {
      return;
    }

    const payload: LeadNotificationPayload = {
      event: 'new_lead',
      site: 'Punto Cero Desarrollos',
      timestamp: new Date().toISOString(),
      lead: {
        id: lead.id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        message: lead.message,
        source: lead.source,
        interestSlug: lead.interestSlug,
        createdAt: lead.createdAt ?? new Date().toISOString(),
      },
    };

    // Controller para timeout de 6 segundos máx
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);

    await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    }).finally(() => clearTimeout(timer));
  } catch (err) {
    // Log silencioso para diagnóstico sin afectar al visitante
    if (import.meta.env.DEV) {
      console.warn('[lead-notification] Fallo al despachar webhook:', err);
    }
  }
}

/**
 * Prueba la conectividad de un webhook desde el panel de administración.
 */
export async function testWebhook(
  url: string,
): Promise<{ ok: boolean; status?: number; error?: string }> {
  const trimmed = url.trim();
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return { ok: false, error: 'La URL debe comenzar con http:// o https://' };
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(trimmed, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event: 'test_ping',
        site: 'Punto Cero Desarrollos',
        message: 'Mensaje de prueba de conexión enviado desde el panel de administración.',
        timestamp: new Date().toISOString(),
      }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timer));

    if (res.ok) {
      return { ok: true, status: res.status };
    }
    return {
      ok: false,
      status: res.status,
      error: `El servidor respondió con código HTTP ${res.status}`,
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error desconocido de red';
    return { ok: false, error: message };
  }
}
