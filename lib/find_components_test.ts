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
  const components = found.unwrap();
  expect(components[0]).toEqual({
    className: 'WeatherCardComponent',
    selector: 'app-weather-card',
    type: 'component'
  });
  expect(components[1]).toEqual({
    className: 'WeatherDirective',
    selector: '[foo]',
    type: 'directive'
  });
});
