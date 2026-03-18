import * as cheerio from 'cheerio';
import axios from 'axios';

export class WebsiteScraper {
  /**
   * Scrapes and cleans textual content from a URL.
   * In a future enterprise iteration, this could be upgraded to Playwright for Single Page Applications (SPAs).
   */
  static async scrapeHtml(url: string): Promise<string> {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; AI-Voice-Receptionist-Builder/1.0)',
        },
        timeout: 10000
      });
      
      const html = response.data;
      const $ = cheerio.load(html);

      // Remove noisy elements that don't contain business logic
      $('script, style, noscript, nav, footer, iframe, img, svg, link, meta').remove();

      // Extract raw text content and normalize whitespace
      let text = $('body').text();
      text = text.replace(/\s+/g, ' ').trim();

      if (!text || text.length < 50) {
        throw new Error('Scraped content is suspiciously thin or empty.');
      }

      return text;
    } catch (error: any) {
      throw new Error(`Failed to scrape ${url}: ${error.message}`);
    }
  }
}
