import * as ts from 'typescript';
import {filterByKind, getText, Maybe} from "./functions";
import {ImportInfo} from "./find_imports";

export interface ImportInfo {
  identifier: string;
  from: string;
}

/**
 * Finds all the "import {foo} from 'path'".
 */
export function findImports(sourceFile: ts.SourceFile): Maybe<ImportInfo[]> {
  return Maybe.lift(sourceFile)
      .fmap(filterByKind<ts.ImportDeclaration>(ts.SyntaxKind.ImportDeclaration))
      .fmap(imports => {
        return imports.map((importDeclaration: ts.ImportDeclaration) => {
          // Drop quotes from the import.
          const from = importDeclaration.moduleSpecifier.getText().replace(/['"]/g, '');

          // Collect all the identifiers.
          return Maybe.lift(importDeclaration.importClause)
              .fmap(filterByKind<ts.Identifier>(ts.SyntaxKind.Identifier))
              .fmap(identifiers => identifiers.map(getText))
              .fmap(ids => ids.map(identifier => ({identifier, from})))
              .unwrap();
        });
      })
      // Flatten.
      .fmap(x => [].concat.apply([], x));
}