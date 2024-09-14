use tauri::{AppHandle, Manager};

use crate::utils;

use super::app_state::AppState;

#[tauri::command]
pub async fn set_auth(handle: AppHandle, urls: Vec<&str>) -> Result<(), String> {
    for url in urls {
        let matched = utils::match_deep_link(url);
        let state = handle
            .try_state::<AppState>()
            .ok_or("Failed to get AppState")
            .expect("Failed to get AppState");
        let mut auth = state.auth.lock().await;
        *auth = matched;
    }

    Ok(())
}