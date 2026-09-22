import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Read server environment variables (supports standard and Vite prefixed variables)
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  '';

export class ServerSupabaseService {
  private client: SupabaseClient | null = null;
  private configured: boolean = false;
  private saveDebounceTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.init();
  }

  private init() {
    if (SUPABASE_URL && SUPABASE_KEY && SUPABASE_URL.startsWith('http') && SUPABASE_KEY.length > 20) {
      try {
        this.client = createClient(SUPABASE_URL, SUPABASE_KEY, {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        });
        this.configured = true;
        console.log('✅ ServerSupabaseService: Initialized with URL:', SUPABASE_URL);
      } catch (err) {
        console.error('❌ ServerSupabaseService: Failed to create client:', err);
        this.client = null;
        this.configured = false;
      }
    } else {
      console.log('ℹ️ ServerSupabaseService: Supabase credentials not set. Operating in local JSON storage mode.');
      this.configured = false;
    }
  }

  public isConfigured(): boolean {
    return this.configured && this.client !== null;
  }

  /**
   * Test connection to Supabase table `app_storage`
   */
  public async checkStatus(): Promise<{ connected: boolean; configured: boolean; message: string }> {
    if (!this.isConfigured() || !this.client) {
      return {
        configured: false,
        connected: false,
        message: 'ยังไม่ได้ตั้งค่า SUPABASE_URL และ SUPABASE_KEY ใน Environment Variables ของ Render',
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
            message: 'เชื่อมต่อ Supabase ได้ แต่ยังไม่ได้สร้างตาราง app_storage (กรุณารันคำสั่งใน supabase/schema.sql)',
          };
        }
        return {
          configured: true,
          connected: false,
          message: `Supabase Error: ${error.message}`,
        };
      }

      return {
        configured: true,
        connected: true,
        message: 'เชื่อมต่อ Supabase สำเร็จ ข้อมูลสมาชิกและห้องจะถูกบันทึกบน Cloud ถาวร 100%',
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
