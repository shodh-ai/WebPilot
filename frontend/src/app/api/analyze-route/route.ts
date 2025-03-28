import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import fsPromises from 'fs/promises';
import NextJsInteractiveElementAnalyzer, { InteractiveElementDetails } from '@/scripts/interactive-elements-analyzer';

// Predefined route descriptions and contexts
const routeDescriptions: { [key: string]: { 
  description: string, 
  context: { [key: string]: any } 
}} = {
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

    // Get predefined route description and context
    const routeDescription = routeDescriptions[route] || {
      description: 'Generic page',
      context: {}
    };

    if (!routeElements || routeElements.length === 0) {
      return NextResponse.json({ 
        message: `No elements found for route: ${route}`, 
        elements: [],
        metadata: {
          pageDescription: routeDescription.description,
          context: routeDescription.context
        }
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

    // Return analysis result with metadata
    return NextResponse.json({ 
      route: route,
      elements: formattedElements,
      metadata: {
        pageDescription: routeDescription.description,
        context: routeDescription.context
      }
    });

  } catch (error) {
    console.error('Unexpected Route Analysis Error:', error);
    return NextResponse.json({ 
      error: 'Unexpected error occurred',
      details: String(error)
    }, { status: 500 });
  }
}

// Optional: Add POST method if needed for future extensions
export async function POST(request: Request) {
  return NextResponse.json({ 
    error: 'Method not supported' 
  }, { status: 405 });
}