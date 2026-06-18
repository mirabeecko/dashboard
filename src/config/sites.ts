export interface Site {
  id: string;
  name: string;
  domain: string;
  measurementId: string;
  propertyId: string; // GA4 property numeric ID
  gtmId: string;
  category: 'ecommerce' | 'leadgen' | 'content';
  googleAdsCustomerId?: string; // 10-digit Google Ads customer ID
}

export const SITES: Site[] = [
  {
    id: 'sheskates',
    name: 'SheSkates',
    domain: 'sheskates.cz',
    measurementId: 'G-KDMZ8KZC3F',
    propertyId: '540216883',
    gtmId: 'GTM-KVV3BZGP',
    category: 'ecommerce',
    // googleAdsCustomerId: '1234567890', // <-- doplň Google Ads Customer ID
  },
  {
    id: 'ninja-tyden',
    name: 'Ninja Týden',
    domain: 'ninja-tyden.cz',
    measurementId: 'G-GBBN7TXHSV',
    propertyId: '539768933',
    gtmId: 'GTM-K946RX5J',
    category: 'leadgen',
    // googleAdsCustomerId: '1234567890',
  },
  {
    id: 'tjkrupka',
    name: 'TJ Krupka',
    domain: 'tjkrupka.cz',
    measurementId: 'G-NM6R8S2X39',
    propertyId: '511361257',
    gtmId: 'GTM-WNJ48SCF',
    category: 'content',
    // googleAdsCustomerId: '1234567890',
  },
  {
    id: 'webdo24',
    name: 'WebDo24',
    domain: 'webdo24.cz',
    measurementId: 'G-815XCLCGY8',
    propertyId: '530284583',
    gtmId: 'GTM-KJNB99JZ',
    category: 'leadgen',
    // googleAdsCustomerId: '1234567890',
  },
];

export function getSiteById(id: string): Site | undefined {
  return SITES.find((s) => s.id === id);
}

export function getSiteByPropertyId(propertyId: string): Site | undefined {
  return SITES.find((s) => s.propertyId === propertyId);
}
