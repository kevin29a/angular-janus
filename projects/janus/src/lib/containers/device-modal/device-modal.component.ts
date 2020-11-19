import { Component, OnInit, ChangeDetectionStrategy, Inject, Input } from '@angular/core';

import { FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { WebrtcService } from 'janus-angular';


@Component({
  selector: 'nvid-device-modal',
  templateUrl: './device-modal.component.html',
  styleUrls: [
    './device-modal.component.scss',
    '../../../styles/modal.scss',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DeviceModalComponent implements OnInit {

  public devicesForm;
  public availableAudioDevices;
  public availableVideoDevices;
  public availableSpeakerDevices;
  public supportsSpeakerSelection = false;

  constructor(
    private dialogRef: MatDialogRef<DeviceModalComponent>,
    private builder: FormBuilder,
    private webrtc: WebrtcService,
    @Inject(MAT_DIALOG_DATA) public data: {audioDeviceId: string, videoDeviceId: string, speakerDeviceId: string}
  ) { }

  ngOnInit(): void {
    this.devicesForm = this.builder.group({
      audioDevice: [this.data.audioDeviceId, [Validators.required]],
      videoDevice: [this.data.videoDeviceId, [Validators.required]],
      speakerDevice: [this.data.speakerDeviceId, [Validators.required]],
    });
    this.getDevices();
  }

  async getDevices() {
    const allDevices = await this.webrtc.listDevices();
    this.supportsSpeakerSelection = this.webrtc.supportsSpeakerSelection();
    this.availableAudioDevices = allDevices.filter((device) => device.kind === 'audioinput');
    this.availableVideoDevices = allDevices.filter((device) => device.kind === 'videoinput');
    this.availableSpeakerDevices = allDevices.filter((device) => device.kind === 'audiooutput');
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    const returnValue = {
      audioDeviceId: this.devicesForm.get('audioDevice').value,
      videoDeviceId: this.devicesForm.get('videoDevice').value,
      speakerDeviceId: this.devicesForm.get('speakerDevice').value,
    };
    this.dialogRef.close(returnValue);
  }
}
