import https from 'node:https'

const base = 'https://bismillah-bazaar-production.up.railway.app'

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'accept-encoding': 'gzip' } }, (res) => {
      const chunks = []
      res.on('data', (c) => chunks.push(c))
      res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    }).on('error', reject)
  })
}

// Fetch the login page (public, no redirect)
const html = await fetch(`${base}/login`)
console.log('Login page length:', html.length)
console.log('Has NotificationBell:', html.includes('NotificationBell'))
console.log('Has bell SVG path:', html.includes('M15 17h5l'))
console.log('Has notif: channel:', html.includes('notif:'))

// Also check catalog (might redirect, but let's see)
const catHtml = await fetch(`${base}/catalog`)
console.log('\nCatalog page length:', catHtml.length)
console.log('Catalog has bell:', catHtml.includes('NotificationBell'))

// Check if there's a redirect
if (catHtml.length < 1000) {
  console.log('Catalog page is small, likely redirecting')
}
