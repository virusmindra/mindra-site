'use client';

import {useEffect, useMemo, useState} from 'react';
import {useTranslations} from 'next-intl';
import FoundersToggle from '@/components/FoundersToggle';

type Prices = { monthly?: number; q3?: number; q6?: number; annual?: number; lifetime?: number; };
type Tier = {
  code: 'free'|'lite'|'std'|'pro';
  nameKey: string;
  descKey?: string;
  minutes?: string;
  prices: Prices;
};

const TIERS: Tier[] = [
  { code:'free', nameKey:'donate.tier.free.name', descKey:'donate.tier.free.desc', prices:{} },
  { code:'lite', nameKey:'donate.tier.lite.name', minutes:'donate.tier.lite.minutes',
    prices:{monthly:15,q3:40,q6:75,annual:150,lifetime:300} },
  { code:'std', nameKey:'donate.tier.std.name', minutes:'donate.tier.std.minutes',
    prices:{monthly:30,q3:80,q6:150,annual:280,lifetime:500} },
  { code:'pro', nameKey:'donate.tier.pro.name', minutes:'donate.tier.pro.minutes',
    prices:{monthly:50,q3:135,q6:250,annual:480,lifetime:800} },
];

function withDiscount(p:number|undefined, pct:number){ if(!p) return undefined; return Math.round(p*(1-pct/100)*100)/100;}
const usd=(n:number)=>`$${n.toFixed(n%1?2:0)}`;

export default function PricingClient({locale, defaultFounder}:{locale:string, defaultFounder:number}) {
  // ВАЖНО: без namespace, ключи полные — "donate.…"
  const t = useTranslations();
  const [founderPct, setFounderPct] = useState<number>(defaultFounder); // 0 | 35 | 40

  useEffect(() => {
    const u = new URL(window.location.href);
    if (founderPct) u.searchParams.set('founder', String(founderPct));
    else u.searchParams.delete('founder');
    window.history.replaceState(null,'',u.toString());
  }, [founderPct]);

  const tiers = useMemo(() => TIERS, []);

  return (
    <>
      <h2 className="mt-10 text-2xl font-semibold">{t('donate.plans.title')}</h2>
      <p className="mt-2 opacity-90">{t('donate.plans.subtitle')}</p>

      <FoundersToggle
        defaultPercent={founderPct}
        onChange={setFounderPct}
        label={t('donate.founders.toggle')}
        badge35={t('donate.founders.badge35')}
        badge40={t('donate.founders.badge40')}
      />

      <div className="grid md:grid-cols-3 gap-4 mt-6">
        {tiers.map(tier => {
          const p = tier.prices;
          const d = (x?:number)=>withDiscount(x, founderPct);
          const hasPrices = Object.keys(p).length>0;

          return (
            <div key={tier.code} className="rounded-2xl border border-white/10 p-6">
              <h3 className="text-xl font-semibold">{t(tier.nameKey)}</h3>
              {tier.descKey && <p className="opacity-80 mt-2">{t(tier.descKey)}</p>}
              {tier.minutes && <p className="opacity-80 mt-2">{t(tier.minutes)}</p>}

              {hasPrices ? (
                <table className="w-full text-sm mt-4">
                  <tbody className="[&_tr+tr]:border-t [&_tr+tr]:border-white/10">
                    {p.monthly && (
                      <tr>
                        <td className="py-2">{t('donate.plans.monthly')}</td>
                        <td className="py-2 text-right">
                          <Price base={p.monthly} discounted={d(p.monthly)} />
                        </td>
                      </tr>
                    )}
                    {p.q3 && (
                      <tr>
                        <td className="py-2">{t('donate.plans.q3')}</td>
                        <td className="py-2 text-right">
                          <Price base={p.q3} discounted={d(p.q3)} />
                        </td>
                      </tr>
                    )}
                    {p.q6 && (
                      <tr>
                        <td className="py-2">{t('donate.plans.q6')}</td>
                        <td className="py-2 text-right">
                          <Price base={p.q6} discounted={d(p.q6)} />
                        </td>
                      </tr>
                    )}
                    {p.annual && (
                      <tr>
                        <td className="py-2">{t('donate.plans.annual')}</td>
                        <td className="py-2 text-right">
                          <Price base={p.annual} discounted={d(p.annual)} />
                        </td>
                      </tr>
                    )}
                    {p.lifetime && (
                      <tr>
                        <td className="py-2">{t('donate.plans.lifetime')}</td>
                        <td className="py-2 text-right">
                          <Price base={p.lifetime} discounted={d(p.lifetime)} />
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              ) : (
                <p className="opacity-80 mt-3">{t('donate.plans.freeNote')}</p>
              )}

              <div className="mt-4">
                <a
                  className="inline-block rounded-xl px-4 py-2 border border-white/20 hover:bg-white hover:text-zinc-900 transition"
                  href="#"
                  onClick={(e)=>{e.preventDefault(); alert(t('donate.plans.soon'));}}
                >
                  {t('donate.plans.select')}
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function Price({base, discounted}:{base:number, discounted?:number}) {
  if (!discounted || discounted===base) {
    return <span className="font-semibold">{usd(base)}</span>;
  }
  return (
    <div className="flex items-center justify-end gap-2">
      <span className="line-through opacity-50">{usd(base)}</span>
      <span className="font-semibold">{usd(discounted)}</span>
    </div>
  );
}
