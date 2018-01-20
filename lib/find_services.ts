import * as ts from 'typescript';
import {filterByKind, findDecorator, getText, identity, Maybe} from './functions';

export interface InjectableInfo {
  className: string;
}

export function findServices(sourceFile: ts.SourceFile): Maybe<InjectableInfo[]> {
  return Maybe
      .lift(sourceFile)
      .fmap(filterByKind<ts.ClassDeclaration>(ts.SyntaxKind.ClassDeclaration))
      .fmap((classes: ts.ClassDeclaration[]) => {
        return classes.map(c => {
          const decorator = findDecorator('Injectable')(c);
          if (decorator) {
            return {className: getText(c.name)};
          }
        });
      })
      .fmap(x => x.filter(identity));
}