import {createFile} from './add_module';
import {findComponents} from './find_components';

test('Finds multiple modules in file', () => {
  const file = `import {NgModule, Component, Directive} from '@angular/core';

@Component({
  selector: 'app-weather-card',
})
export class WeatherCardComponent implements OnInit {
}

@NgModule({
  imports: []
})
export class TestModule2 {
}

@Directive({
  selector: '[foo]',
})
export class WeatherDirective implements OnInit {
}

@NgModule({
  imports: []
})
export class TestModule1 {
}

export class Foo {}
`;

  const sourceFile = createFile('before.ts', file);

  const found = findComponents(sourceFile);
  expect(found.isSomething).toBe(true);
  expect(found.unwrap().map(m => m.className)).toEqual(['WeatherCardComponent', 'WeatherDirective']);
});
