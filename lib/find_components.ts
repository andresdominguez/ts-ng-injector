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
            .map(c => {
              const component = findDecorator('Component')(c);
              if (component) {
                const componentInfo: ComponentInfo = {
                  className: getText(c.name),
                  decorator: component,
                  type: 'component',
                };
                return componentInfo;
              }

              const directive = findDecorator('Directive')(c);
              if (directive) {
                const componentInfo: ComponentInfo = {
                  className: getText(c.name),
                  decorator: directive,
                  type: 'directive',
                };
                return componentInfo;
              }
            })
            .filter(identity);
      });
}