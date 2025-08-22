import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/chat-service';

interface SearchResult {
  title: string;
  link: string;
  snippet: string;
}

interface SearchResponse {
  results: SearchResult[];
  query: string;
}

// Simple cache for search results (24 hours)
const searchCache = new Map<string, { results: SearchResult[]; timestamp: number }>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { query } = await request.json();
    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const cacheKey = query.toLowerCase().trim();
    
    // Check cache first
    const cached = searchCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      return NextResponse.json({
        results: cached.results,
        query,
        cached: true
      });
    }

    // For now, we'll implement a simple Google Custom Search or SerpAPI integration
    // You'll need to set up either service and add the API keys to your environment variables
    
    let results: SearchResult[] = [];
    
    if (process.env.GOOGLE_SEARCH_API_KEY && process.env.GOOGLE_SEARCH_ENGINE_ID) {
      // Google Custom Search Implementation
      const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${process.env.GOOGLE_SEARCH_API_KEY}&cx=${process.env.GOOGLE_SEARCH_ENGINE_ID}&q=${encodeURIComponent(query)}&num=5`;
      
      const response = await fetch(searchUrl);
      const data = await response.json();
      
      if (data.items) {
        results = data.items.map((item: any) => ({
          title: item.title,
          link: item.link,
          snippet: item.snippet
        }));
      }
    } else if (process.env.SERPAPI_KEY) {
      // SerpAPI Implementation (alternative)
      const serpUrl = `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&api_key=${process.env.SERPAPI_KEY}&num=5`;
      
      const response = await fetch(serpUrl);
      const data = await response.json();
      
      if (data.organic_results) {
        results = data.organic_results.map((item: any) => ({
          title: item.title,
          link: item.link,
          snippet: item.snippet
        }));
      }
    } else {
      // Fallback: Mock search results for development
      results = [
        {
          title: `Search results for: ${query}`,
          link: 'https://example.com',
          snippet: 'Web search functionality is not configured. Please set up Google Custom Search API or SerpAPI to enable real search results.'
        }
      ];
    }

    // Cache the results
    searchCache.set(cacheKey, { results, timestamp: Date.now() });

    // Clean old cache entries periodically
    if (searchCache.size > 1000) {
      const now = Date.now();
      for (const [key, value] of searchCache.entries()) {
        if (now - value.timestamp > CACHE_DURATION) {
          searchCache.delete(key);
        }
      }
    }

    return NextResponse.json({
      results,
      query,
      cached: false
    } as SearchResponse & { cached: boolean });

  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'Failed to perform search' }, 
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    error: 'Method not allowed. Use POST to search.' 
  }, { status: 405 });
}
