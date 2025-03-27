import { NextResponse } from 'next/server';
import path from 'path';
import NextJsInteractiveElementAnalyzer, { InteractiveElementDetails } from '@/scripts/interactive-elements-analyzer';
export async function GET(request: Request) {
  // Log the incoming request details
  console.log('Incoming Request URL:', request.url);
  
  // Convert to NextRequest for accessing search params
  const nextRequest = new URL(request.url);
  const route = nextRequest.searchParams.get('route');

  // Validate route parameter
  if (!route) {
    console.error('No route parameter provided');
    return NextResponse.json({ 
      error: 'Invalid route parameter' 
    }, { status: 400 });
  }

  try {
    // Resolve project root
    const projectRoot = path.resolve(process.cwd());
    
    console.log('Analyzing Route:', route);
    console.log('Project Root:', projectRoot);

    // Initialize analyzer
    const analyzer = new NextJsInteractiveElementAnalyzer(projectRoot);

    // Analyze route
    const routeElements = await analyzer.analyzeSpecificRoute(route);

    if (!routeElements || routeElements.length === 0) {
      return NextResponse.json({ 
        message: `No elements found for route: ${route}`, 
        elements: [] 
      }, { status: 404 });
    }

    // Transform elements
    const formattedElements = routeElements.map((element: InteractiveElementDetails) => ({
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

    // Return analysis result
    return NextResponse.json({ 
      [route]: formattedElements 
    });

  } catch (error) {
    console.error('Unexpected Route Analysis Error:', error);
    return NextResponse.json({ 
      error: 'Unexpected error occurred',
      details: String(error)
    }, { status: 500 });
  }
}