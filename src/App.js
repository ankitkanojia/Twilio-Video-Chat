import React, { Component } from 'react'
import Video from 'twilio-video';

let tokens = [
    { text: "##", value: "##" },
    { text: "##", value: "##" }
]

class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            userId: 0,
            identity: null,
            peerUserId: 0,
            peerIdentity: "",
            roomName: 'devdigital',
            roomNameErr: false, // Track error for room name TextField
            previewTracks: null,
            localMediaAvailable: false,
            hasJoinedRoom: false,
            activeRoom: '', // Track the current active room
            token: ''
        }

        this.joinRoom = this.joinRoom.bind(this);
        this.roomJoined = this.roomJoined.bind(this);
        this.leaveRoom = this.leaveRoom.bind(this);
        this.detachTracks = this.detachTracks.bind(this);
        this.detachParticipantTracks = this.detachParticipantTracks.bind(this);
    }

    handleRoomNameChange(e) {
        let roomName = e.target.value;
        this.setState({ roomName });
    }

    joinRoom() {
        if (!this.state.roomName.trim()) {
            this.setState({ roomNameErr: true });
            return;
        }

        console.log("Joining room '" + this.state.roomName + "'...");
        let connectOptions = {
            name: this.state.roomName
        };

        if (this.state.previewTracks) {
            connectOptions.tracks = this.state.previewTracks;
        }

        // Join the Room with the token from the server and the
        // LocalParticipant's Tracks.
        Video.connect(this.state.userId, connectOptions).then(this.roomJoined, error => {
            alert('Could not connect to Twilio: ' + error.message);
        });
    }

    attachTracks(tracks, container) {
        tracks.forEach(track => {
            container.appendChild(track.attach());
        });
    }

    // Attaches a track to a specified DOM container
    attachParticipantTracks(participant, container) {
        var tracks = Array.from(participant.tracks.values());
        this.attachTracks(tracks, container);
    }

    detachTracks(tracks) {
        tracks.forEach(track => {
            track.detach().forEach(detachedElement => {
                detachedElement.remove();
            });
        });
    }

    detachParticipantTracks(participant) {
        var tracks = Array.from(participant.tracks.values());
        this.detachTracks(tracks);
    }

    roomJoined(room) {
        // Called when a participant joins a room
        console.log("Joined as '" + this.state.identity + "'");
        this.setState({
            activeRoom: room,
            localMediaAvailable: true,
            hasJoinedRoom: true
        });

        // Attach LocalParticipant's Tracks, if not already attached.
        var previewContainer = this.refs.groupChat_localMedia;
        console.log('previewContainer.querySelector(video)', previewContainer.querySelector('.video'));

        if (!previewContainer.querySelector('.video')) {
            this.attachParticipantTracks(room.localParticipant, this.refs.groupChat_localMedia);
        }

        // Attach the Tracks of the Room's Participants.
        room.participants.forEach(participant => {
            console.log("Already in Room: '" + participant.identity + "'");
            this.setState({
                peerIdentity: participant.identity
            })
            var previewContainer = this.refs.remoteMedia;
            this.attachParticipantTracks(participant, previewContainer);
        });

        // When a Participant joins the Room, log the event.
        room.on('participantConnected', participant => {
            console.log("Joining: '" + participant.identity + "'");
            this.setState({
                peerIdentity: participant.identity
            })
        });

        // When a Participant adds a Track, attach it to the DOM.
        room.on('trackAdded', (track, participant) => {
            console.log(participant.identity + ' added track: ' + track.kind);
            var previewContainer = this.refs.remoteMedia;
            this.attachTracks([track], previewContainer);
        });

        // When a Participant removes a Track, detach it from the DOM.
        room.on('trackRemoved', (track, participant) => {
            console.log(participant.identity + ' removed track: ' + track.kind);
            this.detachTracks([track]);
        });

        // When a Participant leaves the Room, detach its Tracks.
        room.on('participantDisconnected', participant => {
            console.log("Participant '" + participant.identity + "' left the room");
            this.detachParticipantTracks(participant);
        });

        // Once the LocalParticipant leaves the room, detach the Tracks
        // of all Participants, including that of the LocalParticipant.
        room.on('disconnected', () => {
            if (this.state.previewTracks) {
                this.state.previewTracks.forEach(track => {
                    track.stop();
                });
            }
            this.detachParticipantTracks(room.localParticipant);
            room.participants.forEach(this.detachParticipantTracks);
            this.state.activeRoom = null;
            this.setState({ hasJoinedRoom: false, localMediaAvailable: false });
        });
    }

    leaveRoom() {
        this.state.activeRoom.disconnect();
        this.setState({ hasJoinedRoom: false, localMediaAvailable: false, peerIdentity: '' });
    }

    userChange = (obj, name) => {
        console.log(obj, name);
        let { value, id } = obj
        let identity = tokens.filter(obj => {
            if (obj.value === value) {
                return true
            }
            else {
                return false
            }
        })[0]
        this.setState({
            [id]: value,
            [name]: identity['text']
        })
    }

    render() {

        /* Hide 'Join Room' button if user has already joined a room */
        let joinOrLeaveRoomButton = this.state.hasJoinedRoom ? (
            <button onClick={this.leaveRoom} > Leave Room</button>
        ) : (
                <button onClick={this.joinRoom} >Join Room</button>
            );
        /** */

        return (
            <React.Fragment>
                <h1 class="mt-5">One-One Video Chat</h1>
                <div className="row">
                    <div className="col-6" style={{ marginTop: 60 }}>
                        <h2>Peer User Name : {`${this.state.peerIdentity}`}</h2>
                    </div>
                    <div className="col-6">
                        <div ref="groupChat_localMedia" >
                        </div>
                    </div>
                    <div className="col-6">
                        <div ref="remoteMedia" >
                        </div>
                    </div>
                    <div className="col-2">{joinOrLeaveRoomButton}</div>
                </div>
            </React.Fragment>
        )
    }
}

export default App;
