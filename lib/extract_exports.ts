import * as ts from 'typescript';
import {readFileSync} from "fs";

export interface VisitResults {
  classDeclaration: ts.ClassDeclaration;
  hasNgModule: boolean;
  imports: string[];
}

export function visitFile(file: ts.SourceFile) {

}

export const getDecoratorName = (decorator: ts.Decorator) => {
  let baseExpr = <any>decorator.expression || {};
  let expr = baseExpr.expression || {};
  return expr.text;
};

function hasNgModuleDecorator(classDeclaration: ts.ClassDeclaration): boolean {
  const decorators = (classDeclaration.decorators || []) as ts.NodeArray<ts.Decorator>;
  return decorators.some(d => getDecoratorName(d) === 'NgModule');
}

function findNgModuleDecorator(classDeclaration: ts.ClassDeclaration): ts.Decorator {
  const decorators = (classDeclaration.decorators || []) as ts.NodeArray<ts.Decorator>;
  return decorators.find(d => getDecoratorName(d) === 'NgModule')!;
}

function readImports(classDeclaration: ts.ClassDeclaration): ts.Identifier[] {
  const imports = [];
  visit(findNgModuleDecorator(classDeclaration));

  function visit(node: ts.Node) {
    if (node.kind === ts.SyntaxKind.PropertyAssignment) {
      const propertyAssignment = node as ts.PropertyAssignment;
      if (propertyAssignment.name.getText() === 'exports') {
        console.log('yo');
      }
    }
    ts.forEachChild(node, visit);
  }

  return [];
}

export function getClasses(sourceFile: ts.SourceFile): VisitResults[] {
  const classes: VisitResults[] = [];

  visitNodes(sourceFile);

  function visitNodes(node: ts.Node) {
    if (node.kind === ts.SyntaxKind.ClassDeclaration) {
      const classDeclaration = node as ts.ClassDeclaration;
      const hasNgModule = hasNgModuleDecorator(classDeclaration);
      let imports = [];

      if (hasNgModule) {
        imports = readImports(classDeclaration);
      }
      classes.push({
        classDeclaration: classDeclaration,
        hasNgModule: hasNgModule,
        imports
      });
    }
    ts.forEachChild(node, visitNodes);
  }

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
})));
