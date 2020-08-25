import camelCase from 'lodash.camelcase';
import { FileDescriptorProto } from 'google-protobuf/google/protobuf/descriptor_pb';
import { IExportEnumEntry, IExportMessageEntry } from './proto-ast-map';

const PROTO2_SYNTAX = 'proto2';

/**
 * reading stdin `CodeGeneratorRequest` type data
 */
export function withAllStdIn(callback: (buffer: Buffer) => void): void {
  const ret: Buffer[] = [];
  let len = 0;

  const stdin = process.stdin;
  stdin.on('readable', function () {
    let chunk;

    while ((chunk = stdin.read())) {
      if (!(chunk instanceof Buffer)) throw new Error('Did not receive buffer');
      ret.push(chunk);
      len += chunk.length;
    }
  });

  stdin.on('end', function () {
    callback(Buffer.concat(ret, len));
  });
}

export function uppercaseFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function withinNamespaceFromExportEntry(
  name: string,
  exportEntry: IExportMessageEntry | IExportEnumEntry
) {
  return exportEntry.protoPackage ? name.substring(exportEntry.protoPackage.length + 1) : name;
}

export function getPathToRoot(fileName: string) {
  const depth = fileName.split('/').length;
  return depth === 1 ? './' : new Array(depth).join('../');
}

export function filePathToPseudoNamespace(filePath: string): string {
  return filePath.replace('.proto', '').replace(/\//g, '_').replace(/\./g, '_').replace(/-/g, '_');
}

export function filePathFromProtoWithoutExt(protoFilePath: string): string {
  return protoFilePath.replace('.proto', '');
}

export function replaceProtoSuffix(protoFilePath: string): string {
  const suffix = '.proto';
  const hasProtoSuffix = protoFilePath.slice(protoFilePath.length - suffix.length) === suffix;
  return hasProtoSuffix ? protoFilePath.slice(0, -suffix.length) : protoFilePath;
}

export function isProto2Syntax(fileDescriptor: FileDescriptorProto): boolean {
  // Empty syntax defaults to proto2
  return fileDescriptor.getSyntax() === '' || fileDescriptor.getSyntax() === PROTO2_SYNTAX;
}

export function snakeToCamel(str: string): string {
  return camelCase(str);
}

export function isReservedWord(name: string): boolean {
  for (const keyword of reservedKeywords) {
    if (name === keyword) {
      return true;
    }
  }
  return false;
}

// reserved Javascript keywords used by the Javascript generator
// src: https://github.com/google/protobuf/blob/master/src/google/protobuf/compiler/js/js_generator.cc#L60-L119
const reservedKeywords = [
  'abstract',
  'boolean',
  'break',
  'byte',
  'case',
  'catch',
  'char',
  'class',
  'const',
  'continue',
  'debugger',
  'default',
  'delete',
  'do',
  'double',
  'else',
  'enum',
  'export',
  'extends',
  'false',
  'final',
  'finally',
  'float',
  'for',
  'function',
  'goto',
  'if',
  'implements',
  'import',
  'in',
  'instanceof',
  'int',
  'interface',
  'long',
  'native',
  'new',
  'null',
  'package',
  'private',
  'protected',
  'public',
  'return',
  'short',
  'static',
  'super',
  'switch',
  'synchronized',
  'this',
  'throw',
  'throws',
  'transient',
  'try',
  'typeof',
  'var',
  'void',
  'volatile',
  'while',
  'with',
];
