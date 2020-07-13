import { withAllStdIn } from '../src/util';
import assert = require('assert');

describe('protoc plugin entry - index.ts', () => {
  it('should read stdin', () => {
    const message = 'test';
    withAllStdIn((buffer: Buffer) => {
      assert.strictEqual(buffer.toString(), message);
    });

    process.stdin.push(message);
    process.stdin.emit('readable');
    process.stdin.emit('end');
  });
});
