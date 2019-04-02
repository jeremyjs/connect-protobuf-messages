import protobuf, { Root } from 'protobufjs'

const VERSION_CONFIG_MAP = {
  '59': {
    resolve_names: [
      'open-api-protobuf-messages-v59/CommonMessages.proto',
      'open-api-protobuf-messages-v59/OpenApiMessages.proto',
    ],
  },
  '60': {
    resolve_names: [
      'open-api-protobuf-messages-v60/OpenApiCommonMessages.proto',
      'open-api-protobuf-messages-v60/OpenApiMessages.proto',
    ],
  },
}

export class OpenApiProtocol {
  public version
  public filepaths
  public payloadTypes
  public names
  public messages
  public enums

  private version_config
  private rootUrl
  private namespace_root: Root

  constructor({ version = '60' } = {}) {
    this.version = version
    this.version_config = VERSION_CONFIG_MAP[version]
    this.filepaths = this.version_config.resolve_names.map(require.resolve)
    this.payloadTypes = {}
    this.names = {}
    this.messages = {}
    this.enums = {}
    this.namespace_root = new Root()
  }

  public encode (payload_name, params, client_msg_id) {
    const TypeClass = this.getClassByName(payload_name)
    const payload_type = this.getTypeByClass(TypeClass)
    
    TypeClass.verify(params)
    
    const ProtoMessage = this.getClassByName('ProtoMessage')

    return ProtoMessage.create({
      payloadType: payload_type,
      payload: TypeClass.encode(params).finish(),
      clientMsgId: client_msg_id
    })
  }

  public decode (buffer) {
    const ProtoMessageClass = this.getClassByName('ProtoMessage')
    const proto_message: any = ProtoMessageClass.decode(buffer)
    const payload_type = proto_message.payloadType
    const TypeClass = this.getClassbyType(payload_type)
    const payload = TypeClass.decode(proto_message.payload)

    return {
      payloadType: payload_type,
      payload,
      clientMsgId: proto_message.clientMsgId,
    }
  }

  public async load () {
    await Promise.all(
      this.filepaths.map(async (filepath) => {
        const root = await protobuf.load(filepath)
        this.namespace_root = Root.fromJSON(Object.assign({}, this.namespace_root, root.toJSON()))
      })
    )
    .catch(console.error)
  }

  // TODO: lookupEnum

  public getClassByName (name) {
    // if (name_keys.length === 0) {
    //   throw new Error(
    //     `Warning: No names: ${this.names} imported from files: ${this.filepaths}`
    //   )
    // }
    try {
      return this.namespace_root.lookupType(name)
    } catch (e) {
      if (e.message.includes('no such type')) {
        throw new Error(
          `type \`${name}\` not found in files:\n` +
          this.version_config.resolve_names.join('\n')
        )
      } else {
        throw e
      }
    }
  }

  public getTypeByClass (TypeClass) {
    const PayloadTypeEnum = this.namespace_root.lookupEnum('ProtoOAPayloadType')
    console.log(PayloadTypeEnum)
    return 0
  }

  public getClassbyType (payload_type) {
    const PayloadTypeEnum = this.namespace_root.lookupEnum('ProtoOAPayloadType')
    console.log(PayloadTypeEnum)
    return this.namespace_root.lookupType('ProtoMessage')
  }
}

// try {
//   const main = async () => {
//     const protocol = new OpenApiProtocol({ version: '60' })
//     await protocol.load()
//     const message_1 = protocol.getClassByName('ProtoOAApplicationAuthReq')
//     console.log('message_1:', message_1)
//     const message = protocol.getClassByName('foobar')
//   }

//   main().then(() => process.exit(0)).catch(console.error)
// } catch (e) {
//   console.error(e)
// }
