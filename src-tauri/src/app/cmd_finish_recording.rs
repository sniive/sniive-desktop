use std::io::Read;

use tauri::{AppHandle, Manager};

use crate::utils;

use super::app_state::AppState;

#[tauri::command]
pub async fn finish_recording(handle: AppHandle) -> Result<bool, String> {
    let tmp_path = handle.path().app_cache_dir().map_err(|x| x.to_string())?;
    let filepath = tmp_path.join("output.wav");
    let upload_link = utils::get_upload_link(&handle, "wav").await.map_err(|x| x.to_string())?;
        
    let mut file = std::fs::File::open(filepath.clone()).map_err(|x| x.to_string())?;
    let mut file_contents = Vec::new();
    file.read_to_end(&mut file_contents).map_err(|x| x.to_string())?;
    
    let client = reqwest::Client::new();
    let res = client
        .put(&upload_link)
        .header("Content-Type", "audio/wav")
        .header("x-ms-blob-type", "BlockBlob")
        .body(file_contents)
        .send()
        .await
        .map_err(|x| x.to_string())?;

    if !res.status().is_success() {
        return Ok(false);
    }
    std::fs::remove_file(filepath).map_err(|x| x.to_string())?;

    let state = handle
        .try_state::<AppState>()
        .ok_or("Failed to get AppState")?;
    
    let auth = state.auth.lock().await.clone().ok_or("No auth")?;
    let recording_start_time = state.recording_start_time.lock().await.ok_or("No recording start time")?;
    let recording_end_time = state.recording_end_time.lock().await.ok_or("No recording end time")?;

    let url = format!(
        "https://sniive.com/api/spaces/{}/run-tutorial",
        auth.space_name
    );

    let body = serde_json::json!({
        "access": auth.access,
        "metadata": {
            "recordingStartTime": recording_start_time.duration_since(std::time::UNIX_EPOCH).map_err(|x| x.to_string())?.as_millis(),
            "recordingEndTime": recording_end_time.duration_since(std::time::UNIX_EPOCH).map_err(|x| x.to_string())?.as_millis(),
            "platform": "windows",
        }
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