import * as ts from 'typescript';
import {readFileSync} from 'fs';
import {Maybe} from "./functions";

export function parseFile(fileName: string): ts.SourceFile {
  return createFile(fileName, readFileSync(fileName).toString());
}

export function createFile(fileName: string, fileContents: string): ts.SourceFile {
  return ts.createSourceFile(fileName, fileContents, ts.ScriptTarget.ES2015, true);
}

export function addImport(sourceFile: ts.SourceFile,
                          moduleName: string, importPath: string): ts.SourceFile {
  const importDeclaration = createImportDeclaration(moduleName, importPath);
  return ts.updateSourceFileNode(sourceFile, [importDeclaration, ...sourceFile.statements]);
}

function hasNgModuleDecorator(classDeclaration: ts.ClassDeclaration): boolean {
  if (classDeclaration.decorators && classDeclaration.decorators.length) {
    const decorator = classDeclaration.decorators[0] as ts.Decorator;
    const callExpression = decorator.expression as ts.CallExpression;
    return callExpression.expression.getText() === 'NgModule';
  }
  return false;
}

function doFind(node: ts.Node): Maybe<ts.Node> {
  return Maybe.lift(node)
      .fmap(findByKind(ts.SyntaxKind.ClassDeclaration));
}

function findByKind(kind: ts.SyntaxKind): (n: ts.Node) => ts.Node | undefined {
  return function (node: ts.Node) {
    function visitNode(n: ts.Node): ts.Node | undefined {
      if (n.kind === kind) {
        return n;
      }
      return ts.forEachChild(n, visitNode);
    }

    return visitNode(node);
  }
}


export function addToNgModuleImports(sourceFile: ts.SourceFile, moduleName: string): ts.SourceFile {
  // visitNodes(sourceFile);

  function visitNodes(node: ts.Node) {
    if (node.kind === ts.SyntaxKind.ClassDeclaration) {
      const classDeclaration = node as ts.ClassDeclaration;
      if (hasNgModuleDecorator(classDeclaration)) {
        const decorator = classDeclaration.decorators[0];
        const callExpression = decorator.expression as ts.CallExpression;
        const objectLiteralExpression = callExpression.arguments[0] as ts.ObjectLiteralExpression;
        const properties = objectLiteralExpression.properties;

        const found = properties.filter(p => p.name.getText() === 'imports');
        if (found.length > 0) {
          const importsProp = found[0] as ts.PropertyAssignment;
          const initializer = importsProp.initializer as ts.ArrayLiteralExpression;

          const copy = [...initializer.elements.slice(0), ts.createIdentifier(moduleName)];

          importsProp.initializer = ts.updateArrayLiteral(initializer, ts.createNodeArray(copy, true));
        }
      }
    }

    ts.forEachChild(node, visitNodes);
  }

  doFind(sourceFile)
      .fmap(visitNodes);

  return sourceFile;
}

function createImportDeclaration(name: string, pathTo: string): ts.ImportDeclaration {
  const id = ts.createIdentifier(name);
  const importSpecifier = ts.createImportSpecifier(undefined, id);
  const namedImports = ts.createNamedImports([importSpecifier]);
  return ts.createImportDeclaration(
      undefined,
      undefined,
      ts.createImportClause(undefined, namedImports),
      ts.createLiteral(pathTo)
  );
}

export function printFile(sourceFile: ts.SourceFile): string {
  const resultFile = ts.createSourceFile('someFileName.ts', "", ts.ScriptTarget.Latest, false, ts.ScriptKind.TS);
  const printer = ts.createPrinter({
    newLine: ts.NewLineKind.LineFeed,
  });

  return printer.printNode(ts.EmitHint.Unspecified, sourceFile, resultFile);
}
