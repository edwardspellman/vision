const http = require('http');
const fs = require('fs');
const path = require('path');
const FormData = require('buffer'); // we can craft multipart or raw http

async function runErrorSuite() {
  console.log('======================================================');
  console.log('⚡ VISION SYSTEM // COMPREHENSIVE ERROR & STRESS TEST');
  console.log('======================================================\n');

  const roomManager = require('./roomManager');
  const fileCleaner = require('./fileCleaner');

  let passed = 0;
  let failed = 0;

  function assert(name, condition) {
    if (condition) {
      console.log(`✔ [ERROR TEST] ${name}: HANDLED GRACEFULLY (PASSED)`);
      passed++;
    } else {
      console.log(`❌ [ERROR TEST] ${name}: FAILED`);
      failed++;
    }
  }

  // --- 1. DIRECTORY TRAVERSAL & MALICIOUS PATH INJECTION ---
  console.log('\n--- 1. Security & Path Traversal Injection Tests ---');
  
  const pathTraversal1 = fileCleaner.deleteUploadFile('../../server.js');
  assert('Path Traversal with ../../ relative path', pathTraversal1 === false);

  const pathTraversal2 = fileCleaner.deleteUploadFile('..\\..\\windows\\system32\\calc.exe');
  assert('Path Traversal with Windows backslash ..\\ path', pathTraversal2 === false);

  const nullPath = fileCleaner.deleteUploadFile(null);
  assert('Null file URL parameter passed to deletion utility', nullPath === false);

  const undefinedPath = fileCleaner.deleteUploadFile(undefined);
  assert('Undefined file URL parameter passed to deletion utility', undefinedPath === false);

  const emptyPath = fileCleaner.deleteUploadFile('');
  assert('Empty string file URL passed to deletion utility', emptyPath === false);

  const numberPath = fileCleaner.deleteUploadFile(12345);
  assert('Numeric type passed instead of string URL', numberPath === false);

  // --- 2. ROOM CAPACITY, PERMISSION & AUTHENTICATION VIOLATIONS ---
  console.log('\n--- 2. Room Capacity, Auth & Access Control Violations ---');

  // Create limited capacity room (maxUsers = 2)
  const roomErrId = 'ERROR-TEST-ROOM-' + Date.now();
  roomManager.createRoom({
    roomId: roomErrId,
    name: 'Restricted Vault',
    password: 'superSecretKey',
    maxUsers: 2,
    hostUser: { id: 'host_err_1', name: 'Master Host' }
  });

  const roomObj = roomManager.rooms.get(roomErrId);

  // Wrong password
  const wrongPwdRes = roomManager.addUser('sock_attacker', roomErrId, { id: 'bad_user', name: 'Intruder' }, 'badPassword');
  assert('Reject Join with Incorrect Password', wrongPwdRes.success === false && wrongPwdRes.requiresPassword === true);

  // Correct joins up to capacity
  const user1 = roomManager.addUser('sock_u1', roomErrId, { id: 'u1', name: 'User 1' }, 'superSecretKey');
  const user2 = roomManager.addUser('sock_u2', roomErrId, { id: 'u2', name: 'User 2' }, 'superSecretKey');
  assert('Fill Room to Max Capacity (2 users)', user1.success && user2.success);

  // 3rd user attempting to join full room
  const user3OverLimit = roomManager.addUser('sock_u3', roomErrId, { id: 'u3', name: 'User 3' }, 'superSecretKey');
  assert('Reject Join when Room is Full (Exceeds maxUsers limit)', user3OverLimit.success === false && user3OverLimit.error === 'Room is full');

  // Non-existent room join
  const nonExistentJoin = roomManager.addUser('sock_ghost', 'NON-EXISTENT-ROOM-XYZ', { id: 'ghost', name: 'Ghost' }, '');
  assert('Reject Join to Non-Existent Room', nonExistentJoin.success === false && nonExistentJoin.error === 'Room does not exist');

  // Empty room ID creation
  const emptyRoomRes = roomManager.createRoom({ roomId: '   ', name: 'Blank' });
  assert('Create Room with blank/whitespace ID rejected or sanitized', !emptyRoomRes.success || emptyRoomRes.room?.id !== '   ');

  // Duplicate room ID creation
  const duplicateRoomRes = roomManager.createRoom({ roomId: roomErrId, name: 'Dupe' });
  assert('Reject Duplicate Room ID Creation', duplicateRoomRes.success === false);

  // Unauthorized settings modification by non-host
  const unauthSettings = roomManager.updateRoomSettings('sock_u2', roomErrId, { name: 'Compromised Name' });
  assert('Reject Room Settings Modification by Non-Host', unauthSettings.success === false && unauthSettings.error.includes('Only the room host'));

  // --- 3. PAYLOAD OVERSIZED & MALFORMED MESSAGE ATTACKS ---
  console.log('\n--- 3. Message Payload & Input Sanitization Tests ---');

  // Message to non-existent room
  const msgNonExistent = roomManager.addMessage('DOES-NOT-EXIST-ROOM', {
    sender: { name: 'Test' },
    text: 'Hello void'
  });
  assert('Send Message to Non-Existent Room safely returns null', msgNonExistent === null);

  // Malformed message object (no text, no sender)
  const malformedMsg = roomManager.addMessage(roomErrId, {});
  assert('Malformed Message without sender/text defaults gracefully without crash', malformedMsg && malformedMsg.id && malformedMsg.text === '');

  // Message with 100,000 character overflow text (simulate buffer flood)
  const longText = 'A'.repeat(100000);
  const oversizedMsg = roomManager.addMessage(roomErrId, {
    sender: { name: 'Spammer' },
    text: longText
  });
  assert('Extremely Large Message handled safely in memory without heap failure', oversizedMsg && oversizedMsg.text.length === 100000);

  // Message reaction toggling on non-existent message ID
  const badReaction = roomManager.toggleReaction(roomErrId, 'fake-msg-id-12345', '🔥', 'Tester');
  assert('Emoji Reaction on Non-Existent Message ID returns null', badReaction === null);

  // Message reaction on non-existent room
  const badRoomReaction = roomManager.toggleReaction('NON-EXISTENT-ROOM', 'any-id', '🔥', 'Tester');
  assert('Emoji Reaction on Non-Existent Room returns null', badRoomReaction === null);

  // --- 4. EPHEMERAL PURGE WITH MISSING / CORRUPTED DISK FILES ---
  console.log('\n--- 4. Ephemeral Purge Fault Tolerance & Missing Files ---');

  // Add message with fileUrl pointing to non-existent file on disk
  const ghostFileName = `ghost-nonexistent-${Date.now()}.jpg`;
  roomObj.messages.push({
    id: 'msg_with_ghost_file',
    type: 'image',
    fileUrl: `/uploads/${ghostFileName}`,
    timestamp: Date.now() - (40 * 60 * 1000) // 40 minutes old
  });

  let purgeThrew = false;
  try {
    roomManager.purgeExpiredMessages();
  } catch (err) {
    purgeThrew = true;
  }
  assert('Purge message with missing disk file executes without ENOENT crash', purgeThrew === false);

  // --- 5. LIVE HTTP ENDPOINT ERROR RESPONSES ---
  console.log('\n--- 5. Live HTTP Server Error Responses (port 3000) ---');

  // 5a. 404 on non-existent upload file
  await new Promise((resolve) => {
    http.get('http://localhost:3000/uploads/non-existent-random-file-999.png', (res) => {
      assert('HTTP 404 returned for missing/purged upload file', res.statusCode === 404);
      resolve();
    }).on('error', (err) => {
      console.log('HTTP test error:', err.message);
      assert('HTTP 404 check', false);
      resolve();
    });
  });

  // 5b. Blocked file extension upload (.exe)
  await new Promise((resolve) => {
    const boundary = '----WebKitFormBoundaryErrorTest' + Date.now();
    const postData = [
      `--${boundary}`,
      'Content-Disposition: form-data; name="file"; filename="dangerous_script.exe"',
      'Content-Type: application/x-msdownload',
      '',
      'MZThisIsMockExecutableCode',
      `--${boundary}--`
    ].join('\r\n');

    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/upload',
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        let parsed;
        try { parsed = JSON.parse(body); } catch (e) {}
        const isBlocked = res.statusCode === 400 && parsed?.success === false;
        assert('Reject Malicious Upload (.exe file format blocked by security filter)', isBlocked);
        resolve();
      });
    });

    req.on('error', (err) => {
      console.log('Upload error test failed:', err.message);
      assert('Reject Malicious Upload', false);
      resolve();
    });

    req.write(postData);
    req.end();
  });

  // 5c. Blocked file extension upload (.bat)
  await new Promise((resolve) => {
    const boundary = '----WebKitFormBoundaryErrorTest2' + Date.now();
    const postData = [
      `--${boundary}`,
      'Content-Disposition: form-data; name="file"; filename="payload.bat"',
      'Content-Type: text/plain',
      '',
      '@echo off',
      `--${boundary}--`
    ].join('\r\n');

    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/upload',
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        let parsed;
        try { parsed = JSON.parse(body); } catch (e) {}
        const isBlocked = res.statusCode === 400 && parsed?.success === false;
        assert('Reject Malicious Upload (.bat script blocked by security filter)', isBlocked);
        resolve();
      });
    });

    req.on('error', (err) => {
      assert('Reject Malicious Script Upload', false);
      resolve();
    });

    req.write(postData);
    req.end();
  });

  // 5d. Empty upload request without any file
  await new Promise((resolve) => {
    const boundary = '----WebKitFormBoundaryEmpty' + Date.now();
    const postData = [
      `--${boundary}`,
      'Content-Disposition: form-data; name="someOtherField"',
      '',
      'no file here',
      `--${boundary}--`
    ].join('\r\n');

    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/upload',
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        let parsed;
        try { parsed = JSON.parse(body); } catch (e) {}
        assert('Reject Empty Upload Payload (returns 400 "No file provided")', res.statusCode === 400 && parsed?.error === 'No file provided');
        resolve();
      });
    });

    req.on('error', (err) => {
      assert('Reject Empty Upload Payload', false);
      resolve();
    });

    req.write(postData);
    req.end();
  });

  // Clean up test room
  roomManager.rooms.delete(roomErrId);

  console.log('\n======================================================');
  console.log(`🎯 ERROR & RESILIENCE TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runErrorSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
