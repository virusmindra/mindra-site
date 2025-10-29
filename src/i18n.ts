// src/i18n.ts
import {getRequestConfig} from 'next-intl/server';
import type {AbstractIntlMessages} from 'next-intl';

// поддерживаемые локали
export const locales = ['en','ru','uk','pl','es','fr','de','kk','hy','ka','md'] as const;
export type AppLocale = typeof locales[number];
export const defaultLocale: AppLocale = 'en';

// ----------------- СБОРКА СООБЩЕНИЙ -----------------
type Dict = Record<string, any>;
type Locale = AppLocale;

// утилиты
const unflat = (obj: Dict): Dict => {
  const out: Dict = {};
  for (const [k, v] of Object.entries(obj ?? {})) {
    const parts = k.split('.');
    let cur = out;
    parts.forEach((p, i) => {
      if (i === parts.length - 1) cur[p] = v;
      else cur[p] = typeof cur[p] === 'object' && cur[p] ? cur[p] : {};
      cur = cur[p];
    });
  }
  return out;
};
const dmerge = (a: Dict, b: Dict): Dict => {
  const out: Dict = Array.isArray(a) ? [...a] : {...a};
  for (const [k, v] of Object.entries(b ?? {})) {
    out[k] = v && typeof v === 'object' && !Array.isArray(v) ? dmerge(out[k] ?? {}, v) : v;
  }
  return out;
};

// БАЗА (плоские json)
import enBase from '@/app/[locale]/messages/en.json';
import ruBase from '@/app/[locale]/messages/ru.json';
import ukBase from '@/app/[locale]/messages/uk.json';
import plBase from '@/app/[locale]/messages/pl.json';
import esBase from '@/app/[locale]/messages/es.json';
import frBase from '@/app/[locale]/messages/fr.json';
import deBase from '@/app/[locale]/messages/de.json';
import kkBase from '@/app/[locale]/messages/kk.json';
import hyBase from '@/app/[locale]/messages/hy.json';
import kaBase from '@/app/[locale]/messages/ka.json';
import mdBase from '@/app/[locale]/messages/md.json';

// namespaces
import enHeader from '@/app/[locale]/messages/en.header.json';
import ruHeader from '@/app/[locale]/messages/ru.header.json';
import ukHeader from '@/app/[locale]/messages/uk.header.json';
import plHeader from '@/app/[locale]/messages/pl.header.json';
import esHeader from '@/app/[locale]/messages/es.header.json';
import frHeader from '@/app/[locale]/messages/fr.header.json';
import deHeader from '@/app/[locale]/messages/de.header.json';
import kkHeader from '@/app/[locale]/messages/kk.header.json';
import hyHeader from '@/app/[locale]/messages/hy.header.json';
import kaHeader from '@/app/[locale]/messages/ka.header.json';
import mdHeader from '@/app/[locale]/messages/md.header.json';

import enPricing from '@/app/[locale]/messages/en.pricing.json';
import ruPricing from '@/app/[locale]/messages/ru.pricing.json';
import ukPricing from '@/app/[locale]/messages/uk.pricing.json';
import plPricing from '@/app/[locale]/messages/pl.pricing.json';
import esPricing from '@/app/[locale]/messages/es.pricing.json';
import frPricing from '@/app/[locale]/messages/fr.pricing.json';
import dePricing from '@/app/[locale]/messages/de.pricing.json';
import kkPricing from '@/app/[locale]/messages/kk.pricing.json';
import hyPricing from '@/app/[locale]/messages/hy.pricing.json';
import kaPricing from '@/app/[locale]/messages/ka.pricing.json';
import mdPricing from '@/app/[locale]/messages/md.pricing.json';

import enDonate from '@/app/[locale]/messages/en.donate.json';
import ruDonate from '@/app/[locale]/messages/ru.donate.json';
import ukDonate from '@/app/[locale]/messages/uk.donate.json';
import plDonate from '@/app/[locale]/messages/pl.donate.json';
import esDonate from '@/app/[locale]/messages/es.donate.json';
import frDonate from '@/app/[locale]/messages/fr.donate.json';
import deDonate from '@/app/[locale]/messages/de.donate.json';
import kkDonate from '@/app/[locale]/messages/kk.donate.json';
import hyDonate from '@/app/[locale]/messages/hy.donate.json';
import kaDonate from '@/app/[locale]/messages/ka.donate.json';
import mdDonate from '@/app/[locale]/messages/md.donate.json';

