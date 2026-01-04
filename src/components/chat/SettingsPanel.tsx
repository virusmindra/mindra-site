'use client';

import { useTheme } from '@/components/theme/ThemeProvider';

export default function SettingsPanel() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-xl font-semibold text-[var(--text)]">Настройки</h1>
      <p className="text-sm text-[var(--muted)] mt-1">
        Управляй темой, пушами и режимами уведомлений.
      </p>

      <div className="mt-6 space-y-4">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-[var(--text)]">Тема</div>
              <div className="text-xs text-[var(--muted)]">Light / Dark</div>
            </div>

            <div className="inline-flex rounded-full bg-[var(--card)] border border-[var(--border)] p-1 text-[11px]">
              <button
                onClick={() => setTheme('light')}
                className={[
                  'px-2 py-0.5 rounded-full transition',
                  theme === 'light'
                    ? 'bg-[var(--accent)] text-white'
                    : 'text-[var(--muted)] hover:bg-black/5 dark:hover:bg-white/10',
                ].join(' ')}
              >
                ☀️ Light
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={[
                  'px-2 py-0.5 rounded-full transition',
                  theme === 'dark'
                    ? 'bg-[var(--accent)] text-white'
                    : 'text-[var(--muted)] hover:bg-black/5 dark:hover:bg-white/10',
                ].join(' ')}
              >
                🌙 Dark
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
          <div className="text-sm font-medium text-[var(--text)]">Push уведомления</div>
          <div className="text-xs text-[var(--muted)] mt-1">
            (следующий шаг) Тут будет notifyPush + quiet hours.
          </div>
        </div>
      </div>
    </div>
  );
}
