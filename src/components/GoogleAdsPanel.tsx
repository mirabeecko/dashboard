'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Target, MapPin, Search } from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
  status: string;
  channelType: string;
  startDate: string;
  endDate: string;
  budgetMicros: number;
  clicks: number;
  impressions: number;
  costMicros: number;
  conversions: number;
  avgCpcMicros: number;
}

interface Keyword {
  adGroupId: string;
  adGroupName: string;
  text: string;
  matchType: string;
  negative: boolean;
  status: string;
  clicks: number;
  impressions: number;
  costMicros: number;
  conversions: number;
}

interface GeoTarget {
  campaignId: string;
  campaignName: string;
  geoTargetConstant: string;
  negative: boolean;
  bidModifier: number;
}

function microsToCurrency(micros: number): string {
  return (micros / 1_000_000).toLocaleString('cs-CZ', {
    style: 'currency',
    currency: 'CZK',
    maximumFractionDigits: 0,
  });
}

function formatNumber(n: number): string {
  return n.toLocaleString('cs-CZ');
}

export default function GoogleAdsPanel({ customerId }: { customerId?: string }) {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<'campaigns' | 'keywords' | 'geo'>('campaigns');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [geoTargets, setGeoTargets] = useState<GeoTarget[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session || !customerId) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [campRes, kwRes, geoRes] = await Promise.all([
          fetch(`/api/google-ads?customerId=${customerId}&type=campaigns`),
          fetch(`/api/google-ads?customerId=${customerId}&type=keywords`),
          fetch(`/api/google-ads?customerId=${customerId}&type=geo`),
        ]);

        if (!campRes.ok) throw new Error((await campRes.json()).error);
        if (!kwRes.ok) throw new Error((await kwRes.json()).error);
        if (!geoRes.ok) throw new Error((await geoRes.json()).error);

        setCampaigns((await campRes.json()).campaigns || []);
        setKeywords((await kwRes.json()).keywords || []);
        setGeoTargets((await geoRes.json()).geo || []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Chyba');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [session, customerId]);

  if (!customerId) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-700">
        <p className="font-medium">Google Ads není nakonfigurován</p>
        <p className="mt-1 text-sm">
          Přidej <code className="rounded bg-amber-100 px-1">googleAdsCustomerId</code> do{' '}
          <code className="rounded bg-amber-100 px-1">src/config/sites.ts</code> pro tento web.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
        <p className="font-medium">Google Ads API chyba</p>
        <p className="mt-1 text-sm">{error}</p>
        {error.includes('DEVELOPER_TOKEN') && (
          <p className="mt-2 text-sm">
            Přidej <code className="rounded bg-red-100 px-1">GOOGLE_ADS_DEVELOPER_TOKEN</code> do{' '}
            <code className="rounded bg-red-100 px-1">.env.local</code>.
          </p>
        )}
      </div>
    );
  }

  const tabs = [
    { key: 'campaigns' as const, label: 'Kampaně', icon: <Target className="h-4 w-4" /> },
    { key: 'keywords' as const, label: 'Klíčová slova', icon: <Search className="h-4 w-4" /> },
    { key: 'geo' as const, label: 'Lokality', icon: <MapPin className="h-4 w-4" /> },
  ];

  return (
    <div>
      {/* Tabs */}
      <div className="mb-6 flex gap-2 border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition ${
              activeTab === tab.key
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Campaigns */}
      {activeTab === 'campaigns' && (
        <div className="space-y-4">
          {campaigns.length === 0 ? (
            <p className="text-sm text-gray-500">Žádné aktivní kampaně.</p>
          ) : (
            campaigns.map((c) => (
              <div
                key={c.id}
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h4 className="font-semibold text-gray-900">{c.name}</h4>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-gray-500">
                      <span
                        className={`rounded-full px-2 py-0.5 font-medium ${
                          c.status === 'ENABLED'
                            ? 'bg-green-100 text-green-700'
                            : c.status === 'PAUSED'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {c.status}
                      </span>
                      <span className="rounded-full bg-gray-100 px-2 py-0.5">
                        {c.channelType}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">
                      {microsToCurrency(c.costMicros)}
                    </p>
                    <p className="text-xs text-gray-500">utraceno</p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-xs text-gray-500">Kliknutí</p>
                    <p className="text-lg font-bold text-gray-900">{formatNumber(c.clicks)}</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-xs text-gray-500">Zobrazení</p>
                    <p className="text-lg font-bold text-gray-900">{formatNumber(c.impressions)}</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-xs text-gray-500">Konverze</p>
                    <p className="text-lg font-bold text-gray-900">{c.conversions}</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-xs text-gray-500">Prům. CPC</p>
                    <p className="text-lg font-bold text-gray-900">
                      {microsToCurrency(c.avgCpcMicros)}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-500">
                  <span>Rozpočet: {microsToCurrency(c.budgetMicros)}/den</span>
                  <span>Od: {c.startDate}</span>
                  {c.endDate && <span>Do: {c.endDate}</span>}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Keywords */}
      {activeTab === 'keywords' && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                <th className="pb-3 pr-4">Klíčové slovo</th>
                <th className="pb-3 pr-4">Shoda</th>
                <th className="pb-3 pr-4">Typ</th>
                <th className="pb-3 pr-4 text-right">Kliknutí</th>
                <th className="pb-3 pr-4 text-right">Zobrazení</th>
                <th className="pb-3 text-right">Konverze</th>
              </tr>
            </thead>
            <tbody>
              {keywords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">
                    Žádná klíčová slova.
                  </td>
                </tr>
              ) : (
                keywords.map((k, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="py-3 pr-4 font-medium text-gray-900">{k.text}</td>
                    <td className="py-3 pr-4 text-gray-600">{k.matchType}</td>
                    <td className="py-3 pr-4">
                      {k.negative ? (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                          Vylučující
                        </span>
                      ) : (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                          Cílené
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-right">{formatNumber(k.clicks)}</td>
                    <td className="py-3 pr-4 text-right">{formatNumber(k.impressions)}</td>
                    <td className="py-3 text-right">{k.conversions}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Geo */}
      {activeTab === 'geo' && (
        <div className="space-y-4">
          {geoTargets.length === 0 ? (
            <p className="text-sm text-gray-500">Žádné geografické cílení.</p>
          ) : (
            geoTargets.map((g, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4"
              >
                <div>
                  <p className="font-medium text-gray-900">{g.campaignName}</p>
                  <p className="text-xs text-gray-500">{g.geoTargetConstant}</p>
                </div>
                <div className="flex items-center gap-3">
                  {g.negative ? (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                      Vylučeno
                    </span>
                  ) : (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                      Cíleno
                    </span>
                  )}
                  {g.bidModifier !== 0 && (
                    <span className="text-xs text-gray-500">
                      Bid mod: {g.bidModifier > 0 ? '+' : ''}
                      {(g.bidModifier * 100).toFixed(0)}%
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
