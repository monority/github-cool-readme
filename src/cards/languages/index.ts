import { ConfigError } from '../../shape.ts';
import type { CardDef } from '../card.ts';
import { languagesData, type LanguageItem } from './data.ts';
import { renderLanguages } from './classic.ts';
import { renderDisplayLanguages } from './display.ts';

export interface LanguagesSettings {
  title: string | null;
  /** Entries shown, "Other" included: up to MAX_LANGUAGES, the rows that fit on the card. */
  count: number;
  /** Languages left out: their share is dropped. */
  hide: string[];
  /** Weight per repo; 1 is neutral, 0 leaves it out. */
  repos: Record<string, number>;
  /** Fold the remaining languages into an "Other" entry. */
  other: boolean;
  /** The display styles: one language at a time (slides), or all of them on lines with their share. */
  layout: 'slides' | 'list';
}

export const MAX_LANGUAGES = 6;

export const languages: CardDef<'languages', LanguagesSettings, LanguageItem[]> = {
  name: 'languages',
  on: true,
  alt: 'Most used languages',
  settings: { title: 'Most used languages', count: 6, hide: [], repos: {}, other: true, layout: 'slides' },
  shape: { title: 'string?', count: 'number', hide: 'string[]', repos: 'weights', other: 'boolean', layout: 'string' },
  check: (s) => {
    if (s.count > MAX_LANGUAGES) throw new ConfigError(`"cards.languages.count" must be at most ${MAX_LANGUAGES}, "Other" included`);
    if (s.layout !== 'slides' && s.layout !== 'list') throw new ConfigError('"cards.languages.layout" must be "slides" or "list"');
  },
  data: languagesData,
  classic: (data, theme, config) => renderLanguages(data, theme, config),
  display: (data, style, config) => renderDisplayLanguages(data, config.cards.languages, style),
};
