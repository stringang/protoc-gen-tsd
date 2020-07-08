import * as path from 'path';
import * as fs from 'fs';
import { compileTemplate } from '../src/tmpl-engine';

describe('template engine', () => {
  it('should success', () => {
    const rawData = fs
      .readFileSync(path.join(__dirname, 'fixtures', 'proto-template-data.json'))
      .toString();
    const fn = compileTemplate('proto-tsd.tmpl');
    const output = fn(JSON.parse(rawData));
    console.log(output);
  });
});
