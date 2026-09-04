const http = require('http');
const crypto = require('crypto');
const ipUtils = require('./ipUtils');
const roomManager = require('./roomManager');

async function runComprehensiveTestSuite() {
  console.log('======================================================');
  console.log('🚀 STARTING COMPREHENSIVE VISION TEST SUITE & ERROR TESTS');
  console.log('======================================================\n');

  let passedTests = 0;
  let failedTests = 0;

  function assert(condition, testName, errorDetails = '') {
    if (condition) {
      console.log(`  [PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`❌ [FAIL] ${testName} - ${errorDetails}`);
      failedTests++;
    }
  }

  // --- SUITE 1: IP Subnet & Network Detection ---
  console.log('🔹 1. Testing IP Detection & Auto-Room Subnet Matching...');
  try {
    const lanRes = ipUtils.getAutoRoomForIp('192.168.1.105');
    assert(lanRes.isLocal === true && lanRes.roomId === 'LAN-192-168-1', 'LAN IP correctly maps to subnet room LAN-192-168-1');

    const publicRes = ipUtils.getAutoRoomForIp('103.21.244.12');
    assert(publicRes.isLocal === false && publicRes.roomId.startsWith('IP-'), 'Public IP maps to IP room');

    const fallbackRes = ipUtils.getAutoRoomForIp(null);
    assert(fallbackRes.roomId !== undefined, 'Null IP falls back gracefully without crashing');
  } catch (err) {
    assert(false, 'IP Detection Suite', err.message);
  }

  // --- SUITE 2: Room Creation & Duplicate Validation ---
  console.log('\n🔹 2. Testing Room Creation & Validation...');
  try {
    const createRes = roomManager.createRoom({
      roomId: 'SUITE-ROOM-1',
      name: 'Full Suite Test Room',
      password: 'testPassword123',
      isPrivate: true,
      maxUsers: 5,
      requireApproval: true,
      hostUser: { id: 'host_101', name: 'Alpha Host' }
    });
    assert(createRes.success === true && createRes.room.id === 'SUITE-ROOM-1', 'Create room with valid parameters');
    assert(createRes.room.requireApproval === true, 'Room requireApproval setting saved correctly');

    // ERROR TEST: Duplicate room ID creation
    const dupRes = roomManager.createRoom({
      roomId: 'SUITE-ROOM-1',
      name: 'Duplicate Room Attempt'
    });
    assert(dupRes.success === false && dupRes.error.includes('already exists'), '[ERROR TEST] Reject duplicate room ID creation');
  } catch (err) {
    assert(false, 'Room Creation Suite', err.message);
  }

  // --- SUITE 3: Password Authentication & Error Cases ---
  console.log('\n🔹 3. Testing Password Verification & Authentication Errors...');
  try {
    const room = roomManager.rooms.get('SUITE-ROOM-1');
    assert(roomManager.verifyPassword(room, 'testPassword123') === true, 'Valid room password authentication');
    assert(roomManager.verifyPassword(room, 'wrongPass') === false, '[ERROR TEST] Invalid password rejected');
    assert(roomManager.verifyPassword(room, null) === false, '[ERROR TEST] Null password rejected for protected room');

    const user1 = { id: 'u_alice', name: 'Alice', avatar: 'AliceAvatar', device: 'desktop' };
    const joinRes = roomManager.addUser('sock_alice', 'SUITE-ROOM-1', user1, 'testPassword123');
    assert(joinRes.success === true && joinRes.user.name === 'Alice', 'User added to protected room with valid password');

    // ERROR TEST: Bad password join attempt
    const user2 = { id: 'u_bob', name: 'Bob', avatar: 'BobAvatar' };
    const badJoin = roomManager.addUser('sock_bob', 'SUITE-ROOM-1', user2, 'wrongPassword');
    assert(badJoin.success === false && badJoin.requiresPassword === true, '[ERROR TEST] Reject user join with incorrect password');

    // ERROR TEST: Non-existent room join attempt
    const nonExistJoin = roomManager.addUser('sock_ghost', 'NON-EXISTENT-ROOM', user2, 'pass');
    assert(nonExistJoin.success === false && nonExistJoin.error === 'Room does not exist', '[ERROR TEST] Reject join to non-existent room');
  } catch (err) {
    assert(false, 'Password Authentication Suite', err.message);
  }

  // --- SUITE 4: Host Approval ("Knocking") Flow & Settings Updates ---
  console.log('\n🔹 4. Testing Host Approval ("Knocking") & Room Settings Update...');
  try {
    const candidateUser = { id: 'u_charlie', name: 'Charlie' };
    const addPending = roomManager.addPendingApproval('sock_charlie', 'SUITE-ROOM-1', candidateUser);
    assert(addPending === true, 'Add pending knocking candidate to room');

    const room = roomManager.rooms.get('SUITE-ROOM-1');
    assert(room.pendingApprovals.has('sock_charlie'), 'Pending candidate stored in room.pendingApprovals map');

    roomManager.removePendingApproval('sock_charlie', 'SUITE-ROOM-1');
    assert(!room.pendingApprovals.has('sock_charlie'), 'Pending candidate removed after host decision');

    // Host Socket resolution
    const hostSocket = roomManager.getHostSocketId('SUITE-ROOM-1');
    assert(hostSocket === 'sock_alice', 'Correctly identify host socket ID in room');

    // Room settings update by host
    const settingRes = roomManager.updateRoomSettings('SUITE-ROOM-1', 'sock_alice', { requireApproval: false, name: 'Updated Room Name' });
    assert(settingRes.success === true && settingRes.room.requireApproval === false, 'Host updates room settings successfully');

    // ERROR TEST: Non-host attempt to update room settings
    const nonHostSetting = roomManager.updateRoomSettings('SUITE-ROOM-1', 'sock_intruder', { requireApproval: true });
    assert(nonHostSetting.success === false && nonHostSetting.error.includes('Only the room host'), '[ERROR TEST] Reject room settings update from non-host');
  } catch (err) {
    assert(false, 'Host Approval & Settings Suite', err.message);
  }

  // --- SUITE 5: Messaging, Reactions, Voice Messages & 30-Min Auto-Purge ---
  console.log('\n🔹 5. Testing Messaging, Voice Messages, Reactions & Auto-Purge...');
  try {
    const sender = { id: 'u_alice', name: 'Alice' };

    // Standard text message
    const msg1 = roomManager.addMessage('SUITE-ROOM-1', {
      sender,
      text: 'Hello Vision team!',
      type: 'text'
    });
    assert(msg1 && msg1.text === 'Hello Vision team!', 'Add standard text message to room');

    // Voice message
    const voiceMsg = roomManager.addMessage('SUITE-ROOM-1', {
      sender,
      text: 'Voice note (0:05)',
      type: 'audio',
      fileUrl: 'data:audio/webm;base64,GkXfo59ChoEBQveBAULygQ==',
      audioDuration: 5
    });
    assert(voiceMsg && voiceMsg.type === 'audio' && voiceMsg.audioDuration === 5, 'Add voice audio message to room');

    // Emoji reaction
    const reactAdd = roomManager.toggleReaction('SUITE-ROOM-1', msg1.id, '👍', 'Alice');
    assert(reactAdd && reactAdd.reactions['👍'].includes('Alice'), 'Add emoji reaction to message');

    const reactRemove = roomManager.toggleReaction('SUITE-ROOM-1', msg1.id, '👍', 'Alice');
    assert(reactRemove && !reactRemove.reactions['👍'], 'Remove emoji reaction when toggled again');

    // ERROR TEST: Message to non-existent room
    const badMsg = roomManager.addMessage('GHOST-ROOM', { sender, text: 'No room here' });
    assert(badMsg === null, '[ERROR TEST] Null returned when adding message to non-existent room');

    // 30-Minute Auto-Purge Test
    const room = roomManager.rooms.get('SUITE-ROOM-1');
    const oldTimestamp = Date.now() - (31 * 60 * 1000); // 31 minutes ago
    room.messages.push({
      id: 'old_msg_101',
      sender,
      text: 'Expired old message',
      timestamp: oldTimestamp
    });
    roomManager.purgeExpiredMessages();
    const remainingMsgs = roomManager.getMessages('SUITE-ROOM-1');
    assert(!remainingMsgs.some(m => m.id === 'old_msg_101'), 'Auto-purge purges messages older than 30 minutes');
  } catch (err) {
    assert(false, 'Messaging & Purging Suite', err.message);
  }

  // --- SUITE 6: User Removal & Typing Indicators ---
  console.log('\n🔹 6. Testing User Removal & Typing Indicators...');
  try {
    const typingList = roomManager.setTyping('SUITE-ROOM-1', 'Alice', true);
    assert(typingList.includes('Alice'), 'Alice added to active typing users');

    const stopTyping = roomManager.setTyping('SUITE-ROOM-1', 'Alice', false);
    assert(!stopTyping.includes('Alice'), 'Alice removed from active typing users');

    const removeRes = roomManager.removeUser('sock_alice');
    assert(removeRes && removeRes.roomId === 'SUITE-ROOM-1', 'Remove user by socket ID cleans mapping');
  } catch (err) {
    assert(false, 'User Removal Suite', err.message);
  }

  // --- SUITE 7: HTTP Health Check Server Test ---
  console.log('\n🔹 7. Testing Live HTTP Server Endpoint...');
  await new Promise((resolve) => {
    http.get('http://localhost:3000/api/health', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          assert(res.statusCode === 200 && json.status === 'ok', 'HTTP GET /api/health returns HTTP 200 OK');
        } catch (err) {
          assert(false, 'Live HTTP Server Test', err.message);
        }
        resolve();
      });
    }).on('error', (err) => {
      assert(false, 'Live HTTP Server Test Connection', err.message);
      resolve();
    });
  });

  console.log('\n======================================================');
  console.log(`📊 TEST RESULTS: ${passedTests} PASSED, ${failedTests} FAILED out of ${passedTests + failedTests} TOTAL TESTS`);
  console.log('======================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runComprehensiveTestSuite().catch(err => {
  console.error('Fatal error running test suite:', err);
  process.exit(1);
});
