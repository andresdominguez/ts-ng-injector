import {addImport, addToNgModuleImports, createFile, parseFile, printFile} from "./add_module";
import {join} from 'path';

const beforeInject = `import {NgModule} from '@angular/core';

@NgModule({
  imports: []
})
export class TestModule {
}
`;

test('Adds ts import', () => {
  let sourceFile = createFile('before.ts', beforeInject);
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
  let sourceFile = createFile('before.ts', beforeInject);
  let file = addToNgModuleImports(sourceFile, 'SomeModule');
  expect(printFile(file)).toBe(`import { NgModule } from '@angular/core';
@NgModule({
    imports: [SomeModule,]
})
export class TestModule {
}
`);
});
