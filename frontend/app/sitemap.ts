import type { MetadataRoute } from 'next'

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://realsearch.kr').replace(/\/$/, '')

const staticRoutes = [
  { path: '/', priority: 1, changeFrequency: 'weekly' as const },
  { path: '/search', priority: 0.8, changeFrequency: 'weekly' as const },
  { path: '/advanced-search', priority: 0.7, changeFrequency: 'weekly' as const },
  { path: '/rankings', priority: 0.7, changeFrequency: 'weekly' as const },
  { path: '/regions', priority: 0.7, changeFrequency: 'weekly' as const },
]

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()

  return staticRoutes.map((route) => ({
    url: `${siteUrl}${route.path}`,
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }))
}
