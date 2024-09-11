use std::sync::atomic::Ordering;

use super::app_state::AppState;

#[tauri::command]
pub async fn stop_input(state: tauri::State<'_, AppState>) -> Result<(), String> {
    // set can_run_input to true
    let can_run_input = state.can_run_input.load(Ordering::Relaxed);
    if !can_run_input {
        return Ok(());
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
