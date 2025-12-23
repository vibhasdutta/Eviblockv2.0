import { ImageResponse } from 'next/og'
 
// Route segment config
export const runtime = 'edge'
 
// Image metadata
export const alt = 'EviBlock - Decentralized File Storage & Verification'
export const size = {
  width: 1200,
  height: 630,
}
 
export const contentType = 'image/png'
 
// Image generation
export default async function Image() {
  return new ImageResponse(
    (
      // ImageResponse JSX element
      <div
        style={{
          fontSize: 64,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontFamily: 'system-ui, sans-serif',
          padding: '80px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: 80,
              fontWeight: 'bold',
              marginBottom: 20,
              textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
            }}
          >
            🔗 EviBlock
          </div>
          <div
            style={{
              fontSize: 36,
              fontWeight: 'normal',
              opacity: 0.95,
              maxWidth: 900,
              lineHeight: 1.4,
            }}
          >
            Decentralized File Storage & Verification on Blockchain
          </div>
          <div
            style={{
              fontSize: 24,
              marginTop: 30,
              opacity: 0.85,
              display: 'flex',
              gap: 40,
            }}
          >
            <span>🌐 IPFS</span>
            <span>⛓️ ICP Blockchain</span>
            <span>🔐 Secure</span>
          </div>
        </div>
      </div>
    ),
    // ImageResponse options
    {
      ...size,
    }
  )
}
