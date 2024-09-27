use std::{
    fs::File,
    io::BufWriter,
    sync::{Arc, Mutex},
};
use cpal::{FromSample, Sample};
use crabgrab::{
    prelude::{BitmapDataBgra8x4, CapturableDisplay, FrameBitmapBgraUnorm8x4},
    util::Rect,
};
use tauri::{AppHandle, Event, Listener, Manager, WebviewWindow};
use tauri_plugin_dialog::{DialogExt, MessageDialogKind};

use crate::app::app_state::{AppState, Auth};

pub fn show_error_dialog(app_handle: &AppHandle, message: &str) -> Box<dyn std::error::Error + Send + Sync> {
    app_handle.dialog()
        .message(message)
        .title("Error")
        .kind(MessageDialogKind::Error)
        .blocking_show();

    message.into()
}

pub async fn wait_for_event(window: &WebviewWindow, event_name: String) -> Option<Event> {
    let (blocker_tx, mut blocker_rx) = tokio::sync::mpsc::unbounded_channel::<Event>();
    let id = window.once(event_name, move |evt: Event| {
        blocker_tx.send(evt).unwrap();
    });

    if let Some(evt) = blocker_rx.recv().await {
        window.unlisten(id);
        return Some(evt);
    } else {
        window.unlisten(id);
        return None;
    }
}

pub fn display_id(display: &CapturableDisplay) -> isize {
    let rect = display.rect();
    let xored = ((rect.origin.x as i64) << 0)
        ^ ((rect.origin.y as i64) << 16)
        ^ ((rect.size.width as i64) << 32)
        ^ ((rect.size.height as i64) << 48);

    // isize may be 32 or 64 bits, if it's 32 bits, we need to split the xored into two i32s and combine them
    if std::mem::size_of::<isize>() == 4 {
        let xored1 = (xored & 0xFFFFFFFF) as i32;
        let xored2 = ((xored >> 32) & 0xFFFFFFFF) as i32;
        return (xored1 ^ xored2) as isize;
    }

    xored as isize
}


fn flatten(vec: &[[u8; 4]]) -> Vec<u8> {
    let total_size = vec.len() * 4;
    let mut flattened = Vec::with_capacity(total_size);
    unsafe {
        flattened.set_len(total_size);
    }
    for (i, chunk) in vec.into_iter().enumerate() {
        let offset = i * 4;
        flattened[offset..offset + 4].copy_from_slice(chunk);
    }
    flattened
}

pub fn make_base64_jpeg_from_bitmap<Data: BitmapDataBgra8x4>(
    bitmap: &FrameBitmapBgraUnorm8x4<Data>,
) -> Result<String, String> {
    // convert BGRA to RGB
    let flat_data = flatten(bitmap.data.as_ref());
    let image = turbojpeg::Image { 
        pixels: flat_data.as_slice(),
        width: bitmap.width,
        height: bitmap.height, 
        // size of one image row in bytes
        pitch: bitmap.width * 4,
        format: turbojpeg::PixelFormat::BGRX 
    };
    let jpeg_data = turbojpeg::compress(image, 95, turbojpeg::Subsamp::Sub2x2).map_err(|e| e.to_string())?;
    let base64_image = rbase64::encode(&jpeg_data);
    Ok(base64_image)
}

type WavWriterHandle = Arc<Mutex<Option<hound::WavWriter<BufWriter<File>>>>>;
pub fn write_audio_data<T, U>(input: &[T], writer: &WavWriterHandle)
where
    T: Sample,
    U: Sample + hound::Sample + FromSample<T>,
{
    if let Ok(mut guard) = writer.try_lock() {
        if let Some(writer) = guard.as_mut() {
            for &sample in input.iter() {
                let sample: U = U::from_sample(sample);
                writer.write_sample(sample).expect("Failed to write sample");
            }
        }
    }
}

pub fn is_in(rect: &Rect, x: f64, y: f64) -> bool {
    x >= rect.origin.x
        && x <= rect.origin.x + rect.size.width
        && y >= rect.origin.y
        && y <= rect.origin.y + rect.size.height
}

pub fn match_deep_link(link: &str) -> Option<Auth> {
    let regex = regex::Regex::new(r"sniive://(.+)/(.+)\?access=(.+)").unwrap();
    let captures = regex.captures(link).unwrap();
    if captures.len() != 4 {
        return None;
    } else {
        return Some(Auth {
            space_name: captures[1].to_string(),
            access: captures[3].to_string(),
            locale: captures[2].to_string(),
        });
    }
}

pub async fn get_upload_link(
    app_handle: &AppHandle,
    file_extension: &str,
) -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
    let auth = app_handle
        .try_state::<AppState>()
        .ok_or("Failed to get AppState")?
        .auth
        .lock()
        .await
        .clone()
        .ok_or("No auth")?;

    let url = format!("https://sniive.com/api/spaces/{}/populate", auth.space_name);
    let body = serde_json::json!({ "access": auth.access, "fileExtension": file_extension });
    let client = reqwest::Client::new();
    let res = client
        .post(&url)
        .header("Content-Type", "application/json")
        .body(body.to_string())
        .send()
        .await
        .map_err(|_| show_error_dialog(app_handle, "Trouble connecting to client"))?;
    let json_result = res.json::<String>().await.map_err(|_| show_error_dialog(app_handle, "Failed to parse response"))?;
    Ok(json_result)
}


pub async fn notify_recording_status(
    app_handle: &AppHandle,
    status: &str,
) -> Result<bool, Box<dyn std::error::Error + Send + Sync>> {
    let auth = app_handle
        .try_state::<AppState>()
        .ok_or("Failed to get AppState")?
        .auth
        .lock()
        .await
        .clone()
        .ok_or("No auth")?;

    let url = format!(
        "https://sniive.com/api/spaces/{}/notify-recording-status",
        auth.space_name
    );
    let body = serde_json::json!({ "access": auth.access, "status": status });
    let client = reqwest::Client::new();
    let res = client
        .post(&url)
        .header("Content-Type", "application/json")
        .body(body.to_string())
        .send()
        .await
        .map_err(|_| show_error_dialog(app_handle, "Trouble connecting to client"))?;
    Ok(res.status().is_success())
}
