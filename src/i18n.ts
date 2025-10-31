// src/i18n.ts
export const locales = ['ru','en','uk','pl','es','fr','de','kk','hy','ka','md'] as const;
export type Locale = typeof locales[number];
export const defaultLocale: Locale = 'en';

// --- Импорты словарей ПО ЛОКАЛЯМ ---
// EN
import enBase from '@/app/[locale]/messages/en.json';
import enPricing from '@/app/[locale]/messages/en.pricing.json';
import enDonate from '@/app/[locale]/messages/en.donate.json';
import enSupport from '@/app/[locale]/messages/en.supportPage.json';
import enThanks from '@/app/[locale]/messages/en.thanks.json';

// RU
import ruBase from '@/app/[locale]/messages/ru.json';
import ruPricing from '@/app/[locale]/messages/ru.pricing.json';
import ruDonate from '@/app/[locale]/messages/ru.donate.json';
import ruSupport from '@/app/[locale]/messages/ru.supportPage.json';
import ruThanks from '@/app/[locale]/messages/ru.thanks.json';

// UK
import ukBase from '@/app/[locale]/messages/uk.json';
import ukPricing from '@/app/[locale]/messages/uk.pricing.json';
import ukDonate from '@/app/[locale]/messages/uk.donate.json';
import ukSupport from '@/app/[locale]/messages/uk.supportPage.json';
import ukThanks from '@/app/[locale]/messages/uk.thanks.json';

// PL
import plBase from '@/app/[locale]/messages/pl.json';
import plPricing from '@/app/[locale]/messages/pl.pricing.json';
import plDonate from '@/app/[locale]/messages/pl.donate.json';
import plSupport from '@/app/[locale]/messages/pl.supportPage.json';
import plThanks from '@/app/[locale]/messages/pl.thanks.json';

// ES
import esBase from '@/app/[locale]/messages/es.json';
import esPricing from '@/app/[locale]/messages/es.pricing.json';
import esDonate from '@/app/[locale]/messages/es.donate.json';
import esSupport from '@/app/[locale]/messages/es.supportPage.json';
import esThanks from '@/app/[locale]/messages/es.thanks.json';

// FR
import frBase from '@/app/[locale]/messages/fr.json';
import frPricing from '@/app/[locale]/messages/fr.pricing.json';
import frDonate from '@/app/[locale]/messages/fr.donate.json';
import frSupport from '@/app/[locale]/messages/fr.supportPage.json';
import frThanks from '@/app/[locale]/messages/fr.thanks.json';

// DE
import deBase from '@/app/[locale]/messages/de.json';
import dePricing from '@/app/[locale]/messages/de.pricing.json';
import deDonate from '@/app/[locale]/messages/de.donate.json';
import deSupport from '@/app/[locale]/messages/de.supportPage.json';
import deThanks from '@/app/[locale]/messages/de.thanks.json';

// KK
import kkBase from '@/app/[locale]/messages/kk.json';
import kkPricing from '@/app/[locale]/messages/kk.pricing.json';
import kkDonate from '@/app/[locale]/messages/kk.donate.json';
import kkSupport from '@/app/[locale]/messages/kk.supportPage.json';
import kkThanks from '@/app/[locale]/messages/kk.thanks.json';

// HY
import hyBase from '@/app/[locale]/messages/hy.json';
import hyPricing from '@/app/[locale]/messages/hy.pricing.json';
import hyDonate from '@/app/[locale]/messages/hy.donate.json';
import hySupport from '@/app/[locale]/messages/hy.supportPage.json';
import hyThanks from '@/app/[locale]/messages/hy.thanks.json';

// KA
import kaBase from '@/app/[locale]/messages/ka.json';
import kaPricing from '@/app/[locale]/messages/ka.pricing.json';
import kaDonate from '@/app/[locale]/messages/ka.donate.json';
import kaSupport from '@/app/[locale]/messages/ka.supportPage.json';
import kaThanks from '@/app/[locale]/messages/ka.thanks.json';

// MD
import mdBase from '@/app/[locale]/messages/md.json';
import mdPricing from '@/app/[locale]/messages/md.pricing.json';
import mdDonate from '@/app/[locale]/messages/md.donate.json';
import mdSupport from '@/app/[locale]/messages/md.supportPage.json';
import mdThanks from '@/app/[locale]/messages/md.thanks.json';

// --- Утилиты ---
// Глубокий мердж простых объектов
function deepMerge<T extends Record<string, any>>(...objs: T[]): T {
  const out: any = {};
  for (const o of objs) {
    for (const [k, v] of Object.entries(o || {})) {
      if (v && typeof v === 'object' && !Array.isArray(v)) {
        out[k] = deepMerge(out[k] || {}, v);
      } else {
        out[k] = v;
      }
    }
  }
  return out;
}

// Превращает плоские ключи "a.b.c": "x" во вложенный объект {a:{b:{c:"x"}}}
// Уже вложенные секции (например footer:{...}) оставляем как есть.
function inflateDots(obj: Record<string, any>): Record<string, any> {
  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      // уже вложенный объект — просто мерджим
      result[key] = inflateDots(value);
      continue;
    }
    if (key.includes('.')) {
      const parts = key.split('.');
      let cur = result;
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i]!;
        if (i === parts.length - 1) {
          cur[p] = value;
        } else {
          cur[p] = cur[p] && typeof cur[p] === 'object' ? cur[p] : {};
          cur = cur[p];
        }
      }
    } else {
      result[key] = value;
    }
  }
  return result;
}

// Склейка файлов локали, затем инфлейт плоских ключей
function buildMessages(...chunks: Record<string, any>[]) {
  const merged = deepMerge(...chunks);
  return deepMerge(merged, inflateDots(merged));
}

// --- Карта сообщений по локалям (уже собранных) ---
const MAP: Record<Locale, Record<string, any>> = {
  en: buildMessages(enBase, enPricing, enDonate, enSupport, enThanks),
  ru: buildMessages(ruBase, ruPricing, ruDonate, ruSupport, ruThanks),
  uk: buildMessages(ukBase, ukPricing, ukDonate, ukSupport, ukThanks),
  pl: buildMessages(plBase, plPricing, plDonate, plSupport, plThanks),
  es: buildMessages(esBase, esPricing, esDonate, esSupport, esThanks),
  fr: buildMessages(frBase, frPricing, frDonate, frSupport, frThanks),
  de: buildMessages(deBase, dePricing, deDonate, deSupport, deThanks),
  kk: buildMessages(kkBase, kkPricing, kkDonate, kkSupport, kkThanks),
  hy: buildMessages(hyBase, hyPricing, hyDonate, hySupport, hyThanks),
  ka: buildMessages(kaBase, kaPricing, kaDonate, kaSupport, kaThanks),
  md: buildMessages(mdBase, mdPricing, mdDonate, mdSupport, mdThanks),
};

export function getMessagesSync(locale: Locale): Record<string, any> {
  return MAP[locale] ?? MAP.en;
}
