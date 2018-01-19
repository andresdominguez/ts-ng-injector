import {createFile} from './add_module';
import {findModules} from './find_modules';

test('Finds multiple modules in file', () => {
  const file = `import {NgModule} from '@angular/core';

@NgModule({
  imports: []
})
export class TestModule2 {
}

@NgModule({
  imports: []
})
export class TestModule1 {
}

export class Foo {}
`;

  const sourceFile = createFile('before.ts', file);

  const found = findModules(sourceFile);
  expect(found.isSomething).toBe(true);
  expect(found.unwrap().map(m => m.className)).toEqual(['TestModule2', 'TestModule1']);
});
