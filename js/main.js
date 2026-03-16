// 'use strict';

// var isChannelReady = false;
// var isInitiator = false;
// var isStarted = false;
// var localStream;
// var pc;
// var remoteStream;
// var turnReady;

// var pcConfig = {
//   'iceServers': [{
//     'urls': 'stun:stun.l.google.com:19302'
//   }]
// };

// // Set up audio and video regardless of what devices are present.
// var sdpConstraints = {
//   offerToReceiveAudio: true,
//   offerToReceiveVideo: true
// };

// /////////////////////////////////////////////

// var room = 'foo';
// // Could prompt for room name:
// // room = prompt('Enter room name:');

// var socket = io.connect();

// if (room !== '') {
//   socket.emit('create or join', room);
//   console.log('Attempted to create or  join room', room);
// }

// socket.on('created', function(room) {
//   console.log('Created room ' + room);
//   isInitiator = true;
// });

// socket.on('full', function(room) {
//   console.log('Room ' + room + ' is full');
// });

// socket.on('join', function (room){
//   console.log('Another peer made a request to join room ' + room);
//   console.log('This peer is the initiator of room ' + room + '!');
//   isChannelReady = true;
// });

// socket.on('joined', function(room) {
//   console.log('joined: ' + room);
//   isChannelReady = true;
// });

// socket.on('log', function(array) {
//   console.log.apply(console, array);
// });

// ////////////////////////////////////////////////

// function sendMessage(message) {
//   console.log('Client sending message: ', message);
//   socket.emit('message', message, room);
// }

// // This client receives a message
// socket.on('message', function(message) {
//   console.log('Client received message:', message);
//   if (message === 'got user media') {
//     maybeStart();
//   } else if (message.type === 'offer') {
//     if (!isInitiator && !isStarted) {
//       maybeStart();
//     }
//     pc.setRemoteDescription(new RTCSessionDescription(message));
//     doAnswer();
//   } else if (message.type === 'answer' && isStarted) {
//     pc.setRemoteDescription(new RTCSessionDescription(message));
//   } else if (message.type === 'candidate' && isStarted) {
//     var candidate = new RTCIceCandidate({
//       sdpMLineIndex: message.label,
//       candidate: message.candidate
//     });
//     pc.addIceCandidate(candidate);
//   } else if (message === 'bye' && isStarted) {
//     handleRemoteHangup();
//   }
// });

// ////////////////////////////////////////////////////

// var localVideo = document.querySelector('#localVideo');
// var remoteVideo = document.querySelector('#remoteVideo');

// navigator.mediaDevices.getUserMedia({
//   audio: false,
//   video: true
// })
// .then(gotStream)
// .catch(function(e) {
//   alert('getUserMedia() error: ' + e.name);
// });

// function gotStream(stream) {
//   console.log('Adding local stream.');
//   localStream = stream;
//   localVideo.srcObject = stream;
//   sendMessage('got user media');
//   if (isInitiator) {
//     maybeStart();
//   }
// }

// var constraints = {
//   video: true
// };

// console.log('Getting user media with constraints', constraints);

// if (location.hostname !== 'localhost') {
//   requestTurn(
//     'https://computeengineondemand.appspot.com/turn?username=41784574&key=4080218913'
//   );
// }

// function maybeStart() {
//   console.log('>>>>>>> maybeStart() ', isStarted, localStream, isChannelReady);
//   if (!isStarted && typeof localStream !== 'undefined' && isChannelReady) {
//     console.log('>>>>>> creating peer connection');
//     createPeerConnection();
//     pc.addStream(localStream);
//     isStarted = true;
//     console.log('isInitiator', isInitiator);
//     if (isInitiator) {
//       doCall();
//     }
//   }
// }

// window.onbeforeunload = function() {
//   sendMessage('bye');
// };

// /////////////////////////////////////////////////////////

// function createPeerConnection() {
//   try {
//     pc = new RTCPeerConnection(null);
//     pc.onicecandidate = handleIceCandidate;
//     pc.onaddstream = handleRemoteStreamAdded;
//     pc.onremovestream = handleRemoteStreamRemoved;
//     console.log('Created RTCPeerConnnection');
//   } catch (e) {
//     console.log('Failed to create PeerConnection, exception: ' + e.message);
//     alert('Cannot create RTCPeerConnection object.');
//     return;
//   }
// }

