use std::sync::atomic::Ordering;

use super::app_state::AppState;

#[tauri::command]
pub async fn start_input(state: tauri::State<'_, AppState>) -> Result<(), String> {
    // set can_run_input to true
    let can_run_input = state.can_run_input.load(Ordering::Relaxed);
    if can_run_input {
        return Ok(());
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
