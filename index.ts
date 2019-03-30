import protobuf from 'protobufjs'

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
  private builder
  private rootUrl

  constructor({ version = '60' } = {}) {
    this.version = version
    this.version_config = VERSION_CONFIG_MAP[version]
    this.filepaths = this.version_config.resolve_names.map(require.resolve)
    this.builder = undefined
    this.payloadTypes = {}
    this.names = {}
    this.messages = {}
    this.enums = {}
  }

  public encode (payloadType, params, clientMsgId) {
    const Message = this.getMessageByPayloadType(payloadType)
    const message = new Message(params)

    return this.wrap(payloadType, message, clientMsgId).encode()
  }

  public wrap (payloadType, message, clientMsgId) {
    const ProtoMessage = this.getMessageByName('ProtoMessage')

    return new ProtoMessage({
      payloadType: payloadType,
      payload: message.toBuffer(),
      clientMsgId: clientMsgId
    })
  }

  public decode (buffer) {
    const ProtoMessage = this.getMessageByName('ProtoMessage')
    const protoMessage = ProtoMessage.decode(buffer)
    const payloadType = protoMessage.payloadType

    return {
      payload: this.getMessageByPayloadType(payloadType).decode(
        protoMessage.payload,
      ),
      payloadType,
      clientMsgId: protoMessage.clientMsgId,
    }
  }

  public load () {
    this.filepaths.map((filepath) => {
      this.builder = protobuf.loadProtoFile(filepath, this.builder)
    })
  }

  public markFileAsLoadedForImport (protoFile) {
    this.rootUrl = this.rootUrl || protoFile.url.replace(/\/[^\/]*$/, '') + '/'
    this.builder.files[this.rootUrl + protoFile.name] = true
  }

  public loadFile (protoFile) {
    this.builder = protobuf.loadProtoFile(protoFile.url, this.builder)
    this.markFileAsLoadedForImport(protoFile)
  }

  public build () {
    const builder = this.builder

    builder.build()

    const messages: any[] = []
    const enums: any[] = []

    builder.ns.children.forEach((reflect) => {
      const className = reflect.className

      if (className === 'Message') {
        messages.push(reflect)
      } else if (className === 'Enum') {
        enums.push(reflect)
      }
    })

    messages
      .filter((message) => {
        return typeof this.findPayloadType(message) === 'number'
      })
      .forEach((message) => {
        const name = message.name

        const messageBuilded = builder.build(name)

        this.messages[name] = messageBuilded

        const payloadType = this.findPayloadType(message)

        this.names[name] = {
          messageBuilded: messageBuilded,
          payloadType: payloadType
        }
        this.payloadTypes[payloadType] = {
          messageBuilded: messageBuilded,
          name: name
        }
      }, this)

    enums.forEach((item) => {
      const name = item.name
      enums[name] = builder.build(name)
    })

    this.buildWrapper()
  }

  public buildWrapper () {
    const name = 'ProtoMessage'
    const messageBuilded = this.builder.build(name)
    this.messages[name] = messageBuilded
    this.names[name] = {
      messageBuilded: messageBuilded,
      payloadType: undefined
    }
  }

  public findPayloadType (message) {
    const field = message.children.find((field) => {
      return field.name === 'payloadType'
    })

    if (field) {
      return field.defaultValue
    }
  }

  public getMessageByPayloadType (payloadType) {
    this.errorOnPayloadTypeMissing(payloadType)
    return this.payloadTypes[payloadType].messageBuilded
  }

  public getMessageByName (name) {
    this.errorOnNameMissing(name)
    return this.names[name].messageBuilded
  }

  public getPayloadTypeByName (name) {
    this.errorOnNameMissing(name)
    return this.names[name].payloadType
  }

  public errorOnPayloadTypeMissing (payloadType) {
    const payload_type_keys = Object.keys(this.payloadTypes)

    if (!payload_type_keys.includes(String(payloadType))) {
      if (payload_type_keys.length === 0) {
        throw new Error(
          `Warning: No payload types: ${this.payloadTypes} imported from files: ${this.filepaths}`
        )
      }

      throw new Error(
        `Payload type: ${payloadType} not found in files: ${this.filepaths}`
      )
    }
  }

  public errorOnNameMissing (name) {
    const name_keys = Object.keys(this.names)

    if (!name_keys.includes(name)) {
      if (name_keys.length === 0) {
        throw new Error(
          `Warning: No names: ${this.names} imported from files: ${this.filepaths}`
        )
      }

      throw new Error(`${name} not found in files: ${this.filepaths}`)
    }
  }
}
