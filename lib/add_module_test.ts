import {addModule, parseFile, printFile} from "./add_module";
import {join} from 'path';

test('adds 1 + 2 to equal 3', () => {
  let path = join('test/before_inject.ts');
  let sourceFile = parseFile(path);
  let file = addModule(sourceFile, 'SomeModule', 'foo/bar');
  expect(printFile(file)).toBe(`import { SomeModule } from "foo/bar";
import { NgModule } from '@angular/core';
@NgModule({
    imports: []
})
export class TestModule {
}
`);
});
