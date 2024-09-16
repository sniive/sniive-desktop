use cpal::traits::{DeviceTrait, StreamTrait};
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Manager};
use tokio::sync::mpsc::Receiver;

use crate::{app::app_state::AppState, utils};

use super::convert_audio::convert_audio;

pub async fn audio_controller(
    app_handle: &AppHandle,
    mut async_receiver: Receiver<bool>,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let tmp_path = app_handle.path().app_cache_dir()?;
    let filepath = tmp_path.join("output.wav");

    // if file exists, delete it
    if filepath.exists() {
        std::fs::remove_file(&filepath)?;
    }

    loop {
        while let Some(can_run) = async_receiver.recv().await {
            if can_run {
                break;
            }
        }

        let state = app_handle
            .try_state::<AppState>()
            .ok_or("Failed to get AppState")?;

        let audio_device_lock = state.audio_device.lock().await;
        let audio_device = audio_device_lock.as_ref().ok_or("No audio device")?;

        let config = audio_device
            .default_input_config()
            .expect("Failed to get default input config");

        let base_sample_format = match config.sample_format() {
            cpal::SampleFormat::I16 => Ok::<cpal::SampleFormat, String>(cpal::SampleFormat::I16),
            cpal::SampleFormat::I32 => Ok::<cpal::SampleFormat, String>(cpal::SampleFormat::I32),
            cpal::SampleFormat::F32 => Ok::<cpal::SampleFormat, String>(cpal::SampleFormat::F32),
            _ => Err("Unsupported sample format".into()),
        }?;

        let (bits_per_sample, sample_format) = match config.sample_format() {
            cpal::SampleFormat::I16 => Ok::<_, String>((16, hound::SampleFormat::Int)),
            cpal::SampleFormat::I32 => Ok::<_, String>((32, hound::SampleFormat::Int)),
            cpal::SampleFormat::F32 => Ok::<_, String>((32, hound::SampleFormat::Float)),
            _ => return Err("Unsupported sample format".into()),
        }?;

        let spec = hound::WavSpec {
            channels: config.channels(),
            sample_rate: config.sample_rate().0,
            bits_per_sample,
            sample_format,
        };

        let buffer = hound::WavWriter::create(filepath.clone(), spec)?;
        let writer = Arc::new(Mutex::new(Some(buffer)));
        let writer_clone = writer.clone();
        let err_fn = move |err| {
            eprintln!("an error occurred on stream: {}", err);
        };

        let stream = match base_sample_format {
            cpal::SampleFormat::I16 => audio_device
                .build_input_stream(
                    &config.into(),
                    move |data, _: &_| utils::write_audio_data::<i16, i16>(data, &writer_clone),
                    err_fn,
                    None,
                )?,
            cpal::SampleFormat::I32 => audio_device
                .build_input_stream(
                    &config.into(),
                    move |data, _: &_| utils::write_audio_data::<i32, i32>(data, &writer_clone),
                    err_fn,
                    None,
                )?,
            cpal::SampleFormat::F32 => audio_device
                .build_input_stream(
                    &config.into(),
                    move |data, _: &_| utils::write_audio_data::<f32, f32>(data, &writer_clone),
                    err_fn,
                    None,
                )?,
            sample_format => {
                return Err(format!("Unsupported sample format '{:?}'", sample_format).into())
            }
        };

        stream.play()?;
        while let Some(can_run) = futures::executor::block_on(async_receiver.recv()) {
            if !can_run {
                break;
            }
        }
        drop(stream);


        writer
            .lock()
            .unwrap()
            .take()
            .unwrap()
            .finalize()?;

        convert_audio(&filepath, &spec)?;
    }
}
