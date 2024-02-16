import React, { useState, useRef, useEffect } from "react";
const mimeType = "video/webm";
const statusRecording = {
  INACTIVE: "inactive",
  RECORDING: "recording",
  IDLE: "idle",
  PAUSED: "paused",
};
const VideoRecorder: React.FC = () => {
  const [recording, setRecording] = useState<boolean>(false);
  const recordingLength = useRef<number>(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [permissionCamera, setPermissionCamera] = useState<boolean>(false);
  const videoRecorder = useRef<MediaRecorder | null>(null);
  const [recordingStatus, setRecordingStatus] = useState(
    statusRecording.INACTIVE
  );
  const [stream, setStream] = useState<MediaStream | null>();
  const [videoChunks, setVideoChunks] = useState<Blob[]>([]);
  const [recordedVideo, setRecordedVideo] = useState("");
  useEffect(() => {
    if (!window.MediaRecorder) {
      throw new Error("Unsupported Browser");
    }
  });
  const getCameraPermission = async () => {
    setRecordedVideo("");
    try {
      const videoConstraints = {
        audio: false,
        video: true,
      };
      const audioConstraints = { audio: true };
      const audioStream = await navigator.mediaDevices.getUserMedia(
        audioConstraints
      );
      const videoStream = await navigator.mediaDevices.getUserMedia(
        videoConstraints
      );
      setPermissionCamera(true);
      const combinedStream = new MediaStream([
        ...videoStream.getVideoTracks(),
        ...audioStream.getAudioTracks(),
      ]);
      setStream(combinedStream);
    } catch (error) {
      console.error("Error accessing user media:", error);
      alert("Permission to access camera and microphone was denied.");
    }
  };
  const startRecording = async () => {
    if (stream) {
      setRecordingStatus(statusRecording.RECORDING);
      const media = new MediaRecorder(stream, { mimeType });
      videoRecorder.current = media;
      videoRecorder.current.start();
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      let localVideoChunks: Blob[] = [];
      videoRecorder.current.ondataavailable = (event: BlobEvent) => {
        if (typeof event.data === "undefined") return;
        if (event.data.size === 0) return;
        localVideoChunks.push(event.data);
      };
      setVideoChunks(localVideoChunks);
    }
  };
  const stopRecording = () => {
    setPermissionCamera(false);
    setRecordingStatus(statusRecording.INACTIVE);
    if (videoRecorder.current) {
      videoRecorder.current.stop();
      videoRecorder.current.onstop = () => {
        const videoBlob = new Blob(videoChunks, { type: mimeType });
        const videoUrl = URL.createObjectURL(videoBlob);
        setRecordedVideo(videoUrl);
        setVideoChunks([]);
      };
    }
  };

  const pauseRecording = () => {
    if (
      videoRecorder.current &&
      videoRecorder.current.state === statusRecording.RECORDING
    ) {
      setRecordingStatus(statusRecording.PAUSED);
      videoRecorder.current.pause();
    }
  };
  const resumeRecording = () => {
    if (
      videoRecorder.current &&
      videoRecorder.current.state === statusRecording.PAUSED
    ) {
      setRecordingStatus(statusRecording.RECORDING);
      videoRecorder.current.resume();
    }
  };

  return (
    <div>
      <>
        {!permissionCamera ? (
          <button onClick={getCameraPermission} type="button">
            Get Camera Access
          </button>
        ) : null}
        {permissionCamera && recordingStatus === statusRecording.INACTIVE ? (
          <button onClick={startRecording} type="button">
            Start Recording
          </button>
        ) : null}
        {permissionCamera && recordingStatus === statusRecording.RECORDING ? (
          <button onClick={pauseRecording} type="button">
            Pause Recording
          </button>
        ) : null}
        {permissionCamera && recordingStatus === statusRecording.PAUSED ? (
          <button onClick={resumeRecording} type="button">
            Resume Recording
          </button>
        ) : null}
        {recordingStatus === statusRecording.RECORDING ? (
          <button onClick={stopRecording} type="button">
            Stop Recording
          </button>
        ) : null}
        <video ref={videoRef} width="640" height="480" controls />
        <p>Recording Length: {recordingLength.current} seconds</p>
      </>
      {recordedVideo ? (
        <div className="audio-player">
          <video src={recordedVideo} controls></video>
          <a download href={recordedVideo}>
            Download Recording
          </a>
        </div>
      ) : null}
    </div>
  );
};

export default VideoRecorder;
