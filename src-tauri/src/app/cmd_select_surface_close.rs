use crabgrab::{
    platform::windows::WindowsCapturableWindowExt,
    prelude::{CapturableContent, CapturableContentFilter},
};
use tauri::{AppHandle, Manager};

use crate::utils::display_id;

use super::{
    app_state::{AppState, CapturableSurface},
    cmd_select_surface_start::SurfaceType,
};

pub struct SurfaceSelection {
    pub id: isize,
    pub surface_type: SurfaceType,
}

pub async fn select_surface_close(
    handle: &AppHandle,
    surface_selection: Option<SurfaceSelection>,
) -> Result<(), String> {
    let state = handle
        .try_state::<AppState>()
        .ok_or("Failed to get AppState")?;

    match surface_selection {
        Some(surface_output) => {
            let surface_id = surface_output.id;
            let surface_type = surface_output.surface_type;

            let filter = CapturableContentFilter::EVERYTHING_NORMAL;
            let content = CapturableContent::new(filter)
                .await
                .map_err(|_| "Failed to get capturable content")?;
            match surface_type {
                SurfaceType::Window => {
                    let window = content
                        .windows()
                        .find(|window| window.get_window_handle().0 == surface_id)
                        .ok_or("Window not found")?;
                    let mut capturable_surface = state.capturable_surface.lock().await;
                    *capturable_surface = Some(CapturableSurface::CapturableWindow(window));
                    return Ok(());
                }
                SurfaceType::Display => {
                    let display = content
                        .displays()
                        .find(|display| display_id(display) == surface_id)
                        .ok_or("Display not found")?;
                    let mut capturable_surface = state.capturable_surface.lock().await;
                    *capturable_surface = Some(CapturableSurface::CapturableDisplay(display));
                    return Ok(());
                }
            }
        }
        None => {
            let mut capturable_surface = state.capturable_surface.lock().await;
            *capturable_surface = None;
            return Ok(());
        }
    }
}
