use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter, WebviewWindowBuilder};

use crate::{app::cmd_select_surface_close::select_surface_close, utils::wait_for_event};

use super::{
    cmd_select_surface_close::SurfaceSelection,
    cmd_select_surface_start::{select_surface_start, Surface, SurfaceType},
};

#[derive(Clone, Copy, Serialize, Deserialize)]
struct SelectedSurface {
    id: isize,
    surface_type: SurfaceType,
}
#[derive(Clone, Copy, Serialize, Deserialize)]
enum SelectedSurfaceResult {
    Aborted,                   // Selection process was cancelled
    SelectedNone,              // No surface was selected
    Selected(SelectedSurface), // Selection process was completed
}

#[derive(Serialize, Deserialize)]
pub struct SurfaceOutput {
    pub title: String,
    pub thumbnail: String,
}
#[derive(Serialize, Deserialize)]
pub enum SurfaceOutputResult {
    Aborted,
    SelectedNone,
    Selected(SurfaceOutput),
}

#[tauri::command]
pub async fn select_surface(handle: AppHandle) -> Result<SurfaceOutputResult, String> {
    let thumbnails = select_surface_start(&handle).await?;

    let select_surface_builder = WebviewWindowBuilder::new(
        &handle,
        "select-surface",
        tauri::WebviewUrl::App("/select-surface".into()),
    )
    .always_on_top(true)
    .closable(true)
    .minimizable(true)
    .maximizable(false)
    .resizable(true)
    .inner_size(600.0, 180.0)
    .decorations(false)
    .focused(true)
    .visible(false)
    .title("Select Surface");

    #[cfg(target_os = "windows")]
    select_surface_builder.transparent(true);

    let select_surface_window = select_surface_builder.build().map_err(|e| e.to_string())?;
    let surfaces: Vec<Surface> = thumbnails
        .into_iter()
        .filter_map(|thumbnail| thumbnail)
        .collect();

    wait_for_event(&select_surface_window, "ready".to_string())
        .await
        .ok_or("No ready event")?;
    select_surface_window.show().map_err(|e| e.to_string())?;
    select_surface_window
        .emit("surfaces", surfaces.clone())
        .map_err(|e| e.to_string())?;

    let evt = wait_for_event(&select_surface_window, "selected".to_string())
        .await
        .ok_or("No selected event")?;
    let payload: SelectedSurfaceResult =
        serde_json::from_str(evt.payload()).map_err(|e| e.to_string())?;
    select_surface_window.close().map_err(|e| e.to_string())?;

    match payload {
        SelectedSurfaceResult::Aborted => return Ok(SurfaceOutputResult::Aborted),
        SelectedSurfaceResult::SelectedNone => {
            select_surface_close(&handle, None).await?;
            return Ok(SurfaceOutputResult::SelectedNone);
        }
        SelectedSurfaceResult::Selected(payload) => {
            select_surface_close(
                &handle,
                Some(SurfaceSelection {
                    id: payload.id,
                    surface_type: payload.surface_type,
                }),
            )
            .await?;
            let selected_surface = surfaces
                .into_iter()
                .find(|surface| surface.id == payload.id)
                .ok_or("No surface selected")?;
            return Ok(SurfaceOutputResult::Selected(SurfaceOutput {
                title: selected_surface.title,
                thumbnail: selected_surface.thumbnail,
            }));
        }
    }
}
