import { NextResponse } from 'next/server';
import path from 'path';
import NextJsInteractiveElementAnalyzer, { InteractiveElementDetails } from '@/scripts/interactive-elements-analyzer';

const routeDescriptions: { 
  [key: string]: { 
    description: string, 
    context: { [key: string]: any } 
  }
} = {
  '/': {
    description: 'Main dashboard where users can create and manage posts',
    context: {
      primaryAction: 'Add a new post',
      mainFeatures: [
        'Create new posts',
        'View existing posts'
      ],
      requiredInputs: ['post title', 'post content']
    }
  },
  'ticket': {
    description: 'Support ticket submission page for users to report issues or request assistance',
    context: {
      primaryAction: 'Submit inquiry',
      ticketTypes: [
        'Technical Support', 
        'Feature Request', 
        'Bug Report'
      ],
      requiredFields: [
        'Email', 
        'Department', 
        'Details'
      ],
      validationRules: {
        titleMinLength: 10,
        descriptionMinLength: 20
      }
    }
  },
  'signup': {
    description: 'User registration page to create a new account',
    context: {
      primaryAction: 'Create a new user account',
      authenticationMethod: 'Email-based registration',
      requiredFields: [
        'Email address', 
        'Password', 
        'Confirm Password'
      ],
      passwordRequirements: {
        minLength: 8,
        requireSpecialChar: true,
        requireNumber: true,
        requireUppercase: true
      }
    }
  },
  'messages': {
    description: 'Real-time messaging platform for communication',
    context: {
      primaryAction: 'Send a new message',
      messageTypes: [
        'Text message', 
        'Support inquiry'
      ],
      features: [
        'Real-time messaging',
        'Message history',
        'Send attachments'
      ]
    }
  },
  'login': {
    description: 'User authentication page to access your account',
    context: {
      primaryAction: 'Log into your account',
      authenticationMethods: [
        'Email and password',
        'Social login (if implemented)'
      ],
      securityFeatures: [
        'Password reset',
        'Remember me option'
      ]
    }
  }
};

// Helper function to extract element identifiers
function extractElementIdentifiers(element: any): { 
  elementId?: string, 
  elementClass?: string, 
  elementText?: string 
} {
  // Extract identifiers from DOM or component props if available
  return {
    elementId: element.props?.id || element.attributes?.id || '',
    elementClass: element.props?.className || element.attributes?.class || '',
    elementText: element.textContent || element.props?.children || ''
  };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const route = url.searchParams.get('route');

  if (!route) {
    console.error('No route parameter provided');
    return NextResponse.json({ 
      error: 'Missing route parameter' 
    }, { status: 400 });
  }

  try {
    const projectRoot = path.resolve(process.cwd());
    
    console.log('Analyzing Route:', route);

    // Initialize analyzer
    const analyzer = new NextJsInteractiveElementAnalyzer(projectRoot);

    // Analyze route
    const routeElements = await analyzer.analyzeSpecificRoute(route);

    const routeMetadata = routeDescriptions[route] || {
      description: `Page for ${route}`,
      context: {}
    };

    if (!routeElements || routeElements.length === 0) {
      return NextResponse.json({ 
        route: route,
        elements: [],
        metadata: {
          pageDescription: routeMetadata.description,
          context: routeMetadata.context
        }
      });
    }

    // Transform elements to include information for element selection
    const enhancedElements = routeElements.map((element: InteractiveElementDetails) => {
      const identifiers = extractElementIdentifiers(element);
      
      return {
        elementName: element.elementName || '',
        elementType: element.elementType || '',
        eventType: element.eventType || '',
        boundFunction: element.boundFunction || '',
        referencedFunctions: element.referencedFunctions || [],
        // Include identifiers to help with element selection
        elementId: identifiers.elementId,
        elementClass: identifiers.elementClass,
        elementText: identifiers.elementText
      };
    });

    // Return analysis result with metadata
    return NextResponse.json({ 
      route: route,
      elements: enhancedElements,
      metadata: {
        pageDescription: routeMetadata.description,
        context: routeMetadata.context
      }
    });

  } catch (error) {
    console.error('Route Analysis Error:', error);
    return NextResponse.json({ 
      error: 'Failed to analyze route',
      details: error instanceof Error ? error.message : 'Unknown error',
      route: route
    }, { status: 500 });
  }
}

export async function HEAD(request: Request) {
  return new Response(null, {
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}

export async function POST(request: Request) {
  return NextResponse.json({ 
    error: 'Method not supported' 
  }, { status: 405 });
}