// function handleIceCandidate(event) {
//   console.log('icecandidate event: ', event);
//   if (event.candidate) {
//     sendMessage({
//       type: 'candidate',
//       label: event.candidate.sdpMLineIndex,
//       id: event.candidate.sdpMid,
//       candidate: event.candidate.candidate
//     });
//   } else {
//     console.log('End of candidates.');
//   }
// }

// function handleCreateOfferError(event) {
//   console.log('createOffer() error: ', event);
// }

// function doCall() {
//   console.log('Sending offer to peer');
//   pc.createOffer(setLocalAndSendMessage, handleCreateOfferError);
// }

// function doAnswer() {
//   console.log('Sending answer to peer.');
//   pc.createAnswer().then(
//     setLocalAndSendMessage,
//     onCreateSessionDescriptionError
//   );
// }

// function setLocalAndSendMessage(sessionDescription) {
//   pc.setLocalDescription(sessionDescription);
//   console.log('setLocalAndSendMessage sending message', sessionDescription);
//   sendMessage(sessionDescription);
// }

// function onCreateSessionDescriptionError(error) {
//   trace('Failed to create session description: ' + error.toString());
// }

// function requestTurn(turnURL) {
//   var turnExists = false;
//   for (var i in pcConfig.iceServers) {
//     if (pcConfig.iceServers[i].urls.substr(0, 5) === 'turn:') {
//       turnExists = true;
//       turnReady = true;
//       break;
//     }
//   }
//   if (!turnExists) {
//     console.log('Getting TURN server from ', turnURL);
//     // No TURN server. Get one from computeengineondemand.appspot.com:
//     var xhr = new XMLHttpRequest();
//     xhr.onreadystatechange = function() {
//       if (xhr.readyState === 4 && xhr.status === 200) {
//         var turnServer = JSON.parse(xhr.responseText);
//         console.log('Got TURN server: ', turnServer);
//         pcConfig.iceServers.push({
//           'urls': 'turn:' + turnServer.username + '@' + turnServer.turn,
//           'credential': turnServer.password
//         });
//         turnReady = true;
//       }
//     };
//     xhr.open('GET', turnURL, true);
//     xhr.send();
//   }
// }

// function handleRemoteStreamAdded(event) {
//   console.log('Remote stream added.');
//   remoteStream = event.stream;
//   remoteVideo.srcObject = remoteStream;
// }

// function handleRemoteStreamRemoved(event) {
//   console.log('Remote stream removed. Event: ', event);
// }

// function hangup() {
//   console.log('Hanging up.');
//   stop();
//   sendMessage('bye');
// }

// function handleRemoteHangup() {
//   console.log('Session terminated.');
//   stop();
//   isInitiator = false;
// }

// function stop() {
//   isStarted = false;
//   pc.close();
//   pc = null;
// }

/////////////////////////////////////////////////////////////////////////////////////
//////////
'use strict';

const socket = io();

const params = new URLSearchParams(window.location.search);
const room = params.get('room') || 'foo';
const role = params.get('role') || 'viewer'; // 'sender' or 'viewer'

const localVideo = document.querySelector('#localVideo');
const remoteVideo = document.querySelector('#remoteVideo');
const startButton = document.querySelector('#startButton');
const statusEl = document.querySelector('#status');

let mySocketId = null;
let senderId = null;
let localStream = null;

// sender: viewerId -> RTCPeerConnection
const peerConnections = new Map();

// viewer: single pc to sender
let viewerPc = null;

const pcConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' }
  ]
};

socket.on('connect', () => {
  socket.emit('join room', { room, role });
});

socket.on('log', (array) => {
  console.log.apply(console, array);
});

socket.on('role assigned', ({ role, room, socketId, senderId: existingSenderId }) => {
  mySocketId = socketId;
  if (existingSenderId) senderId = existingSenderId;
  setStatus(`Connected as ${role} in room ${room}`);
  setupUi();
});

socket.on('waiting for sender', () => {
  setStatus('Waiting for sender...');
});

socket.on('sender available', ({ senderId: sid }) => {
  senderId = sid;
  setStatus(`Sender available: ${sid}`);
});

socket.on('viewer joined', async ({ viewerId }) => {
  if (role !== 'sender') return;
  if (!localStream) {
    console.warn('Viewer joined, but local screen stream is not started yet.');
    return;
  }
  await createSenderPeerForViewer(viewerId);
});

socket.on('viewer disconnected', ({ viewerId }) => {
  if (role !== 'sender') return;
  closeSenderPeer(viewerId);
});

