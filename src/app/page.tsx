export default function Home() {
  return (
    <main>
      <section className="border-b border-white/10 bg-gradient-to-b from-zinc-900/30 to-transparent">
        <div className="container py-20 md:py-28 text-center">
          <p className="text-sm uppercase tracking-widest text-zinc-400">Mindra — тёплый AI-друг и коуч</p>
          <h1 className="mt-3 text-4xl md:text-6xl font-semibold leading-tight">
            Поддержка, мотивация и трекер привычек — в одном боте
          </h1>
          <p className="mt-5 max-w-2xl mx-auto text-zinc-300">
            Mindra помогает говорить о важном, держать фокус на целях и заботиться о себе. Работает на 11 языках.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <a className="btn btn-primary" href="https://t.me/talktomindra_bot" target="_blank">
              Запустить в Telegram
            </a>
            <a className="btn btn-ghost" href="#pricing">Тарифы</a>
          </div>
        </div>
      </section>

      <section className="container py-16 md:py-24">
        <h2 className="text-2xl md:text-3xl font-semibold">Что умеет Mindra</h2>
        <div className="mt-8 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            ["Поддерживающий диалог", "Тёплые, бережные ответы — без осуждения и давления."],
            ["Мотивация и коучинг", "План действий, микро-шаги и регулярные чек-ины."],
            ["Цели и привычки", "Добавляй цели, трекер привычек и напоминания."],
            ["Отчёты и статистика", "Недельные отчёты, очки и звания за прогресс."],
            ["Озвучка сообщений", "Голоса (в т.ч. ElevenLabs) и фоновые звуки для сна."],
            ["Премиум-челленджи", "Еженедельные вызовы, пин и авто-снятие после выполнения."],
          ].map(([t, d]) => (
            <div key={t as string} className="rounded-2xl border border-white/10 p-5 bg-white/[0.02]">
              <h3 className="text-lg font-medium">{t}</h3>
              <p className="mt-2 text-sm text-zinc-300">{d}</p>
            </div>
          ))}
        </div>
        <p className="mt-8 text-sm text-zinc-400">
          Языки: рус, укр, пол, англ, исп, фр, нем, каз, арм, груз, рум.
        </p>
      </section>

      <section id="pricing" className="border-t border-white/10 bg-zinc-900/40">
        <div className="container py-16 md:py-24">
          <h2 className="text-2xl md:text-3xl font-semibold">Тарифы</h2>
          <p className="mt-3 text-zinc-300">
            Mindra сейчас работает только в Telegram: <a href="https://t.me/talktomindra_bot" target="_blank">@talktomindra_bot</a>
          </p>

          <div className="mt-8 grid md:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-white/10 p-6 bg-white/[0.02]">
              <h3 className="text-xl font-semibold">Free</h3>
              <p className="mt-2 text-zinc-300">Бесплатно, с лимитами по функциям и сообщениям.</p>
              <ul className="mt-4 space-y-2 text-sm text-zinc-300 list-disc pl-5">
                <li>Базовый чат и поддержка</li>
                <li>Ограниченные цели/привычки/напоминания</li>
                <li>Без ElevenLabs</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-white/10 p-6 bg-white/[0.03]">
              <h3 className="text-xl font-semibold">Mindra+</h3>
              <p className="mt-2 text-zinc-300">Премиум-функции активны, но с мягкими лимитами.</p>
              <ul className="mt-4 space-y-2 text-sm text-zinc-300 list-disc pl-5">
                <li>Премиум-челленджи, отчёты, режимы</li>
                <li>Озвучка (включая ElevenLabs) с месячным лимитом</li>
                <li>Больше целей/привычек/напоминаний</li>
              </ul>
              <div className="mt-4 text-sm text-zinc-400">
                Примеры: $6.99/мес • $17.99/кв • $31.99/полгода • $49.99/год • $159.99 навсегда
              </div>
            </div>

            <div className="rounded-2xl border border-purple-400/30 p-6 bg-gradient-to-br from-purple-600/10 to-fuchsia-500/10">
              <h3 className="text-xl font-semibold">Mindra Pro</h3>
              <p className="mt-2 text-zinc-200">Максимум, без ограничений.</p>
              <ul className="mt-4 space-y-2 text-sm text-zinc-200 list-disc pl-5">
                <li>Безлимитные цели/привычки/напоминания</li>
                <li>ElevenLabs без лимита</li>
                <li>Все премиум-режимы и отчёты</li>
              </ul>
              <div className="mt-4 text-sm text-zinc-300">
                Примеры: $14.99/мес • $38.99/кв • $68.99/полгода • $107.99/год • $299.99 навсегда
              </div>
            </div>
          </div>

          <div className="mt-8">
            <a className="btn btn-primary" href="https://t.me/talktomindra_bot" target="_blank">
              Перейти к боту
            </a>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10">
        <div className="container py-10 text-sm text-zinc-400">
          © {new Date().getFullYear()} Mindra. Любовь, поддержка и дисциплина 💜
        </div>
      </footer>
    </main>
  );
}
