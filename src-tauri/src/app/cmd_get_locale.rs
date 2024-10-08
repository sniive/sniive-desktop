use tauri::{AppHandle, Manager};

use super::app_state::AppState;

#[tauri::command]
pub async fn get_locale(handle: AppHandle) -> Result<String, String> {
    let state = handle
        .try_state::<AppState>()
        .ok_or("Failed to get AppState")?;
    let auth_guard = state.auth.lock().await;
    match auth_guard.as_ref() {
        Some(auth) => Ok(auth.locale.clone()),
        None => Ok(sys_locale::get_locale().unwrap_or_else(|| String::from("en-US")).split('-').next().unwrap_or("en").to_string()),
    }
}