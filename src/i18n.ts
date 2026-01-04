// src/i18n.ts
export const locales = ['ru','en','uk','pl','es','fr','de','kk','hy','ka','md'] as const;
export type Locale = typeof locales[number];
export const defaultLocale: Locale = 'en';

// БАЗОВЫЕ
import enBase from '@/app/[locale]/(site)/messages/en.json';
import ruBase from '@/app/[locale]/(site)/messages/ru.json';
import ukBase from '@/app/[locale]/(site)/messages/uk.json';
import plBase from '@/app/[locale]/(site)/messages/pl.json';
import esBase from '@/app/[locale]/(site)/messages/es.json';
import frBase from '@/app/[locale]/(site)/messages/fr.json';
import deBase from '@/app/[locale]/(site)/messages/de.json';
import kkBase from '@/app/[locale]/(site)/messages/kk.json';
import hyBase from '@/app/[locale]/(site)/messages/hy.json';
import kaBase from '@/app/[locale]/(site)/messages/ka.json';
import mdBase from '@/app/[locale]/(site)/messages/md.json';

import enChat from '@/app/[locale]/(site)/messages/en.chat.json';
import ruChat from '@/app/[locale]/(site)/messages/ru.chat.json';
import ukChat from '@/app/[locale]/(site)/messages/uk.chat.json';
import plChat from '@/app/[locale]/(site)/messages/pl.chat.json';
import esChat from '@/app/[locale]/(site)/messages/es.chat.json';
import frChat from '@/app/[locale]/(site)/messages/fr.chat.json';
import deChat from '@/app/[locale]/(site)/messages/de.chat.json';
import kkChat from '@/app/[locale]/(site)/messages/kk.chat.json';
import hyChat from '@/app/[locale]/(site)/messages/hy.chat.json';
import kaChat from '@/app/[locale]/(site)/messages/ka.chat.json';
import mdChat from '@/app/[locale]/(site)/messages/md.chat.json';

// PRICING
import enPricing from '@/app/[locale]/(site)/messages/en.pricing.json';
import ruPricing from '@/app/[locale]/(site)/messages/ru.pricing.json';
import ukPricing from '@/app/[locale]/(site)/messages/uk.pricing.json';
import plPricing from '@/app/[locale]/(site)/messages/pl.pricing.json';
import esPricing from '@/app/[locale]/(site)/messages/es.pricing.json';
import frPricing from '@/app/[locale]/(site)/messages/fr.pricing.json';
import dePricing from '@/app/[locale]/(site)/messages/de.pricing.json';
import kkPricing from '@/app/[locale]/(site)/messages/kk.pricing.json';
import hyPricing from '@/app/[locale]/(site)/messages/hy.pricing.json';
import kaPricing from '@/app/[locale]/(site)/messages/ka.pricing.json';
import mdPricing from '@/app/[locale]/(site)/messages/md.pricing.json';

// DONATE
import enDonate from '@/app/[locale]/(site)/messages/en.donate.json';
import ruDonate from '@/app/[locale]/(site)/messages/ru.donate.json';
import ukDonate from '@/app/[locale]/(site)/messages/uk.donate.json';
import plDonate from '@/app/[locale]/(site)/messages/pl.donate.json';
import esDonate from '@/app/[locale]/(site)/messages/es.donate.json';
import frDonate from '@/app/[locale]/(site)/messages/fr.donate.json';
import deDonate from '@/app/[locale]/(site)/messages/de.donate.json';
import kkDonate from '@/app/[locale]/(site)/messages/kk.donate.json';
import hyDonate from '@/app/[locale]/(site)/messages/hy.donate.json';
import kaDonate from '@/app/[locale]/(site)/messages/ka.donate.json';
import mdDonate from '@/app/[locale]/(site)/messages/md.donate.json';

// SUPPORT
import enSupport from '@/app/[locale]/(site)/messages/en.supportPage.json';
import ruSupport from '@/app/[locale]/(site)/messages/ru.supportPage.json';
import ukSupport from '@/app/[locale]/(site)/messages/uk.supportPage.json';
import plSupport from '@/app/[locale]/(site)/messages/pl.supportPage.json';
import esSupport from '@/app/[locale]/(site)/messages/es.supportPage.json';
import frSupport from '@/app/[locale]/(site)/messages/fr.supportPage.json';
import deSupport from '@/app/[locale]/(site)/messages/de.supportPage.json';
import kkSupport from '@/app/[locale]/(site)/messages/kk.supportPage.json';
import hySupport from '@/app/[locale]/(site)/messages/hy.supportPage.json';
import kaSupport from '@/app/[locale]/(site)/messages/ka.supportPage.json';
import mdSupport from '@/app/[locale]/(site)/messages/md.supportPage.json';

// THANKS
import enThanks from '@/app/[locale]/(site)/messages/en.thanks.json';
import ruThanks from '@/app/[locale]/(site)/messages/ru.thanks.json';
import ukThanks from '@/app/[locale]/(site)/messages/uk.thanks.json';
import plThanks from '@/app/[locale]/(site)/messages/pl.thanks.json';
import esThanks from '@/app/[locale]/(site)/messages/es.thanks.json';
import frThanks from '@/app/[locale]/(site)/messages/fr.thanks.json';
import deThanks from '@/app/[locale]/(site)/messages/de.thanks.json';
import kkThanks from '@/app/[locale]/(site)/messages/kk.thanks.json';
import hyThanks from '@/app/[locale]/(site)/messages/hy.thanks.json';
import kaThanks from '@/app/[locale]/(site)/messages/ka.thanks.json';
import mdThanks from '@/app/[locale]/(site)/messages/md.thanks.json';


// ❶ НЕ навязываем сложные типы содержимому словарей
type Messages = Record<string, unknown>;
type PerLocale<T> = Partial<Record<Locale, T>>;

// base словари
const BASE: Record<Locale, Messages> = {
  en: enBase, ru: ruBase, uk: ukBase, pl: plBase, es: esBase,
  fr: frBase, de: deBase, kk: kkBase, hy: hyBase, ka: kaBase, md: mdBase
};

const CHAT: PerLocale<Messages> = {
  en: enChat, ru: ruChat, uk: ukChat, pl: plChat, es: esChat,
  fr: frChat, de: deChat, kk: kkChat, hy: hyChat, ka: kaChat, md: mdChat
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
  support: DONATE,
  chat: CHAT,
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
