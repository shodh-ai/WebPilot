import express from 'express';
import { interactiveElementsController } from '../controllers/interactiveElementsController.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const rawRoute = req.query.route;

  if (!rawRoute) {
    return res.status(400).json({ 
      message: 'Route parameter is required' 
    });
  }

  try {
    const result = await interactiveElementsController.getInteractiveElements(rawRoute);

    if (!result || result.elements === null) {
      return res.status(404).json({ 
        message: 'No interactive elements found',
        route: rawRoute
      });
    }

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error.message
    });
  }
});

export default router;