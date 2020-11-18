# Janus Videoroom Component

This is an angular library with features to make it easy to embed a videoroom into any angular app. Once you have a properly configured, public instance of a janus server with the videoroom plugin enabled, this library includes an easy to use directive that will connect clients in a videoroom.


## Why build this?

The objective when building this is to lower the barrier to implementing
videorooms. The Janus documentation and demos are great for understanding how
the service works. However, the sample client code is not that easy to adopt
into your own application. This makes it so that developers need to write a lot
of the low level code themselves and understand many of the low level details
of the videoroom plugin. While more knowledge is always better than less, we
believe it's possible to implement a videoroom without requiring the developer
to understand intimate details of webrtc.

## What does this implement?

The core function provided by this library is a component called `JanusVideoroomComponent` that implements a videoroom. The selector for the component is `janus-videoroom`. You can have a fully functional videoroom only specifying the URL of the janus gateway and the room ID. The videoroom supports the following features:

- **Room ID** You can specify any `roomId` that is available on the janus gateway.
- **http and websocket connections** You can specify an http and/or websocket URL. The component will prefer the websocket URL and fallback to the http URL.
- *PINs* You can specify a PIN for any room that requires it.
- *Display Names* You can specify the display name for anyone joining a videoroom
- *Publishers or Read Only Users* Users can be publishers, who will send a feed from their camera/microphone, or they can be read only users that don't transmit anything.
- *Devices* Device IDs can be input and dynamically changed so that users can change which input or output devices to use.
- *ICE Servers* In addition the the janus gateway, custom STUN/TURN servers can be specified .
- *Mute Audio* Audio can be muted for publishers

## What does this *not* implement?

In the spirit of doing one thing well, the `janus-videoroom` component does not
implement many necessary parts of an application. For example, the component
supports muting the feed of a publisher. However, it does not implement a mute
button. The burden is put on the developer to implement the UX around how to
mute a feed.

The following is a non-exhaustive list of necessary items for most webapps that
are not implemented by `JanusVideoroomComponent`. These will have to be
implemented by the application outside of this library.

- *Janus room configuration* Create/edit/delete operations on janus rooms are not supported
- *UI elements for interaction* Mute, change device, etc. are supported by the component, but it does not include UI elements for these.
- *User Authentication*
- *Backend Storage*
- *Janus gateway deployment*


## How to use

### Installation

Installation is available through `yarn` or `npm`

```
yarn add janus-angular
```

### Including the module

The `JanusModule` must be included in your `imports` for the module in which you wish to use the directive

```
import { JanusModule } from 'janus';
...
@NgModule({
  declarations: [
    ...
  ],
  imports: [
    ...
    JanusModule,
  ],
})
export class YourAppModule { }
```

### Using the directive

The following minimal use of the directive will work with the demo deploy of janus.
```
<janus-videoroom
    [roomId]='1234'
    [wsUrl]='wss://janus.conf.meetecho.com/ws'
>
</janus-videoroom>
```

## Future Work

In addition to tireless bug fixing and making sure it works on all platforms
and networks, future work will include adding additional touchpoints in which
someone can customize the videoroom. Overlays work great to give rough
functionality to all supported features. However, there are often times when an
app wants to implement buttons on a publisher video itself, or change the
entire look and feel of the videoroom.

