/**
 * Utility function to test backend connection
 * Can be called from browser console or used in development
 */

export async function testBackendConnection() {
  const GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:3010/graphql'
  
  try {
    console.log('Testing connection to:', GRAPHQL_ENDPOINT)
    
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `
          query {
            __typename
          }
        `,
      }),
    })

    if (response.ok || response.status === 400) {
      // 400 is OK for GraphQL (means server is up but query might be invalid)
      console.log('✅ Backend is connected and accessible!')
      console.log('Status:', response.status)
      return { success: true, status: response.status }
    } else {
      console.error('❌ Backend returned error status:', response.status)
      return { success: false, status: response.status, error: 'Backend error' }
    }
  } catch (error: any) {
    console.error('❌ Failed to connect to backend:', error.message)
    console.error('Make sure backend is running on:', GRAPHQL_ENDPOINT)
    return { success: false, error: error.message }
  }
}

// Make it available globally for easy testing
if (typeof window !== 'undefined') {
  (window as any).testBackendConnection = testBackendConnection
}














