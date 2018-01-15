import * as ts from 'typescript';
import {readFileSync} from 'fs';
import {F1, Maybe} from "./functions";

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

function findByKind(kind: ts.SyntaxKind): F1<ts.Node, ts.Node | undefined> {
  return traverse((n: ts.Node) => n.kind === kind);
}

function traverse<T extends ts.Node>(matchFn: F1<ts.Node, boolean>): F1<ts.Node, T | undefined> {
  return function (node: ts.Node): T {
    function visitNode(n: ts.Node): T | undefined {
      if (matchFn(n)) {
        return n as T;
      }
      return ts.forEachChild(n, visitNode);
    }

    return visitNode(node);
  }
}


export function addToNgModuleImports(sourceFile: ts.SourceFile, moduleName: string): ts.SourceFile {
  // visitNodes(sourceFile);

  function visitNodes(node: ts.Node) {
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

    ts.forEachChild(node, visitNodes);
  }

  Maybe.lift(sourceFile)
      .fmap(findByKind(ts.SyntaxKind.ClassDeclaration))
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
