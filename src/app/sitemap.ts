import type { MetadataRoute } from "next";
import { getParties } from "@/modules/corpus/repository";
import { PENDING_CONGRESS_PARTIES } from "@/modules/ui/party-colors";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://programa29n.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const parties = await getParties();
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE_URL}/programas`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/comparar`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/buscar`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    {
      url: `${BASE_URL}/estadisticas`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    { url: `${BASE_URL}/encuesta`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    {
      url: `${BASE_URL}/metodologia`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/aviso-legal`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/privacidad`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/contacto`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  const partyRoutes: MetadataRoute.Sitemap = [
    ...parties.map((party) => ({
      url: `${BASE_URL}/programas/${party.id}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.85,
    })),
    ...PENDING_CONGRESS_PARTIES.map((p) => ({
      url: `${BASE_URL}/programas/${p.partyId}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];

  return [...staticRoutes, ...partyRoutes];
}
