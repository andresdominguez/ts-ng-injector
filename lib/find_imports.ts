import * as ts from 'typescript';
import {filterByKind, getText, Maybe} from "./functions";
import {ImportInfo} from "./find_imports";

export interface ImportInfo {
  identifier: string;
  from: string;
}

export function findImports(sourceFile: ts.SourceFile): Maybe<ImportInfo[]> {
  return Maybe.lift(sourceFile)
      .fmap(filterByKind<ts.ImportDeclaration>(ts.SyntaxKind.ImportDeclaration))
      .fmap((imports: ts.ImportDeclaration[]) => {
        return imports.map((importDeclaration: ts.ImportDeclaration) => {
          const from = importDeclaration.moduleSpecifier.getText().replace(/['"]/g, '');
          return Maybe.lift(importDeclaration.importClause)
              .fmap(filterByKind<ts.Identifier>(ts.SyntaxKind.Identifier))
              .fmap(identifiers => identifiers.map(getText))
              .fmap(ids => {
                return ids.map(id => {
                  return {
                    identifier: id,
                    from: from,
                  };
                });
              })
              .unwrap();
        });
      })
      .fmap(x => [].concat.apply([], x));
}