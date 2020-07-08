// package: helloworld
// file: examples/protos/echo.proto

// GENERATED CODE -- DO NOT EDIT!

/* tslint:disable */
/* eslint-disable */

export namespace EchoRequest {
  export interface IEchoRequest {
    id: number;
    name: string;
    email: string;
    phones: Array<EchoRequest.PhoneNumber>;
  }

  export namespace PhoneNumber {
    export interface IPhoneNumber {
      number: string;
      type: EchoRequest.PhoneType;
    }
  }

  export enum PhoneType {
    MOBILE = 0,
    HOME = 1,
    WORK = 2,
  }
}

export namespace EchoResponse {
  export interface IEchoResponse {
    message: string;
  }
}

export namespace OneOfValues {
  export interface IOneOfValues {
    intChoice: number;
    stringChoice: string;
  }
}

export enum Status {
  UNKNOWN = 0,
  SUCCESS = 1,
}
