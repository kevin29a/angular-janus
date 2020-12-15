'use strict';


customElements.define('compodoc-menu', class extends HTMLElement {
    constructor() {
        super();
        this.isNormalMode = this.getAttribute('mode') === 'normal';
    }

    connectedCallback() {
        this.render(this.isNormalMode);
    }

    render(isNormalMode) {
        let tp = lithtml.html(`
        <nav>
            <ul class="list">
                <li class="title">
                    <a href="index.html" data-type="index-link">janus-angular documentation</a>
                </li>

                <li class="divider"></li>
                ${ isNormalMode ? `<div id="book-search-input" role="search"><input type="text" placeholder="Type to search"></div>` : '' }
                <li class="chapter">
                    <a data-type="chapter-link" href="index.html"><span class="icon ion-ios-home"></span>Getting started</a>
                    <ul class="links">
                        <li class="link">
                            <a href="overview.html" data-type="chapter-link">
                                <span class="icon ion-ios-keypad"></span>Overview
                            </a>
                        </li>
                        <li class="link">
                            <a href="index.html" data-type="chapter-link">
                                <span class="icon ion-ios-paper"></span>README
                            </a>
                        </li>
                                <li class="link">
                                    <a href="dependencies.html" data-type="chapter-link">
                                        <span class="icon ion-ios-list"></span>Dependencies
                                    </a>
                                </li>
                    </ul>
                </li>
                    <li class="chapter modules">
                        <a data-type="chapter-link" href="modules.html">
                            <div class="menu-toggler linked" data-toggle="collapse" ${ isNormalMode ?
                                'data-target="#modules-links"' : 'data-target="#xs-modules-links"' }>
                                <span class="icon ion-ios-archive"></span>
                                <span class="link-name">Modules</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                        </a>
                        <ul class="links collapse " ${ isNormalMode ? 'id="modules-links"' : 'id="xs-modules-links"' }>
                            <li class="link">
                                <a href="modules/JanusModule.html" data-type="entity-link">JanusModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#components-links-module-JanusModule-bb5aa156746445b6ac97185fbde65ff0"' : 'data-target="#xs-components-links-module-JanusModule-bb5aa156746445b6ac97185fbde65ff0"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-JanusModule-bb5aa156746445b6ac97185fbde65ff0"' :
                                            'id="xs-components-links-module-JanusModule-bb5aa156746445b6ac97185fbde65ff0"' }>
                                            <li class="link">
                                                <a href="components/AudioBoxComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">AudioBoxComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/DefaultVideoRoomComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">DefaultVideoRoomComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/DeviceSelectorComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">DeviceSelectorComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/JanusVideoroomComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">JanusVideoroomComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/SelfVideoComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">SelfVideoComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/VideoBoxComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">VideoBoxComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/VideoRoomWrapperComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">VideoRoomWrapperComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                        'data-target="#directives-links-module-JanusModule-bb5aa156746445b6ac97185fbde65ff0"' : 'data-target="#xs-directives-links-module-JanusModule-bb5aa156746445b6ac97185fbde65ff0"' }>
                                        <span class="icon ion-md-code-working"></span>
                                        <span>Directives</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="directives-links-module-JanusModule-bb5aa156746445b6ac97185fbde65ff0"' :
                                        'id="xs-directives-links-module-JanusModule-bb5aa156746445b6ac97185fbde65ff0"' }>
                                        <li class="link">
                                            <a href="directives/VideoRoomWrapperDirective.html"
                                                data-type="entity-link" data-context="sub-entity" data-context-id="modules">VideoRoomWrapperDirective</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                </ul>
                </li>
                        <li class="chapter">
                            <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ? 'data-target="#injectables-links"' :
                                'data-target="#xs-injectables-links"' }>
                                <span class="icon ion-md-arrow-round-down"></span>
                                <span>Injectables</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                            <ul class="links collapse " ${ isNormalMode ? 'id="injectables-links"' : 'id="xs-injectables-links"' }>
                                <li class="link">
                                    <a href="injectables/WebrtcService.html" data-type="entity-link">WebrtcService</a>
                                </li>
                            </ul>
                        </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ? 'data-target="#interfaces-links"' :
                            'data-target="#xs-interfaces-links"' }>
                            <span class="icon ion-md-information-circle-outline"></span>
                            <span>Interfaces</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? ' id="interfaces-links"' : 'id="xs-interfaces-links"' }>
                            <li class="link">
                                <a href="interfaces/AttachRemoteFeedEvent.html" data-type="entity-link">AttachRemoteFeedEvent</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Devices.html" data-type="entity-link">Devices</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/IceServer.html" data-type="entity-link">IceServer</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Publisher.html" data-type="entity-link">Publisher</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/PublishOwnFeedEvent.html" data-type="entity-link">PublishOwnFeedEvent</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/RemoteFeed.html" data-type="entity-link">RemoteFeed</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/RequestSubstreamEvent.html" data-type="entity-link">RequestSubstreamEvent</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/RoomInfo.html" data-type="entity-link">RoomInfo</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/VideoRoomComponent.html" data-type="entity-link">VideoRoomComponent</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ? 'data-target="#miscellaneous-links"'
                            : 'data-target="#xs-miscellaneous-links"' }>
                            <span class="icon ion-ios-cube"></span>
                            <span>Miscellaneous</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="miscellaneous-links"' : 'id="xs-miscellaneous-links"' }>
                            <li class="link">
                                <a href="miscellaneous/enumerations.html" data-type="entity-link">Enums</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/variables.html" data-type="entity-link">Variables</a>
                            </li>
                        </ul>
                    </li>
                    <li class="divider"></li>
                    <li class="copyright">
                        Documentation generated using <a href="https://compodoc.app/" target="_blank">
                            <img data-src="images/compodoc-vectorise.png" class="img-responsive" data-type="compodoc-logo">
                        </a>
                    </li>
            </ul>
        </nav>
        `);
        this.innerHTML = tp.strings;
    }
});