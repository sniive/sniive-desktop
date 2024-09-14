use std::time::Duration;

use crabgrab::prelude::{
    take_screenshot, CapturableContent, CapturableContentFilter, CaptureConfig,
    CapturePixelFormat, CaptureStream, FrameBitmap, VideoFrameBitmap,
};
use futures::future::join_all;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};
use tokio::time::timeout;

#[cfg(target_os = "windows")]
use crabgrab::platform::windows::WindowsCapturableWindowExt;
#[cfg(target_os = "macos")]
use crabgrab::platform::macos::MacosCapturableWindowExt;

use crate::utils;

use super::app_state::AppState;

#[derive(Clone, Copy, Serialize, Deserialize)]
pub enum SurfaceType {
    Window,
    Display,
}

#[derive(Clone)]
struct SurfaceOption {
    id: isize,
    program: String,
    title: String,
    surface_type: SurfaceType,
    config: CaptureConfig,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct Surface {
    pub surface_type: SurfaceType,
    pub id: isize,
    pub title: String,
    pub program: String,
    pub thumbnail: String,
}

pub async fn select_surface_start(handle: &AppHandle) -> Result<Vec<Option<Surface>>, &str> {
    let token = match CaptureStream::test_access(false) {
        Some(token) => token,
        None => CaptureStream::request_access(false)
            .await
            .expect("Expected capture access"),
    };

    let state = handle
        .try_state::<AppState>()
        .ok_or("Failed to get AppState")?;
    let mut capture_token = state.capture_token.lock().await;
    *capture_token = Some(token);

    let filter = CapturableContentFilter::EVERYTHING_NORMAL;
    let content = CapturableContent::new(filter)
        .await
        .map_err(|_| "Failed to get capturable content")?;

    let mut surfaces_options: Vec<SurfaceOption> = [].to_vec();
    let self_pid = std::process::id() as i32;

    content
        .windows()
        .filter(|window| {
            window.rect().size.width > 0.0
                && window.rect().size.height > 0.0
                && window.title().len() > 0
                && window.application().pid() != self_pid
        })
        .for_each(|window| {
            #[cfg(target_os = "macos")]
            let id = window.get_window_id() as isize;
            #[cfg(target_os = "windows")]
            let id = window.get_window_handle().0;
            
            let title = window.title();
            let program = window.application().identifier();
            if let Ok(config) = CaptureConfig::with_window(window, CapturePixelFormat::Bgra8888) {
                surfaces_options.push(SurfaceOption {
                    id,
                    program,
                    title,
                    surface_type: SurfaceType::Window,
                    config,
                });
            }
        });

    content
        .displays()
        .filter(|display| display.rect().size.width > 0.0 && display.rect().size.height > 0.0)
        .for_each(|display| {
            let id = utils::display_id(&display);
            let title = "Monitor".to_string();
            let config = CaptureConfig::with_display(display, CapturePixelFormat::Bgra8888);
            return surfaces_options.push(SurfaceOption {
                id,
                title,
                program: "Display".to_string(),
                surface_type: SurfaceType::Display,
                config,
            });
        });

    let thumbnails = join_all(
        surfaces_options
            .into_iter()
            .map(|surface_option| async move {
                let screenshot = match timeout(
                    Duration::from_secs(1),
                    take_screenshot(token, surface_option.config),
                )
                .await
                {
                    Ok(Ok(screenshot)) => screenshot,
                    _ => return None,
                };

                let image_bitmap_bgra8888 = match screenshot.get_bitmap() {
                    Ok(FrameBitmap::BgraUnorm8x4(image_bitmap)) => image_bitmap,
                    _ => return None,
                };

                let image_base64 = match utils::make_scaled_base64_png_from_bitmap(
                    image_bitmap_bgra8888,
                    600,
                    480,
                ) {
                    Ok(image_base64) => image_base64,
                    _ => return None,
                };

                Some(Surface {
                    id: surface_option.id,
                    title: surface_option.title,
                    program: surface_option.program,
                    surface_type: surface_option.surface_type,
                    thumbnail: image_base64,
                })
            }),
    )
    .await;

    return Ok(thumbnails);
}
