import {createFile} from './add_module';
import {findModules, findModulesAndImports} from './find_modules';

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
  expect(found.unwrap().map(m => m.className)).toEqual(['TestModule2', 'TestModule1']);
});

test('Finds module exports', () => {
  const file = `import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {IceCreamComponent} from '../ice-cream-cmp/ice-cream-cmp.component';
import {OrganicWaffleComponent} from '../organic-waffle/organic-waffle.component';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [IceCreamComponent],
  exports: [IceCreamComponent]
})
export class IceCreamModule {
}

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [OrganicWaffleComponent],
  exports: [OrganicWaffleComponent]
})
export class WaffleModule {
}
`;

  const sourceFile = createFile('before.ts', file);

  const found = findModulesAndImports(sourceFile);
  const modules = found.unwrap();
  expect(modules[0]).toEqual({
    className: 'IceCreamModule',
    imports: ['IceCreamComponent']
  });
  expect(modules[1]).toEqual({
    className: 'WaffleModule',
    imports: ['OrganicWaffleComponent']
  });
});