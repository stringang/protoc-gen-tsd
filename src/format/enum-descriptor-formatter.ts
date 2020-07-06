import {
  EnumDescriptorProto,
  EnumValueDescriptorProto,
} from 'google-protobuf/google/protobuf/descriptor_pb';

export interface IEnumDescriptorProtoModel {
  indent: string;
  enumName: string; // enum type name
  values: { [key: string]: number }; // enum element
}

/**
 * convert EnumDescriptorProto
 * @param enumDescriptor
 * @param indent
 */
export function formatEnumDescriptorProto(
  enumDescriptor: EnumDescriptorProto,
  indent: string
): IEnumDescriptorProtoModel {
  const enumName = enumDescriptor.getName();
  const values: { [key: string]: number } = {};

  enumDescriptor.getValueList().forEach((value: EnumValueDescriptorProto) => {
    values[value.getName().toUpperCase()] = value.getNumber();
  });

  return {
    indent,
    enumName,
    values,
  };
}
