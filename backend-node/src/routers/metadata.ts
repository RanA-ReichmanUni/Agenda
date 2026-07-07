import { Router, Request, Response } from 'express';
import axios from 'axios';
import * as cheerio from 'cheerio';

const router = Router();

router.post('/extract', async (req: Request, res: Response) => {
    const { url } = req.body;
    
    if (!url) {
        return res.status(400).json({ detail: "URL is required" });
    }

    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 10000
        });
        
        const $ = cheerio.load(response.data);
        
        // Extract title
        let title = $('meta[property="og:title"]').attr('content') || $('title').text();
        
        // Extract description
        let description = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content');
        
        // Extract image
        let image = $('meta[property="og:image"]').attr('content');
        
        return res.json({
            title: title || "No title found",
            description: description || "No description found",
            image: image || null
        });
    } catch (e: any) {
        console.error(`Metadata extraction failed: ${e.message}`);
        return res.status(400).json({ detail: `Failed to fetch URL: ${e.message}` });
    }
});

router.get('/check-iframe', async (req: Request, res: Response) => {
    const url = req.query.url as string;
    
    if (!url) {
        return res.status(400).json({ detail: "URL is required" });
    }

    try {
        const response = await axios.head(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 5000,
            maxRedirects: 5
        });
        
        const xFrameOptions = (response.headers['x-frame-options'] || '').toLowerCase();
        const csp = (response.headers['content-security-policy'] || '').toLowerCase();

        if (
            xFrameOptions.includes('deny') ||
            xFrameOptions.includes('sameorigin') ||
            csp.includes('frame-ancestors')
        ) {
            return res.json({ blocked: true });
        }

        return res.json({ blocked: false });
    } catch (e) {
        return res.json({ blocked: true }); // Conservative fallback
    }
});

export default router;
