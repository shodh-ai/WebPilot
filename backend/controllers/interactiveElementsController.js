import fs from 'fs/promises';
import path from 'path';

export class InteractiveElementsController {
  normalizeRoute(route) {
    // Remove leading/trailing slashes, convert to lowercase
    route = route
      .trim()
      .replace(/^\/+|\/+$/g, '')
      .toLowerCase();

    const routeMap = {
      'login': 'frontend\\src\\app\\login\\page.tsx',
      'signup': 'frontend\\src\\app\\signup\\page.tsx',
      'ticket': 'frontend\\src\\app\\ticket\\page.tsx',
      'messages': 'frontend\\src\\app\\messages\\page.tsx',
      '': 'frontend\\src\\app\\page.tsx'
    };

    return routeMap[route] || `frontend\\src\\app\\${route}\\page.tsx`;
  }

  async getInteractiveElements(route) {
    const normalizedRoute = this.normalizeRoute(route);
    const filePath = path.join(process.cwd(), '..', 'interactive-elements-analysis.json');

    try {
      console.log('Normalized Route:', normalizedRoute);
      
      const fileContents = await fs.readFile(filePath, 'utf-8');
      const interactiveElements = JSON.parse(fileContents);

      console.log('All available routes:', Object.keys(interactiveElements));
      
      // Exact match check
      if (interactiveElements[normalizedRoute]) {
        return {
          route: normalizedRoute,
          elements: interactiveElements[normalizedRoute],
          error: null
        };
      }

      // Partial match check
      const matchingKeys = Object.keys(interactiveElements).filter(key => 
        key.toLowerCase().includes(normalizedRoute.toLowerCase())
      );

      console.log('Matching route keys:', matchingKeys);

      if (matchingKeys.length > 0) {
        return {
          route: normalizedRoute,
          elements: interactiveElements[matchingKeys[0]],
          error: null
        };
      }

      return {
        route: normalizedRoute,
        elements: null,
        error: 'No matching route found'
      };
    } catch (error) {
      console.error('Error reading interactive elements:', error);
      return {
        route: normalizedRoute,
        elements: null,
        error: error.message
      };
    }
  }
}

export const interactiveElementsController = new InteractiveElementsController();