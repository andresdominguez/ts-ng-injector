import * as ts from 'typescript';
import {filterByKind, findByKind, findDecorator, findPropertyName, getText, Maybe, removeUndefined} from './functions';

type ComponentType = 'component' | 'directive';

export interface ComponentInfo {
  className: string;
  selector: string;
  type: ComponentType;
}

export function findComponents(sourceFile: ts.SourceFile): Maybe<ComponentInfo[]> {
  return Maybe
      .lift(sourceFile)
      .fmap(filterByKind<ts.ClassDeclaration>(ts.SyntaxKind.ClassDeclaration))
      .fmap((classes: ts.ClassDeclaration[]) => {
            return classes.map(c => {
              const component = findDecorator('Component')(c);
              const directive = findDecorator('Directive')(c);

              return Maybe.lift(component || directive)
                  .fmap(findByKind(ts.SyntaxKind.CallExpression))
                  .fmap(findByKind(ts.SyntaxKind.ObjectLiteralExpression))
                  .fmap(findPropertyName('selector'))
                  .fmap(findByKind<ts.StringLiteral>(ts.SyntaxKind.StringLiteral))
                  .fmap(sl => sl.text)
                  .fmap((selector: string) => {
                    const componentInfo: ComponentInfo = {
                      className: getText(c.name),
                      selector,
                      type: component ? 'component' : 'directive',
                    };
                    return componentInfo;
                  })
                  .unwrap();
            });
          }
      )
      .fmap(removeUndefined);
}