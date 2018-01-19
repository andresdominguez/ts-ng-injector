import * as ts from 'typescript';
import {filterByKind, findDecorator, getText, Maybe} from "./functions";

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
              const directive = findDecorator('Directive')(c);

              if (component || directive) {
                const componentInfo: ComponentInfo = {
                  className: getText(c.name),
                  decorator: component || directive,
                  type: component ? 'component' : 'directive'
                };
                return componentInfo;
              }
            })
            .filter(cd => cd);
      });
}