import { createClient, SupabaseClient } from '@supabase/supabase-js';
import WebSocket from 'ws';

// Ensure global WebSocket is available for Supabase Realtime in Node.js
if (typeof (globalThis as any).WebSocket === 'undefined') {
  (globalThis as any).WebSocket = WebSocket;
}

export class ServerSupabaseService {
  private client: SupabaseClient | null = null;
  private configured: boolean = false;
  private initError: string | null = null;

  constructor() {
    this.init();
  }

  public getCredentials(): { url: string; key: string; rawUrl: string; rawKey: string } {
    const rawUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
    let url = rawUrl.replace(/^["'`]|["'`]$/g, '').trim();

    // Auto-fix if user pasted Dashboard URL (e.g., https://supabase.com/dashboard/project/xyz or https://supabase.com/dashboard/org/xyz)
    if (url.includes('supabase.com/dashboard/')) {
      const segments = url.split('?')[0].split('/').filter(Boolean);
      const ref = segments[segments.length - 1];
      if (ref && ref.length >= 10 && !ref.includes('.')) {
        url = `https://${ref}.supabase.co`;
        console.log(`[ServerSupabaseService] Auto-converted dashboard URL to: ${url}`);
      }
    } else if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }

    const rawKey = (
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_KEY ||
      process.env.VITE_SUPABASE_ANON_KEY ||
      ''
    ).trim();
    const key = rawKey.replace(/^["'`]|["'`]$/g, '').trim();

    return { url, key, rawUrl, rawKey };
  }

  public init(): boolean {
    const { url, key } = this.getCredentials();
    if (!url || !key) {
      this.configured = false;
      this.client = null;
      this.initError = 'URL หรือ Key ว่างเปล่า';
      return false;
    }

    try {
      this.client = createClient(url, key, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
        realtime: {
          transport: WebSocket as any,
        },
      });
      this.configured = true;
      this.initError = null;
      console.log('✅ ServerSupabaseService: Initialized with URL:', url);
      return true;
    } catch (err: any) {
      console.error('❌ ServerSupabaseService: Failed to create client:', err);
      this.client = null;
      this.configured = false;
      this.initError = err?.message || String(err);
      return false;
    }
  }

  public isConfigured(): boolean {
    if (!this.configured || !this.client) {
      this.init();
    }
    return this.configured && this.client !== null;
  }

  /**
   * Test connection to Supabase table `app_storage`
   */
  public async checkStatus(): Promise<{ connected: boolean; configured: boolean; message: string; details?: any }> {
    if (!this.isConfigured()) {
      this.init();
    }

    const { url, key } = this.getCredentials();
    if (!url) {
      return {
        configured: false,
        connected: false,
        message: 'ยังไม่ได้ตั้งค่า SUPABASE_URL ใน Environment Variables ของ Render',
      };
    }

    if (!key) {
      return {
        configured: false,
        connected: false,
        message: 'ยังไม่ได้ตั้งค่า SUPABASE_KEY ใน Environment Variables ของ Render',
      };
    }

    // Check if key contains masking dots or bullets (e.g. copied from UI without clicking Copy button)
    if (key.includes('•') || key.includes('...') || key.includes('…')) {
      return {
        configured: false,
        connected: false,
        message: 'ตรวจพบจุดไข่ปลา (••• หรือ ...) ใน SUPABASE_KEY กรุณากดปุ่มไอคอน Copy (รูปสี่เหลี่ยมซ้อนกัน) ใน Supabase เพื่อคัดลอกคีย์ตัวเต็ม',
      };
    }

    if (key.length < 25) {
      return {
        configured: false,
        connected: false,
        message: `SUPABASE_KEY มีความยาวสั้นเกินไป (${key.length} ตัวอักษร: "${key.slice(0, 10)}...") คีย์จริงจะมีความยาว 40 ตัวอักษรขึ้นไป กรุณากดไอคอน Copy เพื่อคัดลอกตัวเต็ม`,
      };
    }

    if (!this.client) {
      return {
        configured: false,
        connected: false,
        message: `ไม่สามารถเชื่อมต่อ Client ได้: ${this.initError || 'โปรดตรวจสอบความถูกต้องของ URL และ Key'}`,
      };
    }

    try {
      const { data, error } = await this.client
        .from('app_storage')
        .select('key, updated_at')
        .limit(1);

      if (error) {
        // Check if table missing
        if (error.message?.includes('relation') || error.code === '42P01') {
          return {
            configured: true,
            connected: false,
            message: 'เชื่อมต่อ Supabase ได้แล้ว แต่ยังไม่ได้สร้างตาราง app_storage (กรุณากดแท็บคำสั่ง SQL แล้วรันใน Supabase Dashboard)',
          };
        }

        // Invalid key
        if (error.message?.includes('Invalid API key') || error.message?.includes('JWT') || (error as any).status === 401) {
          return {
            configured: true,
            connected: false,
            message: `Supabase แจ้งว่า API Key ไม่ถูกต้อง: ให้ใช้คีย์ในกล่อง Secret keys (sb_secret_...) หรือ anon public (eyJ...) จาก Supabase API Settings`,
          };
        }

        return {
          configured: true,
          connected: false,
          message: `Supabase ตอบกลับข้อผิดพลาด: ${error.message}`,
        };
      }

      return {
        configured: true,
        connected: true,
        message: 'เชื่อมต่อ Supabase สำเร็จ ข้อมูลสมาชิก ห้อง และคิวเพลงจะถูกบันทึกบน Cloud ถาวร 100%',
        details: {
          url,
          keyPrefix: `${key.slice(0, 12)}... (${key.length} chars)`,
        },
      };
    } catch (err: any) {
      return {
        configured: true,
        connected: false,
        message: `ข้อผิดพลาดในการเชื่อมต่อ: ${err.message || err}`,
      };
    }
  }

  /**
   * Load JSON document from `app_storage` table
   */
  public async loadData<T>(key: string): Promise<T | null> {
    if (!this.isConfigured() || !this.client) {
      return null;
    }

    try {
      const { data, error } = await this.client
        .from('app_storage')
        .select('data')
        .eq('key', key)
        .maybeSingle();

      if (error) {
        console.warn(`[SupabaseSync] Failed to load data for key "${key}":`, error.message);
        return null;
      }

      if (data && data.data) {
        console.log(`[SupabaseSync] Successfully hydrated "${key}" from Supabase Cloud!`);
        return data.data as T;
      }

      return null;
    } catch (err) {
      console.error(`[SupabaseSync] Error loading "${key}":`, err);
      return null;
    }
  }

  /**
   * Upsert JSON document into `app_storage` table
   */
  public async saveData(key: string, data: any): Promise<boolean> {
    if (!this.isConfigured() || !this.client) {
      return false;
    }

    try {
      const { error } = await this.client
        .from('app_storage')
        .upsert(
          {
            key,
            data,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'key' }
        );

      if (error) {
        console.warn(`[SupabaseSync] Failed to upsert "${key}":`, error.message);
        return false;
      }

      console.log(`[SupabaseSync] Successfully backed up "${key}" to Supabase Cloud!`);
      return true;
    } catch (err) {
      console.error(`[SupabaseSync] Exception while saving "${key}":`, err);
      return false;
    }
  }
}

export const serverSupabaseService = new ServerSupabaseService();
