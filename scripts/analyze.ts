import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs/promises';
import process from 'process';
import NextJsInteractiveElementAnalyzer from './interactive-elements-analyzer';

async function main() {
  try {
    // Get the project root dynamically
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const projectRoot = path.resolve(__dirname, '..');

    console.log('Project Root:', projectRoot);

    // Find the frontend directory 
    const frontendDir = path.join(projectRoot, 'frontend');
    const appDir = path.join(frontendDir, 'src', 'app');

    console.log('Checking frontend directory:', frontendDir);
    console.log('Checking app directory:', appDir);

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

    // Detailed route analysis
    console.log("\n--- Comprehensive Route Interactive Elements Analysis ---");

    // Scan all routes
    const allRoutes = await analyzer.scanAllRoutes('frontend/src/app');
    
    // Output results in a structured format
    const routeAnalysis: Record<string, any> = {};

    // Process and summarize route analysis
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

    // Output comprehensive analysis
    console.log(JSON.stringify(routeAnalysis, null, 2));

    const outputPath = path.join(projectRoot, 'interactive-elements-analysis.json');
    await fs.writeFile(outputPath, JSON.stringify(routeAnalysis, null, 2));
    console.log(`\nDetailed analysis saved to: ${outputPath}`);

  } catch (error) {
    console.error('Unhandled error in main function:', error);
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
  }
}

main().catch(console.error);