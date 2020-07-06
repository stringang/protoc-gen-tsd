import {
  FieldDescriptorProto,
  OneofDescriptorProto,
} from 'google-protobuf/google/protobuf/descriptor_pb';

export interface IOneofDescriptorProtoModel {
  indent: string;
  oneofName: string;
  oneofNameUpper: string;
  fields: { [key: string]: number };
}

export function formatOneofProto(
  oneofDecl: OneofDescriptorProto,
  oneofFields: FieldDescriptorProto[],
  indent: string
): IOneofDescriptorProtoModel {
  const oneofName = oneofDecl.getName();
  const oneofNameUpper = oneofDecl.getName().toUpperCase();
  const fields: { [key: string]: number } = {};

  oneofFields.forEach((field) => {
    fields[field.getName().toUpperCase()] = field.getNumber();
  });

  return {
    indent,
    oneofName,
    oneofNameUpper,
    fields,
  };
}
