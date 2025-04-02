import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import parser from '@babel/parser';
import * as t from '@babel/types';
import _traverse from '@babel/traverse';

const traverse = (_traverse as any).default || _traverse;

export interface InteractiveElementDetails {
  elementName: string;
  elementType: string;
  eventType: string;
  boundFunction: string;
  componentPath?: string;
  referencedFunctions: string[];
  elementId?: string;
  elementClass?: string;
  elementText?: string;
  functionDetails?: {
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

  async analyzeSpecificRoute(route: string): Promise<InteractiveElementDetails[]> {
    const possiblePaths = [
      `/app/${route}/page.tsx`,
      `/app/${route}/page.js`,
      `/app/${route}/page.jsx`,
      `/pages/${route}.tsx`,
      `/pages/${route}.js`,
      `/pages/${route}.jsx`,
      `/pages/${route}/index.tsx`,
      `/pages/${route}/index.js`,
      `/pages/${route}/index.jsx`
    ];
    
    // If root route
    if (route === '/') {
      possiblePaths.push(
        `/app/page.tsx`,
        `/app/page.js`,
        `/app/page.jsx`,
        `/pages/index.tsx`,
        `/pages/index.js`,
        `/pages/index.jsx`
      );
    }

    console.log('Checking possible paths for route:', route);
    
    let allElements: InteractiveElementDetails[] = [];
    
    // Try each possible path
    for (const routePath of possiblePaths) {
      const fullPath = path.join(this.projectRoot, routePath);
      
      if (this.fileExistsSync(fullPath)) {
        console.log('Found route file:', fullPath);
        const elements = await this.analyzeRoute(routePath);
        allElements = [...allElements, ...elements];
      }
    }
    
    return allElements.map(element => this.enhanceElementWithUIAttributes(element));
  }

  private enhanceElementWithUIAttributes(element: InteractiveElementDetails): InteractiveElementDetails {
    let enhancedElement = { ...element };
    
    if (!enhancedElement.elementId) {
      enhancedElement.elementId = this.extractElementAttribute(element, 'id');
    }
    
    if (!enhancedElement.elementClass) {
      enhancedElement.elementClass = this.extractElementAttribute(element, 'className') || 
                                    this.extractElementAttribute(element, 'class');
    }
    
    if (!enhancedElement.elementText) {
      enhancedElement.elementText = this.extractElementText(element);
    }
    
    return enhancedElement;
  }

  private extractElementAttribute(element: InteractiveElementDetails, attributeName: string): string | undefined {
    const funcSource = this.functionDefinitionCache.get(element.boundFunction);
    if (funcSource) {
      const regex = new RegExp(`${attributeName}=["']([^"']+)["']`, 'i');
      const match = funcSource.match(regex);
      return match ? match[1] : undefined;
    }
    return undefined;
  }

  private extractElementText(element: InteractiveElementDetails): string | undefined {
    const funcSource = this.functionDefinitionCache.get(element.boundFunction);
    if (funcSource) {
      const regex = new RegExp(`<${element.elementType}[^>]*>([^<]+)</${element.elementType}>`, 'i');
      const match = funcSource.match(regex);
      return match ? match[1].trim() : undefined;
    }
    return undefined;
  }

  async analyzeRoute(
    routePath: string, 
    depth: number = 0, 
    analyzedPaths: Set<string> = new Set()
  ): Promise<InteractiveElementDetails[]> {
    if (depth > 3 || analyzedPaths.has(routePath)) return [];
    analyzedPaths.add(routePath);

    const fullRoutePath = path.join(this.projectRoot, routePath);
    
    try {
      if (!this.fileExistsSync(fullRoutePath) || this.analyzedFiles.has(fullRoutePath)) return [];
      this.analyzedFiles.add(fullRoutePath);

      const routeContent = await fsPromises.readFile(fullRoutePath, 'utf-8');
      
      const ast = parser.parse(routeContent, {
        sourceType: 'module',
        plugins: ['typescript', 'jsx']
      });

      const interactiveElements: InteractiveElementDetails[] = [];
      const importedComponents = new Map<string, string>();
      
      this.trackImports(ast, importedComponents);
      this.trackFunctionDefinitions(ast, routeContent);

      traverse(ast, {
        JSXElement: (path: any) => {
          const elementAnalysis = this.analyzeJSXElement(
            path, 
            importedComponents, 
            routeContent
          );
          
          if (elementAnalysis) {
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

      for (const [componentName, importSource] of importedComponents.entries()) {
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
    const baseDirPath = path.dirname(path.join(this.projectRoot, currentPath));
    const absoluteImportPath = path.resolve(baseDirPath, importSource);
    
    const possibleExtensions = ['.tsx', '.ts', '.jsx', '.js'];
    
    for (const ext of possibleExtensions) {
      const fullPath = `${absoluteImportPath}${ext}`;
      if (this.fileExistsSync(fullPath)) {
        return path.relative(this.projectRoot, fullPath);
      }
    }

    for (const ext of possibleExtensions) {
      const indexPath = path.join(absoluteImportPath, `index${ext}`);
      if (this.fileExistsSync(indexPath)) {
        return path.relative(this.projectRoot, indexPath);
      }
    }

    return null;
  }

  private trackImports(ast: t.File, importedComponents: Map<string, string>) {
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

    let elementId: string | undefined;
    let elementClass: string | undefined;
    let elementText: string | undefined;

    const idAttr = path.node.openingElement.attributes.find(
      (a: any) => 
        t.isJSXAttribute(a) && 
        t.isJSXIdentifier(a.name) && 
        a.name.name === 'id' &&
        t.isStringLiteral(a.value)
    );
    
    if (idAttr && t.isStringLiteral(idAttr.value)) {
      elementId = idAttr.value.value;
    }

    const classAttr = path.node.openingElement.attributes.find(
      (a: any) => 
        t.isJSXAttribute(a) && 
        t.isJSXIdentifier(a.name) && 
        (a.name.name === 'className' || a.name.name === 'class') &&
        t.isStringLiteral(a.value)
    );
    
    if (classAttr && t.isStringLiteral(classAttr.value)) {
      elementClass = classAttr.value.value;
    }

    if (path.node.children && path.node.children.length > 0) {
      const textChild = path.node.children.find(
        (child: any) => t.isJSXText(child) && child.value.trim() !== ''
      );
      
      if (textChild) {
        elementText = textChild.value.trim();
      }
    }

    for (const attr of path.node.openingElement.attributes) {
      if (
        t.isJSXAttribute(attr) && 
        t.isJSXIdentifier(attr.name)
      ) {
        const attrName = attr.name.name.toString();
        
        if (interactiveEventTypes.includes(attrName)) {
          if (t.isJSXExpressionContainer(attr.value)) {
            const expression = attr.value.expression;
            
            if (t.isIdentifier(expression)) {
              interactiveElement = {
                elementName,
                elementType: this.determineElementType(elementName),
                eventType: attrName,
                boundFunction: (expression as t.Identifier).name,
                elementId,
                elementClass,
                elementText,
                referencedFunctions: []
              };
            }
          }
        }
      }
    }

    return interactiveElement;
  }

  private determineElementType(elementName: string): string {
    const lowerElementName = elementName.toLowerCase();
    const typeMap: {[key: string]: string} = {
      'form': 'form',
      'input': 'input',
      'button': 'button',
      'select': 'select',
      'link': 'navigation',
      'a': 'link',
      'textarea': 'textarea',
      'checkbox': 'checkbox',
      'radio': 'radio'
    };
    
    return typeMap[lowerElementName] || 'element';
  }

  private traceFunctionReferences(functionName: string, fileContent: string): string[] {
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
            !['console', 'log', 'error', 'preventDefault', 'stringify', 'parse'].includes(name)
          )
      );
    }

    return [...new Set(referencedFunctions)]; // Remove duplicates
  }

  private analyzeFunctionDetails(functionName: string, fileContent: string): any {
    if (!functionName || !fileContent) return {};

    const functionSource = this.functionDefinitionCache.get(functionName);

    if (functionSource) {
      return {
        complexity: this.calculateFunctionComplexity(functionSource),
        dependencies: this.traceFunctionReferences(functionName, fileContent)
      };
    }

    return {};
  }

  private calculateFunctionComplexity(functionSource: string): number {
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
    }, 1);
  }
}

export default NextJsInteractiveElementAnalyzer;