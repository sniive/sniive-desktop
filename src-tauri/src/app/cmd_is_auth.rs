use tauri::{AppHandle, Manager};

use super::app_state::AppState;

#[tauri::command]
pub async fn is_auth(handle: AppHandle) -> Result<bool, String> {
    let state = handle
        .try_state::<AppState>()
        .ok_or("Failed to get AppState")?;
    let auth_guard = state.auth.lock().await;
    Ok(auth_guard.is_some())
}