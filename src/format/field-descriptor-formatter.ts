import { FieldDescriptorProto } from 'google-protobuf/google/protobuf/descriptor_pb';
import {
  ProtoAbstractSyntaxTreeMap,
  IExportEnumEntry,
  IExportMessageEntry,
} from '../proto-ast-map';
import { filePathToPseudoNamespace, withinNamespaceFromExportEntry } from '../util';

export const MESSAGE_TYPE = 11;
export const BYTES_TYPE = 12;
export const ENUM_TYPE = 14;

// @see https://github.com/protocolbuffers/protobuf/blob/master/src/google/protobuf/descriptor.proto#L542
export const JS_NORMAL = 0;
export const JS_STRING = 1;
export const JS_NUMBER = 2;

interface ITypeMap {
  [key: number]: string;
}

const TypeNumToTypeString = {} as ITypeMap;
TypeNumToTypeString[1] = 'number'; // TYPE_DOUBLE
TypeNumToTypeString[2] = 'number'; // TYPE_FLOAT
TypeNumToTypeString[3] = 'number'; // TYPE_INT64
TypeNumToTypeString[4] = 'number'; // TYPE_UINT64
TypeNumToTypeString[5] = 'number'; // TYPE_INT32
TypeNumToTypeString[6] = 'number'; // TYPE_FIXED64
TypeNumToTypeString[7] = 'number'; // TYPE_FIXED32
TypeNumToTypeString[8] = 'boolean'; // TYPE_BOOL
TypeNumToTypeString[9] = 'string'; // TYPE_STRING
TypeNumToTypeString[10] = 'Object'; // TYPE_GROUP
TypeNumToTypeString[MESSAGE_TYPE] = 'Object'; // TYPE_MESSAGE - Length-delimited aggregate.
TypeNumToTypeString[BYTES_TYPE] = 'Uint8Array'; // TYPE_BYTES
TypeNumToTypeString[13] = 'number'; // TYPE_UINT32
TypeNumToTypeString[ENUM_TYPE] = 'number'; // TYPE_ENUM
TypeNumToTypeString[15] = 'number'; // TYPE_SFIXED32
TypeNumToTypeString[16] = 'number'; // TYPE_SFIXED64
TypeNumToTypeString[17] = 'number'; // TYPE_SINT32 - Uses ZigZag encoding.
TypeNumToTypeString[18] = 'number'; // TYPE_SINT64 - Uses ZigZag encoding.

const JsTypeNumToTypeString = {} as ITypeMap;
JsTypeNumToTypeString[JS_NORMAL] = null; // [jstype = JS_NORMAL], value "null" means just using the original type
JsTypeNumToTypeString[JS_STRING] = 'string'; // [jstype = JS_STRING]
JsTypeNumToTypeString[JS_NUMBER] = 'number'; // [jstype = JS_NUMBER]

export function getTypeName(fieldTypeNum: number): string {
  return TypeNumToTypeString[fieldTypeNum];
}

export function getJsTypeName(fieldTypeNum: number): string {
  return fieldTypeNum === JS_NORMAL ? null : JsTypeNumToTypeString[fieldTypeNum];
}

/**
 * convert proto type
 * @param type
 * @param typeName
 * @param currentFileName
 * @param protoAbstractSyntaxTreeMap
 */
export function getFieldType(
  type: FieldDescriptorProto.Type,
  typeName: string,
  currentFileName: string,
  protoAbstractSyntaxTreeMap: ProtoAbstractSyntaxTreeMap
): string {
  let fieldType: string;
  let fromExport: IExportMessageEntry | IExportEnumEntry;
  let withinNamespace: string;

  switch (type) {
    case MESSAGE_TYPE:
      fromExport = protoAbstractSyntaxTreeMap.getMessage(typeName);
      if (!fromExport) {
        throw new Error('Could not getFieldType for message: ' + typeName);
      }
      withinNamespace = withinNamespaceFromExportEntry(typeName, fromExport);
      if (fromExport.protoFileName === currentFileName) {
        fieldType = withinNamespace;
      } else {
        fieldType = filePathToPseudoNamespace(fromExport.protoFileName) + '.' + withinNamespace;
      }
      break;

    case ENUM_TYPE:
      fromExport = protoAbstractSyntaxTreeMap.getEnum(typeName);
      if (!fromExport) {
        throw new Error('Could not getFieldType for enum: ' + typeName);
      }
      withinNamespace = withinNamespaceFromExportEntry(typeName, fromExport);
      if (fromExport.protoFileName === currentFileName) {
        fieldType = withinNamespace;
      } else {
        fieldType = filePathToPseudoNamespace(fromExport.protoFileName) + '.' + withinNamespace;
      }
      break;

    default:
      fieldType = TypeNumToTypeString[type];
      break;
  }

  return fieldType;
}
