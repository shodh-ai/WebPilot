import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs/promises';
import NextJsInteractiveElementAnalyzer from './interactive-elements-analyzer.js';

async function main(routeName?: string) {
  try {
    // Get the project root dynamically
    const filename = fileURLToPath(import.meta.url);
    const dirname = path.dirname(filename);
    const projectRoot = path.resolve(dirname, '..');

    // Find the frontend directory
    const frontendDir = path.join(projectRoot, 'frontend');
    const appDir = path.join(frontendDir, 'src', 'app');

    // Validate directories
    try {
      await fs.access(frontendDir);
      await fs.access(appDir);
    } catch (dirError) {
      console.error('Error accessing frontend or app directory:', dirError);
      return;
    }

    // Initialize the analyzer
    const analyzer = new NextJsInteractiveElementAnalyzer(projectRoot);

    let routeAnalysis: Record<string, any>;

    if (routeName) {
      const specificRouteElements = await analyzer.analyzeSpecificRoute(routeName);
      
      if (specificRouteElements) {
        routeAnalysis = {
          [routeName]: specificRouteElements.map(element => ({
            elementName: element.elementName,
            elementType: element.elementType,
            eventType: element.eventType,
            boundFunction: element.boundFunction,
            componentPath: element.componentPath,
            referencedFunctions: element.referencedFunctions,
            functionDetails: {
              complexity: element.functionDetails?.complexity,
              dependencies: element.functionDetails?.dependencies
            }
          }))
        };
      } else {
        console.error(`No elements found for route: ${routeName}`);
        return;
      }
    } else {
      const allRoutes = await analyzer.scanAllRoutes('frontend/src/app');
      
      routeAnalysis = {};
      Object.entries(allRoutes).forEach(([route, elements]) => {
        if (elements.length > 0) {
          routeAnalysis[route] = elements.map(element => ({
            elementName: element.elementName,
            elementType: element.elementType,
            eventType: element.eventType,
            boundFunction: element.boundFunction,
            componentPath: element.componentPath,
            referencedFunctions: element.referencedFunctions,
            functionDetails: {
              complexity: element.functionDetails?.complexity,
              dependencies: element.functionDetails?.dependencies
            }
          }));
        }
      });
    }

    // Write to file
    const outputPath = path.join(projectRoot, 'interactive-elements-analysis.json');
    await fs.writeFile(outputPath, JSON.stringify(routeAnalysis, null, 2));
    console.log(`Analysis saved to: ${outputPath}`);

  } catch (error) {
    console.error('Unhandled error:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
  }
}

// Check if the script is being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const routeName = process.argv[2];
  main(routeName).catch(console.error);
}

export default main;