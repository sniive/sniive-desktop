use crabgrab::prelude::{CapturableDisplay, CapturableWindow, CaptureAccessToken};
use serde::{Deserialize, Serialize};
use std::{sync::atomic::AtomicBool, time::SystemTime};
use tokio::sync::{mpsc, Mutex};

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Auth {
    pub space_name: String,
    pub access: String,
    pub locale: String,
}

pub enum CapturableSurface {
    CapturableDisplay(CapturableDisplay),
    CapturableWindow(CapturableWindow),
}

pub struct AppState {
    pub can_run_input: AtomicBool,
    pub capturable_surface: Mutex<Option<CapturableSurface>>,
    pub capture_token: Mutex<Option<CaptureAccessToken>>,

    pub can_run_audio: Mutex<mpsc::Sender<bool>>,
    pub audio_device: Mutex<Option<cpal::Device>>,

    pub auth: Mutex<Option<Auth>>,
    pub recording_start_time: Mutex<Option<SystemTime>>,
    pub recording_end_time: Mutex<Option<SystemTime>>,
}
