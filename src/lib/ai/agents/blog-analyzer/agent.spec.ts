import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BlogAnalyzerAgent } from './agent';
import { mockBlogData } from '../../mock';
import type { RawBlogData, UserContext, AnalyzedBlogResult } from './types';

// Mock the dependencies that BlogAnalyzerAgent creates internally
const mockRawBlogDataSourceInstance = {
  fetchRawBlogs: vi.fn(),
};
vi.mock('./data-access', () => ({
  MockRawBlogDataSource: vi.fn(() => mockRawBlogDataSourceInstance),
}));

const mockBlogContentAnalyzerInstance = {
  analyze: vi.fn(),
};
const mockBlogScorerInstance = {
  scoreBlogs: vi.fn(),
};
vi.mock('./logic', () => ({
  BlogContentAnalyzer: vi.fn(() => mockBlogContentAnalyzerInstance),
  BlogScorer: vi.fn(() => mockBlogScorerInstance),
}));

describe('BlogAnalyzerAgent', () => {
  let agent: BlogAnalyzerAgent;

  beforeEach(() => {
    // Reset mocks before each test
    mockRawBlogDataSourceInstance.fetchRawBlogs.mockReset();
    mockBlogContentAnalyzerInstance.analyze.mockReset();
    mockBlogScorerInstance.scoreBlogs.mockReset();

    // Set up mock implementations
    mockRawBlogDataSourceInstance.fetchRawBlogs.mockResolvedValue(mockBlogData.map(blog => ({ url: blog.url, title: blog.title, content: blog.content })));
    mockBlogContentAnalyzerInstance.analyze.mockImplementation(async (rawBlog: RawBlogData) => {
      const analyzedResult: AnalyzedBlogResult = {
        originalUrl: rawBlog.url,
        title: rawBlog.title,
        summary: rawBlog.content.substring(0, Math.min(rawBlog.content.length, 100)) + '...',
        extractedEntities: [
          {
            name: rawBlog.title.includes('온천') ? '우레시노 온천' : '사가규 맛집',
            type: rawBlog.title.includes('온천') ? 'place' : 'restaurant',
            description: rawBlog.title.includes('온천') ? '피부 미인 온천으로 유명' : '입에서 살살 녹는 사가규 전문점',
            sentiment: 'positive',
            keywords: rawBlog.title.includes('온천') ? ['온천', '힐링'] : ['맛집', '사가규'],
          },
        ],
        overallSentiment: 'positive',
        relevanceScore: Math.random() * 0.5 + 0.5,
      };
      return analyzedResult;
    });
    mockBlogScorerInstance.scoreBlogs.mockImplementation((blogs: AnalyzedBlogResult[], userContext: UserContext) => {
      const scored = blogs.map(blog => {
        let score = blog.relevanceScore; 
        if (userContext.interests === '온천' && blog.title.includes('온천')) {
          score = 0.9; 
        } else if (userContext.interests === '온천' && !blog.title.includes('온천')) {
          score = 0.7; 
        }
        return { ...blog, relevanceScore: Math.min(1.0, score) };
      });
      scored.sort((a, b) => b.relevanceScore - a.relevanceScore);
      return scored; 
    });

    agent = new BlogAnalyzerAgent();

    // Math.random을 모의하여 예측 가능한 스코어링 결과를 만듭니다.
    vi.spyOn(Math, 'random').mockReturnValueOnce(0.9) 
                            .mockReturnValueOnce(0.1) 
                            .mockReturnValue(0.5); 
  });

  it('should return an array of AnalyzedBlogResult with correct structure', async () => {
    const location = '일본 사가';
    const userContext = { interests: '온천 힐링' };
    const result = await agent.run({ location, userContext });

    expect(result.status).toBe('success');
    expect(result.data).toBeDefined();
    expect(result.data).toBeInstanceOf(Array);
    expect(result.data.length).toBe(mockBlogData.length); 

    result.data.forEach(blogResult => {
      expect(blogResult.originalUrl).toBeTypeOf('string');
      expect(blogResult.title).toBeTypeOf('string');
      expect(blogResult.summary).toBeTypeOf('string');
      expect(blogResult.extractedEntities).toBeInstanceOf(Array);
      expect(blogResult.relevanceScore).toBeGreaterThanOrEqual(0.5);
      expect(blogResult.relevanceScore).toBeLessThanOrEqual(1.0);
    });

    expect(mockRawBlogDataSourceInstance.fetchRawBlogs).toHaveBeenCalledWith(location);
    expect(mockBlogContentAnalyzerInstance.analyze).toHaveBeenCalledTimes(mockBlogData.length);
    expect(mockBlogScorerInstance.scoreBlogs).toHaveBeenCalledWith(expect.any(Array), userContext);
  });

  it('should score blogs based on user interests', async () => {
    const location = '일본 사가';
    const userContext = { interests: '온천' };
    const result = await agent.run({ location, userContext });

    expect(result.status).toBe('success');
    const results = result.data;

    const onsenBlog = results.find(blog => blog.title.includes('온천'));
    const nonOnsenBlog = results.find(blog => !blog.title.includes('온천'));

    if (onsenBlog && nonOnsenBlog) {
      expect(onsenBlog.relevanceScore).toBeGreaterThan(nonOnsenBlog.relevanceScore);
    }
  });

  it('should return empty array if no blogs are found (mock data limitation)', async () => {
    mockRawBlogDataSourceInstance.fetchRawBlogs.mockResolvedValueOnce([]);

    const location = '없는 지역';
    const userContext = {};
    const result = await agent.run({ location, userContext });

    expect(result.status).toBe('success'); 
    expect(result.data).toEqual([]); 

    expect(mockRawBlogDataSourceInstance.fetchRawBlogs).toHaveBeenCalledWith(location);
    expect(mockBlogContentAnalyzerInstance.analyze).not.toHaveBeenCalled(); 
    expect(mockBlogScorerInstance.scoreBlogs).toHaveBeenCalledWith([], userContext); 
  });
});