socket.on('sender disconnected', () => {
  setStatus('Sender disconnected.');
  if (viewerPc) {
    viewerPc.close();
    viewerPc = null;
  }
  remoteVideo.srcObject = null;
  senderId = null;
});

socket.on('signal', async ({ from, data }) => {
  console.log('Received signal from', from, data);

  if (role === 'sender') {
    let pc = peerConnections.get(from);
    if (!pc) {
      if (!localStream) return;
      pc = await createSenderPeerForViewer(from, false);
    }

    if (data.type === 'answer') {
      await pc.setRemoteDescription(new RTCSessionDescription(data));
    } else if (data.type === 'candidate') {
      if (data.candidate) {
        await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
      }
    }
  } else {
    if (!viewerPc) {
      viewerPc = createViewerPeer(from);
    }

    if (data.type === 'offer') {
      await viewerPc.setRemoteDescription(new RTCSessionDescription(data));
      const answer = await viewerPc.createAnswer();
      await viewerPc.setLocalDescription(answer);

      sendSignal(from, viewerPc.localDescription);
    } else if (data.type === 'candidate') {
      if (data.candidate) {
        await viewerPc.addIceCandidate(new RTCIceCandidate(data.candidate));
      }
    }
  }
});

function sendSignal(target, data) {
  socket.emit('signal', {
    room,
    target,
    data
  });
}

function setStatus(text) {
  console.log(text);
  if (statusEl) statusEl.textContent = text;
}

function setupUi() {
  if (role === 'sender') {
    startButton.style.display = 'inline-block';
    localVideo.style.display = 'block';
    remoteVideo.style.display = 'none';
  } else {
    startButton.style.display = 'none';
    localVideo.style.display = 'none';
    remoteVideo.style.display = 'block';
  }
}

startButton?.addEventListener('click', async () => {
  if (role !== 'sender') return;

  try {
    localStream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        frameRate: 15
      },
      audio: false
    });

    localVideo.srcObject = localStream;
    setStatus('Screen sharing started.');

    const videoTrack = localStream.getVideoTracks()[0];
    videoTrack.onended = () => {
      stopSenderShare();
    };

  } catch (err) {
    console.error(err);
    setStatus(`getDisplayMedia failed: ${err.message}`);
  }
});

async function createSenderPeerForViewer(viewerId, createOfferNow = true) {
  if (peerConnections.has(viewerId)) {
    return peerConnections.get(viewerId);
  }

  const pc = new RTCPeerConnection(pcConfig);
  peerConnections.set(viewerId, pc);

  for (const track of localStream.getTracks()) {
    const sender = pc.addTrack(track, localStream);

    // crude bitrate cap
    const params = sender.getParameters();
    if (!params.encodings) params.encodings = [{}];
    params.encodings[0].maxBitrate = 800000; // 800 kbps
    sender.setParameters(params).catch(console.warn);
  }

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      sendSignal(viewerId, {
        type: 'candidate',
        candidate: event.candidate
      });
    }
  };

  pc.onconnectionstatechange = () => {
    console.log('Sender PC state for', viewerId, pc.connectionState);
    if (
      pc.connectionState === 'failed' ||
      pc.connectionState === 'disconnected' ||
      pc.connectionState === 'closed'
    ) {
      closeSenderPeer(viewerId);
    }
  };

  if (createOfferNow) {
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    sendSignal(viewerId, pc.localDescription);
  }

  return pc;
}

function closeSenderPeer(viewerId) {
  const pc = peerConnections.get(viewerId);
  if (pc) {
    pc.close();
    peerConnections.delete(viewerId);
  }
}

function createViewerPeer(actualSenderId) {
  const pc = new RTCPeerConnection(pcConfig);

  pc.ontrack = (event) => {
    console.log('Viewer received remote track');
    remoteVideo.srcObject = event.streams[0];
  };

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      sendSignal(actualSenderId, {
        type: 'candidate',
        candidate: event.candidate
      });
    }
  };

  pc.onconnectionstatechange = () => {
    console.log('Viewer PC state', pc.connectionState);
  };

  return pc;
}

function stopSenderShare() {
  setStatus('Screen sharing stopped.');

  if (localStream) {
    localStream.getTracks().forEach((t) => t.stop());
    localStream = null;
  }

  localVideo.srcObject = null;

  for (const [viewerId, pc] of peerConnections.entries()) {
    pc.close();
    peerConnections.delete(viewerId);
  }
}