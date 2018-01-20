import * as ts from 'typescript';
import {filterByKind, findDecorator, getText, identity, Maybe} from './functions';

export interface ComponentInfo {
  className: string;
  decorator: ts.Decorator;
  type: 'component' | 'directive';
}

export function findComponents(sourceFile: ts.SourceFile): Maybe<ComponentInfo[]> {
  return Maybe
      .lift(sourceFile)
      .fmap(filterByKind<ts.ClassDeclaration>(ts.SyntaxKind.ClassDeclaration))
      .fmap((classes: ts.ClassDeclaration[]) => {
        return classes
            .map(classDeclaration => {
              const component = findDecorator('Component')(classDeclaration);
              if (component) {
                const componentInfo: ComponentInfo = {
                  className: getText(classDeclaration.name),
                  decorator: component,
                  type: 'component',
                };
                return componentInfo;
              }

              const directive = findDecorator('Directive')(classDeclaration);
              if (directive) {
                const componentInfo: ComponentInfo = {
                  className: getText(classDeclaration.name),
                  decorator: directive,
                  type: 'directive',
                };
                return componentInfo;
              }
            })
            .filter(identity);
      });
}