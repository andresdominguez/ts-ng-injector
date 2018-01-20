import {createFile} from "./add_module";
import {findServices} from "./find_services";

test('finds services', () => {
  const file = `import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs/Observable';

@Injectable()
export class CurrentWeatherService {

  constructor(private http: HttpClient) {}
}

export class Foo {}
`;

  const sourceFile = createFile('before.ts', file);

  const found = findServices(sourceFile);
  expect(found.isSomething).toBe(true);
  expect(found.unwrap().map(m => m.className)).toEqual(['CurrentWeatherService']);
});