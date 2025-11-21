import { Client } from '@elastic/elasticsearch';
import { File, Category, Tag } from '@prisma/client';

const ELASTICSEARCH_NODE = process.env.ELASTICSEARCH_NODE || 'http://localhost:9200';
const INDEX_NAME = 'wedisk_files';

class ElasticsearchService {
  private client: Client;
  private isConnected: boolean = false;

  constructor() {
    this.client = new Client({
      node: ELASTICSEARCH_NODE,
    });
    this.initialize();
  }

  private async initialize() {
    try {
      await this.client.ping();
      console.log('✅ Elasticsearch connected');
      this.isConnected = true;
      await this.createIndex();
    } catch (error) {
      console.error('❌ Elasticsearch connection failed:', error);
      this.isConnected = false;
    }
  }

  private async createIndex() {
    try {
      const exists = await this.client.indices.exists({ index: INDEX_NAME });

      if (!exists) {
        await this.client.indices.create({
          index: INDEX_NAME,
          body: {
            settings: {
              analysis: {
                analyzer: {
                  korean: {
                    type: 'custom',
                    tokenizer: 'standard',
                    filter: ['lowercase', 'cjk_width'],
                  },
                },
              },
            },
            mappings: {
              properties: {
                id: { type: 'keyword' },
                title: {
                  type: 'text',
                  analyzer: 'korean',
                  fields: {
                    keyword: { type: 'keyword' },
                  },
                },
                description: {
                  type: 'text',
                  analyzer: 'korean',
                },
                fileName: { type: 'text' },
                category: {
                  type: 'object',
                  properties: {
                    id: { type: 'keyword' },
                    name: { type: 'keyword' },
                  },
                },
                tags: {
                  type: 'keyword',
                },
                price: { type: 'integer' },
                priceType: { type: 'keyword' },
                downloadCount: { type: 'integer' },
                viewCount: { type: 'integer' },
                ratingAverage: { type: 'float' },
                ratingCount: { type: 'integer' },
                status: { type: 'keyword' },
                createdAt: { type: 'date' },
                updatedAt: { type: 'date' },
              },
            },
          },
        });
        console.log(`✅ Elasticsearch index "${INDEX_NAME}" created`);
      }
    } catch (error) {
      console.error('Error creating Elasticsearch index:', error);
    }
  }

  async indexFile(file: File & { category: Category; tags: Tag[] }) {
    if (!this.isConnected) {
      console.warn('Elasticsearch not connected, skipping indexing');
      return;
    }

    try {
      await this.client.index({
        index: INDEX_NAME,
        id: file.id,
        document: {
          id: file.id,
          title: file.title,
          description: file.description,
          fileName: file.fileName,
          category: {
            id: file.category.id,
            name: file.category.name,
          },
          tags: file.tags.map((tag) => tag.name),
          price: file.price,
          priceType: file.priceType,
          downloadCount: file.downloadCount,
          viewCount: file.viewCount,
          ratingAverage: file.ratingAverage,
          ratingCount: file.ratingCount,
          status: file.status,
          createdAt: file.createdAt,
          updatedAt: file.updatedAt,
        },
      });
      console.log(`✅ File indexed: ${file.title}`);
    } catch (error) {
      console.error('Error indexing file:', error);
    }
  }

  async updateFile(fileId: string, updates: Partial<File>) {
    if (!this.isConnected) {
      return;
    }

    try {
      await this.client.update({
        index: INDEX_NAME,
        id: fileId,
        doc: updates,
      });
    } catch (error) {
      console.error('Error updating file in Elasticsearch:', error);
    }
  }

  async deleteFile(fileId: string) {
    if (!this.isConnected) {
      return;
    }

    try {
      await this.client.delete({
        index: INDEX_NAME,
        id: fileId,
      });
    } catch (error) {
      console.error('Error deleting file from Elasticsearch:', error);
    }
  }

