import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import parser from '@babel/parser';
import * as t from '@babel/types';
import _traverse from '@babel/traverse';

// Ensure proper import for ES modules
const traverse = (_traverse as any).default || _traverse;

interface InteractiveElementDetails {
  elementName: string;
  elementType?: string;
  eventType?: string;
  boundFunction?: string;
  importSource?: string;
  componentPath?: string;
  additionalInfo?: {
    id?: string;
    destination?: string;
    componentProps?: Record<string, any>;
  };
  referencedFunctions?: string[];
  functionDetails?: {
    sourceCode?: string;
    complexity?: number;
    dependencies?: string[];
  };
}

interface ImportInfo {
  source: string;
  imported: string[];
  local: string[];
}

class NextJsInteractiveElementAnalyzer {
  private projectRoot: string;
  private importCache: Map<string, ImportInfo> = new Map();
  private functionDefinitionCache: Map<string, string> = new Map();
  private analyzedFiles: Set<string> = new Set();

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  private fileExistsSync(filePath: string): boolean {
    try {
      fs.accessSync(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async analyzeRoute(
    routePath: string, 
    depth: number = 0, 
    analyzedPaths: Set<string> = new Set()
  ): Promise<InteractiveElementDetails[]> {
    // Prevent infinite recursion
    if (depth > 3 || analyzedPaths.has(routePath)) return [];
    analyzedPaths.add(routePath);

    const fullRoutePath = path.join(this.projectRoot, routePath);
    
    try {
      // Check if file exists and is not already analyzed
      if (this.analyzedFiles.has(fullRoutePath)) return [];
      this.analyzedFiles.add(fullRoutePath);

      const routeContent = await fsPromises.readFile(fullRoutePath, 'utf-8');
      
      const ast = parser.parse(routeContent, {
        sourceType: 'module',
        plugins: ['typescript', 'jsx']
      });

      const interactiveElements: InteractiveElementDetails[] = [];
      const importedComponents = new Map<string, string>();
      
      // Track imports and function definitions
      const imports = this.trackImports(ast);
      this.trackFunctionDefinitions(ast, routeContent);

      // Analyze JSX elements for interactivity
      traverse(ast, {
        JSXElement: (path: any) => {
          const elementAnalysis = this.analyzeJSXElement(
            path, 
            importedComponents, 
            routeContent
          );
          
          if (elementAnalysis) {
            // Trace function references and details
            const referencedFunctions = this.traceFunctionReferences(
              elementAnalysis.boundFunction, 
              routeContent
            );

            const functionDetails = this.analyzeFunctionDetails(
              elementAnalysis.boundFunction, 
              routeContent
            );

            const enhancedElement: InteractiveElementDetails = {
              ...elementAnalysis,
              componentPath: routePath,
              referencedFunctions,
              functionDetails
            };

            interactiveElements.push(enhancedElement);
          }
        }
      });

      // Recursively analyze imported components
      for (const [componentName, importSource] of importedComponents) {
        // Skip if import source is from built-in or external libraries
        if (importSource.startsWith('.') || importSource.startsWith('/')) {
          const importedComponentPath = this.resolveImportPath(routePath, importSource);
          
          if (importedComponentPath) {
            const importedComponentElements = await this.analyzeRoute(
              importedComponentPath, 
              depth + 1, 
              analyzedPaths
            );
            
            interactiveElements.push(...importedComponentElements);
          }
        }
      }

      return interactiveElements;
    } catch (error) {
      console.error(`Error analyzing route ${routePath}:`, error);
      return [];
    }
  }

  private resolveImportPath(currentPath: string, importSource: string): string | null {
    const absoluteImportPath = path.resolve(path.dirname(path.join(this.projectRoot, currentPath)), importSource);
    
    // Check for .tsx, .ts, .jsx, .js extensions
    const possibleExtensions = ['.tsx', '.ts', '.jsx', '.js'];
    
    for (const ext of possibleExtensions) {
      const fullPath = `${absoluteImportPath}${ext}`;
      if (this.fileExistsSync(fullPath)) {
        return path.relative(this.projectRoot, fullPath);
      }
    }

    return null;
  }

  private trackImports(ast: t.File): Map<string, string> {
    const importedComponents = new Map<string, string>();

    traverse(ast, {
      ImportDeclaration: (path: any) => {
        const source = path.node.source.value as string;
        const importInfo: ImportInfo = {
          source,
          imported: [],
          local: []
        };

        path.node.specifiers.forEach((specifier: any) => {
          if (t.isImportDefaultSpecifier(specifier)) {
            importedComponents.set(specifier.local.name, source);
            importInfo.local.push(specifier.local.name);
          } else if (t.isImportSpecifier(specifier)) {
            importedComponents.set(specifier.local.name, source);
            importInfo.imported.push((specifier.imported as t.Identifier).name);
            importInfo.local.push(specifier.local.name);
          }
        });

        this.importCache.set(source, importInfo);
      }
    });

    return importedComponents;
  }

  private trackFunctionDefinitions(ast: t.File, fileContent: string) {
    traverse(ast, {
      FunctionDeclaration: (path: any) => {
        if (path.node.id) {
          const functionName = (path.node.id as t.Identifier).name;
          const startLine = path.node.loc?.start.line || 0;
          const endLine = path.node.loc?.end.line || 0;
          
          const lines = fileContent.split('\n');
          const functionSource = lines.slice(startLine - 1, endLine).join('\n');
          
          this.functionDefinitionCache.set(functionName, functionSource);
        }
      },
      VariableDeclarator: (path: any) => {
        if (
          t.isIdentifier(path.node.id) && 
          (t.isArrowFunctionExpression(path.node.init) || t.isFunctionExpression(path.node.init))
        ) {
          const functionName = (path.node.id as t.Identifier).name;
          const startLine = path.node.loc?.start.line || 0;
          const endLine = path.node.loc?.end.line || 0;
          
          const lines = fileContent.split('\n');
          const functionSource = lines.slice(startLine - 1, endLine).join('\n');
          
          this.functionDefinitionCache.set(functionName, functionSource);
        }
      }
    });
  }

  private analyzeJSXElement(
    path: any, 
    importedComponents: Map<string, string>, 
    fileContent: string
  ): InteractiveElementDetails | null {
    const elementName = t.isJSXIdentifier(path.node.openingElement.name) 
      ? (path.node.openingElement.name as t.JSXIdentifier).name 
      : 'UnknownElement';
    
    const interactiveEventTypes = [
      'onSubmit', 'onClick', 'onChange', 
      'onFocus', 'onBlur', 'onKeyDown',
      'onMouseEnter', 'onMouseLeave'
    ];

    let interactiveElement: InteractiveElementDetails | null = null;

    path.node.openingElement.attributes.forEach((attr: any) => {
      if (
        t.isJSXAttribute(attr) && 
        t.isJSXIdentifier(attr.name)
      ) {
        const attrName = attr.name.name.toString();
        
        if (interactiveEventTypes.includes(attrName)) {
          if (t.isJSXExpressionContainer(attr.value)) {
            const expression = attr.value.expression;
            
            if (t.isIdentifier(expression)) {
              const idAttr = path.node.openingElement.attributes.find(
                (a: any) => 
                  t.isJSXAttribute(a) && 
                  t.isJSXIdentifier(a.name) && 
                  a.name.name === 'id' &&
                  t.isStringLiteral(a.value)
              );

              interactiveElement = {
                elementName,
                elementType: this.determineElementType(elementName),
                eventType: attrName,
                boundFunction: (expression as t.Identifier).name,
                importSource: importedComponents.get(elementName),
                additionalInfo: {
                  id: idAttr && t.isStringLiteral(idAttr.value) ? idAttr.value.value : undefined
                }
              };
            }
          }
        }
      }
    });

    return interactiveElement;
  }

  private determineElementType(elementName: string): string {
    const typeMap: {[key: string]: string} = {
      'form': 'form',
      'input': 'input',
      'button': 'button',
      'select': 'select',
      'Link': 'navigation',
      'a': 'link',
      'textarea': 'textarea',
      'checkbox': 'checkbox',
      'radio': 'radio'
    };
    return typeMap[elementName] || 'interactive-element';
  }

  private traceFunctionReferences(functionName?: string, fileContent?: string): string[] {
    if (!functionName || !fileContent) return [];

    const referencedFunctions: string[] = [];
    const functionSource = this.functionDefinitionCache.get(functionName);

    if (functionSource) {
      const functionCalls = functionSource.match(/\b(\w+)\(/g) || [];
      referencedFunctions.push(
        ...functionCalls
          .map(call => call.replace('(', ''))
          .filter(name => 
            name !== functionName && 
            // Filter out common JS/React keywords and methods
            !['console', 'log', 'error', 'preventDefault', 'stringify', 'parse'].includes(name)
          )
      );
    }

    return referencedFunctions;
  }

  private analyzeFunctionDetails(functionName?: string, fileContent?: string): any {
    if (!functionName || !fileContent) return {};

    const functionSource = this.functionDefinitionCache.get(functionName);

    if (functionSource) {
      return {
        sourceCode: functionSource,
        complexity: this.calculateFunctionComplexity(functionSource),
        dependencies: this.traceFunctionReferences(functionName, fileContent)
      };
    }

    return {};
  }

  private calculateFunctionComplexity(functionSource: string): number {
    // Simple complexity metric based on number of control flow statements
    const complexityMetrics = [
      /if\s*\(/g,     // if statements
      /else\s*{/g,    // else blocks
      /for\s*\(/g,    // for loops
      /while\s*\(/g,  // while loops
      /&&/g,          // logical AND
      /\|\|/g         // logical OR
    ];

    return complexityMetrics.reduce((complexity, metric) => {
      const matches = functionSource.match(metric);
      return complexity + (matches ? matches.length : 0);
    }, 1); // Base complexity is 1
  }

  async scanAllRoutes(routesDir: string): Promise<{[route: string]: InteractiveElementDetails[]}> {
    const routesScan: {[route: string]: InteractiveElementDetails[]} = {};
    
    const fullRoutesPath = path.join(this.projectRoot, routesDir);
    const files = await fsPromises.readdir(fullRoutesPath, { recursive: true });
    
    for (const file of files) {
      if (typeof file === 'string' && 
          (file.endsWith('page.tsx') || 
           file.endsWith('page.js') || 
           file.endsWith('component.tsx') || 
           file.endsWith('component.js'))) {
        const fullPath = path.join(fullRoutesPath, file);
        const relativeRoutePath = path.relative(this.projectRoot, fullPath);
        
        const elements = await this.analyzeRoute(relativeRoutePath);
        
        if (elements.length > 0) {
          routesScan[relativeRoutePath] = elements;
        }
      }
    }

    return routesScan;
  }
}

export default NextJsInteractiveElementAnalyzer;