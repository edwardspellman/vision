const crypto = require('crypto');

/**
 * Normalizes and extracts client IP address from Express Request or Socket handshake
 */
function getClientIp(reqOrSocket) {
  let ip = null;

  // If Socket.IO socket object
  if (reqOrSocket.handshake) {
    const headers = reqOrSocket.handshake.headers || {};
    ip = headers['cf-connecting-ip'] ||
         headers['x-real-ip'] ||
         (headers['x-forwarded-for'] ? headers['x-forwarded-for'].split(',')[0].trim() : null) ||
         reqOrSocket.handshake.address;
  } else if (reqOrSocket.headers) {
    // If Express req object
    const headers = reqOrSocket.headers;
    ip = headers['cf-connecting-ip'] ||
         headers['x-real-ip'] ||
         (headers['x-forwarded-for'] ? headers['x-forwarded-for'].split(',')[0].trim() : null) ||
         reqOrSocket.ip ||
         reqOrSocket.connection?.remoteAddress;
  }

  if (!ip) {
    return '127.0.0.1';
  }

  // Clean IPv4-mapped IPv6 addresses (e.g. ::ffff:192.168.1.5 -> 192.168.1.5)
  if (ip.startsWith('::ffff:')) {
    ip = ip.replace('::ffff:', '');
  }

  // Handle localhost IPv6
  if (ip === '::1' || ip === '0:0:0:0:0:0:0:1') {
    return '127.0.0.1';
  }

  return ip;
}

/**
 * Determine if IP is local/private network
 */
function isPrivateIp(ip) {
  if (!ip) return true;
  if (ip === '127.0.0.1' || ip === 'localhost') return true;
  // 10.0.0.0 - 10.255.255.255
  if (/^10\./.test(ip)) return true;
  // 172.16.0.0 - 172.31.255.255
  if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip)) return true;
  // 192.168.0.0 - 192.168.255.255
  if (/^192\.168\./.test(ip)) return true;
  // Carrier-grade NAT 100.64.0.0/10
  if (/^100\.(6[4-9]|[7-9][0-9]|1[0-1][0-9]|12[0-7])\./.test(ip)) return true;
  
  return false;
}

/**
 * Generates an automatic room ID based on the IP address.
 * People on the same public IP or local subnet are grouped together.
 */
function getAutoRoomForIp(rawIp) {
  const ip = rawIp || '127.0.0.1';
  const isLocal = isPrivateIp(ip);

  if (isLocal) {
    // For local networks (e.g. 192.168.1.x), group by /24 subnet
    const parts = ip.split('.');
    if (parts.length === 4) {
      return {
        roomId: `LAN-${parts[0]}-${parts[1]}-${parts[2]}`,
        roomName: `Local Wi-Fi Network (${parts[0]}.${parts[1]}.${parts[2]}.x)`,
        isLocal: true,
        networkType: 'Local Network'
      };
    }
    return {
      roomId: 'LAN-Localhost',
      roomName: 'Local Development Network',
      isLocal: true,
      networkType: 'Localhost'
    };
  }

  // For public IPs, group by full public IP or /24 subnet for NAT router rooms
  const hash = crypto.createHash('md5').update(ip).digest('hex').substring(0, 8).toUpperCase();
  const maskedIp = maskIp(ip);
  return {
    roomId: `IP-${hash}`,
    roomName: `Network Room (${maskedIp})`,
    isLocal: false,
    networkType: 'Public Wi-Fi / ISP'
  };
}

/**
 * Mask IP address for privacy display (e.g. 103.21.***.***)
 */
function maskIp(ip) {
  if (isPrivateIp(ip)) {
    return ip;
  }
  const parts = ip.split('.');
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.***.***`;
  }
  // IPv6
  const v6Parts = ip.split(':');
  if (v6Parts.length > 2) {
    return `${v6Parts[0]}:${v6Parts[1]}:****:****`;
  }
  return '***.***.***.***';
}

module.exports = {
  getClientIp,
  isPrivateIp,
  getAutoRoomForIp,
  maskIp
};
