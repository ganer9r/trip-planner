import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BlogAnalyzerAgent } from './agent';
import { fetchRawBlogs } from './data-access';
import { BlogContentAnalyzer, BlogAnalysisLogic } from './logic';
import type { UserContext } from './types';
import { mockAnalyzedBlogResultsData, mockFetchRawBlogsData, mockRankedPlacesData } from './mock';

// Mock external dependencies
vi.mock('./data-access');
vi.mock('./logic');

const mockFetchRawBlogs = vi.mocked(fetchRawBlogs);
const MockBlogContentAnalyzer = vi.mocked(BlogContentAnalyzer);
const MockBlogAnalysisLogic = vi.mocked(BlogAnalysisLogic);

describe('BlogAnalyzerAgent', () => {
  let agent: BlogAnalyzerAgent;
  const mockAnalyze = vi.fn();
  const mockExtractAndRankPlaces = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();

    MockBlogContentAnalyzer.mockImplementation(() => ({
      analyze: mockAnalyze
    }));
    MockBlogAnalysisLogic.mockImplementation(() => ({
      extractAndRankPlaces: mockExtractAndRankPlaces
    }));

    agent = new BlogAnalyzerAgent();
  });

  it('데이터 흐름에 맞춰 블로그를 분석하고 장소 순위를 정확히 반환해야 한다', async () => {
    const location = '일본 사가';
    const userContext: UserContext = { interests: '온천 힐링' };

    // 1. Setup mock return values for the entire flow
    mockFetchRawBlogs.mockResolvedValue(mockFetchRawBlogsData);
    mockAnalyze.mockResolvedValue(mockAnalyzedBlogResultsData[0]); // Just return one for simplicity
    mockExtractAndRankPlaces.mockReturnValue(mockRankedPlacesData);

    // 2. Execute the agent
    const result = await agent.run({ location, userContext });

    // 3. Verify the final output
    expect(result.status).toBe('success');
    expect(result.data).toEqual(mockRankedPlacesData);

    // 4. Verify the internal method calls (the "how")
    expect(mockFetchRawBlogs).toHaveBeenCalledWith(location);
    expect(mockAnalyze).toHaveBeenCalledTimes(mockFetchRawBlogsData.length);
    expect(mockExtractAndRankPlaces).toHaveBeenCalledWith(
      [mockAnalyzedBlogResultsData[0], mockAnalyzedBlogResultsData[0]], // Since we are returning the same mock twice
      userContext
    );
  });

  it('블로그가 없으면 빈 배열을 반환해야 한다', async () => {
    const location = '없는 지역';
    const userContext: UserContext = {};

    mockFetchRawBlogs.mockResolvedValue([]);

    const result = await agent.run({ location, userContext });

    expect(result.status).toBe('success');
    expect(result.data).toEqual([]);

    expect(mockAnalyze).not.toHaveBeenCalled();
    expect(mockExtractAndRankPlaces).not.toHaveBeenCalled();
  });

  it('블로그 가져오기 실패 시 에러를 반환해야 한다', async () => {
    const location = '일본 사가';
    const userContext: UserContext = {};
    const errorMessage = 'Network Error';

    mockFetchRawBlogs.mockRejectedValue(new Error(errorMessage));

    const result = await agent.run({ location, userContext });

    expect(result.status).toBe('failure');
    expect(result.errorMessage).toContain(errorMessage);
    expect(result.data).toEqual([]);
  });
});

