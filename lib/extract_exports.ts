import * as ts from 'typescript';
import {readFileSync} from 'fs';
import {
  findByKind, filterByKind, findNgModule, findPropertyName, getText, Maybe, getTexts,
  listToMaybe
} from './functions';

interface ImportedFrom {
  name: string;
  path: string;
}

interface VisitResults {
  sourceFile: ts.SourceFile;
  exports: ImportedFrom[];
}

interface ModuleAndFile {
  ngModule: ts.ObjectLiteralExpression;
  sourceFile: ts.SourceFile;
}

function findNgModules(sourceFiles: ts.SourceFile[]): Maybe<ModuleAndFile[]> {
  return listToMaybe(sourceFiles.map(sourceFile => findNgModule(sourceFile)
      .fmap(ngModule => ({ngModule, sourceFile}))
  ));
}

function assignExported(exported: string[], importDeclarations: Maybe<Array<{ path: string, imports: string[] }>>): Maybe<ImportedFrom[]> {
  return importDeclarations
      .fmap(ids => {
        const identifierToPath = new Map<string, string>();
        for (const importDecl of ids) {
          for (const identifier of importDecl.imports) {
            identifierToPath.set(identifier, importDecl.path);
          }
        }

        return identifierToPath;
      })
      .fmap(x => {
        return exported.map(exp => {
          if (x.has(exp)) {
            return {
              name: exp,
              path: x.get(exp),
            };
          }
        }).filter(x => {
          console.log('x');
          return x !== undefined;
        })
      });
}

export function collectExportedSymbols(moduleAndFile: ModuleAndFile): Maybe<VisitResults> {
  const {ngModule, sourceFile} = moduleAndFile;

  // All the import {a,b} from '...'
  const importDeclarations = Maybe.lift(sourceFile)
      .fmap(filterByKind(ts.SyntaxKind.ImportDeclaration))
      .fmap((importDeclarations: ts.ImportDeclaration[]) => {
        return importDeclarations.map(importDeclaration => {
          const moduleSpecifier = importDeclaration.moduleSpecifier;

          const importSpecifiers = Maybe.lift(importDeclaration.importClause)
              .fmap(filterByKind(ts.SyntaxKind.ImportSpecifier))
              .fmap(getTexts);

          return {
            path: moduleSpecifier.getText(),
            imports: importSpecifiers.isSomething ? importSpecifiers.unwrap() : [],
          };
        });
      });

  const exported = Maybe.lift(ngModule)
      .fmap(findPropertyName('exports'))
      .fmap(findByKind(ts.SyntaxKind.ArrayLiteralExpression))
      .fmap(filterByKind(ts.SyntaxKind.Identifier))
      .fmap(getTexts)
      .fmap(exported => assignExported(exported, importDeclarations));

  return Maybe.nothing;
}


function doSearch() {
  const fileNames = process.argv.slice(2);

  console.log('filenames:', fileNames);

  let allClasses: VisitResults[] = [];
  const sourceFiles = fileNames.map(fileName => {
    return ts.createSourceFile(fileName, readFileSync(fileName).toString(), ts.ScriptTarget.ES2015, /*setParentNodes */ true);
  });

  findNgModules(sourceFiles)
      .fmap(modulesAndFiles => modulesAndFiles.map(collectExportedSymbols))
      .fmap(xx => {
        console.log('1', xx);
      });


  // console.log('Classes', allClasses.map(c => ({
  //   c: c.classDeclaration.name.getText(),
  //   has: c.hasNgModule,
  //   exp: JSON.stringify(c.exports)
  // })));
}

doSearch();