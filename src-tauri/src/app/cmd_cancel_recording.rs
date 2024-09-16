use tauri::{AppHandle, Manager};

use super::app_state::AppState;

#[tauri::command]
pub async fn cancel_recording(handle: AppHandle) -> Result<bool, String> {
    let state = handle
        .try_state::<AppState>()
        .ok_or("Failed to get AppState")?;
    
    let auth = state.auth.lock().await.clone().ok_or("No auth")?;

    let url = format!(
        "https://sniive.com/api/spaces/{}/delete-tutorial",
        auth.space_name
    );

    let body = serde_json::json!({
        "access": auth.access
    });

    let client = reqwest::Client::new();
    let res = client
        .post(&url)
        .header("Content-Type", "application/json")
        .body(body.to_string())
        .send()
        .await
        .map_err(|x| x.to_string())?;

    Ok(res.status().is_success())
}