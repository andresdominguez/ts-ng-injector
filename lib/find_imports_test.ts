import {createFile} from "./add_module";
import {findImports} from "./find_imports";
import {NgModule} from "@angular/core";

const file = `
import {NgModule, Component} from '@angular/core';
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

test('Find imports', () => {
  const sourceFile = createFile('before.ts', file);

  const imports = findImports(sourceFile).unwrap();
  // expect(imports.length).toEqual(1);
  expect(imports[0]).toEqual({identifier: 'NgModule', from: '@angular/core'});
  expect(imports[1]).toEqual({identifier: 'Component', from: '@angular/core'});
});