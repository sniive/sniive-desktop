use app::{
    app_state::AppState, cmd_finish_recording::finish_recording, cmd_get_locale::get_locale, cmd_is_auth::is_auth, cmd_select_audio::select_audio, cmd_select_surface::select_surface, cmd_set_auth::set_auth, cmd_start_input::start_input, cmd_stop_input::stop_input
};
use audio::audio_controller::audio_controller;
use input::{
    input_controller::{input_controller, ToUploadEvent},
    input_loop::input_loop,
    state_machine::InputEvent,
};
use serde_json::Value;
use static_cell::StaticCell;
use std::sync::atomic::AtomicBool;
use tauri::{async_runtime, Listener, Manager};
use tauri_plugin_cli::CliExt;
use tauri_plugin_updater::UpdaterExt;
use tokio::sync::{mpsc, Mutex};
use upload::upload_controller::upload_controller;
use utils::match_deep_link;

mod app;
mod audio;
mod input;
mod upload;
mod utils;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let (async_ic2uc_tx, async_ic2uc_rx) = mpsc::channel::<ToUploadEvent>(1);
    let (async_il2ic_tx, async_il2ic_rx) = mpsc::channel::<InputEvent>(1);
    let (async_ta2ac_tx, async_ta2ac_rx) = mpsc::channel::<bool>(1);
    static APP_HANDLE: StaticCell<tauri::AppHandle> = StaticCell::new();

    tauri::Builder::default()
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_cli::init())
        .plugin(tauri_plugin_single_instance::init(
            app_single_instance_handler,
        ))
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .manage(AppState {
            //async_nx2ta_tx: Mutex::new(async_nx2ta_tx),
            can_run_input: AtomicBool::new(false),
            capturable_surface: Mutex::new(None),
            capture_token: Mutex::new(None),

            can_run_audio: Mutex::new(async_ta2ac_tx),
            audio_device: Mutex::new(None),

            auth: Mutex::new(None),
            recording_start_time: Mutex::new(None),
            recording_end_time: Mutex::new(None),
        })
        .invoke_handler(tauri::generate_handler![
            start_input,
            stop_input,
            select_surface,
            select_audio,
            set_auth,
            is_auth,
            get_locale,
            finish_recording
        ])
        .setup(|app| {
            let app_handle: &'static tauri::AppHandle = APP_HANDLE.init(app.handle().clone());
            app.listen("deep-link://new-url", move |url| {
                app_deep_link_handler(app_handle, url.payload());
            });
            app_cli_handler(app_handle);

            if app_handle
                .plugin(tauri_plugin_updater::Builder::new().build())
                .is_ok()
            {
                let handle = app_handle.clone();
                tauri::async_runtime::spawn(
                    async move { app_update_handler(handle).await.unwrap() },
                );
            }

            async_runtime::spawn(async move {
                upload_controller(app_handle, async_ic2uc_rx).await.unwrap()
            });
            async_runtime::spawn(async move {
                input_controller(app_handle, async_il2ic_rx, async_ic2uc_tx)
                    .await
                    .unwrap()
            });
            async_runtime::spawn(async move {
                audio_controller(app_handle, async_ta2ac_rx).await.unwrap()
            });

            async_runtime::spawn_blocking(move || {
                input_loop(app_handle, async_il2ic_tx);
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn app_deep_link_handler(app: &'static tauri::AppHandle, serialized_urls: &str) {
    let urls: Vec<&str> = serde_json::from_str(serialized_urls).unwrap();
    for url in urls {
        let matched = match_deep_link(url);
        let state = app
            .try_state::<AppState>()
            .ok_or("Failed to get AppState")
            .expect("Failed to get AppState");
        let mut auth = state.auth.blocking_lock();
        *auth = matched;
    }
}

fn app_cli_handler(app: &'static tauri::AppHandle) {
    if let Ok(matches) = app.cli().matches() {
        if let Some(v) = matches.args.get("auth") {
            match &v.value {
                Value::String(str) => {
                    let matched = match_deep_link(&str);
                    let state = app
                        .try_state::<AppState>()
                        .ok_or("Failed to get AppState")
                        .expect("Failed to get AppState");
                    let mut auth = state.auth.blocking_lock();
                    *auth = matched;
                }
                _ => {}
            };
        }
    }
}

fn app_single_instance_handler(app: &tauri::AppHandle, args: Vec<String>, _cwd: String) {
    let windows = app.webview_windows();
    windows
        .values()
        .next()
        .expect("Sorry, no window found")
        .set_focus()
        .expect("Can't Bring Window to Focus");

    println!("args: {:?}", args);

    if args.len() > 1 {
        let arg = &args[1];
        let matched = match_deep_link(arg);
        let state = app
            .try_state::<AppState>()
            .ok_or("Failed to get AppState")
            .expect("Failed to get AppState");
        let mut auth = state.auth.blocking_lock();
        *auth = matched;
    }
}

async fn app_update_handler(
    app: tauri::AppHandle,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    if let Some(update) = app.updater()?.check().await? {
        let mut downloaded = 0;

        // alternatively we could also call update.download() and update.install() separately
        update
            .download_and_install(
                |chunk_length, content_length| {
                    downloaded += chunk_length;
                    println!("downloaded {downloaded} from {content_length:?}");
                },
                || {
                    println!("download finished");
                },
            )
            .await?;

        println!("update installed");
        app.restart();
    }

    Ok(())
}
