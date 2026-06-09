import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/mitra', '/profile', '/my-bookings', '/checkout', '/booking-confirmation'],
      },
    ],
    sitemap: 'https://sporttime.id/sitemap.xml',
  }
}