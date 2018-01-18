import * as ts from 'typescript';
import {readFileSync} from 'fs';
import {findByKind, findNgModule, findPropertyName, Maybe} from './functions';

export interface VisitResults {
  classDeclaration: ts.ClassDeclaration;
  hasNgModule: boolean;
  exports: string[];
}

export function getClasses(sourceFile: ts.SourceFile): VisitResults[] {
  const classes: VisitResults[] = [];

  const ngModule: Maybe<ts.ObjectLiteralExpression> = findNgModule(sourceFile);

  const exports = ngModule.fmap(findPropertyName('exports'))
      .fmap(findByKind(ts.SyntaxKind.ArrayLiteralExpression))
      .fmap((expr: ts.ArrayLiteralExpression) => {
        return expr.elements.filter(e => e.kind === ts.SyntaxKind.Identifier);
      })
      .fmap(elements => elements.map(e => e.getText()));


  function visitNodes(node: ts.Node) {
    if (node.kind === ts.SyntaxKind.ClassDeclaration) {
      const classDeclaration = node as ts.ClassDeclaration;
      const exportsArray = exports.unwrap() || [];

      classes.push({
        classDeclaration: classDeclaration,
        hasNgModule: exportsArray.length > 0,
        exports: exportsArray,
      });
    }
    ts.forEachChild(node, visitNodes);
  }

  visitNodes(sourceFile);

  return classes;
}


const fileNames = process.argv.slice(2);

console.log('filenames:', fileNames);
let allClasses: VisitResults[] = [];
fileNames.forEach(fileName => {
  let sourceFile = ts.createSourceFile(fileName, readFileSync(fileName).toString(), ts.ScriptTarget.ES2015, /*setParentNodes */ true);
  allClasses = [...allClasses, ...getClasses(sourceFile)];
});

console.log('Classes', allClasses.map(c => ({
  c: c.classDeclaration.name.getText(),
  has: c.hasNgModule,
  exp: JSON.stringify(c.exports)
})));
