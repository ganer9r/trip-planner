import { mockFetchRawBlogsData } from './mock';
import type { RawBlogData } from './types';

export async function fetchRawBlogs(location: string): Promise<RawBlogData[]> {
  console.log(`[MockRawBlogDataSource]: Fetching raw blogs for ${location} (mock)`);
  // 실제로는 location에 따라 필터링하거나 외부 API 호출
  // return mockBlogData.map(blog => ({ url: blog.url, title: blog.title, content: blog.content }));
  return mockFetchRawBlogsData;
}