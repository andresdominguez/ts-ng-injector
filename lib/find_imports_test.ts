import {createFile} from "./add_module";
import {findImports} from "./find_imports";
import {NgModule} from "@angular/core";

const file = `
import {NgModule, Component} from '@angular/core';
import {CommonModule} from '@angular/common';
import * as foo from 'a/b/c';
import 'jasmine';
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
  expect(imports).toEqual([
    {identifier: 'NgModule', from: '@angular/core'},
    {identifier: 'Component', from: '@angular/core'},
    {identifier: 'CommonModule', from: '@angular/common'},
    {identifier: 'foo', from: 'a/b/c'},
    {identifier: 'OrganicWaffleComponent', from: '../organic-waffle/organic-waffle.component'},
  ]);
});