import enThanks from '@/app/[locale]/messages/en.thanks.json';
import ruThanks from '@/app/[locale]/messages/ru.thanks.json';
import ukThanks from '@/app/[locale]/messages/uk.thanks.json';
import plThanks from '@/app/[locale]/messages/pl.thanks.json';
import esThanks from '@/app/[locale]/messages/es.thanks.json';
import frThanks from '@/app/[locale]/messages/fr.thanks.json';
import deThanks from '@/app/[locale]/messages/de.thanks.json';
import kkThanks from '@/app/[locale]/messages/kk.thanks.json';
import hyThanks from '@/app/[locale]/messages/hy.thanks.json';
import kaThanks from '@/app/[locale]/messages/ka.thanks.json';
import mdThanks from '@/app/[locale]/messages/md.thanks.json';

import enSupport from '@/app/[locale]/messages/en.supportPage.json';
import ruSupport from '@/app/[locale]/messages/ru.supportPage.json';
import ukSupport from '@/app/[locale]/messages/uk.supportPage.json';
import plSupport from '@/app/[locale]/messages/pl.supportPage.json';
import esSupport from '@/app/[locale]/messages/es.supportPage.json';
import frSupport from '@/app/[locale]/messages/fr.supportPage.json';
import deSupport from '@/app/[locale]/messages/de.supportPage.json';
import kkSupport from '@/app/[locale]/messages/kk.supportPage.json';
import hySupport from '@/app/[locale]/messages/hy.supportPage.json';
import kaSupport from '@/app/[locale]/messages/ka.supportPage.json';
import mdSupport from '@/app/[locale]/messages/md.supportPage.json';

const BASE: Record<Locale, Dict> = {en: enBase, ru: ruBase, uk: ukBase, pl: plBase, es: esBase, fr: frBase, de: deBase, kk: kkBase, hy: hyBase, ka: kaBase, md: mdBase};
const HEADER: Record<Locale, Dict> = {en: enHeader, ru: ruHeader, uk: ukHeader, pl: plHeader, es: esHeader, fr: frHeader, de: deHeader, kk: kkHeader, hy: hyHeader, ka: kaHeader, md: mdHeader};
const PRICING: Record<Locale, Dict> = {en: enPricing, ru: ruPricing, uk: ukPricing, pl: plPricing, es: esPricing, fr: frPricing, de: dePricing, kk: kkPricing, hy: hyPricing, ka: kaPricing, md: mdPricing};
const DONATE: Record<Locale, Dict> = {en: enDonate, ru: ruDonate, uk: ukDonate, pl: plDonate, es: esDonate, fr: frDonate, de: deDonate, kk: kkDonate, hy: hyDonate, ka: kaDonate, md: mdDonate};
const THANKS: Record<Locale, Dict> = {en: enThanks, ru: ruThanks, uk: ukThanks, pl: plThanks, es: esThanks, fr: frThanks, de: deThanks, kk: kkThanks, hy: hyThanks, ka: kaThanks, md: mdThanks};
const SUPPORT: Record<Locale, Dict> = {en: enSupport, ru: ruSupport, uk: ukSupport, pl: plSupport, es: esSupport, fr: frSupport, de: deSupport, kk: kkSupport, hy: hySupport, ka: kaSupport, md: mdSupport};

export async function getMessages({locale}: {locale: string}): Promise<AbstractIntlMessages> {
  const fb: Locale = defaultLocale;
  const lng = (locales as readonly string[]).includes(locale) ? (locale as Locale) : fb;

  let msg: Dict = dmerge(unflat(BASE[fb] ?? {}), unflat(BASE[lng] ?? {}));
  for (const pack of [HEADER, PRICING, DONATE, THANKS]) {
    msg = dmerge(msg, unflat(pack[fb] ?? {}));
    msg = dmerge(msg, unflat(pack[lng] ?? {}));
  }
  msg.supportPage = dmerge(unflat(SUPPORT[fb] ?? {}), unflat(SUPPORT[lng] ?? {}));

  return msg as AbstractIntlMessages;
}

export default getRequestConfig(async ({locale}) => {
  const supported = new Set<string>(locales as readonly string[]);
  const chosen = (locale && supported.has(locale)) ? (locale as AppLocale) : defaultLocale;

  const messages = await getMessages({ locale: chosen }) as AbstractIntlMessages;

  // <= ВАЖНО: вернуть и locale, и messages, чтобы удовлетворить d.ts твоей версии
  return {
    locale: chosen,
    messages
  } as const;
});