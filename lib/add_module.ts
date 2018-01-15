import * as ts from 'typescript';
import {F1, Maybe, traverse} from "./functions";
import {NgModule} from "@angular/core";

export function createFile(fileName: string, fileContents: string): ts.SourceFile {
  return ts.createSourceFile(fileName, fileContents, ts.ScriptTarget.ES2015, true);
}

export function addImport(sourceFile: ts.SourceFile,
                          moduleName: string, importPath: string): ts.SourceFile {
  const importDeclaration = createImportDeclaration(moduleName, importPath);
  return ts.updateSourceFileNode(sourceFile, [importDeclaration, ...sourceFile.statements]);
}

export const getDecoratorName = (decorator: ts.Decorator) => {
  let baseExpr = <any>decorator.expression || {};
  let expr = baseExpr.expression || {};
  return expr.text;
};

function findByKind(kind: ts.SyntaxKind): F1<ts.Node, ts.Node | undefined> {
  return traverse((n: ts.Node) => n.kind === kind);
}

function findNgModuleDecorator() {
  return (node: ts.ClassDeclaration) => {
    if (node.decorators) {
      return node.decorators.find(d => getDecoratorName(d) === 'NgModule');
    }
  }
}

export function addToNgModuleImports(sourceFile: ts.SourceFile, moduleName: string): ts.SourceFile {
  function visitNodes(importsProp: ts.PropertyAssignment) {
    const initializer = importsProp.initializer as ts.ArrayLiteralExpression;
    const copy = [...initializer.elements.slice(0), ts.createIdentifier(moduleName)];
    importsProp.initializer = ts.updateArrayLiteral(initializer, ts.createNodeArray(copy, true));

  }

  Maybe.lift(sourceFile)
      .fmap(findByKind(ts.SyntaxKind.ClassDeclaration))
      .fmap(findNgModuleDecorator())
      .fmap(findByKind(ts.SyntaxKind.CallExpression))
      .fmap(findByKind(ts.SyntaxKind.ObjectLiteralExpression))
      .fmap((objectLiteralExpression: ts.ObjectLiteralExpression) => {
        return objectLiteralExpression.properties.find(p => p.name.getText() === 'imports');
      })
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
