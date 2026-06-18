/* eslint-disable @typescript-eslint/no-explicit-any */
const API_VERSION = 'v16';
const BASE_URL = `https://googleads.googleapis.com/${API_VERSION}`;

interface GoogleAdsConfig {
  accessToken: string;
  developerToken: string;
  customerId: string;
  loginCustomerId?: string; // pro MCC účty
}

async function searchStream(
  config: GoogleAdsConfig,
  query: string
): Promise<any[]> {
  const url = `${BASE_URL}/customers/${config.customerId}/googleAds:searchStream`;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${config.accessToken}`,
    'developer-token': config.developerToken,
    'Content-Type': 'application/json',
  };

  if (config.loginCustomerId) {
    headers['login-customer-id'] = config.loginCustomerId;
  }

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(
      err.error?.message || `Google Ads API error: ${res.status}`
    );
  }

  // searchStream vrací NDJSON (newline-delimited JSON)
  const text = await res.text();
  const lines = text.split('\n').filter((l) => l.trim());
  const results: any[] = [];

  for (const line of lines) {
    try {
      const obj = JSON.parse(line);
      if (Array.isArray(obj.results)) {
        results.push(...obj.results);
      }
    } catch {
      // ignore parse errors
    }
  }

  return results;
}

// ─── Kampaně ────────────────────────────────────────────────────────────────

export async function getCampaigns(config: GoogleAdsConfig) {
  const query = `
    SELECT
      campaign.id,
      campaign.name,
      campaign.status,
      campaign.advertising_channel_type,
      campaign.start_date,
      campaign.end_date,
      campaign_budget.amount_micros,
      metrics.clicks,
      metrics.impressions,
      metrics.cost_micros,
      metrics.conversions,
      metrics.average_cpc
    FROM campaign
    WHERE campaign.status != 'REMOVED'
    ORDER BY campaign.id
  `;

  const rows = await searchStream(config, query);

  return rows.map((r) => ({
    id: r.campaign?.id,
    name: r.campaign?.name,
    status: r.campaign?.status,
    channelType: r.campaign?.advertisingChannelType,
    startDate: r.campaign?.startDate,
    endDate: r.campaign?.endDate,
    budgetMicros: parseInt(r.campaignBudget?.amountMicros || '0', 10),
    clicks: parseInt(r.metrics?.clicks || '0', 10),
    impressions: parseInt(r.metrics?.impressions || '0', 10),
    costMicros: parseInt(r.metrics?.costMicros || '0', 10),
    conversions: parseFloat(r.metrics?.conversions || '0'),
    avgCpcMicros: parseInt(r.metrics?.averageCpc || '0', 10),
  }));
}

// ─── Klíčová slova ──────────────────────────────────────────────────────────

export async function getKeywords(config: GoogleAdsConfig) {
  const query = `
    SELECT
      ad_group.id,
      ad_group.name,
      ad_group_criterion.criterion_id,
      ad_group_criterion.keyword.text,
      ad_group_criterion.keyword.match_type,
      ad_group_criterion.negative,
      ad_group_criterion.status,
      metrics.clicks,
      metrics.impressions,
      metrics.cost_micros,
      metrics.conversions
    FROM ad_group_criterion
    WHERE ad_group_criterion.type = 'KEYWORD'
      AND ad_group_criterion.status != 'REMOVED'
    ORDER BY metrics.clicks DESC
  `;

  const rows = await searchStream(config, query);

  return rows.map((r) => ({
    adGroupId: r.adGroup?.id,
    adGroupName: r.adGroup?.name,
    criterionId: r.adGroupCriterion?.criterionId,
    text: r.adGroupCriterion?.keyword?.text,
    matchType: r.adGroupCriterion?.keyword?.matchType,
    negative: r.adGroupCriterion?.negative || false,
    status: r.adGroupCriterion?.status,
    clicks: parseInt(r.metrics?.clicks || '0', 10),
    impressions: parseInt(r.metrics?.impressions || '0', 10),
    costMicros: parseInt(r.metrics?.costMicros || '0', 10),
    conversions: parseFloat(r.metrics?.conversions || '0'),
  }));
}

// ─── Geo targeting (lokality) ───────────────────────────────────────────────

export async function getGeoTargeting(config: GoogleAdsConfig) {
  const query = `
    SELECT
      campaign.id,
      campaign.name,
      campaign_criterion.criterion_id,
      campaign_criterion.location.geo_target_constant,
      campaign_criterion.location_group,
      campaign_criterion.negative,
      campaign_criterion.bid_modifier
    FROM campaign_criterion
    WHERE campaign_criterion.type = 'LOCATION'
      AND campaign.status != 'REMOVED'
    ORDER BY campaign.id
  `;

  const rows = await searchStream(config, query);

  return rows.map((r) => ({
    campaignId: r.campaign?.id,
    campaignName: r.campaign?.name,
    criterionId: r.campaignCriterion?.criterionId,
    geoTargetConstant: r.campaignCriterion?.location?.geoTargetConstant,
    negative: r.campaignCriterion?.negative || false,
    bidModifier: parseFloat(r.campaignCriterion?.bidModifier || '0'),
  }));
}

// ─── Audience targeting ─────────────────────────────────────────────────────

export async function getAudienceTargeting(config: GoogleAdsConfig) {
  const query = `
    SELECT
      campaign.id,
      campaign.name,
      campaign_criterion.criterion_id,
      campaign_criterion.user_list.user_list,
      campaign_criterion.user_interest.user_interest_category,
      campaign_criterion.negative,
      campaign_criterion.bid_modifier
    FROM campaign_criterion
    WHERE campaign_criterion.type IN ('USER_LIST', 'USER_INTEREST')
      AND campaign.status != 'REMOVED'
    ORDER BY campaign.id
  `;

  const rows = await searchStream(config, query);

  return rows.map((r) => ({
    campaignId: r.campaign?.id,
    campaignName: r.campaign?.name,
    criterionId: r.campaignCriterion?.criterionId,
    type: r.campaignCriterion?.userList ? 'USER_LIST' : 'USER_INTEREST',
    resourceName:
      r.campaignCriterion?.userList?.userList ||
      r.campaignCriterion?.userInterest?.userInterestCategory,
    negative: r.campaignCriterion?.negative || false,
    bidModifier: parseFloat(r.campaignCriterion?.bidModifier || '0'),
  }));
}

// ─── Ad Groups ──────────────────────────────────────────────────────────────

export async function getAdGroups(config: GoogleAdsConfig) {
  const query = `
    SELECT
      ad_group.id,
      ad_group.name,
      ad_group.status,
      ad_group.type,
      campaign.id,
      campaign.name,
      metrics.clicks,
      metrics.impressions,
      metrics.cost_micros,
      metrics.conversions
    FROM ad_group
    WHERE ad_group.status != 'REMOVED'
    ORDER BY metrics.clicks DESC
  `;

  const rows = await searchStream(config, query);

  return rows.map((r) => ({
    id: r.adGroup?.id,
    name: r.adGroup?.name,
    status: r.adGroup?.status,
    type: r.adGroup?.type,
    campaignId: r.campaign?.id,
    campaignName: r.campaign?.name,
    clicks: parseInt(r.metrics?.clicks || '0', 10),
    impressions: parseInt(r.metrics?.impressions || '0', 10),
    costMicros: parseInt(r.metrics?.costMicros || '0', 10),
    conversions: parseFloat(r.metrics?.conversions || '0'),
  }));
}
