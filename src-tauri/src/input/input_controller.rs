use std::time::Duration;
use active_win_pos_rs::get_active_window;
use crabgrab::{
    frame::VideoFrame, platform::windows::WindowsCapturableWindowExt, prelude::{take_screenshot, CaptureConfig, CapturePixelFormat}
};
use tauri::{AppHandle, Manager};
use tokio::{
    sync::mpsc::{Receiver, Sender},
    time::timeout,
};

use crate::{
    app::app_state::{AppState, CapturableSurface},
    utils::is_in,
};

use super::state_machine::{InputEvent, StateMachine, StateMachineResult};

pub struct ToUploadEvent {
    pub events: StateMachineResult,
    pub screenshot: VideoFrame,
}

pub async fn input_controller(
    app_handle: &AppHandle,
    mut async_receiver: Receiver<InputEvent>,
    async_transmitter: Sender<ToUploadEvent>,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let mut state_machine = StateMachine::new();

    while let Some(input_event) = async_receiver.recv().await {
        let state = app_handle
            .try_state::<AppState>()
            .ok_or("Failed to get AppState")?;
        let capturable_surface_lock = state.capturable_surface.lock().await;
        let capturable_surface = capturable_surface_lock
            .as_ref()
            .ok_or("No capturable surface")?;

        let display_rect = match capturable_surface {
            CapturableSurface::CapturableWindow(window) => window.rect(),
            CapturableSurface::CapturableDisplay(display) => display.rect(),
        };

        let capture_config = match capturable_surface {
            CapturableSurface::CapturableWindow(window) => {
                match get_active_window() {
                    Ok(active_window) => {
                        let formatted_id = format!("HWND({:?})", window.get_window_handle().0);
                        if active_window.window_id != formatted_id {
                            continue;
                        }
                    },
                    Err(()) => { continue }
                };
                
                match input_event.event {
                    rdev::EventType::ButtonPress(_) => {
                        if !is_in(
                            &display_rect,
                            input_event.mouse_position.x,
                            input_event.mouse_position.y,
                        ) {
                            continue;
                        }
                    }
                    rdev::EventType::ButtonRelease(_) => {
                        if !is_in(
                            &display_rect,
                            input_event.mouse_position.x,
                            input_event.mouse_position.y,
                        ) {
                            continue;
                        }
                    }
                    _ => {}
                }
                CaptureConfig::with_window(window.clone(), CapturePixelFormat::Bgra8888)
            }
            CapturableSurface::CapturableDisplay(display) => {
                match input_event.event {
                    rdev::EventType::ButtonPress(_button) => {
                        if !is_in(
                            &display_rect,
                            input_event.mouse_position.x,
                            input_event.mouse_position.y,
                        ) {
                            continue;
                        }
                    }
                    rdev::EventType::ButtonRelease(_button) => {
                        if !is_in(
                            &display_rect,
                            input_event.mouse_position.x,
                            input_event.mouse_position.y,
                        ) {
                            continue;
                        }
                    }
                    _ => {}
                }
                Ok(CaptureConfig::with_display(
                    display.clone(),
                    CapturePixelFormat::Bgra8888,
                ))
            }
        }?;

        if let Some(events) = state_machine.update(input_event, display_rect) {
            let capture_token_lock = state.capture_token.lock().await;
            let capture_token = capture_token_lock.as_ref().ok_or("No capture token")?;

            let screenshot = timeout(
                Duration::from_secs(1),
                take_screenshot(*capture_token, capture_config),
            )
            .await??;

            async_transmitter
                .send(ToUploadEvent { events, screenshot })
                .await?;
        }
    }
    Ok(())
}
