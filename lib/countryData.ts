const COUNTRY_ALIASES = [
  { name: 'United States', aliases: ['united states', 'united states of america', 'usa', 'u.s.a.', 'us', 'u.s.'] },
  { name: 'United Kingdom', aliases: ['united kingdom', 'uk', 'u.k.', 'england', 'scotland', 'wales', 'northern ireland', 'great britain'] },
  { name: 'Canada', aliases: ['canada'] },
  { name: 'Australia', aliases: ['australia'] },
  { name: 'New Zealand', aliases: ['new zealand'] },
  { name: 'Germany', aliases: ['germany', 'deutschland'] },
  { name: 'France', aliases: ['france'] },
  { name: 'Italy', aliases: ['italy'] },
  { name: 'Spain', aliases: ['spain'] },
  { name: 'Portugal', aliases: ['portugal'] },
  { name: 'Netherlands', aliases: ['netherlands', 'the netherlands', 'holland'] },
  { name: 'Belgium', aliases: ['belgium'] },
  { name: 'Switzerland', aliases: ['switzerland'] },
  { name: 'Austria', aliases: ['austria'] },
  { name: 'Ireland', aliases: ['ireland'] },
  { name: 'Denmark', aliases: ['denmark'] },
  { name: 'Sweden', aliases: ['sweden'] },
  { name: 'Norway', aliases: ['norway'] },
  { name: 'Finland', aliases: ['finland'] },
  { name: 'Iceland', aliases: ['iceland'] },
  { name: 'Poland', aliases: ['poland'] },
  { name: 'Czech Republic', aliases: ['czech republic', 'czechia'] },
  { name: 'Hungary', aliases: ['hungary'] },
  { name: 'Romania', aliases: ['romania'] },
  { name: 'Greece', aliases: ['greece'] },
  { name: 'Turkey', aliases: ['turkey', 'turkiye'] },
  { name: 'Russia', aliases: ['russia', 'russian federation'] },
  { name: 'Ukraine', aliases: ['ukraine'] },
  { name: 'Israel', aliases: ['israel'] },
  { name: 'Saudi Arabia', aliases: ['saudi arabia', 'kingdom of saudi arabia', 'ksa'] },
  { name: 'United Arab Emirates', aliases: ['united arab emirates', 'uae', 'u.a.e.'] },
  { name: 'Qatar', aliases: ['qatar'] },
  { name: 'Kuwait', aliases: ['kuwait'] },
  { name: 'Bahrain', aliases: ['bahrain'] },
  { name: 'Oman', aliases: ['oman'] },
  { name: 'Jordan', aliases: ['jordan'] },
  { name: 'Lebanon', aliases: ['lebanon'] },
  { name: 'Egypt', aliases: ['egypt'] },
  { name: 'Morocco', aliases: ['morocco'] },
  { name: 'Tunisia', aliases: ['tunisia'] },
  { name: 'Algeria', aliases: ['algeria'] },
  { name: 'South Africa', aliases: ['south africa'] },
  { name: 'Nigeria', aliases: ['nigeria'] },
  { name: 'Kenya', aliases: ['kenya'] },
  { name: 'Ethiopia', aliases: ['ethiopia'] },
  { name: 'Ghana', aliases: ['ghana'] },
  { name: 'India', aliases: ['india'] },
  { name: 'Pakistan', aliases: ['pakistan'] },
  { name: 'Bangladesh', aliases: ['bangladesh'] },
  { name: 'Sri Lanka', aliases: ['sri lanka'] },
  { name: 'Nepal', aliases: ['nepal'] },
  { name: 'China', aliases: ['china', "people's republic of china", 'pr china', 'p.r. china', 'p.r.c.', 'prc'] },
  { name: 'Hong Kong', aliases: ['hong kong'] },
  { name: 'Taiwan', aliases: ['taiwan', 'republic of china'] },
  { name: 'Japan', aliases: ['japan'] },
  { name: 'South Korea', aliases: ['south korea', 'republic of korea', 'korea'] },
  { name: 'Singapore', aliases: ['singapore'] },
  { name: 'Malaysia', aliases: ['malaysia'] },
  { name: 'Thailand', aliases: ['thailand'] },
  { name: 'Vietnam', aliases: ['vietnam', 'viet nam'] },
  { name: 'Indonesia', aliases: ['indonesia'] },
  { name: 'Philippines', aliases: ['philippines'] },
  { name: 'Brazil', aliases: ['brazil', 'brasil'] },
  { name: 'Mexico', aliases: ['mexico'] },
  { name: 'Argentina', aliases: ['argentina'] },
  { name: 'Chile', aliases: ['chile'] },
  { name: 'Colombia', aliases: ['colombia'] },
  { name: 'Peru', aliases: ['peru'] },
];

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/\s+/g, ' ').trim();
}

export const COUNTRY_OPTIONS = COUNTRY_ALIASES.map((country) => country.name).sort((a, b) =>
  a.localeCompare(b),
);

const COUNTRY_MATCHERS = COUNTRY_ALIASES.flatMap((country) =>
  country.aliases.map((alias) => ({
    canonicalName: country.name,
    pattern: new RegExp(`(^|[^a-z])${escapeRegex(alias)}(?=[^a-z]|$)`, 'i'),
    normalizedAlias: normalizeText(alias),
  })),
).sort((a, b) => b.normalizedAlias.length - a.normalizedAlias.length);

export function normalizeCountryInput(value: string): string {
  const normalized = normalizeText(value);
  const match = COUNTRY_MATCHERS.find((entry) => entry.normalizedAlias === normalized);
  return match?.canonicalName ?? value.trim();
}

export function extractCountriesFromAffiliations(affiliations: string[]): string[] {
  const found = new Set<string>();

  for (const affiliation of affiliations) {
    for (const matcher of COUNTRY_MATCHERS) {
      if (matcher.pattern.test(affiliation)) {
        found.add(matcher.canonicalName);
      }
    }
  }

  return Array.from(found).sort((a, b) => a.localeCompare(b));
}
