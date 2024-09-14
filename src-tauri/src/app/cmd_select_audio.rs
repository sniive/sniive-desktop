use cpal::traits::DeviceTrait;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter, WebviewWindowBuilder};

use crate::utils::wait_for_event;

use super::{
    cmd_select_audio_close::select_audio_close, cmd_select_audio_start::select_audio_start,
};

#[derive(Clone, Serialize, Deserialize)]
pub struct AudioDevice {
    pub name: String,
    pub id: usize,
}

#[derive(Clone, Copy, Serialize, Deserialize)]
enum SelectedAudioResult {
    Aborted,         // Selection process was cancelled
    SelectedNone,    // No surface was selected
    Selected(usize), // Selection process was completed
}

#[derive(Serialize, Deserialize)]
pub enum AudioOutputResult {
    Aborted,
    SelectedNone,
    Selected(String),
}

#[tauri::command]
pub async fn select_audio(handle: AppHandle) -> Result<AudioOutputResult, String> {
    let devices = select_audio_start()?;

    let select_audio_builder = WebviewWindowBuilder::new(
        &handle,
        "select-audio-device",
        tauri::WebviewUrl::App("/select-audio-device".into()),
    )
    .always_on_top(true)
    .closable(true)
    .minimizable(true)
    .maximizable(false)
    .resizable(true)
    .inner_size(500.0, 140.0)
    .decorations(false)
    .focused(true)
    .visible(false)
    .title("Select Audio Device");

    let select_audio_window = select_audio_builder.build().map_err(|e| e.to_string())?;
    let audio_devices = devices
        .iter()
        .enumerate()
        .map(|(id, device)| AudioDevice {
            name: device.name().unwrap_or("Unknown".to_string()),
            id,
        })
        .collect::<Vec<AudioDevice>>();

    wait_for_event(&select_audio_window, "ready".to_string())
        .await
        .ok_or("No ready event")?;
    select_audio_window.show().map_err(|e| e.to_string())?;
    select_audio_window
        .emit("audio-devices", audio_devices)
        .map_err(|e| e.to_string())?;

    let evt = wait_for_event(&select_audio_window, "selected".to_string())
        .await
        .ok_or("No selected event")?;
    let payload: SelectedAudioResult = serde_json::from_str(evt.payload()).unwrap();
    select_audio_window.close().map_err(|e| e.to_string())?;

    match payload {
        SelectedAudioResult::Aborted => {
            return Ok(AudioOutputResult::Aborted);
        }
        SelectedAudioResult::SelectedNone => {
            select_audio_close(&handle, None).await?;
            return Ok(AudioOutputResult::SelectedNone);
        }
        SelectedAudioResult::Selected(id) => {
            let device = devices[id].clone();
            let name = device.name().unwrap_or("Unknown".to_string());
            select_audio_close(&handle, Some(device)).await?;
            return Ok(AudioOutputResult::Selected(name));
        }
    }
}
