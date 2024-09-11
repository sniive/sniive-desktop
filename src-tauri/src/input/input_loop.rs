use rdev::listen;
use tauri::{AppHandle, Manager};
use tokio::sync::mpsc::Sender;

use crate::app::app_state::AppState;

use super::state_machine::{InputEvent, MousePosition};

pub fn input_loop(app_handle: &AppHandle, async_sender: Sender<InputEvent>) {
    // Clone the app_handle to avoid lifetime issues
    let app_handle = app_handle.clone();
    let mut mouse_position = MousePosition { x: 0.0, y: 0.0 };
    let mut last_input_key: rdev::Key = rdev::Key::Unknown(0);

    if let Err(error) = listen(move |event: rdev::Event| {
        if let Some(state) = app_handle.try_state::<AppState>() {
            if state
                .can_run_input
                .load(std::sync::atomic::Ordering::Relaxed)
            {
                match event.event_type {
                    rdev::EventType::KeyPress(key) => {
                        if last_input_key == key {
                            last_input_key = key;
                            return;
                        }
                        last_input_key = key;
                    }
                    _ => {}
                }

                match event.event_type {
                    rdev::EventType::MouseMove { x, y } => {
                        mouse_position = MousePosition { x, y };
                    }
                    rdev::EventType::Wheel { .. } => {}
                    _ => {
                        let input_event = InputEvent {
                            event: event.event_type,
                            mouse_position,
                        };
                        async_sender.blocking_send(input_event).unwrap();
                    }
                }
            }
        }
    }) {
        eprintln!("Error: {:?}", error)
    }
}
