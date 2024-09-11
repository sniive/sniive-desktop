use cpal::traits::DeviceTrait;
use tauri::{AppHandle, Manager};

use super::app_state::AppState;

pub async fn select_audio_close(
    handle: &AppHandle,
    device_option: Option<cpal::Device>,
) -> Result<String, String> {
    let state = handle
        .try_state::<AppState>()
        .ok_or("Failed to get AppState")?;

    match device_option {
        Some(device) => {
            let name = device.name().map_err(|e| e.to_string())?;
            let mut audio_device = state.audio_device.lock().await;
            *audio_device = Some(device);
            Ok(name)
        }
        None => {
            let mut audio_device = state.audio_device.lock().await;
            *audio_device = None;
            Ok("None".to_string())
        }
    }
}
