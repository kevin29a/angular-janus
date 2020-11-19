import { ChangeDetectorRef, Component, EventEmitter, OnDestroy, OnInit, Output, ChangeDetectionStrategy, Input } from '@angular/core';

import { FormBuilder, Validators } from '@angular/forms';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { WebrtcService } from '../../services/janus.service';
import { Devices } from '../../models/janus.models';


/**
 * Device selector form. Implements a form that will show the user options for picking their camera,
 * microphone, and speaker device. The speaker option is only shown if the device supports dynamically
 * changing the speaker. This class can be subclassed if style changes are desired.
 * @example
 * <janus-device-selector
 *              [devices]=devices
 *              (deviceUpdate)='onDeviceUpdate($event)'>
 * </janus-device-selector>
 */
@Component({
  selector: 'janus-device-selector',
  templateUrl: './device-selector.component.html',
  styleUrls: [
    './device-selector.component.scss',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DeviceSelectorComponent implements OnInit, OnDestroy {

  /**
   * Currently selected devices
   */
  @Input()
  devices: Devices;

  /**
   * Event emitted whenever the user changes the devices in the form
   */
  @Output()
  deviceUpdate = new EventEmitter<Devices>();

  public devicesForm;
  public availableAudioDevices;
  public availableVideoDevices;
  public availableSpeakerDevices;
  public supportsSpeakerSelection = false;
  private destroy$ = new Subject();


  constructor(
    private changeDetector: ChangeDetectorRef,
    private builder: FormBuilder,
    private webrtc: WebrtcService,
  ) { }

  ngOnInit(): void {

    this.devicesForm = this.builder.group({
      audioDevice: [this.devices.audioDeviceId, [Validators.required]],
      videoDevice: [this.devices.videoDeviceId, [Validators.required]],
      speakerDevice: [this.devices.speakerDeviceId, [Validators.required]],
    });
    this.getDevices();

    this.devicesForm.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      const devices = {
        audioDeviceId: this.devicesForm.get('audioDevice').value,
        videoDeviceId: this.devicesForm.get('videoDevice').value,
        speakerDeviceId: this.devicesForm.get('speakerDevice').value,
      };
      this.deviceUpdate.emit(devices);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** @internal */
  async getDevices(): Promise<void> {
    const allDevices = await this.webrtc.listDevices();
    this.supportsSpeakerSelection = this.webrtc.supportsSpeakerSelection();
    this.availableAudioDevices = allDevices.filter((device) => device.kind === 'audioinput');
    this.availableVideoDevices = allDevices.filter((device) => device.kind === 'videoinput');
    this.availableSpeakerDevices = allDevices.filter((device) => device.kind === 'audiooutput');
    this.changeDetector.detectChanges();
  }
}
