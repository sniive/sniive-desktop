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

use crate::app::app_state::{AppState, Auth};

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

pub fn make_scaled_base64_png_from_bitmap<Data: BitmapDataBgra8x4>(
    bitmap: FrameBitmapBgraUnorm8x4<Data>,
    max_width: usize,
    max_height: usize,
) -> Result<String, String> {
    let (mut height, mut width) = (bitmap.width, bitmap.height);
    if width > max_width {
        width = max_width;
        height = ((max_width as f64 / bitmap.width as f64) * bitmap.height as f64).ceil() as usize;
    };

    if height > max_height {
        height = max_height;
        width = ((max_height as f64 / bitmap.height as f64) * bitmap.width as f64).ceil() as usize;
    };

    let mut write_vec = vec![0u8; 0];
    {
        let mut encoder = png::Encoder::new(&mut write_vec, width as u32, height as u32);
        encoder.set_color(png::ColorType::Rgba);
        encoder.set_depth(png::BitDepth::Eight);
        encoder.set_source_gamma(png::ScaledFloat::from_scaled(45455)); // 1.0 / 2.2, scaled by 100000
        encoder.set_source_gamma(png::ScaledFloat::new(1.0 / 2.2)); // 1.0 / 2.2, unscaled, but rounded
        let source_chromaticities = png::SourceChromaticities::new(
            // Using unscaled instantiation here
            (0.31270, 0.32900),
            (0.64000, 0.33000),
            (0.30000, 0.60000),
            (0.15000, 0.06000),
        );
        encoder.set_source_chromaticities(source_chromaticities);
        let mut writer = match encoder.write_header() {
            Ok(writer) => writer,
            Err(error) => return Err(format!("Error: {:?}", error)),
        };
        let mut image_data = vec![0u8; width * height * 4];
        for y in 0..height {
            let sample_y = (bitmap.height * y) / height;
            for x in 0..width {
                let sample_x = (bitmap.width * x) / width;
                let [b, g, r, a]: [u8; 4] =
                    bitmap.data.as_ref()[sample_x + sample_y * bitmap.width];
                image_data[(x + y * width) * 4 + 0] = r;
                image_data[(x + y * width) * 4 + 1] = g;
                image_data[(x + y * width) * 4 + 2] = b;
                image_data[(x + y * width) * 4 + 3] = a;
            }
        }
        match writer.write_image_data(&image_data) {
            Ok(()) => (),
            Err(error) => return Err(format!("Error: {:?}", error)),
        }
    }
    Ok(rbase64::encode(write_vec.as_slice()))
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
        .await?;
    let res_json = res.json::<String>().await?;
    Ok(res_json)
}

/*
export async function notifyRecordingStatus({
  spaceName,
  access,
  status
}: Auth & { status: 'start' | 'stop' }): Promise<NotifyRecordingStatusResponse> {
  return await fetch(`${domain}/api/spaces/${spaceName}/notify-recording-status`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ access, status })
  })
*/

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
        .await?;
    Ok(res.status().is_success())
}
