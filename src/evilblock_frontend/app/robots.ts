import { MetadataRoute } from 'next'
 
export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://eviblock.com' // Update with your actual domain
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/dashboard/',
          '/profile/',
          '/upload/',
          '/verify-email/',
          '/forgot-password/',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/api/',
          '/dashboard/',
          '/profile/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
