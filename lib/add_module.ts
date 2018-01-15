import * as ts from 'typescript';
import {findNgModule} from "./functions";

export function createFile(fileName: string, fileContents: string): ts.SourceFile {
  return ts.createSourceFile(fileName, fileContents, ts.ScriptTarget.ES2015, true);
}

export function addImport(sourceFile: ts.SourceFile,
                          moduleName: string, importPath: string): ts.SourceFile {
  const importDeclaration = createImportDeclaration(moduleName, importPath);
  return ts.updateSourceFileNode(sourceFile, [importDeclaration, ...sourceFile.statements]);
}

export function addToNgModuleImports(sourceFile: ts.SourceFile, moduleName: string): ts.SourceFile {
  function visitNodes(importsProp: ts.PropertyAssignment) {
    const initializer = importsProp.initializer as ts.ArrayLiteralExpression;
    const copy = [...initializer.elements.slice(0), ts.createIdentifier(moduleName)];
    importsProp.initializer = ts.updateArrayLiteral(initializer, ts.createNodeArray(copy, true));

  }

  // Find @NgModule({imports:[]})
  findNgModule(sourceFile)
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
