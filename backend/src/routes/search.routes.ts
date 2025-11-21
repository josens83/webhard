import { Router } from 'express';
import elasticsearchService from '../services/elasticsearch.service';

const router = Router();

// Advanced search with Elasticsearch
router.get('/', async (req, res) => {
  try {
    const {
      q,
      categoryId,
      tags,
      priceMin,
      priceMax,
      sortBy,
      page,
      limit,
    } = req.query;

    const result = await elasticsearchService.search({
      q: q as string,
      categoryId: categoryId as string,
      tags: tags ? (Array.isArray(tags) ? tags as string[] : [tags as string]) : undefined,
      priceMin: priceMin ? parseInt(priceMin as string) : undefined,
      priceMax: priceMax ? parseInt(priceMax as string) : undefined,
      sortBy: sortBy as string,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      message: 'Search failed',
    });
  }
});

// Auto-suggest
router.get('/suggest', async (req, res) => {
  try {
    const { q, limit } = req.query;

    const suggestions = await elasticsearchService.suggest(
      q as string,
      limit ? parseInt(limit as string) : undefined
    );

    res.json({
      success: true,
      data: suggestions,
    });
  } catch (error) {
    console.error('Suggest error:', error);
    res.status(500).json({
      success: false,
      message: 'Suggestion failed',
    });
  }
});

export default router;
