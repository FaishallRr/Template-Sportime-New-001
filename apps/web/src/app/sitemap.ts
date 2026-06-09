import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://sporttime.id'
  const now = new Date()

  return [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/explore`,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/register`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/explore?sport=padel`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/explore?sport=futsal`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/explore?sport=basket`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/explore?sport=badminton`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.7,
    },
     {
       url: `${baseUrl}/explore?sport=voli`,
       lastModified: now,
       changeFrequency: 'daily',
       priority: 0.6,
     },
     {
       url: `${baseUrl}/explore?sport=tennis`,
       lastModified: now,
       changeFrequency: 'daily',
       priority: 0.7,
     },
   ]
}