  async search(query: {
    q?: string;
    categoryId?: string;
    tags?: string[];
    priceMin?: number;
    priceMax?: number;
    sortBy?: string;
    page?: number;
    limit?: number;
  }) {
    if (!this.isConnected) {
      return { files: [], total: 0 };
    }

    const {
      q,
      categoryId,
      tags,
      priceMin,
      priceMax,
      sortBy = 'relevance',
      page = 1,
      limit = 20,
    } = query;

    const must: any[] = [{ term: { status: 'APPROVED' } }];
    const should: any[] = [];

    if (q) {
      should.push(
        { match: { title: { query: q, boost: 3 } } },
        { match: { description: { query: q, boost: 1 } } },
        { match: { fileName: { query: q, boost: 2 } } }
      );
    }

    if (categoryId) {
      must.push({ term: { 'category.id': categoryId } });
    }

    if (tags && tags.length > 0) {
      must.push({ terms: { tags } });
    }

    if (priceMin !== undefined || priceMax !== undefined) {
      const range: any = {};
      if (priceMin !== undefined) range.gte = priceMin;
      if (priceMax !== undefined) range.lte = priceMax;
      must.push({ range: { price: range } });
    }

    let sort: any[] = [];
    switch (sortBy) {
      case 'latest':
        sort = [{ createdAt: 'desc' }];
        break;
      case 'popular':
        sort = [{ downloadCount: 'desc' }];
        break;
      case 'rating':
        sort = [{ ratingAverage: 'desc' }, { ratingCount: 'desc' }];
        break;
      case 'price_low':
        sort = [{ price: 'asc' }];
        break;
      case 'price_high':
        sort = [{ price: 'desc' }];
        break;
      default:
        sort = should.length > 0 ? [{ _score: 'desc' }] : [{ createdAt: 'desc' }];
    }

    try {
      const from = (page - 1) * limit;

      const body: any = {
        query: {
          bool: {
            must,
          },
        },
        sort,
        from,
        size: limit,
      };

      if (should.length > 0) {
        body.query.bool.should = should;
        body.query.bool.minimum_should_match = 1;
      }

      const result = await this.client.search({
        index: INDEX_NAME,
        body,
      });

      const files = result.hits.hits.map((hit: any) => ({
        ...hit._source,
        score: hit._score,
      }));

      const total = typeof result.hits.total === 'number'
        ? result.hits.total
        : result.hits.total?.value || 0;

      return {
        files,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      console.error('Error searching files:', error);
      return { files: [], total: 0, page, limit, totalPages: 0 };
    }
  }

  async suggest(query: string, limit: number = 5) {
    if (!this.isConnected || !query) {
      return [];
    }

    try {
      const result = await this.client.search({
        index: INDEX_NAME,
        body: {
          query: {
            bool: {
              must: [
                { term: { status: 'APPROVED' } },
                {
                  multi_match: {
                    query,
                    fields: ['title^3', 'tags^2'],
                    type: 'phrase_prefix',
                  },
                },
              ],
            },
          },
          _source: ['title', 'tags'],
          size: limit,
        },
      });

      return result.hits.hits.map((hit: any) => ({
        title: hit._source.title,
        tags: hit._source.tags,
      }));
    } catch (error) {
      console.error('Error getting suggestions:', error);
      return [];
    }
  }

  async reindexAll(files: (File & { category: Category; tags: Tag[] })[]) {
    if (!this.isConnected) {
      console.warn('Elasticsearch not connected, skipping reindexing');
      return;
    }

    console.log(`🔄 Reindexing ${files.length} files...`);

    try {
      // Delete existing index
      const exists = await this.client.indices.exists({ index: INDEX_NAME });
      if (exists) {
        await this.client.indices.delete({ index: INDEX_NAME });
      }

      // Create new index
      await this.createIndex();

      // Bulk index all files
      if (files.length > 0) {
        const operations = files.flatMap((file) => [
          { index: { _index: INDEX_NAME, _id: file.id } },
          {
            id: file.id,
            title: file.title,
            description: file.description,
            fileName: file.fileName,
            category: {
              id: file.category.id,
              name: file.category.name,
            },
            tags: file.tags.map((tag) => tag.name),
            price: file.price,
            priceType: file.priceType,
            downloadCount: file.downloadCount,
            viewCount: file.viewCount,
            ratingAverage: file.ratingAverage,
            ratingCount: file.ratingCount,
            status: file.status,
            createdAt: file.createdAt,
            updatedAt: file.updatedAt,
          },
        ]);

        await this.client.bulk({
          body: operations,
          refresh: true,
        });
      }

      console.log(`✅ Reindexed ${files.length} files`);
    } catch (error) {
      console.error('Error reindexing files:', error);
    }
  }
}

export default new ElasticsearchService();
