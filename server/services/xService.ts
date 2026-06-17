// ============================================================
// X (Twitter) API Service
// ------------------------------------------------------------
// Current implementation: MOCK (no real API calls)
// To switch to real X API:
//   1. npm install twitter-api-v2
//   2. Replace postTweet() with: client.v2.tweet(content)
//   3. Replace getTweetMetrics() with: client.v2.tweetById(id, { 'tweet.fields': ['public_metrics'] })
//   4. Replace verifyCredentials() with: client.v1.verifyCredentials()
// ============================================================

export interface PostResult {
  success: boolean
  tweetId?: string
  error?: string
}

export interface TweetMetrics {
  impressions: number
  likes: number
  retweets: number
  replies: number
}

export class XService {
  private credentials: {
    apiKey: string
    apiSecret: string
    accessToken: string
    accessSecret: string
  }

  constructor(credentials: {
    apiKey: string
    apiSecret: string
    accessToken: string
    accessSecret: string
  }) {
    this.credentials = credentials
  }

  // MOCK → Replace with: await client.v2.tweet(content)
  async postTweet(content: string): Promise<PostResult> {
    console.log(`[XService MOCK] postTweet: "${content.slice(0, 60)}..."`)
    await delay(300)

    if (Math.random() < 0.05) {
      return { success: false, error: 'Rate limit exceeded (mock simulation)' }
    }

    return {
      success: true,
      tweetId: `mock_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    }
  }

  // MOCK → Replace with: client.v2.tweetById(tweetId, { 'tweet.fields': ['public_metrics'] })
  async getTweetMetrics(tweetId: string): Promise<TweetMetrics> {
    console.log(`[XService MOCK] getTweetMetrics: ${tweetId}`)
    await delay(200)

    return {
      impressions: Math.floor(Math.random() * 15000),
      likes: Math.floor(Math.random() * 600),
      retweets: Math.floor(Math.random() * 120),
      replies: Math.floor(Math.random() * 60),
    }
  }

  // MOCK → Replace with: await client.v1.verifyCredentials()
  async verifyCredentials(): Promise<{ valid: boolean; username?: string }> {
    await delay(400)
    return { valid: true, username: 'mock_user' }
  }
}

export function createXService(account: {
  api_key?: string | null
  api_secret?: string | null
  access_token?: string | null
  access_secret?: string | null
}): XService {
  return new XService({
    apiKey: account.api_key || 'mock',
    apiSecret: account.api_secret || 'mock',
    accessToken: account.access_token || 'mock',
    accessSecret: account.access_secret || 'mock',
  })
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
