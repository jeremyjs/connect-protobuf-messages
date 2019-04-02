import test from 'ava'

import { OpenApiProtocol } from './index.js'

const testProtocolForPayload = (t, protocol, payloadName, payload = {}) => {
  const TypeClass = protocol.getClassByName(payloadName)

  const payloadType = protocol.getTypeByClass(TypeClass)
  const message = TypeClass.create(payload)
  const clientMsgId = 'test'

  const encoded_message = protocol.encode(payloadType, message, clientMsgId)
  const decoded_message = protocol.decode(encoded_message)
  const decoded_payload = decoded_message.payload

  t.deepEqual(decoded_payload.payloadType, payloadType)
}

test('initialized with no params, defaults to version: \'60\'', t => {
  const protocol = new OpenApiProtocol()
  t.is(protocol.version, '60')
})

test('the protocol can initialize with version: \'60\'', async (t) => {
  const protocol = new OpenApiProtocol({ version: '60' })
  await protocol.load()

  testProtocolForPayload(t, protocol, 'ProtoOAVersionReq')
})

// test('the protocol can initialize with version: \'59\'', async (t) => {
//   const protocol = new OpenApiProtocol({ version: '59' })
//   await protocol.load()

//   testProtocolForPayload(t, protocol, 'ProtoOAVersionReq')
//   testProtocolForPayload(t, protocol, 'ProtoPingReq', {
//     timestamp: Date.now()
//   })
// })

test.todo('#encode')
test.todo('#wrap')
test.todo('#decode')
test.todo('#load')
test.todo('#markFileAsLoadedForImport')
test.todo('#loadFile')
test.todo('#build')
test.todo('#buildWrapper')
test.todo('#findPayloadType')
test.todo('#getMessageByPayloadType')
test.todo('#getMessageByName')
test.todo('#getPayloadTypeByName')
test.todo('#errorOnPayloadTypeMissing')
test.todo('#errorOnNameMissing')
