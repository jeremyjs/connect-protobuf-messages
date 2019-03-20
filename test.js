const test = require('ava');
const OpenApiProtocol = require('./index');

test(t => {
    const protocol = new OpenApiProtocol();

    protocol.load();
    protocol.build();

    const ProtoOAVersionReq = protocol.getMessageByName('ProtoOAVersionReq')
    const protoPingReq = new ProtoOAVersionReq()
    const clientMsgId = 'test'
    const payloadType = 2104

    t.deepEqual(
        protocol.decode(
            protocol.encode(payloadType, protoPingReq, clientMsgId)
        ).payload.payloadType,
        payloadType
    );
});
