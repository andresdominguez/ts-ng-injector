import {findModules} from "./find_modules";
import {createFile} from "./add_module";

test('finds services', () => {
  const file = `import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs/Observable';

@Injectable()
export class CurrentWeatherService {

  constructor(private http: HttpClient) {}
}
`;

  const sourceFile = createFile('before.ts', file);

  const found = findModules(sourceFile);
  expect(found.isSomething).toBe(true);
  expect(found.unwrap().map(m => m.className)).toEqual(['TestModule2', 'TestModule1']);
});