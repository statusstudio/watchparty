import { createClient, SupabaseClient } from '@supabase/supabase-js';

export class ServerSupabaseService {
  private client: SupabaseClient | null = null;
  private configured: boolean = false;
  private saveDebounceTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.init();
  }

  public getCredentials(): { url: string; key: string; rawUrl: string } {
    const rawUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
    let url = rawUrl;

    // Auto-fix if user pasted Dashboard URL (e.g., https://supabase.com/dashboard/project/xyz or https://supabase.com/dashboard/org/xyz)
    if (url.includes('supabase.com/dashboard/')) {
      const segments = url.split('?')[0].split('/').filter(Boolean);
      const ref = segments[segments.length - 1];
      if (ref && ref.length >= 10 && !ref.includes('.')) {
        url = `https://${ref}.supabase.co`;
        console.log(`[ServerSupabaseService] Auto-converted dashboard URL to: ${url}`);
      }
    }

    const key = (
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_KEY ||
      process.env.VITE_SUPABASE_ANON_KEY ||
      ''
    ).trim();

    return { url, key, rawUrl };
  }

  public init(): boolean {
    const { url, key } = this.getCredentials();
    if (url && key && url.startsWith('http') && key.length > 20) {
      try {
        this.client = createClient(url, key, {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        });
        this.configured = true;
        console.log('✅ ServerSupabaseService: Initialized with URL:', url);
        return true;
      } catch (err) {
        console.error('❌ ServerSupabaseService: Failed to create client:', err);
        this.client = null;
        this.configured = false;
        return false;
      }
    } else {
      this.configured = false;
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

    const { url, key, rawUrl } = this.getCredentials();
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

    if (!this.client) {
      return {
        configured: false,
        connected: false,
        message: 'ค่า SUPABASE_URL หรือ SUPABASE_KEY ไม่ถูกต้อง (URL ต้องขึ้นต้นด้วย https:// และ KEY ต้องเป็นคีย์สมบูรณ์)',
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
        return {
          configured: true,
          connected: false,
          message: `Supabase ตอบกลับข้อผิดพลาด: ${error.message} (กรุณาตรวจสอบว่าใส่ Project URL และ API Key ถูกต้องหรือไม่)`,
        };
      }

      return {
        configured: true,
        connected: true,
        message: 'เชื่อมต่อ Supabase สำเร็จ ข้อมูลสมาชิก ห้อง และคิวเพลงจะถูกบันทึกบน Cloud ถาวร 100%',
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
