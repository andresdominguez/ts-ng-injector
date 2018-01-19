import * as ts from 'typescript';
import {filterByKind, findDecorator, getText, Maybe} from "./functions";

export interface ClassAndDecoratorInfo {
  className: string;
  decorator: ts.Decorator;
}

export function findModules(sourceFile: ts.SourceFile): Maybe<ClassAndDecoratorInfo[]> {
  return Maybe.lift(sourceFile)
      .fmap(filterByKind<ts.ClassDeclaration>(ts.SyntaxKind.ClassDeclaration))
      .fmap((classes: ts.ClassDeclaration[]) => {
        return classes.map(theClass => ({
          className: getText(theClass.name),
          decorator: findDecorator('NgModule')(theClass)
        }));
      })
      .fmap(items => items.filter(i => !!i.decorator));
}