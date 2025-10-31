// src/i18n.ts
export const locales = ['ru','en','uk','pl','es','fr','de','kk','hy','ka','md'] as const;
export type Locale = typeof locales[number];
export const defaultLocale: Locale = 'en';

// БАЗОВЫЕ
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

// СТРАНИЧНЫЕ (опционально)
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

// ❶ НЕ навязываем сложные типы содержимому словарей
type Messages = Record<string, unknown>;
type PerLocale<T> = Partial<Record<Locale, T>>;

// base словари
const BASE: Record<Locale, Messages> = {
  en: enBase, ru: ruBase, uk: ukBase, pl: plBase, es: esBase,
  fr: frBase, de: deBase, kk: kkBase, hy: hyBase, ka: kaBase, md: mdBase
};

// страничные словари
const PRICING: PerLocale<Messages> = {
  en: enPricing, ru: ruPricing, uk: ukPricing, pl: plPricing, es: esPricing,
  fr: frPricing, de: dePricing, kk: kkPricing, hy: hyPricing, ka: kaPricing, md: mdPricing
};
const DONATE: PerLocale<Messages> = {
  en: enDonate, ru: ruDonate, uk: ukDonate, pl: plDonate, es: esDonate,
  fr: frDonate, de: deDonate, kk: kkDonate, hy: hyDonate, ka: kaDonate, md: mdDonate
};
const SUPPORT: PerLocale<Messages> = {
  en: enSupport, ru: ruSupport, uk: ukSupport, pl: plSupport, es: esSupport,
  fr: frSupport, de: deSupport, kk: kkSupport, hy: hySupport, ka: kaSupport, md: mdSupport
};
const THANKS: PerLocale<Messages> = {
  en: enThanks, ru: ruThanks, uk: ukThanks, pl: plThanks, es: esThanks,
  fr: frThanks, de: deThanks, kk: kkThanks, hy: hyThanks, ka: kaThanks, md: mdThanks
};

// регистр страниц → карта локалей
const PAGE_MAP = {
  pricing: PRICING,
  donate: DONATE,
  support: SUPPORT,
  thanks: THANKS
} as const;
export type PageKey = keyof typeof PAGE_MAP;

// плоский merge
function merge(a: Messages, b?: Messages): Messages {
  return b ? { ...a, ...b } : a;
}

// публичный API
export function getMessagesSync(locale: Locale, page?: PageKey): Messages {
  const base = BASE[locale] ?? BASE.en;
  if (!page) return base;
  const pageDict = PAGE_MAP[page]?.[locale] ?? PAGE_MAP[page]?.en;
  return merge(base, pageDict);
}
