// ==========================================================================
// SUPABASE КЛИЕНТ И ДИАГНОСТИКА СОЕДИНЕНИЯ
// ==========================================================================
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = () => {
  return Boolean(
    supabaseUrl && 
    supabaseAnonKey && 
    !supabaseUrl.includes('placeholder') &&
    supabaseUrl.startsWith('https://')
  );
};

export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Проверка живого соединения с базой данных Supabase
 */
export async function testSupabaseConnection() {
  if (!isSupabaseConfigured()) {
    return { 
      connected: false, 
      message: 'Ключи VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY не обнаружены. Приложение работает в локальном режиме.' 
    };
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('count', { count: 'exact', head: true });

    if (error) {
      return { 
        connected: false, 
        message: `Ошибка Supabase API: ${error.message}` 
      };
    }

    return { 
      connected: true, 
      message: 'Подключение к Supabase PostgreSQL успешно! Таблица profiles доступна.' 
    };
  } catch (err) {
    return { 
      connected: false, 
      message: `Сетевая ошибка: ${err.message}` 
    };
  }
}
