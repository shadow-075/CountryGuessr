import { normalize } from './utils';

// Common alternative names -> substrings of the official name (all normalized)
const ALIASES = {
  usa: ['united states'], us: ['united states'], america: ['united states'], 'united states of america': ['united states'],
  uk: ['united kingdom'], britain: ['united kingdom'], 'great britain': ['united kingdom'], england: ['united kingdom'],
  uae: ['united arab emirates'], emirates: ['united arab emirates'],
  'ivory coast': ['cote d ivoire'], 'czech republic': ['czechia', 'czech republic'], burma: ['myanmar'], holland: ['netherlands'],
  swaziland: ['eswatini'], macedonia: ['macedonia'], 'east timor': ['timor'], 'timor leste': ['timor'],
  drc: ['democratic republic of the congo', 'dr congo'], 'dr congo': ['democratic republic of the congo', 'dr congo'],
  'congo kinshasa': ['democratic republic of the congo', 'dr congo'], 'democratic republic of congo': ['democratic republic of the congo', 'dr congo'],
  'congo brazzaville': ['republic of the congo', 'congo'], 'republic of congo': ['republic of the congo', 'congo'],
  'cape verde': ['cabo verde', 'cape verde'], 'south korea': ['south korea', 'korea republic', 'republic of korea'],
  'north korea': ['north korea', 'korea democratic', 'democratic peoples republic of korea'],
  russia: ['russia', 'russian federation'], vatican: ['vatican', 'holy see'], turkey: ['turkiye', 'turkey'],
  tanzania: ['tanzania'], iran: ['iran'], syria: ['syria'], bolivia: ['bolivia'], venezuela: ['venezuela'], moldova: ['moldova'],
  laos: ['lao'], vietnam: ['viet nam', 'vietnam'], brunei: ['brunei'], palestine: ['palestin'], micronesia: ['micronesia'],
  'st lucia': ['saint lucia'], 'st kitts and nevis': ['saint kitts'], 'st vincent': ['saint vincent'], 'sao tome': ['sao tome'],
  bahamas: ['bahamas'], gambia: ['gambia'],
};

/** Finds a country from free text: exact name (accent-insensitive) or a known alias. */
export function matchCountry(countries, text) {
  const n = normalize(text);
  if (!n) return null;
  const exact = countries.find((c) => normalize(c.name) === n);
  if (exact) return exact;
  const targets = ALIASES[n];
  if (!targets) return null;
  for (const t of targets) {
    const hit = countries.find((c) => normalize(c.name) === t);
    if (hit) return hit;
  }
  for (const t of targets) {
    const hit = countries.find((c) => normalize(c.name).includes(t));
    if (hit) return hit;
  }
  return null;
}
