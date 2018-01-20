import * as ts from 'typescript';
import {filterByKind, findDecorator, getText, Maybe, removeUndefined} from './functions';

type ComponentType = 'component' | 'directive';

export interface ComponentInfo {
  className: string;
  decorator: ts.Decorator;
  type: ComponentType;
}

export function findComponents(sourceFile: ts.SourceFile): Maybe<ComponentInfo[]> {
  function newComponentInfo(classDeclaration, decorator: ts.Decorator, type: ComponentType): ComponentInfo {
    return {
      className: getText(classDeclaration.name),
      decorator,
      type,
    };
  }

  return Maybe
      .lift(sourceFile)
      .fmap(filterByKind<ts.ClassDeclaration>(ts.SyntaxKind.ClassDeclaration))
      .fmap((classes: ts.ClassDeclaration[]) => {
        return classes.map(classDeclaration => {
          const component = findDecorator('Component')(classDeclaration);
          if (component) {
            return newComponentInfo(classDeclaration, component, 'component');
          }

          const directive = findDecorator('Directive')(classDeclaration);
          if (directive) {
            return newComponentInfo(classDeclaration, directive, 'directive');
          }
        });
      })
      .fmap(removeUndefined);
}