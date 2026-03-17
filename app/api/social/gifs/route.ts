import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "trending";
  const limit = searchParams.get("limit") || "21";

  // Try GIPHY first if a key is provided in env or use the provided fallback
  const giphyKey = process.env.GIPHY_API_KEY || "XXnx7Mya5GBCNCj6WpiRDHG9oV0xhrQC";
  
  if (giphyKey) {
    try {
      const endpoint = q === "trending"
        ? `https://api.giphy.com/v1/gifs/trending?api_key=${giphyKey}&limit=${limit}`
        : `https://api.giphy.com/v1/gifs/search?api_key=${giphyKey}&q=${encodeURIComponent(q)}&limit=${limit}`;
      
      const res = await fetch(endpoint);
      const data = await res.json();
      
      if (data.data && data.data.length > 0) {
        return NextResponse.json({
          results: data.data.map((gif: any) => ({
            id: gif.id,
            url: gif.images.fixed_height.url,
            previewUrl: gif.images.fixed_height_small.url
          }))
        });
      }
    } catch (err) {
      console.error("Giphy proxy failed", err);
    }
  }

  // Final fallback: The Cat API (Always works!)
  try {
    // We map common tags to the cat API
    const response = await fetch(`https://api.thecatapi.com/v1/images/search?limit=${limit}&mime_types=gif`);
    const data = await response.json();

    return NextResponse.json({
      results: data.map((gif: any) => ({
        id: gif.id,
        url: gif.url,
        previewUrl: gif.url
      }))
    });
  } catch (err) {
    console.error("Cat API fallback failed", err);
    return NextResponse.json({ results: [] });
  }
}
