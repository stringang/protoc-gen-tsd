import { FieldDescriptorProto } from 'google-protobuf/google/protobuf/descriptor_pb';
import { ProtoAbstractSyntaxTreeMap } from '../proto-ast-map';
import { getFieldType } from './field-descriptor-formatter';
import { isReservedWord, snakeToCamel } from '../util';

export interface IExtensionDescriptorProtoModel {
  indent: string;
  extensionName: string;
  fieldType: string; // extension type
}

export function formatExtensionDescriptorProto(
  fileName: string,
  protoAbstractSyntaxTreeMap: ProtoAbstractSyntaxTreeMap,
  extension: FieldDescriptorProto,
  indent: string
): IExtensionDescriptorProtoModel {
  let extensionName = snakeToCamel(extension.getName());
  if (isReservedWord(extensionName)) {
    extensionName = `pb_${extensionName}`;
  }

  // get extension type
  const fieldType = getFieldType(
    extension.getType(),
    extension.getTypeName().slice(1),
    fileName,
    protoAbstractSyntaxTreeMap
  );

  return {
    indent,
    extensionName,
    fieldType,
  };
}
