import { Injectable } from '@angular/core';

import { Observable, of, interval } from 'rxjs';
import { tap, takeWhile } from 'rxjs/operators';

import Janus from '../3rdparty/janus.es';

import * as fromModels from '../models/janus-server.models';
import { RemoteFeed, RoomInfo, JanusEnvironment } from '../models/janus.models';


import { randomString } from '../shared';

@Injectable({
  providedIn: 'root'
})
export class WebrtcService {
  // Wrappers around some common webrtc functions

  constructor() { }
  async getUserMedia(audioDeviceId: string | null, videoDeviceId: string): Promise<any> {
    const constraints = {
      audio: audioDeviceId !== null ? {deviceId: audioDeviceId} : false,
      video: {deviceId: videoDeviceId, width: 1920, height: 1080},
    };
    return navigator.mediaDevices.getUserMedia(constraints);
  }

  listDevices(): Promise<any> {
    return navigator.mediaDevices.enumerateDevices();
  }

  async getDefaultDevices(): Promise<{audioDeviceId: string, videoDeviceId: string, speakerDeviceId}> {
    const devices = await this.listDevices();
    const audioDevices = devices.filter((device) => device.kind === 'audioinput');
    const videoDevices = devices.filter((device) => device.kind === 'videoinput');
    const speakerDevices = devices.filter((device) => device.kind === 'audiooutput');
    const audioDeviceId = audioDevices.length < 1 ? null : audioDevices[0].deviceId;
    const videoDeviceId = videoDevices.length < 1 ? null : videoDevices[0].deviceId;
    const speakerDeviceId = speakerDevices.length < 1 ? null : speakerDevices[0].deviceId;

    return {audioDeviceId, videoDeviceId, speakerDeviceId};
  }

  supportsSpeakerSelection(): boolean {
    const videoElement = document.createElement('video');
    const support = 'setSinkId' in videoElement;
    videoElement.remove();
    return support;
  }

  isSupportedDevice(): boolean {
    return this.supportsAppVersion(navigator.appVersion);
  }

  supportsAppVersion(appVersion: string): boolean {
    // returns true iff it supports the device identified by the supplied navigator.appVersion string
    const match = appVersion ? appVersion.match(/iPhone OS (\d+)_(\d+)/) : false;
    if (!match) {
      return true;
    }
    const version = [
      parseInt(match[1], 10),
      parseInt(match[2], 10),
    ];

    return version[0] >= 13;
  }
}

@Injectable({
  providedIn: 'root'
})
export class JanusService {
  private streams = {};
  private initialized = false;
  private janus: any;
  private server: string;
  private opaqueId: string = randomString(16);
  public handle;   // Handle to the videoroom plugin
  private remoteHandles: { [id: number]: any } = {};   // Handles to remote streams

  private videoElement: any;
  private localStream: any;
  private publishWebrtcState = false;

  private drawLoopActive: boolean;
  private iceServers: {urls: string}[];

  constructor(
    private webrtcService: WebrtcService,
  ) { }

  init(environment: JanusEnvironment): Observable<any> {
    // Initialize Janus

    this.iceServers = environment.iceServers;

    if (this.initialized) {
      console.log('Warning: called janus init twice');
      return of(true);
    }

    return new Observable(
      subscriber => {
        Janus.init({
          debug: 'none',
          callback(): void {
            // Make sure the browser supports WebRTC
            if (!Janus.isWebrtcSupported()) {
              subscriber.error('WebRTC is not supported');
            }
            subscriber.next();
            subscriber.complete();
          }
        });
      }
    );
  }

  destroy(): void {
    const leave = { request: 'leave' };

    if (this.handle) {
      this.handle.send({message: leave});
    }
    this.cleanupLocalStream();
    // this.janus.destroy({unload: true});
  }

  cleanupLocalStream(): void {
    if (this.videoElement) {
      this.videoElement.remove();
    }
    if (this.localStream) {
      for (const track of this.localStream.getTracks()) {
        track.stop();
        this.localStream.removeTrack(track);
      }
    }
    this.drawLoopActive = false;
  }

