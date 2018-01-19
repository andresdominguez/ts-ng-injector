import * as ts from 'typescript';
import {filterByKind, findNgModuleDecorator, getText, Maybe} from "./functions";

export interface NgModuleInfo {
  className: string;
  decorator: ts.Decorator;
}

export function findModules(sourceFile: ts.SourceFile): Maybe<NgModuleInfo[]> {
  return Maybe.lift(sourceFile)
      .fmap(filterByKind<ts.ClassDeclaration>(ts.SyntaxKind.ClassDeclaration))
      .fmap((classes: ts.ClassDeclaration[]) => {
        return classes.map(theClass => ({
          className: getText(theClass.name),
          decorator: findNgModuleDecorator()(theClass)
        }));
      })
      .fmap(items => items.filter(i => !!i.decorator));
}