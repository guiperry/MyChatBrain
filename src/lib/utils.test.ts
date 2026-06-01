import os from 'os';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  cn,
  tw,
  getAppDataDir,
  extractGitHubURL,
  runRAGChain,
  getEmbeddings,
  generateResponse,
  listFiles,
  getFileInfo,
  fetchFileContent,
  indexGitHubRepo,
} from './utils';

const mockAxios = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock('axios', () => ({ default: mockAxios }));

const mockLangfuse = vi.hoisted(() => ({
  Langfuse: vi.fn(() => ({
    trace: vi.fn(() => ({
      span: vi.fn(() => ({
        end: vi.fn(),
      })),
      update: vi.fn(),
    })),
  })),
  default: vi.fn(() => ({
    shutdown: vi.fn(),
    span: vi.fn(() => ({
      end: vi.fn(),
    })),
    update: vi.fn(),
  })),
}));
vi.mock('langfuse', () => mockLangfuse);

vi.mock('@google/generative-ai');

describe('utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('cn', () => {
    it('should merge class names correctly', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2');
      expect(cn('class1', undefined, 'class2')).toBe('class1 class2');
      expect(cn('class1', false, 'class2')).toBe('class1 class2');
    });
  });

  describe('tw', () => {
    it('should merge tailwind classes', () => {
      expect(tw('bg-red-500', 'text-white')).toBe('bg-red-500 text-white');
    });
  });

  describe('getAppDataDir', () => {
    beforeEach(() => {
      vi.spyOn(os, 'platform');
      vi.spyOn(os, 'homedir');
    });

    it('should return correct path for linux', () => {
      vi.mocked(os.platform).mockReturnValue('linux');
      vi.mocked(os.homedir).mockReturnValue('/home/user');
      expect(getAppDataDir()).toBe('/home/user/.local/share/my-chat-brain-v2');
    });

    it('should return correct path for darwin', () => {
      vi.mocked(os.platform).mockReturnValue('darwin');
      vi.mocked(os.homedir).mockReturnValue('/Users/user');
      expect(getAppDataDir()).toMatch(/Library\/Application Support\/My Chat Brain v2/);
    });

    it('should return correct path for win32', () => {
      vi.mocked(os.platform).mockReturnValue('win32');
      vi.mocked(os.homedir).mockReturnValue('C:\\Users\\user');
      expect(getAppDataDir()).toMatch(/AppData[/\\\\]Roaming[/\\\\]My Chat Brain v2/);
    });
  });

  describe('extractGitHubURL', () => {
    it('should extract GitHub URL from text', async () => {
      const result = await extractGitHubURL('Check this repo: https://github.com/user/repo');
      expect(result).toBe('https://github.com/user/repo');
      const nullResult = await extractGitHubURL('No URL here');
      expect(nullResult).toBeNull();
    });
  });

  describe('runRAGChain', () => {
    it('should return the input parameters', async () => {
      const params = {
        prompt: 'test',
        apiKey: 'key',
        modelName: 'model',
        weaviateURL: 'url',
        weaviateApiKey: 'key',
        className: 'class',
      };
      const result = await runRAGChain(params);
      expect(result).toEqual(params);
    });
  });

  describe('getEmbeddings', () => {
    it('should return embeddings from Google AI', async () => {
      const mockEmbedContent = vi.fn().mockResolvedValue({
        embedding: { values: [1, 2, 3] },
      });
      const mockGetGenerativeModel = vi.fn().mockReturnValue({
        embedContent: mockEmbedContent,
      });
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      vi.mocked(GoogleGenerativeAI).mockImplementation(() => ({
        getGenerativeModel: mockGetGenerativeModel,
      } as any));

      const result = await getEmbeddings({
        apiKey: 'key',
        modelName: 'model',
        texts: ['text'],
      });
      expect(result).toEqual([1, 2, 3]);
    });
  });

  describe('generateResponse', () => {
    it('should generate response without retriever', async () => {
      const mockGenerateContent = vi.fn().mockResolvedValue({
        response: { text: () => 'response' },
      });
      const mockGetGenerativeModel = vi.fn().mockReturnValue({
        generateContent: mockGenerateContent,
      });
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      vi.mocked(GoogleGenerativeAI).mockImplementation(() => ({
        getGenerativeModel: mockGetGenerativeModel,
      } as any));

      const result = await generateResponse({
        prompt: 'prompt',
        apiKey: 'key',
        modelName: 'model',
      });
      expect(result).toBe('response');
    });
  });

  describe('listFiles', () => {
    it('should list files from GitHub API', async () => {
      mockAxios.get.mockResolvedValue({
        status: 200,
        data: {
          tree: [
            { type: 'blob', path: 'file1.txt', url: 'url1' },
            { type: 'tree', path: 'dir', url: 'url2' },
          ],
        },
      });

      const result = await listFiles('https://github.com/user/repo');
      expect(result).toEqual([{ path: 'file1.txt', url: 'url1' }]);
    });
  });

  describe('getFileInfo', () => {
    it('should get file info from API', async () => {
      mockAxios.get.mockResolvedValue({
        status: 200,
        data: { download_url: 'download_url' },
      });

      const result = await getFileInfo('url');
      expect(result).toBe('download_url');
    });
  });

  describe('fetchFileContent', () => {
    it('should fetch file content', async () => {
      mockAxios.get.mockResolvedValue({
        status: 200,
        data: 'content',
      });

      const result = await fetchFileContent('url');
      expect(result).toBe('content');
    });
  });

  describe('indexGitHubRepo', () => {
    it('should index GitHub repo', async () => {
      mockAxios.get.mockResolvedValue({
        status: 200,
        data: { tree: [] },
      });

      const result = await indexGitHubRepo('url', 'key', 'model', 'wurl', 'wkey', 'class');
      expect(result).toEqual([]);
    });
  });
});