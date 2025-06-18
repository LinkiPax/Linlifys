import { useEffect, useRef } from 'react'
import Peer from 'simple-peer'

export const useWebRTC = (socket, roomId, userId, localStream) => {
  const peersRef = useRef({})

  const createPeer = (socketId, callerId, stream) => {
    const peer = new Peer({
      initiator: callerId === userId,
      trickle: false,
      stream
    })

    peer.on('signal', signal => {
      socket.emit('signal', { to: socketId, from: userId, signal })
    })

    peer.on('stream', remoteStream => {
      // Handle remote stream (attach to video element)
    })

    peer.on('error', error => {
      console.error('Peer error:', error)
    })

    return peer
  }

  const addPeer = (socketId, userId, stream) => {
    const peer = createPeer(socketId, userId, stream)
    peersRef.current[socketId] = peer
  }

  const removePeer = socketId => {
    if (peersRef.current[socketId]) {
      peersRef.current[socketId].destroy()
      delete peersRef.current[socketId]
    }
  }

  useEffect(() => {
    if (!socket || !localStream) return

    const handleSignal = ({ from, signal }) => {
      const peer = peersRef.current[from]
      if (peer) {
        peer.signal(signal)
      }
    }

    socket.on('signal', handleSignal)

    return () => {
      socket.off('signal', handleSignal)
      Object.values(peersRef.current).forEach(peer => peer.destroy())
    }
  }, [socket, localStream])

  return { addPeer, removePeer }
}