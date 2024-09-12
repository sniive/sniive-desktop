use std::sync::atomic::Ordering;

use tauri::{AppHandle, Manager};

use crate::utils::notify_recording_status;

use super::app_state::AppState;

#[tauri::command]
pub async fn start_input(handle: AppHandle) -> Result<(), String> {
    let state = handle
        .try_state::<AppState>()
        .ok_or("Failed to get AppState")?;

    // set can_run_input to true
    let can_run_input = state.can_run_input.load(Ordering::Relaxed);
    if can_run_input {
        return Ok(());
    }

    if !notify_recording_status(&handle, "start").await.map_err(|x| x.to_string())? {
        return Err("Failed to notify recording status".to_string());
    }

    state.can_run_input.store(true, Ordering::Relaxed);
    state.recording_start_time.lock().await.replace(std::time::SystemTime::now());
    state
        .can_run_audio
        .lock()
        .await
        .send(true)
        .await
        .map_err(|_| "Failed to send to audio")?;
    Ok(())
}
