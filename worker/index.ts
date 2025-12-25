// Cloudflare Worker with D1 database for Flappy Snake
// Deploy: wrangler deploy

export interface Env {
  DB: D1Database;
}

interface ActivePlayer {
  id: string;
  name: string;
  avatar: string;
  score: number;
  last_seen: number;
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // --- LEADERBOARD ENDPOINTS ---

      // GET /api/leaderboard - Get top 10 scores
      if (path === '/api/leaderboard' && request.method === 'GET') {
        const result = await env.DB.prepare(`
          SELECT id, name, score, avatar, created_at
          FROM scores
          ORDER BY score DESC
          LIMIT 10
        `).all();

        return Response.json(result.results, { headers: corsHeaders });
      }

      // POST /api/scores - Add new score
      if (path === '/api/scores' && request.method === 'POST') {
        const body = await request.json() as { name: string; score: number; avatar?: string };
        const { name, score, avatar = '🐍' } = body;

        if (!name || typeof score !== 'number') {
          return Response.json(
            { error: 'Name and score are required' },
            { status: 400, headers: corsHeaders }
          );
        }

        await env.DB.prepare(
          'INSERT INTO scores (name, score, avatar) VALUES (?, ?, ?)'
        ).bind(name, score, avatar).run();

        // Get rank
        const rankResult = await env.DB.prepare(
          'SELECT COUNT(*) as rank FROM scores WHERE score > ?'
        ).bind(score).first<{ rank: number }>();

        const rank = (rankResult?.rank || 0) + 1;

        return Response.json(
          { rank, isTopTen: rank <= 10 },
          { headers: corsHeaders }
        );
      }

      // GET /api/highscore - Get highest score
      if (path === '/api/highscore' && request.method === 'GET') {
        const result = await env.DB.prepare(
          'SELECT MAX(score) as highScore FROM scores'
        ).first<{ highScore: number | null }>();

        return Response.json(
          { highScore: result?.highScore || 0 },
          { headers: corsHeaders }
        );
      }

      // --- PRESENCE ENDPOINTS ---

      // GET /api/presence - Get active players
      if (path === '/api/presence' && request.method === 'GET') {
        // Clean up stale players (older than 10 seconds)
        const cutoff = Date.now() - 10000;
        await env.DB.prepare(
          'DELETE FROM presence WHERE last_seen < ?'
        ).bind(cutoff).run();

        // Get active players
        const result = await env.DB.prepare(`
          SELECT id, name, avatar, score, last_seen as lastSeen
          FROM presence
          ORDER BY score DESC
        `).all<ActivePlayer>();

        return Response.json(result.results, { headers: corsHeaders });
      }

      // POST /api/presence - Send heartbeat
      if (path === '/api/presence' && request.method === 'POST') {
        const body = await request.json() as { id: string; name: string; avatar?: string; score?: number };
        const { id, name, avatar = '🐍', score = 0 } = body;

        if (!id || !name) {
          return Response.json(
            { error: 'id and name are required' },
            { status: 400, headers: corsHeaders }
          );
        }

        // Upsert presence
        await env.DB.prepare(`
          INSERT INTO presence (id, name, avatar, score, last_seen)
          VALUES (?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            name = excluded.name,
            avatar = excluded.avatar,
            score = excluded.score,
            last_seen = excluded.last_seen
        `).bind(id, name, avatar, score, Date.now()).run();

        return Response.json({ success: true }, { headers: corsHeaders });
      }

      // DELETE /api/presence/:id - Remove presence
      if (path.startsWith('/api/presence/') && request.method === 'DELETE') {
        const id = path.split('/').pop();
        if (id) {
          await env.DB.prepare('DELETE FROM presence WHERE id = ?').bind(id).run();
        }
        return Response.json({ success: true }, { headers: corsHeaders });
      }

      // 404 for unknown routes
      return Response.json(
        { error: 'Not found' },
        { status: 404, headers: corsHeaders }
      );

    } catch (error) {
      console.error('Worker error:', error);
      return Response.json(
        { error: 'Internal server error' },
        { status: 500, headers: corsHeaders }
      );
    }
  },
};
