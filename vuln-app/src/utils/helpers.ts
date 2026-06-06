import { Request, Response } from 'express';

export function sendSuccess(res: Response, data: any, message?: string) {
  return res.json({ success: true, message: message || 'OK', data });
}

export function sendError(res: Response, status: number, message: string, details?: any) {
  return res.status(status).json({ success: false, message, details });
}

export function getClientIp(req: Request): string {
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string') return xff.split(',')[0].trim();
  return req.socket.remoteAddress || '127.0.0.1';
}

// Escape < and > to neuter angle-bracket XSS. This is NOT a general HTML
// sanitizer: it does not escape &, ", ', javascript: URIs, or attributes.
// For user-controlled HTML, use DOMPurify with a strict allowlist instead.
export function escapeAngleBrackets(input: string): string {
  return input.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function parseCookies(cookieHeader?: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(';').forEach(pair => {
    const [key, ...val] = pair.trim().split('=');
    if (key) cookies[key.trim()] = val.join('=');
  });
  return cookies;
}

export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
