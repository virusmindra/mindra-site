'use client';

import { useTheme } from '../theme/useTheme';

export default function SettingsPanel() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-xl font-semibold text-white">Настройки</h1>
      <p className="text-sm text-zinc-400 mt-1">Управляй темой, пушами и режимами уведомлений.</p>

      <div className="mt-6 space-y-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-white">Тема</div>
              <div className="text-xs text-zinc-400">Light / Dark</div>
            </div>

            <div className="inline-flex rounded-full bg-zinc-900 p-1 text-[11px]">
              <button
                onClick={() => setTheme('light')}
                className={[
                  'px-2 py-0.5 rounded-full transition',
                  theme === 'light' ? 'bg-white text-zinc-900' : 'text-zinc-300 hover:bg-white/10'
                ].join(' ')}
              >
                ☀️ Light
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={[
                  'px-2 py-0.5 rounded-full transition',
                  theme === 'dark' ? 'bg-white text-zinc-900' : 'text-zinc-300 hover:bg-white/10'
                ].join(' ')}
              >
                🌙 Dark
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-sm font-medium text-white">Push уведомления</div>
          <div className="text-xs text-zinc-400 mt-1">
            (следующий шаг) Тут сделаем тумблер notifyPush + quiet hours.
          </div>
        </div>
      </div>
    </div>
  );
}
