import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export async function GET(request: NextRequest) {
  try {
    // Verify authentication and admin role
    const idToken = request.headers.get('Authorization')?.split('Bearer ')[1];
    if (!idToken) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    if (decodedToken.role !== 'admin') {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    // Fetch paraphraser usage data
    const usageSnapshot = await adminDb
      .collection('paraphrase_usage')
      .orderBy('createdAt', 'desc')
      .get();

    if (usageSnapshot.empty) {
      return NextResponse.json({
        success: true,
        stats: {
          totalUsage: 0,
          totalWords: 0,
          uniqueUsers: 0,
          averageWordsPerRequest: 0,
          modeBreakdown: {},
          toneBreakdown: {},
          recentUsage: []
        }
      });
    }

    // Process the data
    const usageData = usageSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().createdAt?.toDate()?.toISOString() || new Date().toISOString()
    }));

    // Calculate statistics
    const totalUsage = usageData.length;
    const totalWords = usageData.reduce((sum, usage) => sum + (usage.wordCount || 0), 0);
    const uniqueUsers = new Set(usageData.map(usage => usage.userId)).size;
    const averageWordsPerRequest = totalWords / totalUsage;

    // Mode breakdown
    const modeBreakdown: { [key: string]: number } = {};
    usageData.forEach(usage => {
      const mode = usage.mode || 'unknown';
      modeBreakdown[mode] = (modeBreakdown[mode] || 0) + 1;
    });

    // Tone breakdown
    const toneBreakdown: { [key: string]: number } = {};
    usageData.forEach(usage => {
      const tone = usage.tone || 'unknown';
      toneBreakdown[tone] = (toneBreakdown[tone] || 0) + 1;
    });

    // Get user information for recent usage (top 10)
    const recentUsageData = usageData.slice(0, 10);
    const userIds = [...new Set(recentUsageData.map(usage => usage.userId).filter(Boolean))];
    
    let userMap: { [key: string]: any } = {};
    if (userIds.length > 0) {
      try {
        const userPromises = userIds.map(userId => 
          adminAuth.getUser(userId).catch(() => null)
        );
        const users = await Promise.all(userPromises);
        
        users.forEach(user => {
          if (user) {
            userMap[user.uid] = {
              displayName: user.displayName || 'Anonymous',
              email: user.email || 'No email'
            };
          }
        });
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    }

    // Enrich recent usage with user data
    const recentUsage = recentUsageData.map(usage => ({
      id: usage.id,
      userId: usage.userId,
      wordCount: usage.wordCount,
      mode: usage.mode,
      tone: usage.tone,
      timestamp: usage.timestamp,
      userName: userMap[usage.userId]?.displayName || 'Anonymous',
      email: userMap[usage.userId]?.email || 'No email'
    }));

    const stats = {
      totalUsage,
      totalWords,
      uniqueUsers,
      averageWordsPerRequest,
      modeBreakdown,
      toneBreakdown,
      recentUsage
    };

    return NextResponse.json({ success: true, stats });

  } catch (error: any) {
    console.error("Error fetching paraphraser stats:", error);
    
    if (error.code === 'auth/id-token-expired' || error.code === 'auth/argument-error') {
      return NextResponse.json({ error: "Unauthorized: Invalid or expired token" }, { status: 401 });
    }
    
    return NextResponse.json({ 
      error: "Internal server error", 
      message: error.message 
    }, { status: 500 });
  }
}
