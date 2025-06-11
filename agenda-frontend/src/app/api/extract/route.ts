import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

// Function to extract metadata from HTML using cheerio
function extractMetadata(html: string, url: string) {
  const $ = cheerio.load(html);
  
  // Get title from various possible meta tags
  const title = 
    $('meta[property="og:title"]').attr('content') ||
    $('meta[name="twitter:title"]').attr('content') ||
    $('title').text() ||
    $('h1').first().text() ||
    '';

  // Get description from various possible meta tags
  const description = 
    $('meta[property="og:description"]').attr('content') ||
    $('meta[name="twitter:description"]').attr('content') ||
    $('meta[name="description"]').attr('content') ||
    '';

  // Get image from various possible meta tags
  const image = 
    $('meta[property="og:image"]').attr('content') ||
    $('meta[name="twitter:image"]').attr('content') ||
    $('meta[name="twitter:image:src"]').attr('content') ||
    '';

  return {
    title: title.trim(),
    description: description.trim(),
    image: image ? new URL(image, url).toString() : undefined
  };
}

export async function POST(req: NextRequest) {
  console.log('Received metadata extraction request');
  
  try {
    const { url } = await req.json();
    
    if (!url) {
      console.error('No URL provided');
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      );
    }

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      console.error('Invalid URL format:', url);
      return NextResponse.json(
        { error: "URL must start with http:// or https://" },
        { status: 400 }
      );
    }

    console.log('Fetching content from:', url);
    let response;
    try {
      response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
      });
    } catch (fetchError: any) {
      console.error('Error fetching URL:', fetchError);
      return NextResponse.json(
        {
          error: "Failed to fetch URL",
          details: fetchError.message,
          url: url
        },
        { status: 500 }
      );
    }

    if (!response.ok) {
      console.error('Failed to fetch URL:', response.status, response.statusText);
      return NextResponse.json(
        {
          error: "Failed to fetch URL",
          details: `Server responded with status ${response.status}: ${response.statusText}`,
          url: url,
          statusCode: response.status
        },
        { status: response.status }
      );
    }

    const html = await response.text();
    if (!html) {
      console.error('No HTML content received from URL:', url);
      return NextResponse.json(
        { 
          error: "No content received from URL",
          details: "The server returned an empty response",
          url: url
        },
        { status: 422 }
      );
    }

    console.log('Successfully fetched HTML content');
    
    try {
      console.log('Extracting metadata...');
      const metadata = extractMetadata(html, url);
      console.log('Metadata extracted:', metadata);

      // Validate extracted metadata
      if (!metadata.title && !metadata.description) {
        console.error('No metadata found in HTML:', url);
        return NextResponse.json(
          {
            error: "No metadata found",
            details: "Could not find title or description in the page",
            url: url
          },
          { status: 422 }
        );
      }

      return NextResponse.json({
        title: metadata.title || "No title found",
        description: metadata.description || "No description found",
        image: metadata.image,
      });
    } catch (scrapeError: any) {
      console.error('Error during metadata extraction:', scrapeError);
      return NextResponse.json(
        { 
          error: "Failed to extract metadata",
          details: scrapeError.message,
          url: url
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { 
        error: "Failed to fetch metadata",
        details: error.message,
        url: error.url
      },
      { status: 500 }
    );
  }
}
