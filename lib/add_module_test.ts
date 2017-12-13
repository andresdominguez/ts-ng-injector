import {addImport, addToNgModuleImports, parseFile, printFile} from "./add_module";
import {join} from 'path';

test('Adds ts import', () => {
  let path = join('test/before_inject.ts');
  let sourceFile = parseFile(path);
  let file = addImport(sourceFile, 'SomeModule', 'foo/bar');
  expect(printFile(file)).toBe(`import { SomeModule } from "foo/bar";
import { NgModule } from '@angular/core';
@NgModule({
    imports: []
})
export class TestModule {
}
`);
});

test('Add NgModule import', () => {
  let path = join('test/before_inject.ts');
  let sourceFile = parseFile(path);
  let file = addToNgModuleImports(sourceFile, 'SomeModule');
  expect(printFile(file)).toBe(`import { NgModule } from '@angular/core';
@NgModule({
    imports: [SomeModule,]
})
export class TestModule {
}
`);
});