  _get_random_string(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  _attachVideoRoomHelper(subscriber): void {
    const instance = this;
    this.janus.attach({
      plugin: 'janus.plugin.videoroom',
      opaqueId: this.opaqueId,
      success(pluginHandle): void {
        instance.handle = pluginHandle;
        subscriber.next({
          message: fromModels.ATTACH_SUCCESS
        });
      },
      error(error): void {
        subscriber.error(error);
      },
      consentDialog(on): void {
        subscriber.next({
          message: fromModels.CONSENT_DIALOG,
          payload: {on},
        });
      },
      mediaState(medium, on): void {
        subscriber.next({
          message: fromModels.MEDIA_STATE,
          payload: {medium, on},
        });
      },
      webrtcState(on): void {
        instance.publishWebrtcState = on;
        subscriber.next({
          message: fromModels.WEBRTC_STATE,
          payload: {on},
        });
      },
      iceState(arg1, arg2): void {
        // console.log('ICE STATE', arg1, arg2);
      },
      slowLink(msg): void {
      },
      onmessage(msg, jsep): void {
        subscriber.next({
          message: fromModels.ON_MESSAGE,
          payload: {msg, jsep},
        });
        if (!!jsep) {
          instance.handleRemoteJsep(jsep);
        }
      },
      onlocalstream(stream): void {
        const streamId = instance._get_random_string();
        instance.streams[streamId] = stream;
        subscriber.next({
          message: fromModels.ON_LOCAL_STREAM,
          payload: {stream_id: streamId},
        });
      },
      onremotestream(stream): void {
        // Don't expect this to ever happen
        subscriber.next({
          message: fromModels.ON_REMOTE_STREAM,
          payload: {stream},
        });
      },
      oncleanup(): void {
        subscriber.next({
          message: fromModels.ON_CLEANUP,
        });
      }
    });
  }

  attachVideoRoom(url): Observable<fromModels.JanusAttachCallbackData> {
    // Create session
    const instance = this;
    return new Observable(
      subscriber => {
        instance.janus = new Janus({
          server: url,
          iceServers: this.iceServers,
          success: () => {
            instance._attachVideoRoomHelper(subscriber);
          },
          error(error): void {
            subscriber.error(error);
          },
          destroyed(): void {
            window.location.reload();
          }
        });
      }
    );
  }

  register(name: string, userId: string, roomId: string, pin: string): void {
    const register = {
      request: 'join',
      room: roomId,
      ptype: 'publisher',
      display: name,
      id: userId,
      pin,
    };
    this.handle.send({message: register});
  }

  handleRemoteJsep(jsep): void {
    this.handle.handleRemoteJsep({jsep});
  }

  answerRemoteFeedJsep(jsep, feed: RemoteFeed, room: RoomInfo): void {
    // Handle a jsep message for a remote feed

    const handle = this.remoteHandles[feed.id];
    handle.createAnswer({
      jsep,
      trickle: true,
      media: { audioSend: false, videoSend: false },  // We want recvonly audio/video
      success(jsepBody): void {
        const body = { request: 'start', room: room.id };
        handle.send({message: body, jsep: jsepBody});
      },
      error(error): void {
        console.log('ERROR in JSEP RESPONSE');
      }
    });
  }

  draw(canvasContext, videoElement): void {
    canvasContext.drawImage(videoElement, 0, 0);
    const centerX = canvasContext.canvas.width / 2;
    const centerY = canvasContext.canvas.height / 2;
    const videoWidth = videoElement.videoWidth;
    const videoHeight = videoElement.videoHeight;

    canvasContext.fillStyle = '#000';
    canvasContext.fillRect(0, 0, canvasContext.canvas.width, canvasContext.canvas.height);

    canvasContext.save();
    canvasContext.translate(centerX, centerY);
    canvasContext.drawImage(
      videoElement,
      -videoWidth / 2,
      -videoHeight / 2,
      videoWidth,
      videoHeight,
    );
    canvasContext.restore();
  }

  startDrawingLoop(canvasElement, videoElement, frameRate: number): void {
    // Drawing loop using AudioContext oscillator. requestAnimationFrame doesn't fire
    // on background tabs, so this is a hack to make this work when the user switches tabs

    const instance = this;
    instance.drawLoopActive = true;
    const canvasContext = canvasElement.getContext('2d');

    const stepMilliSeconds = 1000 / frameRate;

    function step(): void {
      if (instance.drawLoopActive) {
        instance.draw(canvasContext, videoElement);
        setTimeout(step, stepMilliSeconds);
        // requestAnimationFrame(step);
      }
    }
    step();
  }

  _muteVideo(videoElement): void {
    // Mute a given video element

    const instance = this;
    function mute(event): void {
      videoElement.muted = 'muted';
      videoElement.removeEventListener('playing', mute);
    }

    videoElement.addEventListener('playing', mute);
  }

  _sizeCanvasElement(videoWidth: number, videoHeight: number): {canvasWidth: number, canvasHeight: number} {
    // We're keeping the height the same. Goal is to add black bars to the sides
    // if we're in portrait mode and crop to the center if we're in landscape.
    return {
      canvasWidth: videoHeight * 4 / 3,
      canvasHeight: videoHeight,
    };
  }

  _createVideoElement(canvasId: string, videoStream: any): any {
    // Create the video element and attach it to the canvas

    const videoElement = document.createElement('video');
    const canvasElement: any = document.getElementById(canvasId);
    const canvasStream = canvasElement.captureStream();
    const videoSettings = videoStream.getVideoTracks()[0].getSettings();

    Janus.attachMediaStream(videoElement, videoStream);
    videoElement.autoplay = true;
    videoElement.setAttribute('playsinline', 'true');
    videoElement.setAttribute('id', 'self-video');

    // Chrome doesn't like it if we set the muted attribute before the video is playing
    this._muteVideo(videoElement);

    const { canvasWidth, canvasHeight } = this._sizeCanvasElement(videoSettings.width, videoSettings.height);
    canvasElement.width = canvasWidth;
    canvasElement.height = canvasHeight;

    const audioTrack = videoStream.getAudioTracks().find((item) => item);
    if (!!audioTrack) {
        canvasStream.addTrack(videoStream.getAudioTracks()[0]);
    }

    this.startDrawingLoop(canvasElement, videoElement, videoSettings.frameRate);
    // this.startDrawingLoop(canvasElement, videoElement, 20);

    return {
      videoElement,
      canvasStream,
    };
  }

  unPublishOwnFeed(): void {
    // Unpublish your own feed
    const unpublish = { request: 'unpublish' };
    this.handle.send({ message: unpublish });
    this.cleanupLocalStream();
  }

  publishOwnFeed(
    audioDeviceId: string | null,
    videoDeviceId: string,
    canvasId: string = 'canvas-self',
  ): Observable<boolean> {
    // Publish our own feed
    return new Observable(
      subscriber => {
        if (this.publishWebrtcState) {
          // Already publishing. Need to unpublish, wait until we're done unpublishing, and then republish
          this.unPublishOwnFeed();
          interval(100).pipe(
            takeWhile(() => this.publishWebrtcState)
          ).subscribe({
            complete: () => {
              this.createOffer(subscriber, audioDeviceId, videoDeviceId, canvasId);
            }
          });
        } else {
          // Simple case. Not publishing yet
          this.createOffer(subscriber, audioDeviceId, videoDeviceId, canvasId);
        }
      }
    );
  }

  createOffer(
    subscriber,
    audioDeviceId: string | null,
    videoDeviceId: string,
    canvasId: string,
  ): void {
    const instance = this;
    instance.webrtcService.getUserMedia(audioDeviceId, videoDeviceId)
    .then(
      (videoStream) => {
        instance.localStream = videoStream;
        const {videoElement, canvasStream} = instance._createVideoElement(canvasId, videoStream);
        instance.videoElement = videoElement;
        this.handle.createOffer({
          media: { audioRecv: false, videoRecv: false, audioSend: true, videoSend: true },
          success(jsep): void {
            const publish = { request: 'configure', audio: true, video: true };
            instance.handle.send({message: publish, jsep});
            subscriber.next(true);
            subscriber.complete();
          },
          error(error): void {
            subscriber.error(error);
          },
          simulcast: true,
          simulcastMaxBitrates: {
            high: 256000,
            medium: 128000,
            low: 64000,
          },
          stream: canvasStream,
          trickle: true,
        });
      }
    ).catch((error) => console.log("GUM ERROR:", error, audioDeviceId, videoDeviceId));
  }

  attachMediaStream(elemId: string, streamId: string): void {
    const element: any = document.getElementById(elemId);
    Janus.attachMediaStream(element, this.streams[streamId]);
  }

  attachRemoteFeed(
    feed: RemoteFeed,
    room: RoomInfo,
    pin: string,
  ): Observable<fromModels.JanusAttachCallbackData> {
    // A new feed has been published, create a new plugin handle and attach to it as a subscriber

    const instance = this;

    return new Observable(
      subscriber => {
        instance.janus.attach({
          plugin: 'janus.plugin.videoroom',
          opaqueId: instance.opaqueId,
          success(pluginHandle): void {
            instance.remoteHandles[feed.id] = pluginHandle;
            instance.remoteHandles[feed.id].videoCodec = feed.video_codec;

            const subscribe = {
              request: 'join',
              room: room.id,
              ptype: 'subscriber',
              feed: feed.id,
              private_id: room.privateId,
              substream: 0,
              pin,
            };
            instance.remoteHandles[feed.id].send({message: subscribe});
          },

          error(error): void {
            subscriber.error(error);
          },

          onmessage(msg, jsep): void {
            console.log("MESSAGE", msg);
            subscriber.next({
              message: fromModels.ON_REMOTE_FEED_MESSAGE,
              payload: {
                msg,
                jsep,
                feed,
                room,
              },
            });
            if (!!jsep) {
              instance.answerRemoteFeedJsep(jsep, feed, room);
            }
          },

          webrtcState(on): void {
            subscriber.next({
              message: fromModels.REMOTE_FEED_WEBRTC_STATE,
              payload: {
                on,
                feed,
                room,
              },
            });
          },

          onlocalstream(stream): void {
            console.log('Would never expect to get here');
          },

          slowLink(msg): void {
            subscriber.next({
              message: fromModels.REMOTE_FEED_SLOW_LINK,
              payload: {
                feedId: feed.id,
              },
            });
          },

          onremotestream(stream): void {
            // Save off remote stream

            console.log("HAVE REMOTE STREAM", stream);
            const streamId = instance._get_random_string();
            instance.streams[streamId] = stream;

            const numVideoTracks = stream.getVideoTracks() ? stream.getVideoTracks().length : 0;
            subscriber.next({
              message: fromModels.ON_REMOTE_REMOTE_STREAM,
              payload: {
                streamId,
                numVideoTracks,
                feed,
                room,
              },
            });
          },
          oncleanup(): void {
            subscriber.next({
              message: fromModels.ON_REMOTE_CLEANUP,
              payload: {
                feed,
                room,
              },
            });
          }
        });
      }
    );
  }

  toggleMute(): boolean {
    const muted = this.handle.isAudioMuted();
    if (muted) {
        this.handle.unmuteAudio();
    } else {
        this.handle.muteAudio();
    }
    return this.handle.isAudioMuted();
  }

  setMute(mute: boolean): void {
    const muted = this.handle.isAudioMuted();
    if (muted === mute) {
      return;
    }

    if (mute) {
        this.handle.muteAudio();
    } else {
        this.handle.unmuteAudio();
    }
  }

  requestSubstream(feed: RemoteFeed, substreamId: number): void {
    this.remoteHandles[feed.id].send({message: {request: 'configure', substream: substreamId}});
  }
}
