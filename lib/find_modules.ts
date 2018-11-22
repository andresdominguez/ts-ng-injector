import * as ts from 'typescript';
import {filterByKind, findByKind, findDecorator, findPropertyName, getText, Maybe} from './functions';

export interface ClassAndDecoratorInfo {
  className: string;
  decorator: ts.Decorator;
}

export interface ModuleAndImports {
  className: string;
  exports: string[];
}

function getExports(classAndDecorator: ClassAndDecoratorInfo): ModuleAndImports {
  const exports = Maybe
      .lift(classAndDecorator.decorator)
      .fmap(findByKind(ts.SyntaxKind.CallExpression))
      .fmap(findByKind(ts.SyntaxKind.ObjectLiteralExpression))
      .fmap(findPropertyName('exports'))
      .fmap(findByKind(ts.SyntaxKind.ArrayLiteralExpression))
      .fmap(filterByKind(ts.SyntaxKind.Identifier))
      .fmap(identifiers => identifiers.map(getText));

  return {
    className: classAndDecorator.className,
    exports: exports.isSomething ? exports.unwrap() : [],
  };
}

export function findModulesAndExports(sourceFile: ts.SourceFile): Maybe<ModuleAndImports[]> {
  return findModules(sourceFile)
      .fmap((modules) => modules.map(getExports));
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