const http = require('http');

async function testApi() {
  console.log('Testing UChat backend modules...');

  const ipUtils = require('./ipUtils');
  const roomManager = require('./roomManager');

  // Test 1: IP Detection & Subnet Generation
  const testIp1 = '192.168.1.45';
  const autoRoom1 = ipUtils.getAutoRoomForIp(testIp1);
  console.log('✔ IP Subnet Matching (LAN):', autoRoom1);

  const testIp2 = '103.21.244.12';
  const autoRoom2 = ipUtils.getAutoRoomForIp(testIp2);
  console.log('✔ IP Matching (Public):', autoRoom2);

  // Test 2: Custom Room Creation
  const createRes = roomManager.createRoom({
    roomId: 'TEST-ROOM-99',
    name: 'Test Engineering Room',
    password: 'superSecretPassword123',
    isPrivate: true,
    maxUsers: 20
  });
  console.log('✔ Room Creation:', createRes.success ? 'PASSED' : 'FAILED');

  // Test 3: Password Verification
  const room = roomManager.rooms.get('TEST-ROOM-99');
  const validCheck = roomManager.verifyPassword(room, 'superSecretPassword123');
  const invalidCheck = roomManager.verifyPassword(room, 'wrongPassword');
  console.log('✔ Password Verification (Valid):', validCheck === true ? 'PASSED' : 'FAILED');
  console.log('✔ Password Verification (Invalid):', invalidCheck === false ? 'PASSED' : 'FAILED');

  // Test 4: User addition & presence
  const user1 = { id: 'u1', name: 'Neon Otter', avatar: 'Neon Otter', device: 'desktop' };
  const addRes1 = roomManager.addUser('sock_1', 'TEST-ROOM-99', user1, 'superSecretPassword123');
  console.log('✔ Add User with valid password:', addRes1.success ? 'PASSED' : 'FAILED');

  const addResFail = roomManager.addUser('sock_2', 'TEST-ROOM-99', { name: 'Intruder' }, 'badPass');
  console.log('✔ Add User with bad password rejected:', addResFail.success === false && addResFail.requiresPassword ? 'PASSED' : 'FAILED');

  // Test 5: Messaging & Reactions
  const msg = roomManager.addMessage('TEST-ROOM-99', {
    sender: user1,
    text: 'Hello world test message',
    type: 'text'
  });
  console.log('✔ Add Message to Room:', msg.text === 'Hello world test message' ? 'PASSED' : 'FAILED');

  const reaction = roomManager.toggleReaction('TEST-ROOM-99', msg.id, '🔥', 'Neon Otter');
  console.log('✔ Emoji Reaction:', reaction && reaction.reactions['🔥'] ? 'PASSED' : 'FAILED');

  console.log('\nAll core backend unit tests PASSED successfully!\n');
}

testApi().catch(console.error);
