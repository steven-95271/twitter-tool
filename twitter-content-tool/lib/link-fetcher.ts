export interface LinkPreview {
  url: string;
  title?: string;
  description?: string;
  content?: string;
}

export async function fetchLinkContent(url: string): Promise<LinkPreview> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Twitter-Content-Tool/1.0)',
      },
    });

    const html = await response.text();

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : undefined;

    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
    const description = descMatch ? descMatch[1].trim() : undefined;

    const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
    const ogTitle = ogTitleMatch ? ogTitleMatch[1].trim() : undefined;

    const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
    let content = '';
    if (articleMatch) {
      content = articleMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    }

    return {
      url,
      title: ogTitle || title,
      description,
      content: content.slice(0, 2000),
    };
  } catch (error) {
    console.error('Failed to fetch link content:', error);
    return {
      url,
      title: undefined,
      description: undefined,
      content: undefined,
    };
  }
}
