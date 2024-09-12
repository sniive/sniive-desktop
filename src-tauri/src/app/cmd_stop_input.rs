use std::sync::atomic::Ordering;

use tauri::{AppHandle, Manager};

use crate::utils::notify_recording_status;

use super::app_state::AppState;

#[tauri::command]
pub async fn stop_input(handle: AppHandle) -> Result<(), String> {
    let state = handle
        .try_state::<AppState>()
        .ok_or("Failed to get AppState")?;
    
    // set can_run_input to true
    let can_run_input = state.can_run_input.load(Ordering::Relaxed);
    if !can_run_input {
        return Ok(());
    }

    if !notify_recording_status(&handle, "stop").await.map_err(|x| x.to_string())? {
        return Err("Failed to notify recording status".to_string());
    }

    state.can_run_input.store(false, Ordering::Relaxed);
    state.recording_end_time.lock().await.replace(std::time::SystemTime::now());
    state
        .can_run_audio
        .lock()
        .await
        .send(false)
        .await
        .map_err(|_| "Failed to send to audio")?;
    Ok(())
}
